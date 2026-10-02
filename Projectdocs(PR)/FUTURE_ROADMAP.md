# 🚀 PathFinder — Future Roadmap

## 📋 Current Status (Phase 6, 2026-10-01, `39d5875`)

**Adaptive Roadmap committed — assessment now changes the sequence:**
- ✅ `POST /api/adaptation/recalculate` (latest mastery → gap/recommend/path/roadmap + `cleared_skills`)
- ✅ `POST /assessment/submit` auto-adaptation (optional `target_career`, no second call)
- ✅ Both RAG directions proven: 45→0 cleared after 100% quiz; 45→66 remains after failed quiz
- ✅ 10/10 regression checks PASS

**Next:** Phase 7 — AI explanations/tutor

---

## 📋 Current Status (Phase 5, 2026-10-01, `62969c5`)

> Previous block retained as history.

**Assessment Engine committed — first real feedback loop:**
- ✅ 20-question bank (6 skills, all canonical)
- ✅ start/submit/result endpoints (answers never leaked, idempotent submit)
- ✅ 30/70 mastery blend → `MasteryHistory(source=quiz)`
- ✅ `gap_before/gap_after` in every result (proven: 100% → 0→70 → gap 70→0 → `ready`)

**History:** Phase 6 built on Phase 5 (`62969c5`), which built on Phase 4 (`7d253d5`). Next: **Phase 7 — AI explanations/tutor**.

**Phase 4 Complete — roadmap + progress platform committed (`7d253d5`):**
- ✅ Skill Gap Engine
- ✅ Recommendation Engine
- ✅ Path Generator
- ✅ Learner Profile (Pydantic schema + Gemini `/extract`)
- ✅ Resource Recommendation (8 curated resources, 50/20/20/10 matcher)
- ✅ Roadmap Generator (phases, milestones, `next_action`, `estimated_weeks`)
- ✅ Progress Data Model (`Activity`, `Progress`, `MasteryHistory`)
- ✅ Progress API (7 endpoints: activity, complete, progress, skills, dashboard, notifications, certificate)
- ✅ API endpoints working (8-endpoint smoke PASS, Commit 5)

> Phase 4 history above; assessment details in “Phased Development Plan → Phase 5”.

---

## 🎯 Improvement Plan (Priority Order)

### 🔥 Priority 1: Make Adaptive Loop REALLY Work
**Goal:** Demonstrate complete Learn → Assess → Adapt → Repeat cycle

**What to build:**
- Assessment system with 10 questions per skill
- Mastery calculation from assessment results
- Path adaptation based on new mastery scores
- AI explanation of what changed and why

**Success criteria:**
- User can take assessment
- Mastery scores update
- Path automatically adapts
- AI explains the changes

### 🔥 Priority 2: Make Skill Graph Convincing
**Goal:** Ensure GenAI Engineer path makes logical sense

**What to build:**
- Complete prerequisite chain: Python → ML → LLM → Embeddings → Vector DB → RAG → Agents
- Proper mastery requirements for each skill
- Clear hard/soft prerequisite distinctions
- Validation that paths respect dependencies

**Success criteria:**
- Path follows logical learning order
- No skill appears before its prerequisites
- Mastery levels make sense for career requirements

### 🔥 Priority 3: Make Assessments Connected to Skills
**Goal:** Each question tests specific skill, not random knowledge

**What to build:**
- Question-to-skill mapping (Q1 → LLM fundamentals, Q2 → Tokens, etc.)
- Skill-specific mastery calculation
- Weakness identification (overall 8/10 but weak in context windows)
- Adaptive questioning based on performance

**Success criteria:**
- Assessment identifies specific skill weaknesses
- Path adapts to address weak areas
- Mastery is meaningful, not just average score

### 🔥 Priority 4: Make AI Explain the System
**Goal:** Use Gemini/Groq for transparent explanations

**What to build:**
- Natural language goal understanding (Phase 2B)
- Profile extraction from conversation
- "Why am I learning this?" explanations
- "Why did my path change?" explanations

**Success criteria:**
- User can ask why they're learning something
- AI explains based on their actual state
- Explanations are clear and personalized

### 🔥 Priority 5: Polish the Demo
**Goal:** Make 6 screens excellent, not everything perfect

**What to build:**
1. **Onboarding:** Clean, simple profile creation
2. **Skill Analysis:** Clear gap visualization
3. **Learning Path:** Visual roadmap with progress
4. **Assessment:** Clean quiz interface
5. **Updated Path:** Clear adaptation visualization
6. **AI Explanation:** Natural language responses

**Success criteria:**
- Demo flows smoothly
- Judges understand the story
- No confusion about what's happening

---

## 📊 Phased Development Plan

### Phase 2B: AI Goal Understanding ✅ DONE (Commit 3)
**Timeline:** Complete
**Goal:** Natural language → Learner Profile

**Features:**
- Gemini/Groq integration for NL understanding
- Profile extraction from conversation
- One-prompt onboarding (no forms)
- Conversational interface

**Architecture:**
```
User: "I want GenAI Engineer in 6 months"
        ↓
Gemini/Groq → LearnerProfile
        ↓
Skill Gap Engine → Path
```

### Phase 3: Resources & Projects — DONE (Commit 4, 2026-09-12)
**Timeline:** Complete — YOU ARE HERE (Commit 4 done, ready to commit)
**Goal:** Answer "HOW should I learn this skill?" — Skill → courses, projects, docs, assessments

**Status 2026-09-12:** Implemented + verified: `resources.json=8`, matcher `50/20/20/10`, `POST /api/path/generate → 200` with `resources[]`. Ready to commit `feat: add personalized resource recommendation engine`. Temp `example.com` URLs — real URLs later.

**Decision: Option A first (Curated local `resources.json`, 30-50 resources)**
- Option A: Curated local resources — easy, reliable, no external API, fast, perfect for hackathon MVP, easy demo/deploy.
- Option B: Live resource discovery (internet search for courses/tutorials) — more dynamic but more complexity, failure points, quality risk.
- Choice: Option A first to finish MVP successfully. Option B later as enhancement if time remains.

**What NOT to do yet (V1 scope guard):**
- ❌ vector database / Qdrant / embeddings / hybrid retrieval / Supabase / Neon
- Priority stays: `WORKING MVP → POLISH → ADVANCED RETRIEVAL`, not advanced architecture first.

**Phase 3A: Resource data model (implemented):**
```text
Resource
├── id (e.g. res_embeddings_01)
├── title (e.g. Embeddings Fundamentals)
├── type (course | tutorial | documentation | project | assessment)
├── skill_id (canonical, must ∈ skills_catalog.json)
├── difficulty (beginner | intermediate | advanced)
├── estimated_hours
├── URL
├── description
└── tags
```
Example skill `embeddings` gets: 📚 Learning Resource + 📖 Documentation + 🛠 Mini Project (semantic-search) + 📝 Assessment (similarity quiz).

**Personalization (verified): embeddings/beginner/project → project 90.0 > course 80.0:**
- Same skill `RAG`, different learner → different experience:
- User A (Beginner, 5 hrs/week) → beginner resource + small project
- User B (Intermediate, 15 hrs/week) → advanced resource + larger project + assessment

**Architecture (implemented):**
```
Learner Profile
      ↓
Skill Gap Engine
      ↓
Learning Path → Required Skills
      ↓
Resource Matcher
      ↓
┌───────────────────────┐
│ Courses    │ Projects │
│ Tutorials  │ Assessments │
└────────────┬──────────┘
              ↓
     Personalized Path (Learn 📚 → Practice 🛠 → Assess 📝 → Milestone)
```

**Architecture (legacy summary kept):**
```
Learning Path Skill
        ↓
Resource Recommendation Engine
        ↓
Courses + Projects + Videos + Assessments
```

### Phase 4: Progress Tracking ✅ DONE (Commit 5, 2026-10-01, `7d253d5`)
**Timeline:** Complete
**Goal:** Dashboard with milestones and mastery tracking

**Delivered:**
- ✅ Roadmap Generator (Phases, Milestones, Time Estimation, Next Action, `estimated_weeks`)
- ✅ Progress Data Model (Activity, Progress, MasteryHistory Tables)
- ✅ Progress API (`POST /activity`, `POST /complete`, `GET /{learner_id}`, `GET /{learner_id}/skills`)
- ✅ Dashboard (`GET /api/progress/dashboard/{learner_id}` — progress bar, skill bars, milestones, next action, real-hours ETA)
- ✅ Notifications & Certificate System (`GET /notifications/{id}`, `GET /certificate/{id}` — SHA-256, 100% only)

**Architecture:**
```
Learner Activity
        ↓
Progress Tracker
        ↓
Dashboard + Notifications
```

### Phase 5: Assessment Engine ✅ DONE (2026-10-01, `62969c5`)
**Timeline:** Complete
**Goal:** Real quiz scoring replacing the V1 `+10 per completion` heuristic

**Delivered:**
- 20-question bank (`backend/data/assessments.json`, 6 skills, all canonical)
- `POST /assessment/start` (no answer leak) → `POST /submit` (30/70 blend, idempotent) → `GET /{id}` + `/{id}/result`
- Every result carries `gap_before/gap_after` — the input Phase 6 recalculates from

### Phase 6: Adaptive Roadmap ✅ DONE (2026-10-01, `39d5875`)
**Timeline:** Complete
**Goal:** An assessment result changes the recommended learning sequence automatically

**Delivered:** `POST /api/adaptation/recalculate` + submit-time auto-adaptation; `cleared_skills`; RAG scenario proven both directions; 10-check regression file.

### Phase 7: Advanced Adaptation (later)
**Timeline:** After Phase 6
**Goal:** ML-based recommendations, population learning

**Features:**
- ML models learning from thousands of learners
- Cross-learner pattern recognition
- Predictive recommendations
- Dynamic skill graph updates

**Architecture:**
```
Learner Data (thousands)
        ↓
ML Models
        ↓
Predictive Recommendations
```

---

## 🛠️ Technical Roadmap

### Immediate (Phase 7)
- [x] Assessment system with skill mapping (done — Phase 5)
- [x] Mastery calculation service (done — 30/70 blend, Phase 5)
- [x] Path adaptation logic (done — Phase 6 orchestration + `cleared_skills`)
- [ ] AI explanation endpoints
- [ ] Demo UI polish

### Done since this list was written (Commit 5)
- [x] Gemini profile extraction (`POST /api/profile/extract`)
- [x] Resource recommendation engine (Commit 4)
- [x] Basic progress tracking + dashboard (Commit 5)

### Short-term (V2)
- [ ] Groq fallback provider (currently Gemini-only; swap documented in `llm_service.py`)
- [x] Natural language profile extraction (done — Commit 3)
- [x] Resource recommendation engine (done — Commit 4)
- [x] Basic progress tracking (done — Commit 5)

### Medium-term (V3)
- [ ] React frontend
- [ ] Multi-user authentication
- [ ] Dynamic resource discovery
- [ ] Assessment question banks

### Long-term (V4+)
- [ ] ML-based recommendations
- [ ] Population learning models
- [ ] Advanced analytics
- [ ] Enterprise features

---

## 🎯 Success Metrics

### For Hackathon (Current)
- ✅ Core adaptive loop works
- ✅ Demo shows complete flow
- ✅ Judges understand the innovation
- ✅ Weaknesses are acknowledged honestly

### For V2
- [ ] Natural language onboarding works
- [ ] AI explanations are clear
- [ ] Resource recommendations are useful
- [ ] Progress tracking is accurate

### For V3+
- [ ] 100+ active users
- [ ] 1000+ skill gaps calculated
- [ ] ML models showing improvement
- [ ] Dynamic resources covering 80% of skills

---

## 📈 Scaling Plan

### Data Scaling
- **V1 (actual, Commit 5):** 77 skills, 8 resources, 5 careers
- **V2:** 100 skills, 100 resources, 10 careers
- **V3:** 200 skills, 500 resources, 20 careers
- **V4:** Dynamic discovery, unlimited resources

### User Scaling
- **V1:** Single demo user
- **V2:** 10 beta users
- **V3:** 100 users
- **V4:** 1000+ users

### Feature Scaling
- **V1:** Core adaptive loop
- **V2:** AI onboarding + explanations
- **V3:** Resources + progress tracking
- **V4:** ML + analytics + enterprise

---

## 🎤 How to Present This

### For Judges
**Say:** "This is our V1 prototype. We've built the core adaptive loop that demonstrates the innovation. Here's what comes next..."

**Show:**
1. Current working features
2. Architecture that supports scaling
3. Clear roadmap with priorities
4. Honest assessment of limitations

### For Investors
**Say:** "We have a working prototype with clear path to scale. Here's our 12-month roadmap..."

**Show:**
1. Current traction (users, feedback)
2. Market opportunity
3. Technical moat (adaptive algorithm)
4. Revenue model potential

---

## 🏁 Conclusion

**PathFinder V1** demonstrates the core innovation: adaptive, prerequisite-aware learning paths that continuously recalculate based on demonstrated mastery.

**Future versions** will add:
- AI-powered onboarding
- Dynamic resource recommendations
- Advanced progress tracking
- ML-based personalization

**The architecture is built to scale. The data and features need to grow with user feedback.**

---

*PathFinder — Personalized → Prerequisite-aware → Adaptive*