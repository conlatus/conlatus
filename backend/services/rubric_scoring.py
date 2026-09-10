"""
rubric_scoring.py — Pure deterministic scoring layer.
Never calls LLM, only computes weighted verdict from accumulated evidence.
"""

from typing import Any, Dict


def calculate_verdict(
    rubric_evidence: Dict[str, Any],
    rubric_criteria: Dict[str, Dict[str, Any]],
    verdict_threshold: float = 3.0,
) -> Dict[str, Any]:
    """
    Computes the final interview verdict deterministically from accumulated evidence.

    Args:
        rubric_evidence: Dictionary mapping criterion names to evidence items or lists of items.
                         Each item can be a dict/RubricEvidenceItem containing 'score' (and 'evidence'/'reasoning').
        rubric_criteria: Dictionary defining criteria metadata including 'weight' and 'scale'.
        verdict_threshold: Minimum weighted score required for a 'PASS' verdict.

    Returns:
        Dict containing overall_score, verdict ('PASS' or 'FAIL'), threshold, and criteria_breakdown.
    """
    criteria_breakdown = {}
    overall_score = 0.0
    has_missing_evidence = False

    for criterion_name, criterion_config in rubric_criteria.items():
        weight = criterion_config.get("weight", 0.0)

        # Extract evidence for this criterion
        raw_evidence = rubric_evidence.get(criterion_name)

        if raw_evidence is None:
            # Missing evidence for this criterion
            criterion_score = 0.0
            evidence_count = 0
            has_missing_evidence = True
        elif isinstance(raw_evidence, list):
            scores = []
            for item in raw_evidence:
                if isinstance(item, dict):
                    scores.append(item.get("score", 0.0))
                elif hasattr(item, "score"):
                    scores.append(getattr(item, "score"))
            criterion_score = (sum(scores) / len(scores)) if scores else 0.0
            evidence_count = len(scores)
            if evidence_count == 0:
                has_missing_evidence = True
        else:
            if isinstance(raw_evidence, dict):
                criterion_score = float(raw_evidence.get("score", 0.0))
            elif hasattr(raw_evidence, "score"):
                criterion_score = float(getattr(raw_evidence, "score"))
            else:
                criterion_score = float(raw_evidence)
            evidence_count = 1

        weighted_score = criterion_score * weight
        overall_score += weighted_score

        criteria_breakdown[criterion_name] = {
            "score": round(criterion_score, 2),
            "weight": weight,
            "weighted_score": round(weighted_score, 2),
            "evidence_count": evidence_count,
        }

    overall_score = round(overall_score, 2)
    if has_missing_evidence:
        verdict = "INCOMPLETE"
    else:
        verdict = "PASS" if overall_score >= verdict_threshold else "FAIL"

    return {
        "overall_score": overall_score,
        "verdict": verdict,
        "threshold": verdict_threshold,
        "criteria_breakdown": criteria_breakdown,
    }

