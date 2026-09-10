from fastapi import APIRouter, Depends, HTTPException, status
from api.deps import get_current_admin
from schemas.question_generation import TopicGenerationRequest, CurriculumPlanSchema
from services.question_generator import question_generator
from core.llm import LLMError

router = APIRouter(
    prefix="/admin",
    tags=["admin-questions"],
    dependencies=[Depends(get_current_admin)]
)

@router.post("/generate-questions", response_model=CurriculumPlanSchema)
def generate_questions(request: TopicGenerationRequest):
    """
    Autonomously synthesize interview questions based on topics, role title, and seniority.
    """
    try:
        curriculum = question_generator.generate_curriculum(request)
        return curriculum
    except LLMError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Question generation failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during generation: {str(e)}"
        )
