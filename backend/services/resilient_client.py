import logging
import os
from typing import Optional, Dict, Any, List
import json
import time

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    retry_if_exception,
)

logger = logging.getLogger(__name__)

class RetryableLLMError(Exception):
    """Exception that should trigger a retry."""
    pass

class NonRetryableLLMError(Exception):
    """Exception that should fail immediately."""
    pass


def should_retry(exception: BaseException) -> bool:
    """Determine if we should retry based on the exception message/type."""
    if isinstance(exception, RetryableLLMError):
        return True
    if isinstance(exception, NonRetryableLLMError):
        return False
        
    err_str = str(exception).lower()
    # 404 Model not found or missing access should fail immediately without retrying
    if "404" in err_str or "model_not_found" in err_str or "does not exist" in err_str:
        return False
    # Rate limits and server errors
    if "rate limit" in err_str or "429" in err_str:
        logger.warning("Rate limit hit. Retrying...")
        return True
    if "503" in err_str or "500" in err_str or "502" in err_str or "504" in err_str:
        logger.warning(f"Server error {err_str[:50]}. Retrying...")
        return True
    if "connection" in err_str or "timeout" in err_str:
        logger.warning("Connection error. Retrying...")
        return True
        
    # Default to not retrying unknown errors to avoid long hangs
    return False

class ResilientLLMClient:
    """
    A wrapper around Groq (or fallback models) that uses tenacity for exponential backoff.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except ImportError:
                logger.warning("Groq package not installed. Will use mock.")
                pass
            except Exception as e:
                logger.error(f"Failed to initialize Groq: {e}")

    @retry(
        retry=retry_if_exception(should_retry),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(4),
        reraise=True
    )
    def _execute_chat_completion(self, messages: List[Dict[str, str]], model: str, temperature: float = 0.2) -> str:
        if not self.client:
            raise NonRetryableLLMError("Groq client not initialized")
            
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=temperature,
            )
            return response.choices[0].message.content or "{}"
        except Exception as e:
            err_str = str(e).lower()
            if "authentication" in err_str or "unauthorized" in err_str or "401" in err_str:
                raise NonRetryableLLMError("Groq API authentication failed.") from e
            if "invalid api key" in err_str:
                raise NonRetryableLLMError("Invalid API key.") from e
            if "404" in err_str or "model_not_found" in err_str or "does not exist" in err_str:
                raise NonRetryableLLMError(f"Groq model {model} not found or inaccessible: {e}") from e
                
            if should_retry(e):
                raise RetryableLLMError(str(e)) from e
            raise NonRetryableLLMError(str(e)) from e

    def get_json_completion(
        self, 
        messages: List[Dict[str, str]], 
        primary_model: Optional[str] = None,
        fallback_model: Optional[str] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Executes a chat completion with fallback logic.
        """
        p_model = primary_model or os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
        f_model = fallback_model or os.environ.get("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
        if p_model == f_model:
            f_model = "openai/gpt-oss-20b" if p_model != "openai/gpt-oss-20b" else "qwen/qwen3.8-27b"

        # Try primary model
        try:
            raw_response = self._execute_chat_completion(
                messages=messages, 
                model=p_model, 
                temperature=temperature
            )
        except Exception as e:
            logger.error(f"Primary model {p_model} failed after retries: {e}. Attempting fallback to {f_model}...")
            try:
                # Try fallback model once
                raw_response = self._execute_chat_completion(
                    messages=messages, 
                    model=f_model, 
                    temperature=temperature
                )
            except Exception as fallback_e:
                logger.error(f"Fallback model {f_model} failed: {fallback_e}")
                raise NonRetryableLLMError("All LLM models failed.") from fallback_e

        # Clean JSON
        clean_json = raw_response.strip()
        if clean_json.startswith("```"):
            lines = clean_json.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_json = "\n".join(lines).strip()
            
        try:
            return json.loads(clean_json)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON: {e}")
            raise NonRetryableLLMError("LLM returned invalid JSON structure.") from e
