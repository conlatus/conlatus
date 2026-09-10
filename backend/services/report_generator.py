import json
import logging
from typing import Dict, Any, Optional
import uuid
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.interview import Interview
from models.report import Report
from core.session import session_store
from services.resilient_client import ResilientLLMClient, NonRetryableLLMError

logger = logging.getLogger(__name__)


class ReportGenerator:
    def __init__(self):
        self.llm_client = ResilientLLMClient()

    async def generate_report(self, interview_id: uuid.UUID, db_session: AsyncSession) -> Optional[Report]:
        """
        Synthesizes the post-interview report (Pass 2) by combining deterministic scores (Pass 1)
        with a holistic LLM assessment of the entire transcript.
        """
        # Fetch interview from DB
        res_interview = await db_session.execute(select(Interview).where(Interview.id == interview_id))
        interview = res_interview.scalar_one_or_none()
        
        if not interview:
            logger.error(f"Interview {interview_id} not found in DB.")
            return None

        # Check if report already exists
        res_report = await db_session.execute(select(Report).where(Report.interview_id == interview_id))
        existing_report = res_report.scalar_one_or_none()
        
        if existing_report:
            logger.info(f"Report already exists for interview {interview_id}.")
            return existing_report

        # Get active session from memory
        active_session = session_store.get_session(str(interview_id))
        
        verdict = None
        transcript_text = "No transcript available."
        
        if active_session:
            if active_session.verdict:
                verdict = active_session.verdict.dict()
            
            # Format transcript
            history_lines = []
            for t in active_session.conversation_history:
                history_lines.append(f"{str(t.role).capitalize()}: {t.content}")
            transcript_text = "\n\n".join(history_lines)
        else:
            logger.warning(f"Active session {interview_id} not found in memory. Returning early.")
            return None

        if not verdict:
            logger.error(f"No verdict calculated for session {interview_id}.")
            return None

        # Build prompt
        system_prompt = """You are an expert Executive Technical Recruiter.
You are tasked with writing a comprehensive candidate evaluation report.
You will be provided with:
1. The deterministic criteria scores calculated during the interview.
2. The full interview transcript.

Generate a JSON report with the following keys:
{
    "executive_summary": "A 3-4 sentence high-level overview of the candidate's performance.",
    "strengths": ["List of 2-3 strengths, incorporating direct verbatim quotes from the candidate"],
    "growth_areas": ["List of 2-3 areas for growth or red flags, with direct verbatim quotes"],
    "communication": "Assessment of the candidate's articulation and clarity.",
    "recommendation": "Strong Hire" | "Hire" | "Leaning No" | "Strong No"
}
Ensure output is STRICT JSON without markdown wrapping.
"""
        
        user_prompt = f"""
Deterministic Scores:
{json.dumps(verdict, indent=2)}

Full Transcript:
{transcript_text}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            # We must run synchronous LLM calls in a threadpool to not block asyncio loop
            parsed = await asyncio.to_thread(
                self.llm_client.get_json_completion, messages, temperature=0.3
            )
        except NonRetryableLLMError as e:
            logger.error(f"Failed to generate LLM report: {e}")
            parsed = {
                "executive_summary": "Failed to generate report due to LLM error.",
                "strengths": [],
                "growth_areas": [],
                "communication": "N/A",
                "recommendation": "Leaning No"
            }
        except Exception as e:
            logger.error(f"Unexpected error in LLM report generation: {e}")
            parsed = {
                "executive_summary": "Failed to generate report due to unexpected error.",
                "strengths": [],
                "growth_areas": [],
                "communication": "N/A",
                "recommendation": "Leaning No"
            }

        synthesis_details = {
            "strengths": parsed.get("strengths", []),
            "growth_areas": parsed.get("growth_areas", []),
            "communication": parsed.get("communication", ""),
            "flags": []
        }

        recommendation = str(parsed.get("recommendation", "Leaning No"))
        summary = str(parsed.get("executive_summary", ""))
        overall_score = verdict.get("overall_score", 0.0)
        rubric_breakdown = verdict.get("criteria_breakdown", {})

        new_report = Report(
            interview_id=interview_id,
            overall_score=overall_score,
            recommendation=recommendation,
            rubric_breakdown=rubric_breakdown,
            synthesis_details=synthesis_details,
            summary=summary,
            human_decision=None,
            human_notes=None
        )

        db_session.add(new_report)
        await db_session.commit()
        await db_session.refresh(new_report)
        
        logger.info(f"Successfully generated and saved report for {interview_id}")
        return new_report

    async def generate_report_background(self, interview_id: uuid.UUID):
        """Helper to run report generation isolated in a background task with its own DB session."""
        from core.database import AsyncSessionLocal
        try:
            async with AsyncSessionLocal() as session:
                await self.generate_report(interview_id, session)
        except Exception as e:
            logger.error(f"Background report generation failed for {interview_id}: {e}")

report_generator = ReportGenerator()
