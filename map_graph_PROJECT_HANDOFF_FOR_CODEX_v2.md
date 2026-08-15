MAP-GRAPH — COMPLETE PROJECT HANDOFF / CODEX CONTEXT
Version 2 • Detailed technical + product continuation reference
Purpose: This document is intended to be uploaded to Codex or another coding agent so the project can be continued without reconstructing the previous discussion. It deliberately separates what is already implemented from what is planned. If an exact implementation detail is not stated here, inspect the existing repository/code rather than inventing it.

## 0. Current Checkpoint — READ THIS FIRST

- The project is a 48-hour assessment project and also a potential resume project.
- Core concept is LOCKED: graph-powered social/local place discovery with a map-first UI.
- CognoDB (Neo4j-compatible) is connected and working.
- Graph seed data exists and Cypher queries run successfully.
- Recommendation API/query works and returns dynamic results for different users.
- Dummy authentication works for demo users such as Rahul and Arjun.
- Rahul and Arjun receive different recommendation scores/results.
- Explore page works and shows recommendation cards with scores and explanation reasons.
- Real HSR Layout map is WORKING using MapLibre GL JS 5.23.0 + OpenFreeMap Liberty style.
- The next implementation task is REAL DATABASE-DRIVEN MAP MARKERS, then marker/card synchronization and map.flyTo().
- Do not restart the architecture or switch map providers unless a concrete new failure requires it.

## 1. Product Problem

People exploring a new area often have too many generic place choices and little context about which places fit their personal taste or social circle. The app combines geographic discovery with personal preferences and relationship signals.
- User selects/searches an area such as HSR Layout.
- The map shows real places in that area.
- Recommendations are personalized using user interests and graph relationships.
- The app can explain WHY a place was recommended.
- Friends' visits and recommendations become recommendation signals.
- Users can eventually save, visit, recommend and give feedback, causing the graph to evolve.
- The map is the exploration surface; the graph is the relationship/recommendation brain.

## 2. Product Thesis

Explore map
   ↓
Discover places
   ↓
See "why this place?"
   ↓
Use social context (friends visited/recommended)
   ↓
Save / Visit / Recommend
   ↓
Graph changes
   ↓
Future recommendations improve

## 3. Why Graph Database?

Do NOT say SQL/NoSQL cannot do this. They can. The argument is that relationships are first-class in this product and recommendation logic depends on traversing them.
User
  ├── LIKES ─────────────→ Interest
  ├── CONNECTED_TO ──────→ Friend/User
  │                           ├── VISITED ─────→ Place
  │                           └── RECOMMENDED ─→ Place
  └── VISITED/SAVED ─────→ Place

Place
  ├── HAS_ATTRIBUTE ─────→ Attribute
  ├── HAS_CATEGORY ──────→ Category
  └── LOCATED_IN ────────→ Area
- Graph makes multi-hop traversal natural: User → Friend → VISITED → Place.
- Graph makes relationship-heavy recommendations easier to explain.
- The social graph can grow without creating large numbers of relational join tables.
- SQL/PostGIS would still be strong for geospatial/place storage; the graph is selected because relationships drive the recommendation context.
- NoSQL would be valid for flexible place documents, but relationship traversal is the differentiator here.

## 4. Technology Stack

- Next.js 16.3.1 App Router.
- TypeScript.
- Tailwind CSS.
- CognoDB managed Neo4j-compatible graph database.
- Neo4j Bolt driver / Neo4j-compatible Cypher.
- MapLibre GL JS 5.23.0.
- OpenFreeMap Liberty vector basemap.
- Dummy/local authentication for demo users.
- Node.js 20.20.2, npm 10.8.2.

## 5. Repository / Code Organization

src/
├── app/
│   ├── api/
│   │   └── recommendations/
│   ├── explore/
│   │   └── page.tsx
│   ├── login/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   └── ExploreMap.tsx
│
└── lib/
    ├── recommendations.ts
    └── mockData.ts

scripts/
└── test-db.ts
The exact repository may contain additional files. The above is the known project structure from the implementation discussion. When modifying the project, inspect the actual repo before creating duplicate utilities/components.

## 6. Environment / Database Connection

- CognoDB URI, username and password are stored in the project's env file.
- Do not hardcode credentials.
- npm run db:test is the existing DB smoke test.
- Successful test output was: URI exists: true; Username exists: true; Password exists: true; CognoDB connected; Result: Integer { low: 1, high: 0 }.
npm run db:test

## 7. Current Graph Data Model


### User

- Example users: Rahul, Arjun, Priya.
- User relationships currently include CONNECTED_TO, LIKES, VISITED, RECOMMENDED.
- Future: SAVED.

### Place

- Properties observed: id, name, description, latitude, longitude, rating, priceLevel.
- Example: p1 Cafe One, p2 Cafe Two, p3 Japanese House.
- Places are geographic entities that appear on the map.

### Interest / Attribute

- Examples: Coffee, Quiet, Aesthetic, Outdoor.
- Current implementation uses interest matches for recommendation scoring.
- Future real-place ingestion can enrich places with attributes derived from descriptions/reviews.

### Area

- Current UI has HSR Layout as an area.
- Future areas include Koramangala, Indiranagar, Whitefield, MG Road, etc.
- An area can be represented as a graph entity or as an application-level map/query concept; inspect current code before changing the model.

## 8. Seed Graph Relationships Already Created

Arjun ──CONNECTED_TO──→ Rahul
Arjun ──CONNECTED_TO──→ Priya

Arjun ──LIKES──→ Coffee
Arjun ──LIKES──→ Quiet
Arjun ──LIKES──→ Aesthetic

Rahul ──CONNECTED_TO──→ Arjun
Rahul ──LIKES──→ Coffee
Rahul ──LIKES──→ Outdoor
Rahul ──VISITED──→ Cafe One
Rahul ──RECOMMENDED──→ Cafe One
Rahul ──VISITED──→ Japanese House

Priya ──CONNECTED_TO──→ Arjun
Priya ──LIKES──→ Quiet
Priya ──VISITED──→ Cafe Two
Priya ──RECOMMENDED──→ Cafe Two

## 9. Current Place Data

p1
Cafe One
"Quiet coffee spot with a relaxed atmosphere."
latitude: 12.9116
longitude: 77.6389
rating: 4.5
priceLevel: 2

p2
Cafe Two
"Aesthetic cafe with outdoor seating."
latitude: 12.914
longitude: 77.640
rating: 4.3
priceLevel: 2

p3
Japanese House
"Cozy Japanese restaurant."
latitude: 12.910
longitude: 77.635
rating: 4.6
priceLevel: 3

## 10. Recommendation System — Current Implementation

The current recommendation system is a graph query implemented in Cypher and exposed to the application through the recommendation API/lib. It is intentionally simple and explainable rather than ML-based.
User
 ↓
match user's interests
 ↓
match places in the requested area
 ↓
traverse social relationships
 ↓
check friend visits/recommendations
 ↓
calculate weighted signals in Cypher
 ↓
aggregate into score
 ↓
generate reasons
 ↓
sort recommendations
 ↓
return JSON to UI
- The current score is calculated in Cypher, not by an external ML model.
- The score combines relationship/interest signals and aggregates them.
- Reasons are returned with the score so the UI can explain the result.
- The exact numeric weights should be read from the current Cypher source in the repository before modifying the formula; this handoff document intentionally does not invent a weight table.
- Neo4j integer values were previously returned to JS as objects such as {low: 75, high: 0}; the API now normalizes the score to a regular JavaScript number.
- Current observed results demonstrate that different users get different scores/results.

## 11. Known Recommendation Output

[
  {
    "id": "p1",
    "name": "Cafe One",
    "description": "Quiet coffee spot with a relaxed atmosphere.",
    "latitude": 12.9116,
    "longitude": 77.6389,
    "rating": 4.5,
    "priceLevel": 2,
    "score": 100,
    "reasons": [
      "Matches your Coffee interest",
      "Matches your Quiet interest",
      "Rahul visited this place",
      "Rahul recommended this place"
    ],
    "matchedInterests": ["Coffee", "Quiet"],
    "visitors": ["Rahul"],
    "recommenders": ["Rahul"]
  },
  {
    "id": "p2",
    "name": "Cafe Two",
    "description": "Aesthetic cafe with outdoor seating.",
    "latitude": 12.914,
    "longitude": 77.64,
    "rating": 4.3,
    "priceLevel": 2,
    "score": 100,
    "reasons": [
      "Matches your Coffee interest",
      "Matches your Aesthetic interest",
      "Priya visited this place",
      "Priya recommended this place"
    ],
    "matchedInterests": ["Coffee", "Aesthetic"],
    "visitors": ["Priya"],
    "recommenders": ["Priya"]
  },
  {
    "id": "p3",
    "name": "Japanese House",
    "description": "Cozy Japanese restaurant.",
    "latitude": 12.91,
    "longitude": 77.635,
    "rating": 4.6,
    "priceLevel": 3,
    "score": 45,
    "reasons": [
      "Rahul visited this place"
    ],
    "matchedInterests": [],
    "visitors": ["Rahul"],
    "recommenders": []
  }
]

## 12. How to Explain Scoring in an Interview

Use this explanation: “For the MVP, scoring is deliberately transparent. Cypher traverses the graph and checks signals such as whether a place matches the user's interests and whether connected users visited or recommended it. Each signal contributes a weight, those contributions are aggregated into a score, and the same query produces human-readable reasons. This gives us explainability. If the recommendation model becomes more sophisticated, we can move scoring into a recommendation service and eventually add learned ranking.”

## 13. Current UI

- Login page / dummy auth.
- Explore page.
- Area selector currently includes HSR Layout.
- Recommendation section shows number of places.
- Cards show place name, rating, description, score badge, and Why This Place reasons.
- Current user appears in the top navigation with logout.
- The map is now rendered on the left and recommendations on the right.
- UI is functional but not final-polished.

## 14. Current Map Stack — WORKING

MapLibre GL JS 5.23.0
        ↓
OpenFreeMap
        ↓
Liberty style
        ↓
OpenStreetMap/OpenMapTiles-based map data
style:
https://tiles.openfreemap.org/styles/liberty
- The map is centered around HSR Layout using [77.6389, 12.9116].
- Important: MapLibre coordinates are [longitude, latitude].
- NavigationControl is already working.
- The real HSR basemap is visible and interactive.
- Map layer 1 is complete.
- Do not switch back to Mapbox; Mapbox requested payment details and was rejected for this assessment.
- Do not switch providers just because the current basemap is not yet aesthetically perfect.

## 15. Map Architecture Target

Recommendation API
       ↓
Explore page state
       ↓
ExploreMap(props)
       ↓
MapLibre map
       ├── basemap
       ├── place markers
       ├── selected marker
       └── map.flyTo()

Recommendation cards
       ↕
selectedPlace state
       ↕
map marker selection

## 16. Next Immediate Coding Task

- Modify ExploreMap.tsx so it accepts the existing recommendation objects as props.
- Create one real marker for each returned place using longitude/latitude.
- Do NOT hardcode marker coordinates in the map component.
- Use the API recommendation objects already returned by the app.
- Click marker → set selected place.
- Click recommendation card → set selected place and map.flyTo() to its coordinates.
- Visually highlight the selected marker/card.
- Only after this works should we add more map features.

## 17. Desired Map Interaction

User selects Cafe Two card
        ↓
selectedPlace = Cafe Two
        ↓
map.flyTo({
  center: [CafeTwo.longitude, CafeTwo.latitude],
  zoom: 16
})
        ↓
Cafe Two marker becomes active
        ↓
Cafe Two card becomes highlighted
User clicks Cafe Two marker
        ↓
selectedPlace = Cafe Two
        ↓
Cafe Two card becomes highlighted
        ↓
optional popup/detail surface opens

## 18. Area Switching

Future area selector should drive both the map and recommendations.
HSR Layout selected
      ↓
map.flyTo(HSR coordinates)
      ↓
fetch recommendations for area1
      ↓
replace markers/cards

Koramangala selected
      ↓
map.flyTo(Koramangala coordinates)
      ↓
fetch recommendations for Koramangala
      ↓
replace markers/cards
- Do not create a separate recommendation system for each area.
- Area is a query/context parameter.
- Use a small area metadata structure for initial demo coordinates.
- Later, real place ingestion can determine area/geographic containment.

## 19. Graph Filters Planned

[ For You ] [ Friends ] [ Visited ] [ Saved ] [ Discover ]
- For You: current recommendation query.
- Friends: connected users' visited/recommended places.
- Visited: current user VISITED places.
- Saved: current user SAVED places.
- Discover: places not visited, including lower-score places.
- These filters are intentionally graph-oriented rather than generic restaurant filters.

## 20. Place Detail Panel Planned

Cafe One
⭐ 4.5
94/100 match

Why this place?
✓ Matches Coffee
✓ Matches Quiet
✓ Rahul visited
✓ Rahul recommended

People you know
Rahul — visited

[ Save ] [ I've been here ] [ Recommend ]
- Use progressive disclosure: compact marker popup first, richer right-side detail panel if needed.
- The detail panel should explain recommendation context instead of only displaying generic place metadata.

## 21. Marker Semantics Planned

- Recommended for current user.
- Visited by current user.
- Saved by current user.
- Visited by friend.
- Recommended by friend.
- Unexplored/discoverable.
- Do not rely only on color; use icons, borders, size or badges as additional cues.

## 22. Save / Visit / Recommend Graph Writes

User ──SAVED──────→ Place
User ──VISITED─────→ Place
User ──RECOMMENDED─→ Place
- These should eventually be API actions, not direct browser-to-database writes.
- RECOMMENDED and VISITED are intentionally different signals.
- A future recommendation query can use these relationships as signals.
- A recommendation can later store metadata such as createdAt or note.

## 23. Future Real Place Ingestion

Search / external place source
          ↓
normalize place
          ↓
check if place already exists
          ↓
create/update Place
          ↓
latitude/longitude/category/rating/description
          ↓
attribute enrichment
          ↓
CognoDB
          ↓
recommendation query
          ↓
map
- Do not manually create hundreds of places.
- Seed data is only for the assessment MVP.
- The eventual app needs an external place data source.
- AI can later extract attributes from descriptions/reviews.

## 24. Minimal AI Layer — Future, Not Yet

- Possible AI job: convert unstructured place text into controlled attributes such as Coffee, Quiet, Aesthetic, Outdoor, Work Friendly.
- Then create Place → HAS_ATTRIBUTE → Attribute.
- AI should enrich data, not replace the graph.
- Do not add AI until the basic map/graph flow is stable.

## 25. Automatic Location / Geotagging — Future

- Do not silently record visits from GPS.
- Later, location can trigger a suggestion such as: “Looks like you visited Cafe Two. Add it?”
- User confirmation should create VISITED.
- This can later be extended to feedback and preference learning.

## 26. Production-Like End-to-End Flow

OPEN APP
  ↓
AUTH / DEMO USER
  ↓
EXPLORE
  ↓
choose/search area
  ↓
map centers on area
  ↓
load places + graph recommendations
  ↓
markers + recommendation cards
  ↓
user selects place
  ↓
see score + WHY + friend context
  ↓
Save / Visited / Recommend
  ↓
API writes graph relationship
  ↓
future recommendation changes
  ↓
user explores again

## 27. Strong Assessment Demo

1. Login as Arjun
2. Open HSR Layout
3. Show For You recommendations
4. Point out score/reasons
5. Click Cafe One card → map flies to it
6. Click marker → card becomes selected
7. Switch Friends → show graph/social context
8. Optionally save/visit/recommend
9. Logout
10. Login as Rahul
11. Show different recommendation results
This demo proves: authentication flow, graph-backed data, relationship traversal, personalized scoring, explainability, map integration, social signals and dynamic user-specific output.

## 28. Scope — Must Have

- Dummy auth/demo users.
- Real CognoDB graph.
- Graph-driven recommendations.
- Map.
- Real database-driven place markers.
- Area exploration.
- Explainable reasons.
- Friends visited/recommended signals.
- Save.
- Visited.
- Recommend.
- Graph-oriented filters.

## 29. Scope — Nice to Have

- Place search.
- Place detail drawer.
- Preference onboarding.
- External place ingestion.
- AI attribute enrichment.
- Marker clustering.
- Polished animations and transitions.
- Loading/empty/error states.

## 30. Explicitly Out of Scope for 48 Hours

- Full social network.
- Messaging/chat/stories.
- Payments/reservations.
- Google Maps replacement.
- Complex AI chatbot.
- Complex ML model.
- Production-grade auth.
- Continuous background GPS tracking.
- Notifications.
- Follower/profile ecosystem.
- Review moderation.

## 31. Important Implementation Rules for Codex

- FIRST inspect the existing repository and preserve working code.
- Do not invent duplicate API routes, database clients, or data models if they already exist.
- Do not rewrite the recommendation query unless the task explicitly requires it.
- Do not replace the current working map foundation.
- Do not hardcode place coordinates into UI components when coordinates already come from the API.
- Keep map state and recommendation state synchronized through a selectedPlace concept.
- Keep database credentials in env.
- Use API routes/server code for database writes; never expose CognoDB credentials to the browser.
- After each layer, run the app and test before moving to the next layer.
- Prefer small components instead of turning page.tsx into one huge file.
- If exact Cypher/scoring behavior is needed, inspect the actual current source code and explain it from there rather than guessing weights.

## 32. What Is NOT Yet Implemented

- Database-driven map markers.
- Marker/card synchronization.
- map.flyTo when a recommendation is selected.
- Area switching that actually refreshes recommendations.
- For You/Friends/Visited/Saved/Discover filters.
- Save/Visited/Recommend write APIs.
- Place detail drawer.
- Search.
- Real external place ingestion.
- AI attribute enrichment.
- Automatic location confirmation.
- Final visual polish.

## 33. What IS Proven Working

- CognoDB connectivity.
- Cypher execution.
- Graph relationships.
- Recommendation query.
- Score normalization.
- Recommendation reasons.
- Different recommendations for different users.
- Dummy login.
- Explore page.
- HSR area UI.
- MapLibre map rendering.
- OpenFreeMap basemap.
- Map navigation controls.

## 34. Handoff Prompt — COPY THIS TO CODEX

Use the following prompt when uploading this document to Codex:
You are continuing an existing Next.js + TypeScript assessment project called MAP-GRAPH.

Read the attached MAP-GRAPH handoff document completely before changing code.

Do NOT redesign the architecture from scratch. Preserve the working CognoDB graph, recommendation API, dummy auth, Explore page, and MapLibre/OpenFreeMap map.

Current working state:
- CognoDB/Neo4j-compatible database is connected.
- Graph seed data contains Rahul, Arjun, Priya, interests, and places.
- Recommendation query is implemented in Cypher.
- Recommendations include score, reasons, matchedInterests, visitors and recommenders.
- Rahul and Arjun receive different results.
- Dummy login works.
- HSR Explore page works.
- MapLibre 5.23.0 + OpenFreeMap Liberty map works.
- Map is currently only a basemap; real recommendation markers have NOT been implemented yet.

IMMEDIATE TASK:
1. Inspect the existing repository and locate the current recommendation data flow.
2. Pass the existing recommendation objects into ExploreMap without hardcoding place coordinates.
3. Render real markers using each place's longitude/latitude.
4. Clicking a marker should select the corresponding place.
5. Clicking a recommendation card should select the same place and map.flyTo() its coordinates.
6. Highlight the selected card/marker.
7. Keep the existing recommendation query and scoring unchanged.
8. Do not add search, filters, external place APIs or AI yet.
9. Test the implementation and report exactly what changed.

Important: if an exact implementation detail is missing from this document, inspect the repository/code. Do not invent it.

## 35. Continuation Command

If starting in a new chat, upload this document and say: “Continue MAP-GRAPH from the Codex handoff. We are at Layer 2: real CognoDB recommendation markers on the working HSR MapLibre/OpenFreeMap map.”

## 36. Quick Reference

PROJECT: MAP-GRAPH
GOAL: Social + personalized local place discovery on a map
DB: CognoDB / Neo4j-compatible
QUERY: Cypher recommendation scoring + reasons
FRONTEND: Next.js + TypeScript + Tailwind
MAP: MapLibre 5.23.0 + OpenFreeMap Liberty
AUTH: Dummy users (Rahul / Arjun / Priya)
WORKING: Graph + recommendations + personalization + HSR map
NEXT: Markers → marker/card sync → flyTo → area switching → filters → actions → search → ingestion/AI → polish