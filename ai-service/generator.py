import google.generativeai as genai
import os
import json
from .models import ClinicalVignette, Vitals
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class VignetteGenerator:
    def __init__(self):
        # Using Gemini 2.5 Flash for the latest capabilities
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def synthesize_vignette(self, medical_facts: dict, template: str = None) -> ClinicalVignette:
        """
        Synthesizes a medical vignette based on facts from Neo4j and USMLE templates.
        If a template is provided, it prioritizes the original text to maintain integrity.
        """
        template_context = f"\nORIGINAL USMLE QUESTION (Source of Truth):\n{template}\n" if template else ""

        prompt = f"""
        You are a medical education expert preparing content for a USMLE Step 1/2CK simulation.
        
        {template_context}
        
        Using the medical facts and the provided original question: {json.dumps(medical_facts)}

        The output MUST be in JSON format and match this structure:
        {{
            "age": int,
            "gender": str,
            "chief_complaint": "Extracted or inferred chief complaint",
            "full_vignette": "The COMPLETE original USMLE-style question stem. Do NOT summarize or re-write. Preserve the technical complexity and all findings.",
            "hpi": [str, str, str, str], // 4-5 dialogue bits that a patient might say if asked about their history based on the stem
            "vitals": {{ "temp": float or null, "hr": int or null, "rr": int or null, "bp": "120/80" or null, "spo2": int or null }},
            "physical_exam": "Specific exam findings extracted from the stem. If none mentioned, return null.",
            "labs": {{ "key": "value" }}, // Extract labs if present in the stem
            "imaging": "Imaging findings extracted from the stem. If none, return null.",
            "correct_diagnosis": "The true diagnosis based on the stem",
            "differential": [str, str, str],
            "explanation": "Brief pathophysiology explanation",
            "snomed_codes": ["code1", "code2"]
        }}

        Guidelines:
        - If 'vitals' or 'physical_exam' are NOT explicitly mentioned in the original question, set those JSON values to null. Do NOT hallucinate new data.
        - The 'full_vignette' field MUST be the primary focus. It should contain the original technical text exactly as it would appear on a board exam.
        - 'hpi' should be the patient's 'voice' explaining their symptoms in a less technical way (for the RPG interaction).
        """

        response = await self.model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        data = json.loads(response.text)
        data['source_id'] = medical_facts.get('id', 'unknown')
        return ClinicalVignette(**data)
