# ANTICS MD: MASTER SYSTEM ARCHITECTURE (v2)

## 1. Project Context & Identity
* **Product Name:** Antic MD
* **Domain:** `anticsmd.hsieh.org`
* **Niche:** Competitive Multiplayer Hospital Operations & Clinical Reasoning Simulator.
* **Shared Auth:** Uses Firebase Project `qrpass-4f170` (`hjxuguoxunslszpbdweh`).
* **SSO Strategy:** Cross-subdomain session detection via `browserLocalPersistence` (shared with `card.hsieh.org`).

---

## 2. Detailed Architecture & Data Flow

### A. Client Layer (Frontend)
*   **Framework:** Next.js (App Router) with `force-dynamic` rendering on `/play`.
*   **UI/UX:**
    *   **Styling:** Tailwind CSS.
    *   **Animation:** Framer Motion for UI popups (`InterviewMenu`).
*   **Game Engine:** Phaser.js, rendered inside a React `GameCanvas` component.
    *   **Scene:** `WardScene.ts` manages all game logic, including player movement (WASD/Arrow Keys), patient spawning, and proximity calculations.
    *   **Communication:** Phaser communicates with React via global `window.dispatchEvent` for events like `phaser-patient-interact` and `phaser-remote-update`.
*   **Real-time Networking:** `partysocket` client connects to the PartyKit server.

### B. Application Layer (Real-time & AI)

#### B1. Real-time Engine (PartyKit)
*   **Location:** `party/server.ts`, deployed to PartyKit Cloud.
*   **Responsibilities:**
    *   **Player Sync:** Receives `(x, y)` coordinates from clients and broadcasts them to all other players in the room (`hospital-ward`).
    *   **Competitive Mechanics:**
        *   **Curbside Steal:** Manages a `locks` object (`patientId -> playerId`) to enforce that only one player can interact with a patient at a time.
        *   **One Lock Rule:** Automatically releases a player's old lock if they try to lock a new patient.
    *   **Status Sync:** Broadcasts player `status` (e.g., 'walking', 'interviewing') for eavesdropping.

#### B2. AI Service (Python FastAPI)
*   **Location:** `/ai-service`, designed to run as a separate server.
*   **Core RAG Pipeline:**
    1.  **Ground Truth (Neo4j):** The `/generate/one` endpoint queries a local **Dockerized Neo4j** instance for a disease's pathognomonic symptoms and metadata (e.g., `specialty`).
    2.  **Style & Tone (ChromaDB):** It then queries a local **Dockerized ChromaDB** for a similar USMLE-style vignette from the **MedQA** dataset.
    3.  **Synthesis (Gemini):** Both the facts and the style template are passed to the **`gemini-2.5-flash`** model, which generates a high-quality, structured JSON vignette.
*   **Knowledge Ingestion (Scripts):**
    *   `extract_medqa_knowledge.py`: An AI-powered script that reads the MedQA dataset, uses Gemini to extract structured `Disease`, `Specialty`, and `Key_Finding` entities, and seeds them into Neo4j.
    *   `seed_chroma.py`: Seeds ChromaDB with raw vignettes for similarity search.
    *   `batch_pipeline.py`: Orchestrates the end-to-end generation for all diseases in Neo4j and pushes the results to the Supabase cache.

### C. Storage & Retrieval (The RAG Pipeline)

*   **Knowledge Layer (Offline):**
    *   **Neo4j AuraDB (or local Docker):** Stores the structured **Medical Knowledge Graph** (`:Disease` -> `:Symptom`) extracted from MedQA.
    *   **ChromaDB (or local Docker):** Stores vector embeddings of **MedQA vignette templates** for tone/style matching.
*   **Cache Database (Live Game):**
    *   **Supabase (PostgreSQL):** Hosts the `daily_vignettes` table. This table is populated by the `batch_pipeline.py` script.
    *   **Frontend Access:** The Next.js app reads directly from this table (`is_active = true`) to fetch the vignettes for the current game session, ensuring low latency.
*   **Player Stats & Auth:**
    *   **Firebase Authentication:** Handles user sign-in.
    *   **Firestore:** The `game_stats` collection stores player XP, Score, and other metrics, updated via the `saveGameStats` helper function.

---

## 3. Core Gameplay Loop & Mechanics
1.  **Spawn:** The `WardScene` in Phaser fetches active vignette IDs from **Supabase** and spawns interactive patient objects on the ward floor.
2.  **Interact:** A player moves near a patient and clicks, triggering the `phaser-patient-interact` event.
3.  **Lock & Load:** The client requests a `lock` from the **PartyKit** server. The server verifies the lock, broadcasts the change (turning the patient red for others), and sends the vignette data from Supabase to the player's UI.
4.  **Hybrid Interview:**
    *   **Static Options:** The `InterviewMenu` displays the HPI, vitals, and exam findings from the Supabase vignette.
    *   **Custom Text (Future):** The "Deep Inquiry" box will send custom text to the **AI Service** for real-time answers.
5.  **Eavesdrop:** Other players' clients receive the `status: 'interviewing'` broadcast from PartyKit. If they are within the `400` unit radius, their "Ward Feed" UI updates.
6.  **The Sprint:**
    *   **Auto-Unlock:** If the active player walks away from the patient, the lock is automatically released.
    *   **Submit & Score:** The player selects a diagnosis and submits. The client checks the `correctDiagnosis` from the vignette, updates the score in **Firestore**, and unlocks the patient.
