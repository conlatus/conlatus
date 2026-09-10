# Goodbye Hardcoded Loops, Hello Adaptive Engine 🧠

Hey team! ☕️

Remember that incredibly annoying logic in our interview engine that rigidly forced the AI to follow-up EXACTLY three times regardless of what the candidate said? Even if they gave the most brilliant, Nobel-prize-winning answer on turn one, the AI would still awkwardly ask, "Can you elaborate?" 

Yeah, that's finally dead. 🪦

We just shipped the **Adaptive Dialogue Engine & Resilient Probing** architecture. 

### What's New? 🚀

We stripped out the hardcoded `followup_count >= 3` logic from `interview.py` and completely redesigned the core flow with a proper state machine: `DialogueManager`. 

Now, when a candidate speaks, the LLM evaluator doesn't just return a boolean `is_complete`. It explicitly evaluates the *information entropy* and quality of the response, and selects from an action space:
- **`DEEPEN`**: The candidate said something spicy; drill into it!
- **`CLARIFY`**: The candidate was vague; force them to be specific.
- **`PIVOT`**: The candidate nailed it (or completely bombed and we're wasting time); let's move on to the next base question.
- **`CONCLUDE`**: Time budget reached, wrap it up gracefully.

### Resilience and the LLM 🛡️

LLMs are flaky. Sometimes Groq throws a 429 rate limit. Sometimes the JSON parser chokes because the model decided to write an apology before its JSON block. 

To fix this, we added `tenacity` and built a `ResilientLLMClient`. It intelligently catches transient server errors, automatically applies exponential backoff, and even recovers from malformed JSON Markdown blocks. If Groq fully crashes, we have fallback pathways so the candidate doesn't get dropped in the middle of a sentence.

The interview experience just went from "robotic checklist" to "smooth, adaptive conversationalist."

Ship it! 🚢
