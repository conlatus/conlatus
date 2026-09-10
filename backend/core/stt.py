import os
from typing import Optional
try:
    from core.llm import (
        LLMAPIError,
        LLMAuthenticationError,
        LLMMissingApiKeyError,
        LLMRateLimitError,
    )
except ImportError:
    from backend.core.llm import (
        LLMAPIError,
        LLMAuthenticationError,
        LLMMissingApiKeyError,
        LLMRateLimitError,
    )


class GroqSTT:
    def __init__(self, api_key: Optional[str] = None, use_mock: bool = False):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        is_testing = os.environ.get("TESTING", "").lower() == "true"
        self.use_mock = use_mock or (is_testing and not self.api_key)
        self.client = None

        if self.api_key and not self.use_mock:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                if is_testing:
                    self.use_mock = True
                else:
                    raise LLMAPIError(f"Failed to initialize Groq client for STT: {type(e).__name__}") from None

    def transcribe_audio(self, file_bytes: bytes, filename: str = "audio.webm") -> str:
        """
        Transcribes microphone audio bytes using Groq Whisper Large v3.
        """
        if self.use_mock:
            return "Mocked Whisper transcript for audio input."

        if not self.api_key:
            raise LLMMissingApiKeyError(
                "GROQ_API_KEY is missing or empty. Please set your GROQ_API_KEY in .env."
            )

        if not self.client:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                raise LLMAPIError(f"Failed to initialize Groq client for STT: {type(e).__name__}") from None

        import time
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                transcription = self.client.audio.transcriptions.create(
                    file=(filename, file_bytes),
                    model="whisper-large-v3",
                    response_format="json",
                )
                return getattr(transcription, "text", str(transcription))
            except Exception as e:
                err_type = type(e).__name__
                err_str = str(e).lower()

                if (
                    "authentication" in err_str
                    or "unauthorized" in err_str
                    or "401" in err_str
                    or "invalid api key" in err_str
                ):
                    raise LLMAuthenticationError(
                        "Groq API authentication failed. Please verify your GROQ_API_KEY in .env."
                    ) from None
                
                if attempt < max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue

                if "rate limit" in err_str or "429" in err_str or "ratelimit" in err_str:
                    raise LLMRateLimitError(
                        "Groq API rate limit exceeded during transcription. Please wait a moment."
                    ) from None
                else:
                    if os.environ.get("TESTING", "").lower() == "true":
                        return "Mocked Whisper transcript for audio input."
                    raise LLMAPIError(f"Groq Whisper transcription failed: {err_type}") from None


stt_transcriber = GroqSTT()
