# MAP-GRAPH — Project Context & Continuation Reference

*48-hour assessment project | Detailed checkpoint for future chats*

## 1. Project Decision & Thesis

- Chosen project: a graph-powered social/local discovery application with a map as the primary exploration surface.
- A user selects or searches an area such as HSR Layout, sees real places on a map, and receives personalized recommendations based on their interests/preferences plus social graph signals such as friends’ visits and recommendations.
- The product is NOT intended to be a Google Maps replacement, Instagram, Yelp, or a full social network. The core loop is: Explore map → discover → understand why → save/visit/recommend → graph changes → better future recommendations.
- The project was deliberately selected over the incident/root-cause project because the map-graph idea has stronger visual/demo value, more originality, a strong graph-database story, social + recommendation signals, and good resume value while remaining feasible for a 48-hour assessment.

## 2. Assessment Strategy

- Primary objective: maximize the chance of selection with a small but polished working product, while also creating a useful graph-database project for the resume.
- The project should demonstrate graph modeling, graph traversal/multi-hop relationships, explainable scoring, personalization, social signals, dynamic updates, map visualization, and a defensible graph-vs-relational/NoSQL architecture decision.
- The goal is NOT to build a huge production platform. A tight end-to-end loop is more valuable than many incomplete features.

## 3. Graph Database Justification — Honest Version

- Many individual features can absolutely be implemented with SQL/Postgres/PostGIS or NoSQL. We should never claim otherwise.
- The strong justification for a graph database is that relationships are first-class and recommendation queries depend heavily on traversing those relationships: User → CONNECTED_TO → Friend → VISITED/RECOMMENDED → Place; User → LIKES → Interest; Place → HAS_ATTRIBUTE → Attribute; Place → LOCATED_IN → Area.
- Graph makes multi-hop traversal and relationship-heavy recommendation logic natural and explainable. SQL/PostGIS remains a valid option for straightforward place/geospatial storage, and NoSQL is valid for flexible documents. The graph choice is about the shape and importance of relationships, not because other databases are incapable.
- Interview framing: “We chose a graph because the recommendation context is relationship-heavy. We need to traverse users, friends, interests, visits and recommendations and explain why a place was selected. A relational solution is possible, but the graph representation makes these traversals and evolving social signals more direct.”

## 4. Current Technology Stack

- Next.js App Router + TypeScript + Tailwind CSS.
- CognoDB managed Neo4j-compatible graph database using Bolt.
- MapLibre GL JS for maps.
- OpenFreeMap Liberty style as the current free basemap provider.
- Dummy authentication for demo users such as Rahul and Arjun.
- Recommendation API backed by CognoDB/Cypher.

## 5. Database Milestone — Already Working

- CognoDB instance was created and the project successfully connected to it.
- The initial connection problem was an undefined Bolt URL; later an ECONNRESET occurred while the database instance was still being created. Once ready, npm run db:test succeeded with: URI exists: true; Username exists: true; Password exists: true; CognoDB connected.
- Cypher was also successfully run in the CognoDB browser and the user verified the graph relationships visually.

## 6. Current Graph Model

- User nodes: Rahul, Arjun, Priya.
- Interest/attribute concepts: Coffee, Quiet, Aesthetic, Outdoor, etc.
- Place nodes: Cafe One, Cafe Two, Japanese House.
- Relationships currently used include CONNECTED_TO, LIKES, VISITED, RECOMMENDED.
- Place metadata includes id, name, description, latitude, longitude, rating and priceLevel.
- Potential future relationships: SAVED, HAS_ATTRIBUTE, HAS_CATEGORY, LOCATED_IN.

## 7. Current Seed Data

- Cafe One (p1): “Quiet coffee spot with a relaxed atmosphere.” latitude 12.9116, longitude 77.6389, rating 4.5, priceLevel 2.
- Cafe Two (p2): “Aesthetic cafe with outdoor seating.” latitude 12.914, longitude 77.64, rating 4.3, priceLevel 2.
- Japanese House (p3): “Cozy Japanese restaurant.” latitude 12.91, longitude 77.635, rating 4.6, priceLevel 3.
- Observed relationships include: Arjun CONNECTED_TO Rahul; Arjun CONNECTED_TO Priya; Arjun LIKES Coffee, Quiet, Aesthetic; Rahul CONNECTED_TO Arjun; Rahul LIKES Coffee, Outdoor; Rahul VISITED Cafe One and Japanese House; Rahul RECOMMENDED Cafe One; Priya CONNECTED_TO Arjun; Priya LIKES Quiet; Priya VISITED Cafe Two; Priya RECOMMENDED Cafe Two.

## 8. Recommendation & Scoring

- Recommendation output is dynamic per user. Rahul and Arjun already receive different scores/results, proving personalization.
- Current scoring is performed in Cypher by combining weighted relationship signals and aggregating them into a numeric score. The API normalizes Neo4j integer values into JavaScript numbers.
- Reasons are returned alongside the score, for example: “Matches your Coffee interest”, “Matches your Quiet interest”, “Rahul visited this place”, “Rahul recommended this place”.
- Example output: Cafe One score 100 with Coffee + Quiet matches and Rahul visit/recommendation; Cafe Two score 100 with Coffee + Aesthetic matches and Priya visit/recommendation; Japanese House score 45 with Rahul visit only.
- Future architecture can move complex scoring into a dedicated recommendation service, but the current Cypher-based scoring is intentionally simple and easy to explain for the assessment.

## 9. Current Working Application

- Dummy authentication works for demo users such as Rahul and Arjun.
- The Explore page dynamically displays recommendations and reasons. Scores differ for Rahul and Arjun.
- The UI currently has an area selector, recommendation cards, match scores, descriptions, and “Why this place?” reasons.
- The UI is functional but intentionally not fully polished yet. Core graph/database/map behavior is prioritized first.

## 10. Map Implementation History & Current State

- The next-maps GitHub project was used as a UI/interaction reference because it demonstrates map-first discovery, floating controls, search, markers and a compact detail surface. It uses Mapbox GL JS, but Mapbox requested payment details, so it was not selected for this assessment.
- Free alternatives were evaluated. OpenFreeMap + MapLibre was selected because it works without Mapbox billing/API setup and provides MapLibre-compatible styles.
- MapLibre v6 initially caused an import/module compatibility issue under the current Next.js/Turbopack setup. MapLibre was downgraded to v5.23.0 and the map now works.
- The current working map uses MapLibre GL JS 5.23.0, OpenFreeMap Liberty style, center around HSR Layout, zoom 14, and NavigationControl.
- The OpenFreeMap style URL was verified in DevTools: https://tiles.openfreemap.org/styles/liberty returned HTTP 200 with application/json and CORS enabled. The real HSR map now renders successfully.
- Important: the map foundation is DONE. Do not go back into map-provider debugging unless a new concrete error appears.

## 11. Product Vision

- The map is not merely a list of recommendations. It is a personal + social exploration map.
- The user should be able to see places they have visited, places they have saved, places friends visited/recommended, personalized recommendations, and lower-ranked discoverable places.
- The application should feel like a real product: map-first, visually clean, interactive, explainable, and social without becoming a full social network.

## 12. Main Map Modes / Filters

- For You: personalized recommendations based on the current user’s interests and graph context.
- Friends: places reached through CONNECTED_TO → friends → VISITED/RECOMMENDED.
- Visited: current user → VISITED → Place.
- Saved: current user → SAVED → Place.
- Discover: places not yet visited, including lower-ranked options so the map remains an exploration surface rather than only a top-N recommendation list.

## 13. Desired UI Direction

- Use the next-maps/NextDoor.Company interaction philosophy as inspiration, not as a clone: large map, floating controls, concise place information, expandable detail panel, and map-first exploration.
- Top bar: Explore/brand, search, current user/logout.
- Map should dominate the screen. Avoid a permanently huge sidebar.
- Floating filters: For You, Friends, Visited, Saved, Discover.
- Map markers should communicate state such as visited, recommended, friend activity, saved and unexplored. Do not rely on color alone; use icons/state too.
- Clicking a marker should select the corresponding place/card and optionally zoom/fly to it. Clicking a recommendation card should fly the map to the corresponding marker.
- Place detail panel should show name, rating, category, score, reasons, people-you-know signals and actions such as Save, Visited and Recommend.
- The current map is light; product chrome/cards can use the existing dark UI. Rounded panels, floating controls, clean spacing, and subtle interactions should make it feel polished.

## 14. Real-World User Flow

- First-time onboarding: choose interests such as Coffee, Nature, Aesthetic, Japanese, Books, Live Music, Work Friendly. Create User → LIKES → Interest.
- Open Explore: select/search an area such as HSR Layout. Map centers on the area.
- Recommendation pipeline: area → places → user preferences → social graph → community signals → ranking.
- Select a place: show score and explain why it matches, including friend activity.
- User can Save, mark “I’ve been here”, or Recommend.
- Manual visit confirmation is preferred for MVP. Automatic GPS should later suggest a visit instead of silently recording one.
- After visiting, user can provide lightweight feedback such as a rating and selected attributes. Repeated behavior can later be used to infer preferences.
- User can explicitly recommend a place; RECOMMENDED remains distinct from VISITED.
- Saved places are distinct from visited places.

## 15. Future Geolocation Concept

- Later, location permission/geofencing can detect that a user appears to be at a place and ask: “Looks like you visited Cafe Two. Add it?”
- Do not automatically assume a visit because GPS can be inaccurate and this is a privacy-sensitive action.
- After confirmation, the graph can receive User → VISITED → Place and optionally feedback/preferences based on explicit user input.

## 16. Real Place Data + AI Enrichment

- Seeded places are placeholders for the assessment. The eventual product should ingest real places from an external place/search provider instead of manually hardcoding every place.
- Ingestion flow: external place source → normalize/check existing place → create/update Place in CognoDB → enrich attributes → connect Place to Area/Category/Attribute.
- A minimal AI layer can later turn unstructured place descriptions/reviews into attributes such as Coffee, Quiet, Aesthetic, Outdoor, Work Friendly, etc.
- AI is optional for the MVP and should not be added before the basic graph + map loop works.
- The graph remains the product brain; the map is the geographic visualization of graph results.

## 17. Assessment Demo Story

- A strong demo should be short and concrete: Arjun logs in → selects HSR → sees personalized For You recommendations → clicks Cafe One → sees why it matches and that Rahul visited/recommended it → saves/visits/recommends → switches to Friends or another user → demonstrates different recommendations.
- This demonstrates dummy auth, personalization, graph traversal, explainable scoring, social signals, database writes and map visualization without needing a huge product.

## 18. Scope — Must Have

- Dummy login/demo users.
- Real CognoDB graph database.
- Real graph-driven recommendations.
- Map.
- Real recommendation/place markers.
- Area exploration.
- Explainable recommendation reasons.
- Friends visited/recommended signals.
- Save.
- Mark visited.
- Recommend.
- Graph-based map filters.

## 19. Scope — Nice to Have

- Place search.
- Place detail drawer.
- Basic preference selection.
- Real external place ingestion.
- AI attribute enrichment.
- Marker clustering.
- More polished animations and interactions.

## 20. Explicitly Out of Scope for the 48-hour Assessment

- Full social network.
- Messaging/chat/stories.
- Payments/reservations.
- Google Maps replacement.
- Complex AI chatbot.
- Complex ML recommendation model.
- Production-grade authentication.
- Continuous background GPS tracking.
- Notifications.
- Full follower/profile ecosystem.
- Review moderation system.

## 21. Architecture Target

- src/app/explore/page.tsx — orchestrates page state/data.
- src/components/ExploreMap.tsx — map rendering and markers.
- Potential components: PlaceCard.tsx, PlacePanel.tsx, MapFilters.tsx, SearchBar.tsx.
- src/lib/recommendations.ts — recommendation API/data integration.
- Keep map rendering separate from recommendation/database logic. Do not put everything into page.tsx.
- Target flow: CognoDB → recommendation API → Explore page → ExploreMap → markers/cards. User actions write back through API → CognoDB.

## 22. Ten-Layer Implementation Roadmap

- Layer 1 — DONE: real OpenFreeMap + MapLibre HSR map.
- Layer 2 — NEXT: pass recommendation objects into ExploreMap and render Cafe One, Cafe Two and Japanese House at their actual coordinates.
- Layer 3: marker ↔ recommendation card interaction; click marker → select card/panel; click card → map.flyTo selected place.
- Layer 4: area switching; HSR/Koramangala/Indiranagar/etc. should map.flyTo the area and refresh recommendations.
- Layer 5: graph filters For You / Friends / Visited / Saved / Discover.
- Layer 6: place detail drawer/panel with score, reasons, friend activity and actions.
- Layer 7: Save / Visit / Recommend actions that write relationships back to CognoDB.
- Layer 8: Search.
- Layer 9: real place ingestion from an external provider + optional AI enrichment.
- Layer 10: final UI polish, clustering, loading/error/empty states, responsiveness and assessment demo readiness.

## 23. Immediate Next Task

- Do NOT change the map provider or database foundation.
- Modify ExploreMap.tsx to accept the existing recommendation objects as props and create real markers from longitude/latitude.
- Then connect marker selection with recommendation-card selection and map.flyTo().
- Test this layer before moving to area switching or filters.

## 24. Working Style / Rules for Continuing

- Lock major decisions before coding.
- Build the easiest/core MVP layers first.
- Use placeholders where needed, then replace them with real systems.
- After each layer, test and confirm before moving forward.
- Be brutal/honest about scope and whether a feature actually strengthens the assessment.
- Prefer a small polished end-to-end flow over many incomplete features.
- Keep the graph justification honest: graph is chosen for relationship-heavy traversal and explainability, not because SQL/NoSQL are impossible.
- When preparing interview/assessment explanations, clearly distinguish current simple Cypher scoring from future recommendation-service/ML possibilities.
- Use concise, step-by-step implementation instructions and provide complete code when coding.

## 25. Continuation Checkpoint

- At the moment this document was created: CognoDB is connected and working; graph data and Cypher recommendations work; dummy auth works; Rahul and Arjun get different recommendations/scores; the Explore page works; the HSR map works with MapLibre 5.23.0 + OpenFreeMap Liberty; the UI is functional but not final-polished.
- The next coding task is: REAL MAP MARKERS → MARKER/CARD SELECTION → map.flyTo().
- If continuing in another chat, provide this document and say: “Continue the map-graph project from the checkpoint in this document.”

## Quick Resume Block

- Project: Graph-powered social/local map discovery and recommendation app.
- DB: CognoDB / Neo4j-compatible Bolt.
- Map: MapLibre GL JS 5.23.0 + OpenFreeMap Liberty.
- Working: graph, recommendations, scoring, reasons, dummy auth, personalized Rahul/Arjun results, HSR map.
- Next: real recommendation markers → marker/card interaction → flyTo → area switching → graph filters → actions → search → ingestion/AI → polish.