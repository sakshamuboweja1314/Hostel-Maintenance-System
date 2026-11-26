"""
Safety Escalation Service.
Transparent safety escalation layer for life-safety and immediate physical hazards.
Critically: NEVER replaces the NLP model output. Clearly distinguishes model predictions
from deterministic safety overrides in accordance with Section 5.E and Responsible AI guidelines.
"""

import re
from typing import Tuple, Optional

# Core hazard patterns
SAFETY_HAZARD_PATTERNS = [
    (r"\b(spark|sparks|sparking|crackling)\b", "Detected active electrical sparking hazard."),
    (r"\b(live wire|exposed wire|bare wire)\b", "Detected exposed electrical live wire hazard."),
    (r"\b(electric shock|shock felt|grounding fault)\b", "Detected electric shock / grounding hazard."),
    (r"\b(fire|flames|burning smell|smoke coming|smoke visible)\b", "Detected fire or active combustion hazard."),
    (r"\b(gas leak|lpg leak|cylinder leak)\b", "Detected hazardous gas leak."),
    (r"\b(flooding.*electrical|water.*electrical board|water.*fuse)\b", "Detected high-risk water ingress into electrical equipment."),
    (r"\b(uncontrolled flooding|pipe burst.*flooding|gushing rapidly)\b", "Detected severe uncontrolled flooding."),
    (r"\b(ceiling.*collapsed|plaster fell|balcony railing.*collapse|railing.*rusted through)\b", "Detected structural failure / falling debris hazard."),
    (r"\b(trapped inside|locked inside|cannot escape)\b", "Detected entrapment / emergency egress hazard.")
]

def check_safety_escalation(text: str) -> Tuple[bool, Optional[str]]:
    """
    Evaluates text for life-safety hazards.
    Returns:
        (is_escalated, escalation_reason)
    """
    clean_text = text.lower()
    
    for pattern, reason in SAFETY_HAZARD_PATTERNS:
        if re.search(pattern, clean_text):
            return True, reason
            
    return False, None
