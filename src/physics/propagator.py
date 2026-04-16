"""Orbital trajectory propagator using scipy ODE solvers."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy.integrate import solve_ivp

from src.physics.cr3bp import cr3bp_equations, jacobi_constant
from src.config import MU_CR3BP


def propagate_trajectory(
    state0: NDArray,
    t_span: tuple[float, float],
    mu: float = MU_CR3BP,
    max_step: float = 1e-3,
    rtol: float = 1e-12,
    atol: float = 1e-14,
    dense_output: bool = True,
) -> dict:
    """Propagate a CR3BP trajectory from an initial state.

    Uses DOP853 (8th-order Dormand–Prince) for high-accuracy integration.

    Args:
        state0: Initial state [x, y, z, vx, vy, vz] in non-dimensional units.
        t_span: (t_start, t_end) in non-dimensional time.
        mu: CR3BP mass ratio.
        max_step: Maximum integration step size.
        rtol: Relative tolerance.
        atol: Absolute tolerance.
        dense_output: Whether to produce a continuous solution.

    Returns:
        Dict with keys: 't' (times), 'states' (6×N), 'jacobi' (N,),
        'sol' (scipy OdeSolution if dense_output).
    """
    sol = solve_ivp(
        fun=lambda t, s: cr3bp_equations(t, s, mu),
        t_span=t_span,
        y0=state0,
        method="DOP853",
        max_step=max_step,
        rtol=rtol,
        atol=atol,
        dense_output=dense_output,
    )

    # Compute Jacobi constant along the trajectory (should be near-constant)
    cj_values = np.array([jacobi_constant(sol.y[:, k], mu)
                         for k in range(sol.y.shape[1])])

    result = {
        "t": sol.t,
        "states": sol.y,
        "jacobi": cj_values,
    }
    if dense_output:
        result["sol"] = sol.sol

    return result


def compute_delta_v(v_current: NDArray, v_target: NDArray) -> float:
    """Compute the delta-v magnitude for a single impulsive manoeuvre.

    Args:
        v_current: Current velocity vector [vx, vy, vz].
        v_target: Target velocity vector [vx, vy, vz].

    Returns:
        Delta-v magnitude (non-dimensional or m/s depending on input units).
    """
    return float(np.linalg.norm(v_target - v_current))


def check_trajectory_feasibility(
    delta_v_total: float,
    max_delta_v: float = 4.0,
    jacobi_drift: float | None = None,
    max_jacobi_drift: float = 1e-6,
) -> dict:
    """Check if a generated trajectory is physically feasible.

    Args:
        delta_v_total: Total delta-v of the trajectory.
        max_delta_v: Maximum allowable delta-v (non-dimensional).
        jacobi_drift: Maximum observed Jacobi-constant drift along the path.
        max_jacobi_drift: Tolerance for Jacobi drift.

    Returns:
        Dict with 'feasible' (bool) and 'reasons' (list[str]).
    """
    reasons: list[str] = []
    if delta_v_total > max_delta_v:
        reasons.append(
            f"Δv ({delta_v_total:.4f}) exceeds limit ({max_delta_v})")
    if jacobi_drift is not None and jacobi_drift > max_jacobi_drift:
        reasons.append(
            f"Jacobi drift ({jacobi_drift:.2e}) exceeds tolerance ({max_jacobi_drift})")

    return {"feasible": len(reasons) == 0, "reasons": reasons}
