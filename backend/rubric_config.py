"""
rubric_config.py — MVP rubric + question config (loaded via import, not DB)
"""

ROLE_TITLE = "Junior Web Developer — Fundamentals"

# Rubric criteria the interview evaluates against.
# `weight` values across all criteria should sum to 1.0.
RUBRIC_CRITERIA = {
    "technical_depth": {
        "weight": 0.4,
        "scale": 5,  # score range 1-5 per criterion
        "description": "Understanding of basic programming and web concepts.",
    },
    "problem_solving": {
        "weight": 0.3,
        "scale": 5,
        "description": "Ability to identify language paradigms and core syntax elements.",
    },
    "communication": {
        "weight": 0.3,
        "scale": 5,
        "description": "Clear, concise answers (single-word or short answers are encouraged).",
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
        "text": "What is HTML?",
        "maps_to": ["technical_depth"],
        "notes": "Candidate can provide a single-word or short answer, e.g., 'markup', 'structure', 'webpages', or 'HyperText Markup Language'.",
    },
    {
        "id": "q2",
        "text": "What is CSS?",
        "maps_to": ["technical_depth", "communication"],
        "notes": "Candidate can provide a single-word or short answer, e.g., 'styling', 'styles', 'design', or 'presentation'.",
    },
    {
        "id": "q3",
        "text": "What are variables in programming?",
        "maps_to": ["technical_depth", "problem_solving"],
        "notes": "Candidate can answer in one word or a brief phrase, e.g., 'containers', 'storage', 'data holders', or 'memory'.",
    },
    {
        "id": "q4",
        "text": "Give one example of an interpreted programming language.",
        "maps_to": ["problem_solving", "communication"],
        "notes": "One-word answer expected, e.g., 'Python', 'JavaScript', 'Ruby', or 'PHP'.",
    },
    {
        "id": "q5",
        "text": "Give one example of a compiled programming language.",
        "maps_to": ["problem_solving", "communication"],
        "notes": "One-word answer expected, e.g., 'C', 'C++', 'Java', 'Rust', or 'Go'.",
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
