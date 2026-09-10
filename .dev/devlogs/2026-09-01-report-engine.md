# Dual-Pass Report Generation 📄

Hey team! ☕️

Ever had a candidate answer every question with technically correct responses, but sound completely unenthusiastic and disjointed while doing it? 

Our old scoring engine just tallied up the turn-by-turn scores and spat out a number. It completely missed the holistic vibe check.

Today we're shipping the **Multi-Dimensional Report Engine**. It uses a dual-pass evaluation architecture.

### How it works 🛠️

**Pass 1: Deterministic Scoring**
This is the same system we had before. As the interview progresses, we calculate a normalized score per criteria based on the rubric weights.

**Pass 2: LLM Generative Synthesis**
This is the new hotness. When the interview ends, we trigger a background task (so the candidate doesn't have to wait for it). We feed the *entire transcript* and the Pass 1 scores into Groq. 

We explicitly prompt the LLM to write an executive summary and extract **verbatim quotes** from the candidate to back up the listed strengths and growth areas. It also evaluates their articulation and communication style holistically, since you can only really judge communication by looking at the entire conversation.

### Human in the Loop 🧑‍⚖️

We also added a new endpoint `POST /api/v1/reports/{id}/decision` so recruiters can drop their own notes and override the AI's final verdict. Because at the end of the day, AI should inform the hiring decision, not make it.

Ship it! 🚢
