import logging
from typing import Optional, Tuple
from schemas.dialogue import ProbeDecision, TurnState
from core.llm import llm_evaluator
from core.session import session_store
from models.schemas import RubricEvidenceItem

try:
    import rubric_config
except ImportError:
    import backend.rubric_config as rubric_config

logger = logging.getLogger(__name__)

class DialogueManager:
    """
    State machine that orchestrates the flow of the interview based on LLM probe decisions.
    """
    
    def process_turn(self, session_id: str, candidate_text: str) -> Tuple[bool, Optional[str]]:
        """
        Processes a candidate's turn.
        Returns a tuple: (is_followup: bool, next_question_text: Optional[str])
        """
        session = session_store.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Update turn count
        session.total_turns += 1

        active_questions = (
            session.interview_config.questions
            if session.interview_config and session.interview_config.questions
            else rubric_config.QUESTIONS
        )
        active_max_followups = (
            session.interview_config.max_followups
            if session.interview_config and session.interview_config.max_followups is not None
            else rubric_config.MAX_FOLLOWUPS_PER_QUESTION
        )
        active_rubric_criteria = (
            session.interview_config.rubric_criteria
            if session.interview_config and session.interview_config.rubric_criteria
            else rubric_config.RUBRIC_CRITERIA
        )

        current_question = active_questions[session.current_question_index]

        history_dicts = [{"role": t.role, "content": t.content} for t in session.conversation_history]
        
        envelope = llm_evaluator.evaluate_response(
            current_question=current_question,
            candidate_response=candidate_text,
            conversation_history=history_dicts,
            current_followup_count=session.current_question_followup_count,
            max_followups=active_max_followups,
            rubric_criteria=active_rubric_criteria,
            role_title=session.role_title
        )

        session.last_raw_llm_response = envelope.raw_llm_response

        # Update evidence
        for item in envelope.criterion_evaluations:
            crit_name = item.get("criterion")
            if crit_name and crit_name in active_rubric_criteria:
                session.rubric_evidence[crit_name] = RubricEvidenceItem(
                    criterion=crit_name,
                    score=float(item.get("score", 3.0)),
                    evidence=str(item.get("evidence", "")),
                    reasoning=str(item.get("reasoning", "")),
                )

        # Apply state transitions based on decision
        decision = envelope.decision
        
        # Override DEEPEN/CLARIFY if max followups reached
        if decision in [ProbeDecision.DEEPEN, ProbeDecision.CLARIFY] and session.current_question_followup_count >= active_max_followups:
            logger.info("Max followups reached, forcing PIVOT.")
            decision = ProbeDecision.PIVOT

        is_followup = False
        next_question_text = None

        if decision in [ProbeDecision.DEEPEN, ProbeDecision.CLARIFY]:
            session.current_question_followup_count += 1
            is_followup = True
            next_question_text = envelope.suggested_question or "Could you elaborate?"
            session.add_turn(role="interviewer", content=next_question_text)
        elif decision == ProbeDecision.PIVOT:
            session.current_question_index += 1
            session.current_question_followup_count = 0
            if session.current_question_index < len(active_questions):
                next_question_text = active_questions[session.current_question_index]["text"]
                session.add_turn(role="interviewer", content=next_question_text)
            else:
                # Exhausted questions
                session.status = "completed"
        elif decision == ProbeDecision.CONCLUDE:
            # The LLM decided to wrap up the interview completely
            session.status = "completed"

        # Check total turn budget limits
        if session.total_turns >= session.max_total_turns and session.status != "completed":
            session.status = "length_limited"

        return is_followup, next_question_text

dialogue_manager = DialogueManager()
