import json
import logging
import os
import time
from typing import Optional, List

try:
    from groq import Groq
except ImportError:
    pass

from schemas.question_generation import TopicGenerationRequest, CurriculumPlanSchema
from services.web_research import web_researcher
from core.llm import LLMError, LLMMissingApiKeyError, LLMAuthenticationError, LLMRateLimitError, LLMAPIError

logger = logging.getLogger(__name__)

# Priority list of high-speed, high-reasoning models on Groq
CANDIDATE_MODELS: List[str] = [
    os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b"),
    os.environ.get("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b"),
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "groq/compound-mini",
]


class QuestionGenerator:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Groq client in QuestionGenerator: {e}")

    def generate_curriculum(self, request: TopicGenerationRequest) -> CurriculumPlanSchema:
        if not self.api_key or not self.client:
            raise LLMMissingApiKeyError("GROQ_API_KEY is missing or invalid.")

        # Grounding context from contemporary technical trends
        grounding_context = web_researcher.fetch_contemporary_scenarios(
            request.role_title, request.topics
        )

        num_questions = 4
        topics_str = ", ".join(request.topics) if request.topics else "General Software Engineering"

        system_prompt = f"""You are an elite Staff-level engineering interviewer and technical assessor.
Your task is to generate {num_questions} to 5 deep, scenario-based interview questions for a '{request.role_title}' role.
Seniority Level: {request.seniority_level}
Topics to focus on: {topics_str}

Rules:
1. Do NOT ask generic textbook trivia (e.g., "What is useState?").
2. Emphasize real-world trade-offs, architectural decisions, and production debugging scenarios.
3. Incorporate the following grounding context: {grounding_context}
4. Job Description context (if any): {request.job_description or 'N/A'}
5. You MUST generate at least 4 distinct questions in the 'questions' list (e.g., id 'q1', 'q2', 'q3', 'q4').
6. Format the output strictly as a JSON object matching the CurriculumPlanSchema.
    
JSON Schema:
{{
  "questions": [
    {{
      "id": "q1",
      "text": "Scenario-based question 1 text...",
      "competency_tag": "Architecture & Design",
      "difficulty": 4,
      "expected_signals": "Candidate should discuss...",
      "rubric_criteria": {{
        "criterion_a": {{
           "weight": 0.5,
           "scale": 5,
           "description": "Evaluation for criterion"
        }}
      }},
      "notes": "Interviewer note"
    }},
    {{
      "id": "q2",
      "text": "Scenario-based question 2 text...",
      "competency_tag": "Production Debugging",
      "difficulty": 4,
      "expected_signals": "Candidate should discuss...",
      "rubric_criteria": {{
        "criterion_b": {{
           "weight": 0.5,
           "scale": 5,
           "description": "Evaluation for criterion"
        }}
      }},
      "notes": "Interviewer note"
    }}
  ]
}}
Output only valid JSON without markdown fences.
"""

        # Deduplicate candidate models while preserving priority order
        unique_models = []
        for m in CANDIDATE_MODELS:
            if m and m not in unique_models:
                unique_models.append(m)

        last_error = None
        has_rate_limit = False

        for model in unique_models:
            try:
                logger.info(f"Synthesizing curriculum questions using model: {model}")
                t0 = time.time()
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": "Generate the curriculum JSON now."}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=1800,
                )

                raw_json = response.choices[0].message.content or "{}"
                clean_json = raw_json.strip()
                if clean_json.startswith("```"):
                    lines = clean_json.splitlines()
                    if lines and lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    clean_json = "\n".join(lines).strip()

                data = json.loads(clean_json)
                elapsed = time.time() - t0
                logger.info(f"Successfully synthesized questions with {model} in {elapsed:.2f}s")
                return CurriculumPlanSchema(**data)

            except Exception as e:
                err_str = str(e).lower()
                last_error = e

                # 401 Unauthorized should fail immediately
                if "authentication" in err_str or "unauthorized" in err_str or "401" in err_str or "invalid api key" in err_str:
                    raise LLMAuthenticationError(f"Groq API authentication failed: {e}") from e

                # Track rate limits
                if "rate limit" in err_str or "429" in err_str:
                    has_rate_limit = True
                    logger.warning(f"Rate limit for model {model}: {e}. Trying next available candidate...")
                    continue

                # 404 Model not found: switch to next model immediately with zero wait
                if "404" in err_str or "model_not_found" in err_str or "does not exist" in err_str:
                    logger.warning(f"Model {model} is not available on this key (404). Falling back immediately...")
                    continue

                # For other errors (e.g. transient network or parse error), log and try fallback model
                logger.warning(f"Error generating questions with {model}: {e}. Attempting fallback...")
                continue

        if has_rate_limit:
            raise LLMRateLimitError(f"Groq API rate limit exceeded across all candidate models: {last_error}") from last_error

        raise LLMAPIError(f"Failed to generate questions after trying models {unique_models}: {last_error}") from last_error


question_generator = QuestionGenerator()
