from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Vitals(BaseModel):
    temp: float
    hr: int
    rr: int
    bp: str
    spo2: int

class ClinicalVignette(BaseModel):
    id: Optional[str] = None
    age: int
    gender: str
    chief_complaint: str
    hpi: List[str] # RPG static dialogue bits
    vitals: Vitals
    physical_exam: str
    labs: Optional[Dict[str, str]] = None
    imaging: Optional[str] = None
    correct_diagnosis: str
    differential: List[str]
    explanation: str
    # Knowledge mapping metadata
    snomed_codes: List[str] = []
    source_id: str # Reference to Neo4j node or ChromaDB document
