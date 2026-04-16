"""Tests for the CR3BP physics module."""

import numpy as np
import pytest

from src.physics.cr3bp import cr3bp_equations, jacobi_constant, cr3bp_residual, lagrange_points
from src.config import MU_CR3BP


class TestCR3BPEquations:
    """Tests for the CR3BP equations of motion."""

    def test_state_derivative_shape(self):
        """Derivative vector should be length 6."""
        state = np.array([0.5, 0.1, 0.0, 0.01, -0.02, 0.0])
        deriv = cr3bp_equations(0.0, state)
        assert deriv.shape == (6,)

    def test_velocity_passthrough(self):
        """First 3 elements of derivative should equal velocities."""
        state = np.array([0.5, 0.1, 0.0, 0.01, -0.02, 0.003])
        deriv = cr3bp_equations(0.0, state)
        np.testing.assert_array_equal(deriv[:3], state[3:])

    def test_lagrange_l1_on_x_axis(self):
        """L1 should be on the x-axis between Earth and Moon."""
        lps = lagrange_points()
        l1 = lps["L1"]
        assert -MU_CR3BP < l1[0] < (1 - MU_CR3BP)
        assert abs(l1[1]) < 1e-10
        assert abs(l1[2]) < 1e-10

    def test_lagrange_l4_l5_equilateral(self):
        """L4 and L5 should form equilateral triangles."""
        lps = lagrange_points()
        # L4 y > 0, L5 y < 0
        assert lps["L4"][1] > 0
        assert lps["L5"][1] < 0
        # Same x coordinate
        assert abs(lps["L4"][0] - lps["L5"][0]) < 1e-10


class TestJacobiConstant:
    """Tests for the Jacobi constant."""

    def test_positive_at_lagrange_point(self):
        """Jacobi constant at L1 with zero velocity should be positive."""
        lps = lagrange_points()
        state = np.array([*lps["L1"], 0, 0, 0])
        cj = jacobi_constant(state)
        assert cj > 0

    def test_conservation_along_trajectory(self):
        """Jacobi constant should be conserved along a CR3BP trajectory."""
        from src.physics.propagator import propagate_trajectory

        state0 = np.array([0.5, 0.0, 0.0, 0.0, 0.5, 0.0])
        result = propagate_trajectory(state0, (0, 2 * np.pi))
        cj = result["jacobi"]
        # Drift should be tiny for a well-integrated trajectory
        assert np.std(cj) < 1e-6


class TestCR3BPResidual:
    """Tests for the physics residual."""

    def test_zero_residual_for_exact_dynamics(self):
        """Residual should be zero when state_dot matches analytical equations."""
        state = np.array([0.5, 0.1, 0.0, 0.01, -0.02, 0.0])
        exact_dot = cr3bp_equations(0.0, state)
        residual = cr3bp_residual(state, exact_dot)
        np.testing.assert_allclose(residual, 0.0, atol=1e-14)

    def test_nonzero_residual_for_wrong_dynamics(self):
        """Residual should be nonzero for incorrect state derivative."""
        state = np.array([0.5, 0.1, 0.0, 0.01, -0.02, 0.0])
        wrong_dot = np.zeros(6)
        residual = cr3bp_residual(state, wrong_dot)
        assert np.linalg.norm(residual) > 0
