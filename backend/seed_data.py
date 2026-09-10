import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

from core.database import AsyncSessionLocal, init_db
from core.security import hash_password
from models.user import User
from models.company import Company
from models.role import Role
from models.interview import Interview
from models.report import Report
from models.transcript import Transcript


async def seed():
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Check if users exist
        res = await session.execute(select(User).where(User.email == "admin@conlatus.ai"))
        existing_admin = res.scalar_one_or_none()

        if existing_admin:
            print("Database already contains admin user. Seeding additional candidates if needed...")
        else:
            print("Seeding initial company, users, roles, and candidates...")

        # Company
        comp_res = await session.execute(select(Company).where(Company.name == "Conlatus AI Labs"))
        company = comp_res.scalar_one_or_none()
        if not company:
            company = Company(name="Conlatus AI Labs")
            session.add(company)
            await session.flush()

        # Users
        if not existing_admin:
            admin_user = User(
                email="admin@conlatus.ai",
                full_name="Alex Morgan (Director of Talent)",
                hashed_password=hash_password("admin123"),
                role="admin",
                company_id=company.id,
                is_active=True,
            )
            recruiter_user = User(
                email="recruiter@conlatus.ai",
                full_name="Sarah Jenkins (Senior Technical Recruiter)",
                hashed_password=hash_password("recruiter123"),
                role="recruiter",
                company_id=company.id,
                is_active=True,
            )
            session.add_all([admin_user, recruiter_user])
            await session.flush()
        else:
            admin_user = existing_admin

        # Roles
        roles_data = [
            {
                "title": "Staff Frontend Architect",
                "desc": "Leading design systems, micro-frontends, WebGL liquid UI, and high-concurrency client state architecture.",
                "rubric": {
                    "architecture": {"score": 5.0, "weight": 0.25, "weighted_score": 1.25, "evidence_count": 4},
                    "performance": {"score": 4.8, "weight": 0.25, "weighted_score": 1.20, "evidence_count": 3},
                    "system_design": {"score": 4.5, "weight": 0.20, "weighted_score": 0.90, "evidence_count": 3},
                    "communication": {"score": 4.7, "weight": 0.15, "weighted_score": 0.70, "evidence_count": 4},
                    "code_quality": {"score": 4.6, "weight": 0.15, "weighted_score": 0.69, "evidence_count": 3},
                }
            },
            {
                "title": "Principal Systems Engineer",
                "desc": "Distributed backend architectures, ultra-low latency audio processing pipelines, and resilient microservices.",
                "rubric": {
                    "distributed_systems": {"score": 4.5, "weight": 0.30, "weighted_score": 1.35, "evidence_count": 4},
                    "concurrency": {"score": 4.2, "weight": 0.25, "weighted_score": 1.05, "evidence_count": 3},
                    "debugging": {"score": 4.0, "weight": 0.20, "weighted_score": 0.80, "evidence_count": 2},
                    "communication": {"score": 4.3, "weight": 0.15, "weighted_score": 0.65, "evidence_count": 3},
                    "system_design": {"score": 4.4, "weight": 0.10, "weighted_score": 0.44, "evidence_count": 3},
                }
            },
            {
                "title": "Senior Fullstack AI Engineer",
                "desc": "End-to-end integration of LLM agents, Next.js 15 App Router interfaces, and real-time streaming APIs.",
                "rubric": {
                    "fullstack_execution": {"score": 4.2, "weight": 0.25, "weighted_score": 1.05, "evidence_count": 3},
                    "ai_integration": {"score": 4.5, "weight": 0.25, "weighted_score": 1.12, "evidence_count": 4},
                    "api_design": {"score": 4.0, "weight": 0.20, "weighted_score": 0.80, "evidence_count": 3},
                    "problem_solving": {"score": 3.8, "weight": 0.15, "weighted_score": 0.57, "evidence_count": 2},
                    "communication": {"score": 4.1, "weight": 0.15, "weighted_score": 0.62, "evidence_count": 3},
                }
            },
        ]

        created_roles = []
        for r in roles_data:
            role_res = await session.execute(select(Role).where(Role.title == r["title"]))
            role_obj = role_res.scalar_one_or_none()
            if not role_obj:
                role_obj = Role(
                    title=r["title"],
                    description=r["desc"],
                    company_id=company.id,
                    rubric=r["rubric"],
                    competencies=r["rubric"],
                )
                session.add(role_obj)
                await session.flush()
            created_roles.append(role_obj)

        # Check existing interviews count
        inv_count_res = await session.execute(select(Interview))
        if len(inv_count_res.scalars().all()) > 0:
            print("Interviews already exist in database. Skipping duplicate seed.")
            return

        now = datetime.now(timezone.utc)

        # Candidate 1: Elena Rostova (Staff Frontend - Completed - 4.7 - Strong Hire - Decision: Hired)
        c1_id = uuid.uuid4()
        c1_inv = Interview(
            id=c1_id,
            role_id=created_roles[0].id,
            user_id=admin_user.id,
            candidate_name="Elena Rostova",
            candidate_email="elena.rostova@engineer.dev",
            token="tok_elena_staff_front_99",
            status="completed",
            started_at=now - timedelta(days=2, hours=3),
            completed_at=now - timedelta(days=2, hours=2, minutes=25),
        )
        session.add(c1_inv)
        await session.flush()

        c1_report = Report(
            interview_id=c1_id,
            overall_score=4.7,
            recommendation="Strong Hire",
            summary="Elena demonstrated peerless technical mastery in distributed frontend systems, hardware-accelerated rendering, and resilient client-side state synchronization. Her architectural rationale was crisp, highly pragmatic, and backed by production battle-testing.",
            rubric_breakdown=created_roles[0].rubric,
            synthesis_details={
                "strengths": [
                    "Exceptional grasp of WebGL shader compilation caching and OffscreenCanvas rendering: 'We decoupled the continuous audio FFT visualization onto an isolated Worker thread to guarantee a solid 60fps main thread.'",
                    "Deep mastery of Next.js Server Components and hydration boundaries: 'We strictly isolate state to interactive leaf nodes, ensuring 90% of our layout renders as zero-bundle static HTML.'",
                    "Crisp articulation of failure modes and circuit-breakers under erratic network conditions."
                ],
                "growth_areas": [
                    "Slightly biased toward custom internal abstractions over off-the-shelf primitives: 'I preferred writing our own bespoke virtual DOM diffing logic before considering standard windowing libraries.'"
                ],
                "communication": "Articulate, measured, and authoritative. Answered technical deep-dives with immediate structural clarity.",
                "flags": []
            },
            human_decision="hired",
            human_notes="Candidate accepted our offer! Outstanding performance in both system design and real-time frontend loops."
        )
        session.add(c1_report)

        c1_transcripts = [
            Transcript(interview_id=c1_id, speaker="interviewer", message="Welcome Elena! To begin, could you walk me through an ambitious technical project where you spearheaded the frontend architecture?"),
            Transcript(interview_id=c1_id, speaker="candidate", message="Certainly. At my previous company, I architected a real-time collaborative canvas application serving over 50,000 concurrent enterprise users. We needed sub-16ms latency for peer cursor synchronization and WebGL audio visualization."),
            Transcript(interview_id=c1_id, speaker="interviewer", message="How did you prevent main-thread jank when rendering heavy audio waveforms alongside rapid state updates?"),
            Transcript(interview_id=c1_id, speaker="candidate", message="We decoupled the continuous audio FFT visualization onto an isolated Web Worker via OffscreenCanvas. State diffs were sent through SharedArrayBuffers, ensuring the main React thread never choked on rendering frames."),
            Transcript(interview_id=c1_id, speaker="interviewer", message="What strategy did you apply to optimize Next.js server bundle size and initial page load times?"),
            Transcript(interview_id=c1_id, speaker="candidate", message="We strictly isolate state to interactive leaf nodes, ensuring 90% of our layout renders as zero-bundle static HTML. We also introduced dynamic code-splitting for heavy analysis panels."),
            Transcript(interview_id=c1_id, speaker="interviewer", message="Excellent. Do you have any closing reflections on how you scale engineering culture?"),
            Transcript(interview_id=c1_id, speaker="candidate", message="I strongly champion RFC-driven engineering and architectural decision records (ADRs) so teams align before writing a single line of code.")
        ]
        session.add_all(c1_transcripts)

        # Candidate 2: Marcus Vance (Principal Systems Engineer - Completed - 4.2 - Hire - Decision: Next Round)
        c2_id = uuid.uuid4()
        c2_inv = Interview(
            id=c2_id,
            role_id=created_roles[1].id,
            user_id=admin_user.id,
            candidate_name="Marcus Vance",
            candidate_email="m.vance@systems-core.io",
            token="tok_marcus_sys_core_44",
            status="completed",
            started_at=now - timedelta(days=1, hours=5),
            completed_at=now - timedelta(days=1, hours=4, minutes=18),
        )
        session.add(c2_inv)
        await session.flush()

        c2_report = Report(
            interview_id=c2_id,
            overall_score=4.2,
            recommendation="Hire",
            summary="Marcus showed solid understanding of distributed stream processing, actor model concurrency, and Redis caching topologies. Answered questions with good depth and realistic tradeoffs.",
            rubric_breakdown=created_roles[1].rubric,
            synthesis_details={
                "strengths": [
                    "Solid hands-on experience tuning epoll and async I/O event loops: 'We switched from thread-per-connection to an asynchronous Tokio runtime, cutting memory per connection by 75%.'",
                    "Strong instinct for database indexing and WAL management under write-heavy workloads."
                ],
                "growth_areas": [
                    "Could demonstrate more familiarity with modern eBPF tracing tools for kernel-level network profiling."
                ],
                "communication": "Calm, concise, and direct.",
                "flags": []
            },
            human_decision="next_round",
            human_notes="Schedule technical onsite interview with VP of Infrastructure."
        )
        session.add(c2_report)

        c2_transcripts = [
            Transcript(interview_id=c2_id, speaker="interviewer", message="Hello Marcus! Could you describe a time when you resolved a catastrophic production bottleneck?"),
            Transcript(interview_id=c2_id, speaker="candidate", message="Yes. We had a cascading timeout failure across our Kafka consumer group due to GC pauses. We profiled heap allocations, removed unnecessary boxing, and tuned G1GC survivor spaces."),
            Transcript(interview_id=c2_id, speaker="interviewer", message="How did you handle real-time connection scale during peak loads?"),
            Transcript(interview_id=c2_id, speaker="candidate", message="We switched from thread-per-connection to an asynchronous Tokio runtime, cutting memory per connection by 75% and scaling to 100k active sockets."),
            Transcript(interview_id=c2_id, speaker="interviewer", message="Great technical overview, thank you.")
        ]
        session.add_all(c2_transcripts)

        # Candidate 3: Priya Sharma (Senior Fullstack AI - Completed - 2.8 - Leaning No - Decision: None)
        c3_id = uuid.uuid4()
        c3_inv = Interview(
            id=c3_id,
            role_id=created_roles[2].id,
            user_id=admin_user.id,
            candidate_name="Priya Sharma",
            candidate_email="priya.sharma@cloudtech.org",
            token="tok_priya_fullstack_ai_12",
            status="completed",
            started_at=now - timedelta(hours=14),
            completed_at=now - timedelta(hours=13, minutes=30),
        )
        session.add(c3_inv)
        await session.flush()

        c3_report = Report(
            interview_id=c3_id,
            overall_score=2.8,
            recommendation="Leaning No",
            summary="Priya demonstrated basic familiarity with OpenAI APIs and LangChain wrappers, but struggled on core database transaction isolation and frontend performance optimization questions.",
            rubric_breakdown={
                "fullstack_execution": {"score": 2.5, "weight": 0.25, "weighted_score": 0.62, "evidence_count": 2},
                "ai_integration": {"score": 3.4, "weight": 0.25, "weighted_score": 0.85, "evidence_count": 3},
                "api_design": {"score": 2.8, "weight": 0.20, "weighted_score": 0.56, "evidence_count": 2},
                "problem_solving": {"score": 2.4, "weight": 0.15, "weighted_score": 0.36, "evidence_count": 2},
                "communication": {"score": 3.0, "weight": 0.15, "weighted_score": 0.45, "evidence_count": 3},
            },
            synthesis_details={
                "strengths": [
                    "Enthusiastic about conversational prompt engineering and few-shot templates."
                ],
                "growth_areas": [
                    "Struggled to explain ACID guarantees and deadlock recovery in relational databases: 'I usually just rely on Prisma to handle all concurrency without thinking about row locks.'",
                    "Limited experience with streaming backpressure or server-sent events."
                ],
                "communication": "Somewhat hesitant when pressed on low-level system tradeoffs.",
                "flags": ["Gaps in database concurrency and production scaling."]
            },
            human_decision=None,
            human_notes=None
        )
        session.add(c3_report)

        c3_transcripts = [
            Transcript(interview_id=c3_id, speaker="interviewer", message="Welcome Priya! How do you handle database deadlocks and concurrency in multi-tenant SaaS?"),
            Transcript(interview_id=c3_id, speaker="candidate", message="I usually just rely on Prisma to handle all concurrency without thinking about row locks. If there's an issue, the client retries the API request."),
            Transcript(interview_id=c3_id, speaker="interviewer", message="How do you architect streaming LLM responses to prevent client render thrashing?"),
            Transcript(interview_id=c3_id, speaker="candidate", message="We just use React state setter on every chunk token received over SSE.")
        ]
        session.add_all(c3_transcripts)

        # Candidate 4: Liam O'Connor (Staff Frontend Architect - Completed - 3.7 - Hire - Decision: None)
        c4_id = uuid.uuid4()
        c4_inv = Interview(
            id=c4_id,
            role_id=created_roles[0].id,
            user_id=admin_user.id,
            candidate_name="Liam O'Connor",
            candidate_email="liam.oconnor@dublin-dev.ie",
            token="tok_liam_frontend_77",
            status="completed",
            started_at=now - timedelta(hours=6),
            completed_at=now - timedelta(hours=5, minutes=32),
        )
        session.add(c4_inv)
        await session.flush()

        c4_report = Report(
            interview_id=c4_id,
            overall_score=3.7,
            recommendation="Hire",
            summary="Strong candidate with solid component library craftsmanship, accessibility best practices, and clean TypeScript typing.",
            rubric_breakdown={
                "architecture": {"score": 3.8, "weight": 0.25, "weighted_score": 0.95, "evidence_count": 3},
                "performance": {"score": 3.6, "weight": 0.25, "weighted_score": 0.90, "evidence_count": 3},
                "system_design": {"score": 3.5, "weight": 0.20, "weighted_score": 0.70, "evidence_count": 2},
                "communication": {"score": 4.0, "weight": 0.15, "weighted_score": 0.60, "evidence_count": 3},
                "code_quality": {"score": 3.9, "weight": 0.15, "weighted_score": 0.58, "evidence_count": 3},
            },
            synthesis_details={
                "strengths": [
                    "Passionate about WCAG 2.1 AA accessibility and keyboard navigation contracts.",
                    "Clean modular CSS architecture avoiding utility bloat."
                ],
                "growth_areas": [
                    "Less experience with WebGL or native WebAssembly modules."
                ],
                "communication": "Friendly, collaborative, and clear.",
                "flags": []
            },
            human_decision=None,
            human_notes=None
        )
        session.add(c4_report)

        # Candidate 5: Sophia Chen (Senior Fullstack AI - In Progress)
        c5_id = uuid.uuid4()
        c5_inv = Interview(
            id=c5_id,
            role_id=created_roles[2].id,
            user_id=admin_user.id,
            candidate_name="Sophia Chen",
            candidate_email="sophia.chen@ai-nexus.ca",
            token="tok_sophia_active_session_33",
            status="in_progress",
            started_at=now - timedelta(minutes=18),
            completed_at=None,
        )
        session.add(c5_inv)
        await session.flush()

        c5_transcripts = [
            Transcript(interview_id=c5_id, speaker="interviewer", message="Hello Sophia! Welcome to your Senior Fullstack AI interview at Conlatus. Could you tell us about a time you optimized an AI agent pipeline?"),
            Transcript(interview_id=c5_id, speaker="candidate", message="Hi! In my current role, I built a hybrid RAG retrieval pipeline combining dense vector embeddings with BM25 sparse search. This cut hallucination rates by 40% while keeping latency under 800ms."),
            Transcript(interview_id=c5_id, speaker="interviewer", message="How did you evaluate and quantify the retrieval accuracy before shipping to production?"),
            Transcript(interview_id=c5_id, speaker="candidate", message="We used Ragas metrics for faithfulness and answer relevance, alongside an automated synthetic gold-standard benchmark run in our CI/CD quality gate.")
        ]
        session.add_all(c5_transcripts)

        # Candidate 6: David Kim (Staff Frontend - Created / Pending)
        c6_id = uuid.uuid4()
        c6_inv = Interview(
            id=c6_id,
            role_id=created_roles[0].id,
            user_id=admin_user.id,
            candidate_name="David Kim",
            candidate_email="david.kim@seoul-code.kr",
            token="tok_david_pending_link_19",
            status="created",
            started_at=None,
            completed_at=None,
        )
        session.add(c6_inv)

        await session.commit()
        print("Successfully seeded demo data: 2 users, 3 roles, 6 realistic candidate interviews, reports, and transcripts!")


if __name__ == "__main__":
    asyncio.run(seed())
