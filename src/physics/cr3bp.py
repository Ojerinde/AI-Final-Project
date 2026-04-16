"""Circular Restricted Three-Body Problem (CR3BP) equations.

Implements the non-dimensional CR3BP equations of motion from Szebehely's
*Theory of Orbits* (1967), Chapter 1.  The formulation uses a rotating
reference frame centred at the Earth–Moon barycentre.

Coordinate convention (synodic / rotating frame):
    x — along Earth–Moon line (Earth at -μ, Moon at 1-μ)
    y — in the orbital plane, perpendicular to x
    z — normal to the orbital plane
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from src.config import MU_CR3BP


# ── Equations of Motion ─────────────────────────────────────────────────────

def cr3bp_equations(t: float, state: NDArray, mu: float = MU_CR3BP) -> NDArray:
    """Right-hand side of the CR3BP equations of motion.

    Args:
        t: Time (unused — autonomous system; kept for ODE-solver API).
        state: State vector [x, y, z, vx, vy, vz].
        mu: Mass ratio μ = m₂/(m₁+m₂). Defaults to Earth–Moon value.

    Returns:
        Derivative vector [vx, vy, vz, ax, ay, az].
    """
    x, y, z, vx, vy, vz = state

    # Distances to primaries
    r1 = np.sqrt((x + mu) ** 2 + y ** 2 + z ** 2)          # to Earth (m₁)
    r2 = np.sqrt((x - 1 + mu) ** 2 + y ** 2 + z ** 2)      # to Moon  (m₂)

    # Accelerations in the rotating frame (Szebehely eq. 1.4-5)
    ax = (2 * vy + x
          - (1 - mu) * (x + mu) / r1 ** 3
          - mu * (x - 1 + mu) / r2 ** 3)
    ay = (-2 * vx + y
          - (1 - mu) * y / r1 ** 3
          - mu * y / r2 ** 3)
    az = (-(1 - mu) * z / r1 ** 3
          - mu * z / r2 ** 3)

    return np.array([vx, vy, vz, ax, ay, az])


# ── Jacobi Constant ─────────────────────────────────────────────────────────

def jacobi_constant(state: NDArray, mu: float = MU_CR3BP) -> float:
    """Compute the Jacobi constant (integral of motion) for a CR3BP state.

    Args:
        state: State vector [x, y, z, vx, vy, vz].
        mu: Mass ratio.

    Returns:
        Jacobi constant C_J (scalar).
    """
    x, y, z, vx, vy, vz = state
    r1 = np.sqrt((x + mu) ** 2 + y ** 2 + z ** 2)
    r2 = np.sqrt((x - 1 + mu) ** 2 + y ** 2 + z ** 2)

    U = 0.5 * (x ** 2 + y ** 2) + (1 - mu) / r1 + mu / r2
    v_sq = vx ** 2 + vy ** 2 + vz ** 2

    return 2 * U - v_sq


# ── CR3BP Residual (for PINN loss) ──────────────────────────────────────────

def cr3bp_residual(
    state: NDArray,
    state_dot: NDArray,
    mu: float = MU_CR3BP,
) -> NDArray:
    """Compute the CR3BP residual: ẍ_predicted − ẍ_cr3bp.

    Used as the physics-informed loss term in the PINN.

    Args:
        state: State vector [x, y, z, vx, vy, vz].
        state_dot: Time-derivative of state (predicted by network).
        mu: Mass ratio.

    Returns:
        Residual vector (6,). Zero ↔ exact CR3BP compliance.
    """
    analytical = cr3bp_equations(0.0, state, mu)
    return state_dot - analytical


# ── Lagrange Points ─────────────────────────────────────────────────────────

def lagrange_points(mu: float = MU_CR3BP, tol: float = 1e-12) -> dict[str, NDArray]:
    """Compute the five CR3BP Lagrange points via Newton iteration.

    Args:
        mu: Mass ratio.
        tol: Convergence tolerance.

    Returns:
        Dict mapping "L1"…"L5" to position arrays [x, y, 0].
    """
    from scipy.optimize import brentq

    def collinear_eq(x: float) -> float:
        """f(x) = 0 along the x-axis (y=z=0, vy=vz=0, ax=0)."""
        r1 = abs(x + mu)
        r2 = abs(x - 1 + mu)
        return x - (1 - mu) * (x + mu) / r1 ** 3 - mu * (x - 1 + mu) / r2 ** 3

    # L1: between Earth and Moon
    x_l1 = brentq(collinear_eq, -mu + 0.01, 1 - mu - 0.01, xtol=tol)
    # L2: beyond Moon
    x_l2 = brentq(collinear_eq, 1 - mu + 0.01, 2.0, xtol=tol)
    # L3: opposite side of Earth
    x_l3 = brentq(collinear_eq, -2.0, -mu - 0.01, xtol=tol)

    # L4 and L5: equilateral triangle points
    x_l4 = 0.5 - mu
    y_l4 = np.sqrt(3) / 2
    x_l5 = 0.5 - mu
    y_l5 = -np.sqrt(3) / 2

    return {
        "L1": np.array([x_l1, 0.0, 0.0]),
        "L2": np.array([x_l2, 0.0, 0.0]),
        "L3": np.array([x_l3, 0.0, 0.0]),
        "L4": np.array([x_l4, y_l4, 0.0]),
        "L5": np.array([x_l5, y_l5, 0.0]),
    }
