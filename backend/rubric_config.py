"""
rubric_config.py — MVP rubric + question config (loaded via import, not DB)
"""

ROLE_TITLE = "Backend Developer — Internship"

# Rubric criteria the interview evaluates against.
# `weight` values across all criteria should sum to 1.0.
RUBRIC_CRITERIA = {
    "technical_depth": {
        "weight": 0.4,
        "scale": 5,  # score range 1-5 per criterion
        "description": "Depth of understanding, not just correct terminology.",
    },
    "problem_solving": {
        "weight": 0.3,
        "scale": 5,
        "description": "Ability to reason through edge cases and trade-offs.",
    },
    "communication": {
        "weight": 0.3,
        "scale": 5,
        "description": "Clarity and structure of explanation.",
    },
}

# Deterministic verdict threshold — weighted average score (out of max scale) needed to pass.
# Consumed by the separate scoring layer (rubric_scoring.py), never by the LLM directly.
VERDICT_THRESHOLD = 3.0

# Minimum number of base questions required for a valid interview.
# Enforced at config load time — reject/warn below this, do not attempt to run a shorter interview.
MIN_QUESTIONS = 3

# Max follow-up re-probes allowed per base question before moving on regardless of answer quality.
MAX_FOLLOWUPS_PER_QUESTION = 2

# Maximum total turns permitted per session to enforce runtime safety ceiling.
SAFETY_CEILING = 30


QUESTIONS = [
    {
        "id": "q1",
        "text": "Explain the difference between REST and GraphQL.",
        "maps_to": ["technical_depth"],
        "notes": "Look for understanding of trade-offs, not just definitions.",
    },
    {
        "id": "q2",
        "text": "Walk me through how you'd debug a slow API endpoint.",
        "maps_to": ["problem_solving", "communication"],
        "notes": "",
    },
    {
        "id": "q3",
        "text": "How do database indexes improve query performance, and what are their trade-offs?",
        "maps_to": ["technical_depth", "problem_solving"],
        "notes": "Candidate should mention index structures and write overhead.",
    },
    {
        "id": "q4",
        "text": "How would you design a simple rate limiter for a REST API?",
        "maps_to": ["technical_depth", "problem_solving", "communication"],
        "notes": "Look for sliding window / token bucket concepts.",
    },
]


def validate_rubric_config(
    questions=None,
    criteria=None,
    min_questions=None,
) -> None:
    """
    Validates rubric and question configuration.
    Raises ValueError if validation fails:
    1. len(QUESTIONS) < MIN_QUESTIONS
    2. Sum of weights in RUBRIC_CRITERIA != 1.0
    3. Any question's maps_to references a criterion not present in RUBRIC_CRITERIA
    """
    target_questions = questions if questions is not None else QUESTIONS
    target_criteria = criteria if criteria is not None else RUBRIC_CRITERIA
    target_min_questions = min_questions if min_questions is not None else MIN_QUESTIONS

    if len(target_questions) < target_min_questions:
        raise ValueError(
            f"Config validation error: Question count ({len(target_questions)}) "
            f"is less than MIN_QUESTIONS ({target_min_questions})."
        )

    weight_sum = sum(c.get("weight", 0.0) for c in target_criteria.values())
    if abs(weight_sum - 1.0) > 1e-6:
        raise ValueError(
            f"Config validation error: Sum of rubric weights ({weight_sum:.4f}) does not equal 1.0."
        )

    valid_criteria_keys = set(target_criteria.keys())
    for q in target_questions:
        for mapped_criterion in q.get("maps_to", []):
            if mapped_criterion not in valid_criteria_keys:
                raise ValueError(
                    f"Config validation error: Question '{q.get('id')}' references unknown criterion '{mapped_criterion}'."
                )
