# Teaching the AI to Interrogate Humans (Nicely, of course)

Hey folks! 👋 So we just rolled out a pretty sweet upgrade to the recruiter admin dashboard today: **Autonomous AI Question Synthesis**.

You know what's annoying? Setting up technical interviews. Writing good questions is hard. It usually devolves into a recruiter frantically Googling "hard React questions" and copying the first trivia question they see ("What is the virtual DOM?"). Yawn. 🥱

We wanted our AI interviewer to hit the candidate with *real-world* scenarios. To do that, we built a whole generation pipeline powered by Groq and `llama-3.3-70b-versatile`. 

### How it works under the hood 🏎️💨

We added a new Pydantic schema called `CurriculumPlanSchema`. This schema strictly forces the LLM to output an array of `GeneratedQuestionSchema` objects. The beautiful part is that it doesn't just generate the question text; it demands the LLM to also figure out the `competency_tag`, a `difficulty` level, and most importantly, the `expected_signals` and `rubric_criteria`.

When a recruiter clicks the magical  **Synthesize Questions**  button on the frontend, we hit our new `/admin/generate-questions` endpoint.
But wait, we didn't just tell the LLM to "write questions." We added a `WebResearchService` (currently heavily mocking the pipeline) designed to inject grounding context. It basically whispers in the LLM's ear: *"Hey, make sure you ask them about distributed consensus failures and production memory leaks."* 

This ensures the generated curriculum is grounded in modern engineering realities, not 2012 textbook definitions.

### Frontend Goodies 🎨

We wired up a sleek mode-toggle in the `SetupInterviewPage` (built on Next.js, of course). You can switch between manual mode and autonomous mode. If you go autonomous, you just pick a seniority level, type in a few topics, paste a JD, and bam—the LLM kicks back a beautifully structured curriculum. The recruiter can still tweak the question text inline before finalizing the interview link. 

No more trivia. It's time for some deep architecture drilling! ☕️🚀
