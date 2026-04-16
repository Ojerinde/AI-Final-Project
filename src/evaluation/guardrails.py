"""Constitutional AI guardrails for mission safety.

Automatically rejects any plan that violates:
- NASA-STD-8719.14A orbital debris limits
- Reentry casualty risk > 1:10,000
"""

from __future__ import annotations

from src.config import MAX_CASUALTY_RISK, MAX_DEBRIS_LIFETIME_YEARS


class ConstitutionalGuardrail:
    """Guardrail layer that rejects unsafe mission plans.

    Checks:
    1. Reentry casualty risk ≤ 1:10,000
    2. Orbital debris lifetime ≤ 25 years
    3. No intentional breakup events
    """

    PROHIBITED_KEYWORDS = [
        "intentional breakup",
        "deliberate fragmentation",
        "self-destruct in orbit",
        "create debris field",
    ]

    def check(self, plan: dict) -> dict:
        """Validate a mission plan against safety constraints.

        Args:
            plan: Dict with keys like 'casualty_risk', 'debris_lifetime_years',
                  'description', 'delta_v', etc.

        Returns:
            Dict with 'approved' (bool), 'violations' (list[str]).
        """
        violations: list[str] = []

        # Casualty risk
        risk = plan.get("casualty_risk", 0.0)
        if risk > MAX_CASUALTY_RISK:
            violations.append(
                f"Casualty risk {risk:.2e} exceeds limit {MAX_CASUALTY_RISK:.2e} "
                f"(NASA-STD-8719.14A §4.7)"
            )

        # Debris lifetime
        lifetime = plan.get("debris_lifetime_years", 0.0)
        if lifetime > MAX_DEBRIS_LIFETIME_YEARS:
            violations.append(
                f"Debris lifetime {lifetime} years exceeds {MAX_DEBRIS_LIFETIME_YEARS}-year limit "
                f"(NASA-STD-8719.14A §4.3)"
            )

        # Prohibited actions
        desc = plan.get("description", "").lower()
        for kw in self.PROHIBITED_KEYWORDS:
            if kw in desc:
                violations.append(f"Prohibited action detected: '{kw}'")

        return {"approved": len(violations) == 0, "violations": violations}


def check_casualty_risk(estimated_risk: float) -> dict:
    """Quick check for reentry casualty risk compliance.

    Args:
        estimated_risk: Estimated probability of human casualty.

    Returns:
        Dict with 'compliant' and 'message'.
    """
    compliant = estimated_risk <= MAX_CASUALTY_RISK
    return {
        "compliant": compliant,
        "estimated_risk": estimated_risk,
        "limit": MAX_CASUALTY_RISK,
        "message": (
            "PASS — within NASA-STD-8719.14A casualty risk limit"
            if compliant
            else f"FAIL — risk {estimated_risk:.2e} exceeds 1:10,000 limit"
        ),
    }
