from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Vitals(BaseModel):
    temp: Optional[float] = None
    hr: Optional[int] = None
    rr: Optional[int] = None
    bp: Optional[str] = None
    spo2: Optional[int] = None

class ClinicalVignette(BaseModel):
    id: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    chief_complaint: Optional[str] = None
    full_vignette: str # The dense USMLE-style paragraph is the only strict requirement
    hpi: List[str] = [] # RPG static dialogue bits
    vitals: Optional[Vitals] = None
    physical_exam: Optional[str] = None
    labs: Optional[Dict[str, str]] = None
    imaging: Optional[str] = None
    correct_diagnosis: str
    differential: List[str] = []
    explanation: Optional[str] = None
    # Knowledge mapping metadata
    snomed_codes: Optional[List[str]] = []
    source_id: Optional[str] = None # Reference to Neo4j node or ChromaDB document
