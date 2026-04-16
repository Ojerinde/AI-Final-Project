"""Physics-Informed Neural Network (PINN) loss function.

Uses automatic differentiation to penalise trajectories that violate the
CR3BP equations from Szebehely's *Theory of Orbits*.
"""

from __future__ import annotations

import torch
import torch.nn as nn

from src.config import MU_CR3BP


class PhysicsLoss(nn.Module):
    """PINN loss: penalises CR3BP equation residuals via autograd.

    Combines a data-fitting MSE term with a physics residual term:
        L = L_data + λ · L_physics
    """

    def __init__(self, lambda_physics: float = 1.0, mu: float = MU_CR3BP):
        """Initialise the physics loss.

        Args:
            lambda_physics: Weight of the physics residual term.
            mu: CR3BP mass ratio.
        """
        super().__init__()
        self.lambda_physics = lambda_physics
        self.mu = mu
        self.mse = nn.MSELoss()

    def cr3bp_acceleration(self, state: torch.Tensor) -> torch.Tensor:
        """Compute CR3BP accelerations for a batch of states.

        Args:
            state: Batch of states (B, 6) [x, y, z, vx, vy, vz].

        Returns:
            Accelerations (B, 3) [ax, ay, az].
        """
        mu = self.mu
        x, y, z = state[:, 0], state[:, 1], state[:, 2]
        vx, vy = state[:, 3], state[:, 4]

        r1 = torch.sqrt((x + mu) ** 2 + y ** 2 + z ** 2).clamp(min=1e-8)
        r2 = torch.sqrt((x - 1 + mu) ** 2 + y ** 2 + z ** 2).clamp(min=1e-8)

        ax = (2 * vy + x
              - (1 - mu) * (x + mu) / r1 ** 3
              - mu * (x - 1 + mu) / r2 ** 3)
        ay = (-2 * vx + y
              - (1 - mu) * y / r1 ** 3
              - mu * y / r2 ** 3)
        az = (-(1 - mu) * z / r1 ** 3
              - mu * z / r2 ** 3)

        return torch.stack([ax, ay, az], dim=-1)

    def forward(
        self,
        pred_states: torch.Tensor,
        true_states: torch.Tensor,
        t: torch.Tensor,
    ) -> dict[str, torch.Tensor]:
        """Compute combined PINN loss.

        Args:
            pred_states: Predicted trajectory states (B, T, 6).
            true_states: Ground-truth states (B, T, 6).
            t: Time points (T,) — requires grad for autograd.

        Returns:
            Dict with 'total', 'data', 'physics' loss tensors.
        """
        # Data loss
        loss_data = self.mse(pred_states, true_states)

        # Physics loss via finite differences (or autograd if t requires grad)
        # Use central differences for velocity → acceleration
        dt = t[1] - t[0] if len(t) > 1 else 1.0
        if pred_states.shape[1] > 2:
            # Finite-difference acceleration from predicted positions
            vel_pred = (pred_states[:, 2:, :3] -
                        pred_states[:, :-2, :3]) / (2 * dt)
            acc_pred = (pred_states[:, 2:, 3:] -
                        pred_states[:, :-2, 3:]) / (2 * dt)

            # Analytical CR3BP acceleration at interior points
            interior_states = pred_states[:, 1:-1, :]
            B, T_int, _ = interior_states.shape
            acc_cr3bp = self.cr3bp_acceleration(interior_states.reshape(-1, 6))
            acc_cr3bp = acc_cr3bp.reshape(B, T_int, 3)

            loss_physics = self.mse(acc_pred, acc_cr3bp)
        else:
            loss_physics = torch.tensor(0.0, device=pred_states.device)

        total = loss_data + self.lambda_physics * loss_physics
        return {"total": total, "data": loss_data, "physics": loss_physics}
