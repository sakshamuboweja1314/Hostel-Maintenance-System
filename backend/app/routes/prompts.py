import json
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter(prefix="/api/prompts", tags=["Prompt Engineering Lab"])

class PromptAnalyzeRequest(BaseModel):
    complaint_text: str = Field(..., min_length=3)
    prompt_strategy: str = Field(..., description="zero_shot, one_shot, few_shot, role_prompt, or structured_json")
    model_name: Optional[str] = "llama3:latest"

PROMPT_TEMPLATES = {
    "zero_shot": (
        "You are a maintenance complaint classification assistant.\n"
        "Given the following hostel maintenance complaint, determine:\n"
        "1. Category (Water and Plumbing, Electrical, Internet and Wi-Fi, Cleanliness and Sanitation, Furniture and Civil Maintenance, Other)\n"
        "2. Urgency (Critical, High, Medium, Low)\n"
        "3. Brief Reason\n\n"
        "Complaint:\n\"{complaint}\"\n\nOutput:"
    ),
    "one_shot": (
        "You are a hostel maintenance complaint classification assistant.\n\n"
        "Example:\n"
        "Complaint: \"The main water pipe burst in the hallway and is flooding the corridor.\"\n"
        "Output:\n"
        "Category: Water and Plumbing\n"
        "Urgency: Critical\n"
        "Reason: Active flooding poses direct hazard to property and electrical safety.\n\n"
        "Now analyze the following complaint:\n"
        "Complaint: \"{complaint}\"\nOutput:"
    ),
    "few_shot": (
        "You are a hostel maintenance complaint triage assistant. Classify category and urgency.\n\n"
        "Example 1:\n"
        "Complaint: \"Sparks are flying from the switchboard in Room 204.\"\n"
        "Output:\n"
        "Category: Electrical\nUrgency: Critical\n"
        "Reason: Direct fire and electrocution hazard requiring emergency isolation.\n\n"
        "Example 2:\n"
        "Complaint: \"Wi-Fi is completely down across all rooms in Block C during the placement exam.\"\n"
        "Output:\n"
        "Category: Internet and Wi-Fi\nUrgency: High\n"
        "Reason: High impact across multiple residents with an imminent academic/placement deadline.\n\n"
        "Example 3:\n"
        "Complaint: \"The study chair wheel makes a slight squeak when pushed.\"\n"
        "Output:\n"
        "Category: Furniture and Civil Maintenance\nUrgency: Low\n"
        "Reason: Minor cosmetic/comfort defect with no safety or functional impedance.\n\n"
        "Now classify this complaint:\n"
        "Complaint: \"{complaint}\"\nOutput:"
    ),
    "role_prompt": (
        "You are an expert Chief Facility & Safety Warden at an engineering university hostel.\n"
        "Your role is to strictly prioritize maintenance requests according to occupant safety, risk of structural or electrical damage, and academic disruption.\n\n"
        "Analyze the submitted student complaint:\n\"{complaint}\"\n\n"
        "Provide an authoritative triage evaluation including:\n"
        "1. Category Classification\n"
        "2. Urgency Level (Critical, High, Medium, Low)\n"
        "3. Immediate Hazard Analysis\n"
        "4. Justification for Prioritization"
    ),
    "structured_json": (
        "You are a backend NLP extraction engine for a hostel complaint management system.\n"
        "Analyze the complaint and respond ONLY with valid JSON conforming to this schema:\n"
        "{\n"
        "  \"predicted_category\": \"Water and Plumbing | Electrical | Internet and Wi-Fi | Cleanliness and Sanitation | Furniture and Civil Maintenance | Other\",\n"
        "  \"predicted_urgency\": \"Critical | High | Medium | Low\",\n"
        "  \"priority_score\": <number between 25.0 and 100.0>,\n"
        "  \"priority_explanation\": \"<concise rationale for urgency>\",\n"
        "  \"requires_immediate_dispatch\": <true or false>\n"
        "}\n\n"
        "Complaint:\n\"{complaint}\"\n\n"
        "Respond ONLY with the JSON block. Do not include markdown formatting or commentary outside the JSON."
    )
}

@router.get("/templates")
def get_prompt_templates():
    """Returns educational prompt templates for Unit III & IV prompt engineering demonstration."""
    return {
        "strategies": list(PROMPT_TEMPLATES.keys()),
        "templates": PROMPT_TEMPLATES,
        "descriptions": {
            "zero_shot": "Direct classification prompt with zero contextual examples, relying solely on pretrained model instruction adherence.",
            "one_shot": "Includes a single illustrative input-output pair to anchor output formatting and tone.",
            "few_shot": "Provides multiple balanced exemplars spanning distinct urgency and category classes (In-Context Learning).",
            "role_prompt": "Assigns a specific persona (Chief Facility Warden) to calibrate safety scrutiny and domain tone.",
            "structured_json": "Constrains LLM output into strict JSON schema for automated API parsing and validation."
        }
    }

@router.post("/analyze")
async def analyze_prompt(request: PromptAnalyzeRequest):
    """
    Executes or demonstrates the chosen prompt strategy.
    If local Ollama is reachable, performs live local inference.
    If Ollama is not available, provides the exact prompt and academic demonstration without fabricating fake responses.
    """
    template = PROMPT_TEMPLATES.get(request.prompt_strategy, PROMPT_TEMPLATES["zero_shot"])
    formatted_prompt = template.format(complaint=request.complaint_text)

    # Check for live local Ollama instance
    ollama_available = False
    llm_output = None

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_available = True
                # Attempt generation if model is present
                gen_resp = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": request.model_name or "llama3:latest",
                        "prompt": formatted_prompt,
                        "stream": False
                    },
                    timeout=15.0
                )
                if gen_resp.status_code == 200:
                    data = gen_resp.json()
                    llm_output = data.get("response", "")
    except Exception:
        ollama_available = False

    return {
        "prompt_strategy": request.prompt_strategy,
        "complaint_text": request.complaint_text,
        "compiled_prompt": formatted_prompt,
        "ollama_available": ollama_available,
        "live_llm_execution": llm_output is not None,
        "llm_output": llm_output,
        "educational_notes": (
            "Live local LLM execution requires Ollama running on localhost:11434 with a downloaded model. "
            "The main DistilBERT classification pipeline operates independently on the edge without Ollama."
            if not ollama_available else "Executed locally via Ollama edge LLM."
        )
    }
