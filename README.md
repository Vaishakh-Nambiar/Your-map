# Explore --- Graph-Based Local Discovery

> A map-first local discovery app powered by a social + geographic
> graph.

## Overview

Explore lets a user select an area and discover places using a
combination of:

-   personal interests
-   friends' visits
-   friends' recommendations
-   nearby geographic activity
-   place quality

The key idea is that recommendations are driven by **relationships**,
not just flat place attributes.

------------------------------------------------------------------------

## Why a Graph Database?

This project does **not** claim that SQL or NoSQL cannot implement
recommendations.

The reason for using a graph database is that the core recommendation
logic is relationship-heavy and multi-hop.

For example:

``` text
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

These relationships are modeled directly in the graph, making both
traversal and explanation natural.

------------------------------------------------------------------------

## Features

-   🗺️ Map-first place discovery
-   📍 Real OpenStreetMap places
-   👥 Social graph
-   ❤️ User interests
-   ⭐ Explainable recommendations
-   🤝 Friends-based discovery
-   🧭 Geographic/nearby-area reasoning
-   💾 Save places
-   ✅ Mark places visited
-   👍 Recommend places
-   🔄 Multiple recommendation modes
-   👤 Multiple demo users
-   📊 Progressive map/list loading

------------------------------------------------------------------------

## Recommendation Modes

### For You

Personalized recommendations using:

-   interest matches
-   friend visits
-   friend recommendations
-   nearby social activity

### Friends

Places with stronger social signals:

-   friend visits
-   friend recommendations
-   nearby activity
-   lighter interest matching

### Discover

Broader exploration based primarily on:

-   place quality/rating
-   geographic context
-   lighter interest/social signals

The same place can legitimately appear in multiple modes because the
modes use the same graph signals with different weights.

------------------------------------------------------------------------

## Data

The geographic dataset uses real OpenStreetMap data.

Current dataset:

``` text
834 places

HSR Layout: 321
Koramangala: 513
```

Social behavior is simulated for the assessment.

Current graph seed:

``` text
10 users
26 connections
2213 visits
730 recommendations
629 saves
```

The social graph intentionally contains sparse and overlapping
friendship circles so different users can produce different
recommendation contexts.

------------------------------------------------------------------------

## Graph Model

``` text
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

------------------------------------------------------------------------

## Recommendation Architecture

The recommendation pipeline is deliberately split into two layers.

### Cypher

The graph query retrieves:

-   user interests
-   friends
-   direct friend visits
-   direct friend recommendations
-   nearby-area social activity
-   place metadata

### TypeScript

The application layer:

1.  calculates mode-specific scores
2.  creates explanations
3.  calculates display scores
4.  sorts results
5.  returns the top recommendations

This keeps graph traversal separate from ranking logic.

------------------------------------------------------------------------

## Explainability

Recommendations include reasons such as:

``` text
Matches your Coffee interest
Rahul visited this place
Aisha visited this place
Rahul recommended this place
```

Geographic context is kept distinct:

``` text
Rahul visited a place in nearby Koramangala
```

This does not claim Rahul visited the recommended place.

------------------------------------------------------------------------

## Scoring Philosophy

The project originally used a simple additive score with a hard
100-point cap.

During testing, this created scaling and interpretation problems.

The design was changed toward weighted/normalized category scoring so
that the number of friends does not automatically dominate the ranking.

The principle is:

> Signal importance should matter more than raw relationship count.

This is particularly important when thinking about users with very
different social-graph sizes.

------------------------------------------------------------------------

## Map

MapLibre is used for the map.

The map:

-   displays recommendation markers
-   focuses on selected areas
-   flies to selected places
-   synchronizes with recommendation cards
-   progressively renders recommendation markers

Only the first five recommendations are shown initially to avoid visual
overload.

------------------------------------------------------------------------

## User Actions

Users can independently:

``` text
Save
Visit
Recommend
```

These create graph relationships:

``` text
(User)-[:SAVED]->(Place)
(User)-[:VISITED]->(Place)
(User)-[:RECOMMENDED]->(Place)
```

Multiple actions can coexist for the same place.

------------------------------------------------------------------------

## API

### Recommendations

``` text
GET /api/recommendations
```

Parameters:

``` text
userId
areaId
mode
```

Example:

``` text
/api/recommendations?userId=u1&areaId=area1&mode=for-you
```

Modes:

``` text
for-you
friends
discover
```

### Place actions

``` text
POST /api/places/action
```

Actions:

``` text
save
visit
recommend
```

The action API uses `MERGE` to create the graph relationship.

------------------------------------------------------------------------

## Project Structure

Important areas of the project:

``` text
src/
├── app/
│   ├── api/
│   │   ├── recommendations/
│   │   │   └── route.ts
│   │   └── places/
│   │       └── action/
│   │           └── route.ts
│   └── explore/
│       └── page.tsx
│
├── components/
│   └── ExploreMap.tsx
│
└── lib/
    ├── db.ts
    ├── queries.ts
    └── recommendations.ts

scripts/
├── import-osm.ts
├── ingest-osm.ts
├── seed-social.ts
└── seed.ts   # destructive — do not run
```

------------------------------------------------------------------------

## Running Locally

Install dependencies:

``` bash
npm install
```

Run the development server:

``` bash
npm run dev
```

Open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## Data Import

Real OSM places are stored locally in:

``` text
scripts/osm-places.json
```

The project has separate scripts for geographic data ingestion and
social seeding.

**Do not run `scripts/seed.ts` casually because it is destructive.**

Use:

``` bash
npx tsx scripts/seed-social.ts
```

for the social graph seed.

------------------------------------------------------------------------

## Environment

The database connection is configured through environment variables.

Expected database variables include:

``` text
COGNO_DB_URI
COGNO_DB_USERNAME
COGNO_DB_PASSWORD
```

Do not commit secrets.

------------------------------------------------------------------------

## Assessment Demo

A useful demo flow:

``` text
1. Open Explore
2. Select Arjun
3. Select HSR Layout
4. Show the map and recommendations
5. Explain one recommendation
6. Switch:
      For You → Friends → Discover
7. Show that rankings change
8. Switch user:
      Arjun → Rahul
9. Show different graph context
10. Click a place
11. Save / Visit / Recommend
12. Explain that the action creates a graph relationship
```

------------------------------------------------------------------------

## Important Engineering Decisions

### Real geographic data

We use real OSM data rather than fabricating the place layer.

### Simulated social activity

Social activity is seeded because the assessment does not provide a real
social interaction dataset.

### Explainable ranking

Weighted scoring is used instead of opaque ML because the assessment
emphasizes graph reasoning and explainability.

### Two geographic areas

HSR Layout and Koramangala are enough to demonstrate geographic
relationships without expanding data acquisition unnecessarily.

### Progressive loading

Only five recommendations are initially displayed on the map/list to
keep the exploration surface usable.

------------------------------------------------------------------------

## Known Tradeoffs

### Recommendation latency

The current local recommendation query can take roughly nine seconds.

An optimization attempt caused CognoDB timeout errors reaching roughly
66--67 seconds, so the working query was retained.

Further optimization is intentionally deferred until after MVP.

### Recommendation learning

The current system is rule/graph-signal based rather than ML-trained.

A learned ranking layer could be introduced later when enough behavioral
data exists.

### Social data

Social interactions are simulated for demonstration purposes.

### Scale

The project is designed to demonstrate graph-backed recommendation
architecture, not production-scale infrastructure.

------------------------------------------------------------------------

## Current Status

### MVP --- LOCKED 🔒

Implemented:

-   real OSM data
-   graph data model
-   10 users
-   social relationships
-   interests
-   visits
-   recommendations
-   saves
-   three recommendation modes
-   geographic multi-hop reasoning
-   explainable ranking
-   MapLibre map
-   progressive loading
-   map/card interaction
-   area switching
-   graph mutation APIs
-   multiple demo users
-   loading/error states

### Next

The next phase is UI polish.

Backend/recommendation architecture should remain stable unless a
genuine bug is discovered.

------------------------------------------------------------------------

## Future Improvements

Possible post-assessment improvements:

-   recommendation query optimization
-   recommendation feedback loops
-   temporal signals
-   better place-quality ranking
-   authentication
-   more geographic areas
-   learned ranking
-   caching
-   production deployment improvements
-   richer user profiles

These are intentionally outside the current MVP.

------------------------------------------------------------------------

## Demo / Presentation

The strongest technical story is:

``` text
Real places
    ↓
Graph model
    ↓
Multi-hop traversal
    ↓
Graph signals
    ↓
Explainable scoring
    ↓
Ranked recommendations
    ↓
Map-first UX
    ↓
User action
    ↓
Graph mutation
```

The goal is not to demonstrate the largest possible system.

The goal is to demonstrate a **tight, understandable, graph-backed
recommendation loop**.
