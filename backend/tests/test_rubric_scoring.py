import pytest
try:
    from services.rubric_scoring import calculate_verdict
except ImportError:
    from backend.services.rubric_scoring import calculate_verdict

SAMPLE_CRITERIA = {
    "technical_depth": {"weight": 0.4, "scale": 5},
    "problem_solving": {"weight": 0.3, "scale": 5},
    "communication": {"weight": 0.3, "scale": 5},
}

VERDICT_THRESHOLD = 3.0


def test_scoring_clearly_pass():
    """Evidence that should clearly pass (VERDICT_THRESHOLD comfortably exceeded)."""
    evidence = {
        "technical_depth": {"score": 4.5, "evidence": "Strong deep dive"},
        "problem_solving": {"score": 4.0, "evidence": "Good edge cases"},
        "communication": {"score": 5.0, "evidence": "Clear explanation"},
    }
    # Weighted: 4.5*0.4 + 4.0*0.3 + 5.0*0.3 = 1.8 + 1.2 + 1.5 = 4.5 >= 3.0
    result = calculate_verdict(evidence, SAMPLE_CRITERIA, VERDICT_THRESHOLD)
    assert result["verdict"] == "PASS"
    assert result["overall_score"] == 4.5


def test_scoring_clearly_fail():
    """Evidence that should clearly fail."""
    evidence = {
        "technical_depth": {"score": 2.0, "evidence": "Superficial"},
        "problem_solving": {"score": 1.5, "evidence": "Missed edge cases"},
        "communication": {"score": 2.0, "evidence": "Disorganized"},
    }
    # Weighted: 2.0*0.4 + 1.5*0.3 + 2.0*0.3 = 0.8 + 0.45 + 0.6 = 1.85 < 3.0
    result = calculate_verdict(evidence, SAMPLE_CRITERIA, VERDICT_THRESHOLD)
    assert result["verdict"] == "FAIL"
    assert result["overall_score"] == 1.85


def test_scoring_exact_threshold_boundary():
    """Evidence sitting exactly at the threshold boundary (overall_score == VERDICT_THRESHOLD)."""
    evidence = {
        "technical_depth": {"score": 3.0, "evidence": "Acceptable"},
        "problem_solving": {"score": 3.0, "evidence": "Acceptable"},
        "communication": {"score": 3.0, "evidence": "Acceptable"},
    }
    # Weighted: 3.0*0.4 + 3.0*0.3 + 3.0*0.3 = 3.0 == 3.0
    result = calculate_verdict(evidence, SAMPLE_CRITERIA, VERDICT_THRESHOLD)
    assert result["overall_score"] == 3.0
    assert result["verdict"] == "PASS"


def test_scoring_missing_criterion_failsafe():
    """Evidence missing a criterion entirely (should not silently pass — fail-safe to INCOMPLETE)."""
    partial_evidence = {
        "technical_depth": {"score": 5.0, "evidence": "Excellent"},  # 5.0 * 0.4 = 2.0
        "problem_solving": {"score": 5.0, "evidence": "Excellent"},  # 5.0 * 0.3 = 1.5
        # communication is missing entirely!
    }
    result = calculate_verdict(partial_evidence, SAMPLE_CRITERIA, VERDICT_THRESHOLD)
    assert result["verdict"] == "INCOMPLETE"
    assert result["criteria_breakdown"]["communication"]["score"] == 0.0
    assert result["criteria_breakdown"]["communication"]["evidence_count"] == 0
