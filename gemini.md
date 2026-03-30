# ANTICS MD: MASTER SYSTEM ARCHITECTURE (v2.2)

## 1. Project Context & Identity
* **Product Name:** Antic MD
* **Domain:** `anticsmd.hsieh.org`
* **Niche:** Competitive Multiplayer Hospital Operations & Clinical Reasoning Simulator.
* **Shared Auth:** Uses Firebase Project `qrpass-4f170`.
* **SSO Strategy:** Cross-subdomain session detection via `browserLocalPersistence`.

---

## 2. Detailed Architecture & Data Flow

### A. Client Layer (Frontend)
*   **Framework:** Next.js (App Router) with `force-dynamic` rendering.
*   **UI/UX (The Clinical Workstation):**
    *   **3-Column Bulletproof Grid:** Strictly enforced horizontal layout (`240px | 1fr | 380px`).
    *   **Styling:** Tailwind CSS v4 with `@tailwindcss/postcss`.
    *   **Theme:** "Chunky Clinical" aesthetic with thick borders, rounded corners, and professional medical terminology.
*   **Game Engine:** Phaser.js (v3.90.0) inside `GameCanvas.tsx`.
    *   **Scaling:** Uses `Phaser.Scale.FIT` to remain constrained within the grid.
    *   **Lifecycle Safety:** Checks `this.sys.isActive()` to prevent "ghost scenes" from processing socket data after unmount.

### B. Real-time & AI Layers
*   **Networking:** PartyKit (`party/server.ts`) for real-time player sync and patient locking.
*   **AI Service:** Python FastAPI service generating MedQA-style vignettes using Gemini 2.5 Flash and Neo4j/ChromaDB RAG.

### C. The Clinical RAG Pipeline
*   **Ingestion:** Raw MedQA data from HuggingFace (`medalpaca/medical_meadow_medqa`) is split into a **Fact Brain** (Neo4j) and a **Style Brain** (ChromaDB).
*   **Distillation:** 50+ granular specialties are mapped to **9 Master Categories** (Internal Medicine, Surgery, Pediatrics, OB/GYN, Neurology, Psychiatry, Emergency Medicine, Basic Sciences, Population Health) for cleaner UI categorization.
*   **Synthesis:**
    1.  **Facts:** Neo4j provides pathognomonic symptoms and SNOMED codes.
    2.  **Style:** ChromaDB provides a real USMLE question stem as a "Source of Truth."
    3.  **Extraction:** Gemini 2.5 Flash extracts findings from the stem into structured JSON, ensuring zero hallucination of vitals/exams.
*   **Caching:** Final vignettes are pushed to **Supabase** to ensure low-latency access for multiplayer sessions.

---

## 3. Key Architectural Insights & Fixes

### 3.1 UI Stability (Skribbl-style Framework)
*   **The Problem:** Standard CSS layouts often wrap on small screens or when the Phaser canvas grows, causing sidebars to stack vertically.
*   **The Fix:** Used a combination of `min-width: 1200px` on the main container and a fixed-column CSS Grid. Switched to Tailwind v4 `@import` syntax and added a `postcss.config.cjs` to ensure the styles are correctly compiled in Vercel's build environment.

### 3.2 Phaser Scene Persistence
*   **The Problem:** React's StrictMode or navigation re-renders would create new Phaser instances while the old socket listeners were still active, leading to "null pointer" errors when trying to update destroyed objects.
*   **The Fix:** Every socket handler now verifies `if (!this.sys || !this.sys.isActive()) return;`. Additionally, explicit `shutdown` and `destroy` listeners close the socket connection.

### 3.3 Clinical Data Mapping
*   **The Problem:** Python backend uses `snake_case`, while the frontend uses `camelCase`, and some vignettes were missing the dense MedQA paragraph.
*   **The Fix:** Implemented a mapping layer in `PlayPage.tsx` that standardizes incoming Supabase rows. Added `fullVignette` support to all models to prioritize the USMLE-style stem over dialogue bits.

### 3.4 Patient Lifecycle & Global Sync
*   **The Problem:** Patients would sometimes despawn when a player walked away, or wouldn't disappear for other players when cured.
*   **The Fix:** 
    *   **Decoupled Logic:** "Walk-away" now only releases the server lock (`unlock`), while "Submit" triggers a physical `despawn`.
    *   **Global Despawn:** Implemented a `despawn` broadcast in PartyKit. When one player submits a diagnosis, the patient is removed from *all* active clients' Phaser scenes simultaneously.
    *   **React-Phaser Sync:** Added `phaser-patient-autounlock` event to ensure the React "Dossier" UI closes automatically when Phaser triggers a distance-based unlock.

### 3.5 Question Persistence & Completion Tracking
*   **The Problem:** Players would encounter the same clinical vignettes repeatedly across sessions, leading to a redundant experience.
*   **The Fix:** 
    *   **Firestore Integration:** Implemented `completedQuestions` array within the user's `game_stats` document in Firestore.
    *   **Dual-Layer Filtering:** Both the React frontend (Dossier list) and the Phaser game engine (Ward spawn logic) now filter out Supabase vignettes that match the user's completed IDs.
    *   **Successful Resolution Trigger:** Only successful diagnoses trigger the `markQuestionAsCompleted` logic, ensuring patients are only cleared once "solved."

### 3.6 Clinical Presentation Authenticity
*   **The Problem:** The synthesized vignettes often split critical context into separate UI fields, and LLMs would sometimes "hallucinate" vitals or exam data that wasn't in the original USMLE stem.
*   **The Fix:** 
    *   **Source of Truth:** Redesigned the `VignetteGenerator` prompt to treat the original USMLE stem as the absolute source of truth, instructing the model to extract findings rather than generate them.
    *   **Board-Style UI:** Updated `InterviewMenu` to feature an "Official Case History" section that displays the full clinical stem.
    *   **Conditional Rendering:** Vitals and Exam sections now only appear if data was explicitly extracted from the original question, matching the variable data density of real board exams.

---

## 4. Current Objectives (Roadmap)
1.  **Dynamic Respawning:** Implement logic to automatically fetch and spawn a *new* patient into a bay once it has been emptied by a successful (or failed) submission.
2.  **Laboratory & Imaging Viewer:** Create a dedicated tab in the Dossier for viewing rich lab results and diagnostic imaging findings extracted from the vignette.
3.  **Enhanced Unit Comms:** Expand the "Ward Feed" to include rich notifications (e.g., "Dr. Hsieh correctly diagnosed Myocardial Infarction in Bay 4").
4.  **Physical Boundaries:** Refine the Phaser ward collision map to prevent players from walking through medical equipment or walls.
5.  **Persistent Leaderboard:** Connect the Firestore scoring data to a global leaderboard accessible from the header.
