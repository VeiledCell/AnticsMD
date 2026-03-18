import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

class Neo4jSeeder:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            auth=(os.getenv("NEO4J_USER", "neo4j"), os.getenv("NEO4J_PASSWORD", "password123"))
        )

    def close(self):
        self.driver.close()

    def seed(self):
        with self.driver.session() as session:
            # Clear existing data
            session.run("MATCH (n) DETACH DELETE n")
            
            # Create Diseases and Symptoms
            medical_data = [
                {
                    "disease": "Community Acquired Pneumonia",
                    "symptoms": ["Cough", "Fever", "Shortness of breath", "Pleuritic chest pain", "Sputum production"],
                    "snomed": "385093006"
                },
                {
                    "disease": "Congestive Heart Failure",
                    "symptoms": ["Orthopnea", "Paroxysmal nocturnal dyspnea", "Peripheral edema", "Fatigue", "Jugular venous distension"],
                    "snomed": "42343007"
                },
                {
                    "disease": "Acute Appendicitis",
                    "symptoms": ["Right lower quadrant pain", "Anorexia", "Nausea", "Rebound tenderness", "Fever"],
                    "snomed": "18526009"
                },
                {
                    "disease": "Diabetic Ketoacidosis",
                    "symptoms": ["Polyuria", "Polydipsia", "Abdominal pain", "Kussmaul breathing", "Fruity breath odor"],
                    "snomed": "15381008"
                },
                {
                    "disease": "Pulmonary Embolism",
                    "symptoms": ["Sudden shortness of breath", "Tachycardia", "Hemoptysis", "Calf swelling", "Chest pain"],
                    "snomed": "59282003"
                }
            ]

            for entry in medical_data:
                session.run("""
                    MERGE (d:Disease {name: $disease, snomed: $snomed})
                    WITH d
                    UNWIND $symptoms as symptom_name
                    MERGE (s:Symptom {name: symptom_name})
                    MERGE (d)-[:CAUSES]->(s)
                """, disease=entry['disease'], symptoms=entry['symptoms'], snomed=entry['snomed'])
            
            print(f"✅ Successfully seeded {len(medical_data)} diseases and their symptoms into Neo4j.")

if __name__ == "__main__":
    seeder = Neo4jSeeder()
    seeder.seed()
    seeder.close()
