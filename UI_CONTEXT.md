# Explore — UI Context / Handoff

## Purpose

This file is the handoff context for continuing the **Explore — Graph-Based Local Discovery** project in a new ChatGPT conversation or IDE.

The functional MVP/backend is already complete and **LOCKED**.

From this point onward, the primary goal is:

> **UI/UX polish, visual hierarchy, usability, presentation quality, README/demo preparation, and final product polish.**

Do not redesign or modify the backend architecture unless an actual bug is discovered.

For full project history and architecture, also attach:

- `MAP_GRAPH_MVP_REFERENCE.md`
- `README_DRAFT.md`

Those files are the authoritative detailed project references.

---

# 1. PROJECT THESIS

Explore is a **map-first social/local discovery application**.

A user selects an area such as HSR Layout and receives recommendations based on:

- personal interests
- friends' visits
- friends' recommendations
- nearby geographic/social activity
- place quality

The map is the primary exploration surface.

The graph relationship model allows recommendations to traverse relationships such as:

```text
User
 ↓ CONNECTED_TO
Friend
 ↓ VISITED
Place
 ↓ LOCATED_IN
Area
 ↓ NEAR
Nearby Area
```

The honest architectural explanation is:

> SQL/NoSQL could implement this, but the recommendation problem is relationship-heavy and multi-hop, so a graph database makes those relationships first-class and makes traversal and explanation natural.

---

# 2. CURRENT STACK

- Next.js 16.3.1
- TypeScript
- CognoDB / Neo4j-compatible Cypher
- neo4j-driver
- MapLibre GL
- OpenFreeMap / Liberty-style map
- OpenStreetMap
- Node.js 20.20.2
- Windows development environment

Mapbox was avoided because it requested payment details.

---

# 3. CURRENT DATA

Real OpenStreetMap place data is used.

Current dataset:

```text
834 places

HSR Layout: 321
Koramangala: 513
```

Real places are stored/imported through:

```text
scripts/osm-places.json
scripts/import-osm.ts
scripts/ingest-osm.ts
```

Social behavior is simulated for the assessment.

Current social seed:

```text
Users:           10
Places:          834
Visits:          2213
Recommendations: 730
Saved:           629
Connections:     26
```

There is an older destructive:

```text
scripts/seed.ts
```

Do NOT run it casually.

The current social seed is:

```text
scripts/seed-social.ts
```

---

# 4. USERS

10 users exist in the graph.

Four are exposed in the UI for demonstration:

```text
Arjun  → u1
Rahul  → u2
Priya  → u3
Aisha  → u4
```

The other six remain in the graph to create social diversity.

Friendship circles are intentionally sparse and overlapping.

Example design principle:

```text
Rahul → A/B
Aisha → B/C
Priya → D/E
```

Different users therefore have different graph contexts.

Repeated recommendations across users are expected because multiple friends can visit the same place.

---

# 5. GRAPH MODEL — LOCKED

```text
(:User)-[:LIKES]->(:Interest)

(:User)-[:CONNECTED_TO]->(:User)

(:User)-[:VISITED]->(:Place)

(:User)-[:RECOMMENDED]->(:Place)

(:User)-[:SAVED]->(:Place)

(:Place)-[:HAS_ATTRIBUTE]->(:Attribute)

(:Place)-[:HAS_CATEGORY]->(:Category)

(:Place)-[:LOCATED_IN]->(:Area)

(:Area)-[:NEAR]->(:Area)
```

Do not redesign this for UI work.

---

# 6. RECOMMENDATION ENGINE — LOCKED

Architecture:

```text
Cypher
 ↓
extract graph signals
 ↓
TypeScript
 ↓
mode-specific scoring
 ↓
reasons
 ↓
display score
 ↓
sorting
 ↓
recommendations
```

Cypher retrieves graph relationships/signals.

TypeScript performs scoring and ranking.

Three modes exist:

### For You

Personalized:

- interest matches
- friend visits
- friend recommendations
- nearby activity

### Friends

Social-focused:

- friend visits
- friend recommendations
- nearby activity
- interest match

### Discover

Exploration-focused:

- place quality/rating
- nearby activity
- interest match

The same place can legitimately appear in multiple modes because the same underlying graph signals can be weighted differently.

---

# 7. EXPLAINABILITY

Recommendations contain reasons such as:

```text
Matches your Coffee interest
Rahul visited this place
Aisha visited this place
Rahul recommended this place
```

Nearby reasoning must remain distinct:

```text
Rahul visited a place in nearby Koramangala
```

This must NOT be presented as:

```text
Rahul visited this place
```

unless Rahul actually visited that exact place.

This distinction is important for the product's credibility.

---

# 8. SCORING HISTORY

The project originally used a hard 100-point cap.

That created scaling/interpretation problems.

The design moved toward weighted category-based scoring so raw friend count does not automatically dominate ranking.

Interview explanation:

> Signal importance should matter more than raw relationship count. A user with 1,000 friends should not automatically get a huge recommendation score simply because they have more connections.

Do not casually replace the scoring architecture during UI work.

---

# 9. MAP — CURRENT FUNCTIONALITY

MapLibre is the primary exploration surface.

Already working:

- real place markers
- first 5 recommendations displayed initially
- progressive loading
- card → map focus
- marker → place selection
- area switching
- map flies to selected area
- old results cleared during loading
- loading state
- selected place panel
- initial area overview
- multiple areas

The map should NOT show hundreds of markers at once.

The current 5-at-a-time behavior is intentional.

---

# 10. MAPLIBRE WARNING

A previous hover bug caused markers to jump to the top-left.

Cause:

MapLibre uses the marker element's CSS `transform` for geographic positioning.

Never overwrite:

```css
transform
```

on a MapLibre marker element.

Hover effects should instead use things such as:

```text
box-shadow
background
border
opacity
```

without destroying MapLibre's transform.

---

# 11. PLACE ACTIONS

Users can independently:

```text
Save
Visit
Recommend
```

All three can coexist.

Graph relationships:

```text
(User)-[:SAVED]->(Place)
(User)-[:VISITED]->(Place)
(User)-[:RECOMMENDED]->(Place)
```

Mutation API:

```text
POST /api/places/action
```

Recommendation API:

```text
GET /api/recommendations
```

These MUST remain separate.

Folder structure:

```text
src/app/api/
├── recommendations/
│   └── route.ts       ← GET
│
└── places/
    └── action/
        └── route.ts   ← POST
```

---

# 12. IMPORTANT MUTATION DECISION

We attempted to make:

```text
Visit
 ↓
place immediately disappears from recommendations
```

by modifying the recommendation Cypher.

It broke recommendation results.

The change was reverted.

Therefore:

**Do not reintroduce this behavior during UI work.**

The graph mutation itself works and is sufficient for the current MVP.

---

# 13. PERFORMANCE

Recommendation requests currently take approximately:

```text
~9 seconds locally
```

An attempted query optimization caused:

```text
context deadline exceeded
```

and requests reached:

```text
66–67 seconds
```

The optimization was reverted.

Decision:

> Keep the stable ~9-second query for the assessment and improve the loading experience instead of risking the recommendation engine.

Do NOT optimize the recommendation query during UI work unless explicitly requested.

---

# 14. IMPORTANT PREVIOUS BUGS

These are documented and should not be accidentally recreated:

### 405 route issue

The action POST route was accidentally used as the recommendation route.

Result:

```text
GET /api/recommendations → 405
```

Keep recommendation and mutation routes separate.

### Query result schema mismatch

TypeScript once tried to read a field that Cypher did not return:

```text
totalUserInterests
```

Keep Cypher return fields synchronized with TypeScript.

### neo4j-driver issue

The project once failed because `neo4j-driver` was missing from the actual project directory.

### Query timeout

Aggressive recommendation-query optimization caused CognoDB timeouts.

### MapLibre transform issue

Do not overwrite marker transform.

---

# 15. MVP IS LOCKED

Already working:

```text
Real OSM data                     ✅
834 places                        ✅
10 graph users                    ✅
Sparse social graph               ✅
Interests                         ✅
Visits                            ✅
Recommendations                  ✅
Saved places                      ✅
Friend relationships              ✅
For You                           ✅
Friends                           ✅
Discover                          ✅
Geographic reasoning              ✅
Explainable recommendations       ✅
Mode-specific ranking             ✅
Map markers                       ✅
Card ↔ map interaction             ✅
Area switching                    ✅
Map focusing                      ✅
Progressive 5-at-a-time loading   ✅
Loading states                    ✅
Save / Visit / Recommend          ✅
Graph mutations                   ✅
Multiple demo users               ✅
Stable GitHub version             ✅
```

The stable version is already stored in GitHub.

---

# 16. CURRENT PHASE = UI ONLY

The backend/MVP is locked.

We are now making the product:

- cleaner
- easier to understand
- more polished
- more presentable
- easier for an interviewer to use
- better for a demo video

Do not expand scope.

Do not add major backend features.

Do not redesign the graph.

Do not rewrite recommendation logic.

---

# 17. UI DESIGN GOAL

The product should feel like a modern local-discovery product.

Desired qualities:

```text
map-first
clean
minimal
premium
easy to scan
good visual hierarchy
consistent
not overly flashy
```

The map remains the primary surface.

The recommendation list should feel like a companion to the map.

---

# 18. FIRST-IMPRESSION GOAL

An interviewer should understand the product within roughly 10 seconds.

They should immediately understand:

```text
Where am I?
Which area am I exploring?
Who am I?
What are these recommendations?
Why is this place recommended?
```

Do not make these things difficult to locate.

---

# 19. UI AREAS TO POLISH

Work through these in priority order.

## A. Header

Improve:

- Explore/product identity
- current user
- demo user switcher
- area context
- spacing

## B. Area selector

Make the context obvious:

```text
Exploring HSR Layout
```

rather than hiding it in generic controls.

## C. Mode selector

Make these feel like primary navigation:

```text
For You
Friends
Discover
```

## D. Recommendation cards

Improve:

- place name
- category
- rating
- score
- reasons
- friend activity
- actions

Avoid making raw scores feel overly technical.

Instead of only:

```text
58.7
```

consider a visual:

```text
58% match
```

or:

```text
Strong match
```

while retaining technical detail where useful.

## E. Selected place panel

Make it clearly visible when a place is selected.

It should show:

```text
Place name
Category
Rating
Recommendation match
Why you're seeing this
Friend activity
Save
Visited
Recommend
```

## F. Map markers

Normal marker:

```text
●
```

Selected marker:

```text
larger / highlighted
```

But never break MapLibre positioning.

## G. Loading

Current loading behavior works.

Make it visually polished.

Do not show stale recommendations while changing:

```text
area
mode
user
```

## H. Empty states

Provide useful states for:

```text
No recommendations
No places
No social activity
```

Avoid blank screens.

## I. Error states

Make errors human-readable.

Do not expose raw Neo4j/Cypher errors in the UI.

## J. Responsive layout

Desktop is the primary assessment target.

Tablet/mobile can be improved if time permits.

---

# 20. DESIRED UX DIRECTION

Conceptually:

```text
┌────────────────────────────────────────────────────────────┐
│ Explore                         Arjun ▼                    │
├──────────────────────┬─────────────────────────────────────┤
│                      │                                     │
│ Exploring HSR ▼      │                                     │
│                      │               MAP                   │
│ For You Friends      │                                     │
│ Discover             │        ●       ●                    │
│                      │   ●              ●                  │
│ ┌──────────────────┐ │                                     │
│ │ Place            │ │                                     │
│ │ ★ 4.5   58%      │ │                                     │
│ │ Rahul visited    │ │                                     │
│ │ Matches Coffee   │ │                                     │
│ │ Save Visit 👍    │ │                                     │
│ └──────────────────┘ │                                     │
│                      │                                     │
│ ┌──────────────────┐ │                                     │
│ │ Another place    │ │                                     │
│ └──────────────────┘ │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

This is conceptual only. Do not blindly copy it.

---

# 21. IMPORTANT: UI ≠ NEW FEATURES

Do not add unnecessary:

- authentication systems
- ML models
- embeddings
- vector search
- notifications
- admin dashboards
- complex profiles
- production-scale caching
- additional recommendation algorithms
- large data expansion
- new graph relationships

The MVP is intentionally small and complete.

---

# 22. DEMO STORY

The polished UI should support this flow:

```text
1. Select Arjun
2. Select HSR Layout
3. Map focuses on HSR
4. For You recommendations appear
5. Click a place
6. See why it was recommended
7. Switch to Friends
8. Ranking changes
9. Switch to Discover
10. Different places appear
11. Switch to Rahul
12. Recommendations change
13. Save / Visit / Recommend a place
```

This is the core presentation story.

---

# 23. UI IMPLEMENTATION RULES

For every UI change:

1. Explain briefly what is changing.
2. Identify exact file(s).
3. Prefer complete copy-pasteable files.
4. Do not give tiny fragments when a full replacement is safer.
5. Add comments for non-obvious code.
6. Keep explanations concise.
7. Do not modify working backend behavior unnecessarily.
8. Do not give many alternative implementations.
9. Pick the best practical implementation.
10. Tell me exactly how to test the change.

If I upload a file, use that exact current file as the source of truth.

Do not assume the contents of files from older conversations.

---

# 24. COMMUNICATION STYLE

I prefer:

```text
What we're changing
↓
Why
↓
Exact file(s)
↓
Complete code
↓
Test
↓
Next
```

Be concise and direct.

Do not repeatedly explain architecture we have already established.

Go deep only when there is a genuine design/architecture decision.

---

# 25. SOURCE DOCUMENTS

When starting in a new chat/IDE, attach:

```text
UI_CONTEXT.md
MAP_GRAPH_MVP_REFERENCE.md
README_DRAFT.md
```

Use them together:

### UI_CONTEXT.md

This file = immediate handoff and UI phase instructions.

### MAP_GRAPH_MVP_REFERENCE.md

This file = detailed project history, architecture, decisions, bugs, tradeoffs, scoring, seed design, and interview context.

### README_DRAFT.md

This file = GitHub-facing documentation draft.

The reference files should be consulted before making architectural assumptions.

---

# 26. CURRENT TASK

We are starting the UI beautification/final presentation phase.

First inspect the actual current:

```text
src/app/explore/page.tsx
src/components/ExploreMap.tsx
```

and any other UI components that are actually imported/used.

Do not assume their current contents from this document.

Then identify the first 2–3 UI improvements in priority order.

Start with the highest-impact improvement.

Give complete copy-pasteable code when practical.

---

# 27. FINAL RULE

The project is currently:

```text
Backend             = stable
Graph schema        = stable
Recommendation      = stable
Seed                = stable
API                 = stable
MVP                 = LOCKED

UI                  = OPEN FOR POLISH
```

If a UI change exposes a backend bug, explain the bug before changing backend code.

Otherwise, stay within the UI/presentation layer.

**Do not restart the backend/MVP design discussion unless explicitly asked.**
