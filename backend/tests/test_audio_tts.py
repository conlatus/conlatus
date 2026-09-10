"""
Pure-logic unit tests for STT transcript-to-loop handoff and TTS sentence boundary chunking.
"""

import io
from unittest.mock import patch
from fastapi.testclient import TestClient

try:
    from main import app
    from core.tts import chunk_sentences
    from core.llm import LLMEvaluationOutput
    import rubric_config
except ImportError:
    from backend.main import app
    from backend.core.tts import chunk_sentences
    from backend.core.llm import LLMEvaluationOutput
    import backend.rubric_config as rubric_config

client = TestClient(app)


def test_sentence_boundary_chunking_basic():
    text = "Hello! This is a test. How are you doing?"
    chunks = chunk_sentences(text)
    assert chunks == ["Hello!", "This is a test.", "How are you doing?"]


def test_sentence_boundary_chunking_trailing_unpunctuated():
    text = "First complete sentence. Second trailing phrase without dot"
    chunks = chunk_sentences(text)
    assert chunks == ["First complete sentence.", "Second trailing phrase without dot"]


def test_sentence_boundary_chunking_empty_and_whitespace():
    assert chunk_sentences("") == []
    assert chunk_sentences("   ") == []
    assert chunk_sentences(None) == []


def test_sentence_boundary_chunking_single_sentence():
    text = "REST relies on standard HTTP methods like GET and POST."
    chunks = chunk_sentences(text)
    assert chunks == ["REST relies on standard HTTP methods like GET and POST."]


@patch("backend.routers.interview.stt_transcriber.transcribe_audio")
@patch("backend.routers.interview.llm_evaluator.evaluate_response")
def test_audio_message_transcript_to_loop_handoff(mock_eval, mock_transcribe, candidate_headers):
    """
    Validates that audio-message receives an audio blob, calls Whisper STT,
    and passes the resulting transcript into the exact same interview loop.
    """
    from schemas.dialogue import ProbeDecision

    mock_transcript = "REST uses HTTP methods across endpoints, while GraphQL uses a single endpoint."
    mock_transcribe.return_value = mock_transcript
    mock_eval.return_value = LLMEvaluationOutput(
        decision=ProbeDecision.PIVOT,
        suggested_question=None,
        criterion_evaluations=[
            {
                "criterion": "technical_depth",
                "score": 4.0,
                "evidence": mock_transcript,
                "reasoning": "Clear explanation of REST vs GraphQL.",
            }
        ],
        raw_llm_response="{}",
    )

    start_resp = client.post("/interview/start", json={"candidate_id": "candidate-audio-loop"}, headers=candidate_headers)
    session_id = start_resp.json()["session_id"]

    fake_audio_bytes = b"RIFF....WAVEfmt ...."
    audio_file = io.BytesIO(fake_audio_bytes)

    response = client.post(
        f"/interview/{session_id}/audio-message",
        files={"file": ("test_answer.webm", audio_file, "audio/webm")},
        headers=candidate_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transcript"] == mock_transcript
    assert data["session_id"] == session_id
    mock_transcribe.assert_called_once()
    mock_eval.assert_called_once()

    status_resp = client.get(f"/interview/{session_id}/status", headers=candidate_headers)
    status_data = status_resp.json()
    candidate_turn = [t for t in status_data["conversation_history"] if t["role"] == "candidate"][-1]
    assert candidate_turn["role"] == "candidate"
    assert candidate_turn["content"] == mock_transcript


@patch("backend.routers.interview.stt_transcriber.transcribe_audio")
def test_audio_message_empty_file_rejection(mock_transcribe, candidate_headers):
    start_resp = client.post("/interview/start", json={"candidate_id": "candidate-empty-audio"}, headers=candidate_headers)
    session_id = start_resp.json()["session_id"]

    empty_audio = io.BytesIO(b"")
    response = client.post(
        f"/interview/{session_id}/audio-message",
        files={"file": ("empty.webm", empty_audio, "audio/webm")},
        headers=candidate_headers,
    )
    assert response.status_code == 400
    assert "Empty audio" in response.json()["detail"]
