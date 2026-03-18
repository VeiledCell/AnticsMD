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
        """
        template_context = f"\nFollow the professional tone and structure of this USMLE-style example:\n{template}\n" if template else ""

        prompt = f"""
        Generate a medical clinical vignette for a competitive hospital simulation game.
        Base it on the following medical facts from our knowledge graph: {json.dumps(medical_facts)}
        {template_context}

        The output MUST be in JSON format and match this structure:
        ...
            "age": int,
            "gender": str,
            "chief_complaint": str,
            "hpi": [str, str, str, str], // 4-5 static dialogue bits for an RPG style interview
            "vitals": {{ "temp": float, "hr": int, "rr": int, "bp": "120/80", "spo2": int }},
            "physical_exam": str,
            "labs": {{ "key": "value" }},
            "imaging": str or null,
            "correct_diagnosis": str,
            "differential": [str, str, str],
            "explanation": "Brief pathophysiology explanation",
            "snomed_codes": ["code1", "code2"]
        }}

        Guidelines:
        - Ensure 100% factual accuracy for the diagnosis and vitals.
        - hpi dialogue should be written in a conversational 'RPG patient' tone.
        - Ensure the diagnosis is clinically plausible for the vitals and PE provided.
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
