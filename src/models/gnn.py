"""Graph Neural Network for Earth–Moon–Sun gravity web.

Models the gravitational interactions between celestial bodies as a graph:
- Nodes: Earth, Moon, Sun (+ spacecraft as dynamic node)
- Edges: gravitational links with distance-weighted features
"""

from __future__ import annotations

import torch
import torch.nn as nn
from torch_geometric.nn import MessagePassing, global_mean_pool
from torch_geometric.data import Data, Batch


class GravityEdgeConv(MessagePassing):
    """Message-passing layer for gravitational interactions.

    Each message encodes the gravitational influence between two bodies
    weighted by inverse-square distance.
    """

    def __init__(self, in_channels: int, out_channels: int):
        """Initialise the edge convolution layer.

        Args:
            in_channels: Dimension of input node features.
            out_channels: Dimension of output node features.
        """
        super().__init__(aggr="add")
        self.mlp = nn.Sequential(
            nn.Linear(2 * in_channels + 1, out_channels),
            nn.SiLU(),
            nn.Linear(out_channels, out_channels),
        )

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor,
                edge_attr: torch.Tensor) -> torch.Tensor:
        """Forward pass through message passing.

        Args:
            x: Node features (N, in_channels).
            edge_index: Edge connectivity (2, E).
            edge_attr: Edge features — inverse-square distance (E, 1).

        Returns:
            Updated node features (N, out_channels).
        """
        return self.propagate(edge_index, x=x, edge_attr=edge_attr)

    def message(self, x_i: torch.Tensor, x_j: torch.Tensor,
                edge_attr: torch.Tensor) -> torch.Tensor:
        """Construct messages from source to target nodes.

        Args:
            x_i: Target node features.
            x_j: Source node features.
            edge_attr: Edge weights (gravitational strength).

        Returns:
            Message tensor.
        """
        return self.mlp(torch.cat([x_i, x_j, edge_attr], dim=-1))


class GravityGNN(nn.Module):
    """Graph Neural Network modelling the Earth–Moon gravity web.

    Architecture:
        3 × GravityEdgeConv layers → global mean pool → MLP head
    """

    def __init__(self, node_feat_dim: int = 7, hidden_dim: int = 64,
                 out_dim: int = 6, n_layers: int = 3):
        """Initialise the GNN.

        Args:
            node_feat_dim: Input feature dimension per node (mass, position, velocity).
            hidden_dim: Hidden dimension for graph convolutions.
            out_dim: Output dimension (e.g., 6 for state-vector prediction).
            n_layers: Number of message-passing layers.
        """
        super().__init__()
        self.encoder = nn.Linear(node_feat_dim, hidden_dim)
        self.convs = nn.ModuleList([
            GravityEdgeConv(hidden_dim, hidden_dim) for _ in range(n_layers)
        ])
        self.norms = nn.ModuleList([nn.LayerNorm(hidden_dim)
                                   for _ in range(n_layers)])
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, out_dim),
        )

    def forward(self, data: Data) -> torch.Tensor:
        """Forward pass.

        Args:
            data: PyG Data object with x, edge_index, edge_attr, batch.

        Returns:
            Predictions tensor (batch_size, out_dim).
        """
        x = self.encoder(data.x)
        for conv, norm in zip(self.convs, self.norms):
            x = norm(x + conv(x, data.edge_index, data.edge_attr))
        x = global_mean_pool(x, data.batch)
        return self.head(x)


def build_gravity_graph(
    spacecraft_state: torch.Tensor,
    mu: float = 0.01215,
) -> Data:
    """Build a PyG Data object representing the Earth–Moon–Spacecraft graph.

    Args:
        spacecraft_state: Tensor [x, y, z, vx, vy, vz] of the spacecraft.
        mu: CR3BP mass ratio.

    Returns:
        PyG Data object with 3 nodes (Earth, Moon, Spacecraft).
    """
    # Node features: [mass_param, x, y, z, vx, vy, vz]
    earth = torch.tensor([1 - mu, -mu, 0, 0, 0, 0, 0], dtype=torch.float32)
    moon = torch.tensor([mu, 1 - mu, 0, 0, 0, 0, 0], dtype=torch.float32)
    sc = torch.cat([torch.tensor([0.0]), spacecraft_state.float()])

    x = torch.stack([earth, moon, sc])

    # Fully connected edges (bidirectional)
    edge_index = torch.tensor([[0, 0, 1, 1, 2, 2],
                               [1, 2, 0, 2, 0, 1]], dtype=torch.long)

    # Edge attr: inverse-square of distance between nodes
    positions = x[:, 1:4]
    edge_attr = []
    for src, dst in edge_index.t().tolist():
        dist = torch.norm(positions[src] - positions[dst]).clamp(min=1e-6)
        edge_attr.append(1.0 / dist ** 2)
    edge_attr = torch.tensor(edge_attr, dtype=torch.float32).unsqueeze(-1)

    return Data(x=x, edge_index=edge_index, edge_attr=edge_attr)
