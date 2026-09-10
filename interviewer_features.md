# Interviewer / Recruiter Portal Features

To make the platform functional for an interviewer or recruiter, you need a dedicated **Interviewer Dashboard**. Currently, the frontend only serves the candidate's experience. 

Here is a breakdown of features you can add to the frontend (e.g., under a new route like `/dashboard` or `/admin`) to give interviewers full control over the process.

## 1. Interview Configuration & Setup
Before a candidate joins, the interviewer needs to define what the AI should evaluate.
* **Role & JD Input:** A form to paste the Job Description, which the AI uses to generate relevant questions.
* **Rubric Builder:** A UI to define what success looks like. (e.g., "Evaluate React knowledge out of 10", "Check for cultural fit").
* **Custom Question Bank:** Allow the interviewer to add mandatory questions the AI *must* ask, alongside the dynamically generated ones.
* **Invite Generation:** A button to generate unique, one-time interview links (e.g., `/interview?session=123`) to send to candidates.

## 2. Candidate Pipeline Dashboard
A Kanban board or data table to track candidates through the pipeline.
* **Status Tracking:** See who is `Invited`, `In Progress`, `Completed`, or `Evaluated`.
* **Quick Stats:** High-level AI scores visible at a glance to easily shortlist top performers.

## 3. Post-Interview Analysis & Review
Once an interview is completed, the recruiter needs to review the results without watching the entire video.
* **AI Summary & Scorecard:** A detailed breakdown of how the candidate performed against the predefined rubric.
* **Interactive Transcript:** The full text of the interview. Clicking on a specific message should jump to that timestamp in the video/audio recording.
* **Highlight Reels:** If the AI detects a particularly strong or weak answer, it can flag it for the human interviewer to review.
* **Human Override:** A section for the human reviewer to add their own notes and adjust the final score.

## 4. Live Shadowing (Advanced)
For real-time oversight of the AI.
* **Live View:** The human interviewer can "silently join" an active session to see the live transcript and video feed.
* **Steer the AI:** A chat input for the human to send hidden prompts to the AI (e.g., "Ask them to go deeper on their database experience").
* **Takeover Mode:** A button for the human to pause the AI and step in to speak directly to the candidate via WebRTC.

## Implementation Plan (How to build this)
To add these to your Next.js app, you would typically:
1. Create a new layout for the dashboard (e.g., `src/app/(dashboard)/layout.tsx`).
2. Add a sidebar navigation (Candidates, Roles, Analytics, Settings).
3. Implement Authentication (e.g., NextAuth / Clerk) so only authorized interviewers can access these pages, while candidates can only access the `/interview` route.
