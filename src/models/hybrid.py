"""Hybrid GNN-PINN model for cislunar trajectory generation.

Combines the Graph Neural Network (gravity-web encoder) with PINN
physics-informed loss for end-to-end trajectory prediction.
"""

from __future__ import annotations

import torch
import torch.nn as nn
from torch_geometric.data import Data

from src.models.gnn import GravityGNN
from src.models.pinn import PhysicsLoss


class TrajectoryDecoder(nn.Module):
    """Decodes a latent trajectory representation into a time-series of states."""

    def __init__(self, latent_dim: int = 6, hidden_dim: int = 128,
                 n_timesteps: int = 100, state_dim: int = 6):
        """Initialise the decoder.

        Args:
            latent_dim: Dimension of the GNN output.
            hidden_dim: Hidden layer size.
            n_timesteps: Number of output time steps.
            state_dim: Dimension of each state (6 = x,y,z,vx,vy,vz).
        """
        super().__init__()
        self.n_timesteps = n_timesteps
        self.state_dim = state_dim
        self.net = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, n_timesteps * state_dim),
        )

    def forward(self, z: torch.Tensor) -> torch.Tensor:
        """Decode latent vector to trajectory.

        Args:
            z: Latent vector (B, latent_dim).

        Returns:
            Trajectory tensor (B, n_timesteps, state_dim).
        """
        out = self.net(z)
        return out.view(-1, self.n_timesteps, self.state_dim)


class HybridGNNPINN(nn.Module):
    """End-to-end hybrid model: GNN encoder → trajectory decoder → PINN loss.

    The GNN encodes the gravitational environment (Earth–Moon–Spacecraft graph),
    and the decoder generates a full trajectory. The PINN loss ensures physical
    compliance with CR3BP equations.
    """

    def __init__(
        self,
        node_feat_dim: int = 7,
        gnn_hidden: int = 64,
        gnn_layers: int = 3,
        decoder_hidden: int = 128,
        n_timesteps: int = 100,
        lambda_physics: float = 1.0,
    ):
        """Initialise the hybrid model.

        Args:
            node_feat_dim: GNN input node feature dimension.
            gnn_hidden: GNN hidden dimension.
            gnn_layers: Number of GNN message-passing layers.
            decoder_hidden: Decoder MLP hidden dimension.
            n_timesteps: Number of trajectory time steps to generate.
            lambda_physics: Physics loss weight.
        """
        super().__init__()
        self.gnn = GravityGNN(
            node_feat_dim=node_feat_dim,
            hidden_dim=gnn_hidden,
            out_dim=6,
            n_layers=gnn_layers,
        )
        self.decoder = TrajectoryDecoder(
            latent_dim=6,
            hidden_dim=decoder_hidden,
            n_timesteps=n_timesteps,
            state_dim=6,
        )
        self.physics_loss = PhysicsLoss(lambda_physics=lambda_physics)
        self.n_timesteps = n_timesteps

    def forward(self, data: Data) -> torch.Tensor:
        """Generate trajectory from gravitational graph.

        Args:
            data: PyG Data representing the gravity web.

        Returns:
            Predicted trajectory (B, n_timesteps, 6).
        """
        z = self.gnn(data)
        trajectory = self.decoder(z)
        return trajectory

    def compute_loss(
        self,
        data: Data,
        true_trajectory: torch.Tensor,
        t: torch.Tensor,
    ) -> dict[str, torch.Tensor]:
        """Forward + physics-informed loss computation.

        Args:
            data: Input graph.
            true_trajectory: Ground-truth states (B, T, 6).
            t: Time points (T,).

        Returns:
            Loss dict from PhysicsLoss.
        """
        pred = self.forward(data)
        return self.physics_loss(pred, true_trajectory, t)
