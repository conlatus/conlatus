import json
import os
from typing import Any, Dict, List, Optional
import logging

try:
    import rubric_config
    from schemas.dialogue import EvaluationEnvelope, ProbeDecision
    from services.resilient_client import ResilientLLMClient, NonRetryableLLMError
except ImportError:
    import backend.rubric_config as rubric_config
    from backend.schemas.dialogue import EvaluationEnvelope, ProbeDecision
    from backend.services.resilient_client import ResilientLLMClient, NonRetryableLLMError

LLMEvaluationOutput = EvaluationEnvelope
logger = logging.getLogger(__name__)

class LLMError(Exception):
    """Base exception for LLM operations."""
    pass


class LLMMissingApiKeyError(LLMError):
    """Raised when GROQ_API_KEY is missing or empty."""
    pass


class LLMAuthenticationError(LLMError):
    """Raised when API key is missing or invalid (401)."""
    pass


class LLMRateLimitError(LLMError):
    """Raised when API rate limit is exceeded (429)."""
    pass


class LLMAPIError(LLMError):
    """Raised for general API failures or connection errors."""
    pass


class LLMEvaluator:
    def __init__(self, api_key: Optional[str] = None, use_mock: bool = False):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        is_testing = os.environ.get("TESTING", "").lower() == "true"
        self.use_mock = use_mock or is_testing
        
        self.client = None
        if not self.use_mock:
            self.client = ResilientLLMClient(api_key=self.api_key)

    def evaluate_response(
        self,
        current_question: Dict[str, Any],
        candidate_response: str,
        conversation_history: List[Dict[str, str]],
        current_followup_count: int,
        max_followups: int = rubric_config.MAX_FOLLOWUPS_PER_QUESTION,
        rubric_criteria: Optional[Dict[str, Any]] = None,
        role_title: Optional[str] = None,
    ) -> EvaluationEnvelope:
        """
        Evaluates the candidate's response against rubric criteria mapped to the current question.
        Returns a structured EvaluationEnvelope indicating the dialogue decision.
        """
        if self.use_mock:
            return self._mock_evaluate(
                current_question=current_question,
                candidate_response=candidate_response,
                current_followup_count=current_followup_count,
                max_followups=max_followups,
                rubric_criteria=rubric_criteria,
            )

        if not self.api_key or not self.client:
            raise LLMMissingApiKeyError(
                "GROQ_API_KEY is missing or empty. Please set your GROQ_API_KEY in .env."
            )

        mapped_criteria = current_question.get("maps_to", [])
        active_criteria = rubric_criteria if rubric_criteria else rubric_config.RUBRIC_CRITERIA
        criteria_info = {
            name: active_criteria[name]
            for name in mapped_criteria
            if name in active_criteria
        }

        # Build formatted conversation history context for turns
        history_text = ""
        if conversation_history:
            history_lines = []
            for turn in conversation_history[-6:]:
                role = str(turn.get("role", "unknown")).capitalize()
                content = str(turn.get("content", ""))
                history_lines.append(f"{role}: {content}")
            history_text = "\n".join(history_lines)

        active_role = role_title if role_title else rubric_config.ROLE_TITLE
        system_prompt = f"""You are a friendly, encouraging AI technical interviewer for the entry-level role: '{active_role}'.
You are evaluating the candidate's response to the current base question:
Question ID: {current_question.get('id')}
Question Text: "{current_question.get('text')}"
Notes: "{current_question.get('notes', '')}"
Mapped Rubric Criteria: {json.dumps(criteria_info)}

Current follow-up re-probes used for this question: {current_followup_count} of max {max_followups}.

CRITICAL INSTRUCTIONS ON ANSWER LENGTH & ONE-WORD RESPONSES:
- The interview questions are fundamental concepts (e.g. "What is HTML?", "What is CSS?", "What are variables?", "Give one example of an interpreted language.").
- Candidate answers CAN BE BRIEF OR EVEN A SINGLE WORD (e.g. "Python", "JavaScript", "HTML", "Styling", "Markup", "Storage", "C++").
- If the candidate's one-word or concise answer is correct, award full points (score 4.0 - 5.0) and choose PIVOT to smoothly proceed to the next question.
- Do NOT consider a short or one-word answer vague or penalize the candidate if their answer is correct.
- Only choose CLARIFY if the response is completely blank, unintelligible, or explicitly says "I don't know" / "idk".

CRITICAL INSTRUCTIONS ON QUESTION LENGTH:
- If you choose DEEPEN or CLARIFY, the 'suggested_question' MUST BE VERY SHORT — AT MOST ONE CONCISE SENTENCE (~ 5 to 12 words).
  Example: "Could you name one more example?" or "Can you clarify that in a few words?".
- NEVER generate long, elaborate, or multi-sentence questions.

Analyze the candidate's response and decide the next dialogue action (decision):
- DEEPEN: Candidate gave a good answer; ask a very brief one-sentence follow-up if follow-up budget allows.
- CLARIFY: Candidate gave a missing or unclear answer; ask a very brief one-sentence clarification.
- PIVOT: Candidate answered accurately (including valid one-word answers) or reached diminishing returns; transition to next question (suggested_question MUST be null).
- CONCLUDE: All questions covered or interview time budget reached (suggested_question MUST be null).

If you choose DEEPEN or CLARIFY, you MUST provide a 'suggested_question' (strictly one short sentence).
If you choose PIVOT or CONCLUDE, 'suggested_question' MUST be null.

Return strict JSON matching this exact schema:
{{
  "decision": "DEEPEN | CLARIFY | PIVOT | CONCLUDE",
  "suggested_question": "Your one-sentence follow-up question here (or null)",
  "criterion_evaluations": [
    {{
      "criterion": "criterion_name",
      "score": 4.0,
      "evidence": "quote or detail from response",
      "reasoning": "explanation for score"
    }}
  ]
}}
Do NOT include inline code comments or markdown formatting in your JSON output.
"""

        user_content = f"Recent Conversation History:\n{history_text}\n\nCandidate Response: {candidate_response}" if history_text else f"Candidate Response: {candidate_response}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            parsed = self.client.get_json_completion(messages)
            
            raw_decision = str(parsed.get("decision", "PIVOT")).upper()
            if raw_decision not in ["DEEPEN", "CLARIFY", "PIVOT", "CONCLUDE"]:
                raw_decision = "PIVOT"
                
            suggested_question = parsed.get("suggested_question")
            if raw_decision in ["PIVOT", "CONCLUDE"]:
                suggested_question = None
                
            criterion_evals = []
            for item in parsed.get("criterion_evaluations", []):
                try:
                    score = float(item.get("score", 3.0))
                except (ValueError, TypeError):
                    score = 3.0
                criterion_evals.append({
                    "criterion": str(item.get("criterion", "")),
                    "score": score,
                    "evidence": str(item.get("evidence", "")),
                    "reasoning": str(item.get("reasoning", "")),
                })
                
            return EvaluationEnvelope(
                decision=ProbeDecision(raw_decision),
                suggested_question=suggested_question,
                criterion_evaluations=criterion_evals,
                raw_llm_response=json.dumps(parsed)
            )
            
        except NonRetryableLLMError as e:
            err_str = str(e).lower()
            if "authentication" in err_str:
                raise LLMAuthenticationError(str(e)) from e
            if "invalid json" in err_str:
                raise LLMAPIError("LLM returned invalid JSON structure.") from e
                
            # If all else fails, gracefully degrade
            return self._mock_evaluate(
                current_question=current_question,
                candidate_response=candidate_response,
                current_followup_count=current_followup_count,
                max_followups=max_followups,
                rubric_criteria=rubric_criteria,
            )
        except Exception as e:
            return self._mock_evaluate(
                current_question=current_question,
                candidate_response=candidate_response,
                current_followup_count=current_followup_count,
                max_followups=max_followups,
                rubric_criteria=rubric_criteria,
            )


    def _mock_evaluate(
        self,
        current_question: Dict[str, Any],
        candidate_response: str,
        current_followup_count: int,
        max_followups: int,
        rubric_criteria: Optional[Dict[str, Any]] = None,
    ) -> EvaluationEnvelope:
        """Deterministic mock LLM evaluator for tests and key-less mode."""
        resp_lower = candidate_response.lower().strip()
        is_vague = (
            resp_lower == ""
            or "idk" in resp_lower
            or "i don't know" in resp_lower
            or "unsure" in resp_lower
            or resp_lower == "vague"
        )
        is_stellar = "perfect" in resp_lower or len(resp_lower) > 200

        mapped_criteria = current_question.get("maps_to", [])
        active_criteria = rubric_criteria if rubric_criteria else rubric_config.RUBRIC_CRITERIA
        if not mapped_criteria:
            mapped_criteria = list(active_criteria.keys())

        evaluations = []
        if is_vague:
            decision = ProbeDecision.CLARIFY
            suggested_followup = "Could you give a quick example?"
            score = 2.0
            reasoning = "Response was unclear."
        elif is_stellar:
            decision = ProbeDecision.PIVOT
            suggested_followup = None
            score = 5.0
            reasoning = "Accurate response."
        else:
            # Valid concise/one-word or standard answer
            decision = ProbeDecision.PIVOT
            suggested_followup = None
            score = 4.5
            reasoning = "Accurate and concise answer."

        for crit in mapped_criteria:
            evaluations.append(
                {
                    "criterion": crit,
                    "score": score,
                    "evidence": candidate_response[:100],
                    "reasoning": reasoning,
                }
            )

        mock_payload = {
            "decision": decision.value,
            "suggested_question": suggested_followup,
            "criterion_evaluations": evaluations,
        }

        return EvaluationEnvelope(
            decision=decision,
            suggested_question=suggested_followup,
            criterion_evaluations=evaluations,
            raw_llm_response=json.dumps(mock_payload),
        )

# Default global evaluator instance
llm_evaluator = LLMEvaluator()
