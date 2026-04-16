"""Physics sub-package — CR3BP equations and orbital propagation."""

from src.physics.cr3bp import (
    cr3bp_equations,
    cr3bp_residual,
    jacobi_constant,
    lagrange_points,
)
from src.physics.propagator import propagate_trajectory

__all__ = [
    "cr3bp_equations",
    "cr3bp_residual",
    "jacobi_constant",
    "lagrange_points",
    "propagate_trajectory",
]
