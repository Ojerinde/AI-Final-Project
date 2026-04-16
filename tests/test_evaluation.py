"""Tests for the evaluation module (guardrails & red-teaming)."""

import pytest
from src.evaluation.guardrails import ConstitutionalGuardrail, check_casualty_risk
from src.evaluation.red_team import RedTeamSuite
from src.evaluation.metrics import hit_rate_at_k, mean_reciprocal_rank, trajectory_viability_score


class TestGuardrails:
    """Tests for constitutional guardrails."""

    def test_safe_plan_approved(self):
        """A safe plan should be approved."""
        g = ConstitutionalGuardrail()
        result = g.check({"casualty_risk": 1e-5, "debris_lifetime_years": 5})
        assert result["approved"] is True

    def test_high_risk_rejected(self):
        """High casualty risk should be rejected."""
        g = ConstitutionalGuardrail()
        result = g.check({"casualty_risk": 0.01})
        assert result["approved"] is False

    def test_intentional_breakup_rejected(self):
        """Intentional breakup should be detected and rejected."""
        g = ConstitutionalGuardrail()
        result = g.check({"description": "intentional breakup event"})
        assert result["approved"] is False

    def test_casualty_risk_check(self):
        """Quick risk check should return correct compliance."""
        assert check_casualty_risk(1e-5)["compliant"] is True
        assert check_casualty_risk(0.01)["compliant"] is False


class TestRedTeam:
    """Tests for the red-teaming suite."""

    def test_all_tests_run(self):
        """All red-team cases should execute."""
        suite = RedTeamSuite()
        results = suite.run_all()
        assert len(results) == len(suite.ADVERSARIAL_PROMPTS)

    def test_pass_rate_above_threshold(self):
        """Pass rate should be 100% (guardrails catch all adversarial cases)."""
        suite = RedTeamSuite()
        summary = suite.summary()
        assert summary["pass_rate"] == 1.0


class TestMetrics:
    """Tests for evaluation metrics."""

    def test_hit_rate_with_hit(self):
        """Hit rate should be 1 when relevant result in top-k."""
        results = [{"id": "a"}, {"id": "b"}, {"id": "c"}]
        assert hit_rate_at_k(results, {"b"}, k=3) == 1.0

    def test_hit_rate_no_hit(self):
        """Hit rate should be 0 when no relevant result."""
        results = [{"id": "a"}, {"id": "b"}]
        assert hit_rate_at_k(results, {"z"}, k=2) == 0.0

    def test_viability_score_perfect(self):
        """Perfect trajectory should score 1.0."""
        score = trajectory_viability_score(delta_v=0.0, jacobi_drift=0.0)
        assert score == 1.0
