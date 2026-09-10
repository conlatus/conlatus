import re
from typing import List


def chunk_sentences(text: str) -> List[str]:
    """
    Splits input text into individual sentence chunks based on sentence-ending
    punctuation (., ?, !) followed by whitespace or end of string.
    
    Used for pure-logic sentence boundary detection in TTS synthesis queueing.
    """
    if not text or not text.strip():
        return []

    # Match sentences ending with ., ?, or !
    pattern = r'[^.!?]+[.!?]+(?=\s|$)'
    matches = re.findall(pattern, text)

    matched_len = sum(len(m) for m in matches)
    remainder = text[matched_len:].strip()

    result = [m.strip() for m in matches if m.strip()]
    if remainder:
        result.append(remainder)

    return result
