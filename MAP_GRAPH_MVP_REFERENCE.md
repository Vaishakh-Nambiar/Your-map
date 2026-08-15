# Explore --- Graph-Based Local Discovery

## MVP Technical Reference / Project History

**Status:** MVP functionality locked\
**Assessment:** 48-hour graph-database assessment\
**Primary next phase:** UI polish, README refinement, deployment and
demo/presentation

------------------------------------------------------------------------

## 1. Product Thesis

Explore is a **map-first social/local discovery application**.

A user selects an area such as HSR Layout and receives place
recommendations based on:

-   the user's interests
-   friends' activity
-   friends' recommendations
-   geographic relationships between nearby areas

The map is the primary exploration surface.

The product is intentionally not positioned as "SQL/NoSQL cannot do
this." The honest thesis is:

> The core recommendation problem is relationship-heavy. A graph
> database makes those relationships first-class and makes multi-hop
> recommendation and explanation queries natural.

A representative traversal is:

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
  ↓
Place
```

------------------------------------------------------------------------

# 2. Product Flow

The intended end-to-end flow is:

``` text
Select user
    ↓
Select area
    ↓
Map focuses on area
    ↓
Real places appear
    ↓
Choose:
  For You / Friends / Discover
    ↓
Top recommendations appear
    ↓
Click card / marker
    ↓
Inspect place details + score + reasons
    ↓
Save / Visit / Recommend
    ↓
Graph relationship is created
```

A strong assessment demo is:

``` text
Arjun
  ↓
HSR Layout
  ↓
recommendations

Switch to Rahul
  ↓
same area
  ↓
different graph context
  ↓
different recommendations
```

Repeated places across users are expected: multiple friends can
naturally visit the same place.

------------------------------------------------------------------------

# 3. Why Graph Database?

The application has several relationship types:

``` text
User → Interest
User → Friend
Friend → Place
Place → Area
Area → Nearby Area
Place → Attribute
```

The recommendation engine needs to combine these relationships.

For example:

``` text
Arjun
  ↓ CONNECTED_TO
Rahul
  ↓ VISITED
Place A
```

is a direct social signal.

A geographic signal is different:

``` text
Arjun
  ↓ CONNECTED_TO
Rahul
  ↓ VISITED
Place B
  ↓ LOCATED_IN
Koramangala
       ↑
      NEAR
       ↓
HSR Layout
```

This is deliberately modeled as an **indirect contextual signal**.

Important distinction:

> "Rahul visited a place in nearby Koramangala" does NOT mean "Rahul
> visited the recommended place in HSR."

That distinction became important during recommendation debugging.

------------------------------------------------------------------------

# 4. Technology Stack

-   Next.js 16.3.1
-   TypeScript
-   Neo4j-compatible CognoDB
-   `neo4j-driver`
-   MapLibre GL
-   OpenFreeMap / Liberty-style map
-   OpenStreetMap data
-   Node.js 20.20.2
-   Windows development environment

Mapbox was intentionally avoided because it requested payment details.

------------------------------------------------------------------------

# 5. Real Geographic Data

The project uses real OpenStreetMap place data.

Initial Overpass attempts encountered:

-   HTTP 429 Too Many Requests
-   HTTP 504 Gateway Timeout

The extraction was simplified and moved to:

``` text
https://maps.mail.ru/osm/tools/overpass/api/interpreter
```

That approach worked.

Current real dataset:

``` text
834 places

HSR Layout: 321
Koramangala: 513
```

The places contain real geographic information including:

-   OSM ID
-   name
-   latitude
-   longitude
-   category
-   OSM tags

Local data:

``` text
scripts/osm-places.json
```

Import-related scripts:

``` text
scripts/import-osm.ts
scripts/ingest-osm.ts
```

------------------------------------------------------------------------

# 6. Critical Seed-Script Rule

There is an older destructive script:

``` text
scripts/seed.ts
```

It resets/deletes graph data.

**Do not run it.**

The social graph is seeded with:

``` text
scripts/seed-social.ts
```

This preserves the real OSM places and creates the social graph around
them.

Latest known seed run:

``` text
Users:          10
Places:         834
Visits:         2213
Recommendations:730
Saved:          629
Connections:    26
```

The social graph was intentionally designed as:

-   10 users
-   sparse + overlapping friendship circles
-   varied interests
-   varied visits
-   independent recommendations
-   independent saves
-   real OSM places preserved

------------------------------------------------------------------------

# 7. Users

There are 10 users in the graph.

Four are exposed in the UI for easy assessment/demo switching:

``` text
Arjun  → u1
Rahul  → u2
Priya  → u3
Aisha  → u4
```

The remaining six users stay in the graph to provide additional social
diversity.

The friendship graph is intentionally not a fully connected network.

Example design principle:

``` text
Rahul → friends A/B
Aisha → friends B/C
Priya → friends D/E
```

This produces overlapping but distinct social contexts.

This is preferable to giving every user the same friends, because
identical social graphs would make recommendation outputs artificially
similar.

------------------------------------------------------------------------

# 8. Graph Data Model

Current graph relationships:

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

Geographic graph:

``` text
Place → LOCATED_IN → Area
Area → NEAR → Area
```

Current areas:

``` text
HSR Layout
Koramangala
```

with a nearby relationship between them.

------------------------------------------------------------------------

# 9. Recommendation Architecture

The recommendation pipeline is intentionally split.

## Cypher responsibility

Cypher retrieves graph relationships/signals:

-   user interests
-   friends
-   friends who visited the exact place
-   friends who recommended the exact place
-   nearby-area social activity
-   place metadata

## TypeScript responsibility

TypeScript:

-   calculates scores
-   applies mode-specific weights
-   creates explanation reasons
-   calculates display score
-   sorts recommendations
-   returns the top results

This separation is an important architectural explanation for the
assessment.

------------------------------------------------------------------------

# 10. Recommendation Modes

## For You

Personalized recommendations.

Signals:

``` text
Interest match
Friend visits
Friend recommendations
Nearby social activity
```

The user's own interests have significant influence.

------------------------------------------------------------------------

## Friends

Social-graph-focused recommendations.

Signals:

``` text
Friend visits
Friend recommendations
Nearby social activity
Interest match
```

Direct friend activity is intentionally weighted more heavily.

------------------------------------------------------------------------

## Discover

Broader exploration.

Signals:

``` text
Place quality/rating
Nearby activity
Interest match
```

Discover does not require direct social activity to produce useful
results.

------------------------------------------------------------------------

# 11. Recommendation Reasons

Recommendations are explainable.

Examples:

``` text
Matches your Coffee interest
Rahul visited this place
Aisha visited this place
Rahul recommended this place
```

For geographic context:

``` text
Rahul visited a place in nearby Koramangala
```

The explanation is part of the product rather than an invisible score.

------------------------------------------------------------------------

# 12. Ranking / Scoring Lessons

The recommendation engine initially used a simple additive score and a
hard 100-point cap.

That caused problems.

A key issue was that a user with many friends could potentially
accumulate social signals in a way that made a capped 100-point score
misleading.

This led to an important design discussion:

> A recommendation score should remain interpretable as the system
> scales.

The current direction is weighted category-based scoring rather than
treating 100 as an arbitrary absolute truth.

The interview explanation should be:

> The weights represent the relative importance of recommendation
> signals. They should be normalized or bounded at the category level so
> that a user with a much larger social graph does not automatically
> dominate the ranking simply because they have more friends.

This is an important scaling consideration.

------------------------------------------------------------------------

# 13. Recommendation Ranking Behavior

The system scores candidates first, sorts them, and then returns the
strongest results.

The API currently returns up to 50 ranked recommendations.

The UI progressively exposes them:

``` text
First 5
↓
Next 5
↓
Next 5
...
```

Only the visible recommendation set is rendered as map markers.

This prevents the map from being overloaded.

------------------------------------------------------------------------

# 14. Why For You and Friends Can Overlap

During testing, For You and Friends sometimes returned the same top
places but with different scores.

This was not automatically a bug.

The reason is:

-   both modes use the same underlying graph signals
-   the modes change the relative weights
-   the same place can genuinely be strong for both modes

For example, a place may simultaneously have:

``` text
multiple friend visits
friend recommendation
user interest match
```

Therefore it can legitimately rank highly in both modes.

The important distinction is that:

``` text
same place ≠ same recommendation logic
```

The score breakdown and mode-specific weighting explain the difference.

------------------------------------------------------------------------

# 15. Why Discover Looks Different

Discover intentionally emphasizes:

-   place quality/rating
-   exploration
-   lighter social context
-   lighter interest context

Therefore it can return places absent from the top of For You/Friends.

That is desirable.

The three modes are not supposed to be three unrelated datasets. They
are three different ranking perspectives over graph/place signals.

------------------------------------------------------------------------

# 16. Seed-Data Lessons

Early simulated data made the modes look too similar.

This was diagnosed as a **data distribution issue combined with
scoring**, rather than automatically blaming the query.

The seed was redesigned to provide:

-   more users
-   sparse friendship circles
-   overlapping friendships
-   varied interests
-   varied visits
-   varied recommendations
-   independent saves

This gives the graph enough structure to produce visibly different
contexts.

The latest seed uses 10 users and 26 connections.

------------------------------------------------------------------------

# 17. Realistic Place Data

The dataset contains many real OSM businesses.

During demo preparation, it became clear that simply treating every
place equally is not ideal.

A tiny local shop can technically be a recommendation, but a polished
demo should surface recognizable/useful categories more prominently.

The design direction is therefore:

``` text
Higher-quality / useful categories
        ↓
cafes
restaurants
coffee places
popular food places
etc.
        ↓
smaller / less compelling places
```

This should be treated as a future ranking/data-quality refinement if
needed, not as a reason to expand MVP scope.

------------------------------------------------------------------------

# 18. Map Architecture

MapLibre is the primary map interface.

Current behavior:

-   real places become markers
-   first 5 recommendation places are shown
-   card selection focuses the map on that place
-   marker selection can select the corresponding place
-   changing areas updates markers
-   map flies/focuses on the newly selected area
-   old recommendation results are cleared while loading
-   a loading state prevents stale content from remaining visible

An initial lightweight area overview was also explored so the map can
communicate that the application contains multiple supported areas.

The initial-area overview is a good-to-have, not core recommendation
functionality.

------------------------------------------------------------------------

# 19. Important MapLibre Bug

A marker-hover bug occurred because the marker element's CSS `transform`
was overwritten.

MapLibre itself uses `transform` to position markers.

Overwriting it with:

``` text
transform: scale(...)
```

caused markers to jump to the top-left.

The correct lesson:

> Never overwrite MapLibre's marker positioning transform.

Hover effects should instead modify properties such as:

``` text
box-shadow
background
opacity
```

without touching `transform`.

------------------------------------------------------------------------

# 20. Place Actions / Graph Mutations

The application supports three independent actions:

``` text
Save
Visit
Recommend
```

They are intentionally independent.

A user can have all three relationships to the same place:

``` text
(User)-[:SAVED]->(Place)
(User)-[:VISITED]->(Place)
(User)-[:RECOMMENDED]->(Place)
```

This was explicitly fixed after discovering that one action visually
replaced another.

The API is:

``` text
POST /api/places/action
```

It creates the appropriate relationship using `MERGE`.

------------------------------------------------------------------------

# 21. Important Mutation Decision

We attempted to make:

``` text
User clicks Visit
↓
place immediately excluded from recommendations
```

by adding a `NOT VISITED` filter to the recommendation Cypher.

That change caused the recommendation results to become empty.

It was reverted.

This is now a deliberate boundary:

> Do not modify the stable recommendation query simply to add a
> nice-to-have mutation behavior before the assessment.

The graph mutation itself works.

The working action route remains:

``` text
src/app/api/places/action/route.ts
```

The working recommendation route remains:

``` text
src/app/api/recommendations/route.ts
```

These are separate routes.

------------------------------------------------------------------------

# 22. Critical Route Bug

At one point the POST action route was accidentally restored into the
recommendation route location.

This caused:

``` text
GET /api/recommendations ... 405
```

because the route only exported POST.

The correct architecture is:

``` text
src/app/api/
├── recommendations/
│   └── route.ts       ← GET
│
└── places/
    └── action/
        └── route.ts   ← POST
```

This is now fixed and the stable version has been committed to GitHub.

------------------------------------------------------------------------

# 23. Performance

Recommendation requests currently take approximately:

``` text
~9 seconds locally
```

This is slower than ideal.

However, an optimization attempt caused CognoDB to return:

``` text
context deadline exceeded
```

and requests reached approximately:

``` text
66–67 seconds
```

Therefore the decision is:

> Keep the known-working \~9-second version for the assessment rather
> than risk breaking the recommendation engine.

Performance optimization is explicitly postponed.

Potential future work:

-   query profiling
-   indexing
-   reducing intermediate row expansion
-   query restructuring
-   caching where appropriate

But these are **post-MVP**.

------------------------------------------------------------------------

# 24. Other Important Debugging Lessons

## Missing dependency

The application once failed with:

``` text
Can't resolve 'neo4j-driver'
```

The issue was that the dependency was missing in the actual project
directory.

The project contains multiple lockfiles, which also produced a Next.js
workspace-root warning.

The working project is:

``` text
D:\Learn\map-graph\map-graph
```

The dependency was installed there.

------------------------------------------------------------------------

## Result-schema mismatch

At one point TypeScript attempted to read:

``` text
totalUserInterests
```

while the Cypher result did not expose that field.

The result then reported available keys without `totalUserInterests`.

The query/schema contract was corrected.

Lesson:

> Cypher return fields and TypeScript `record.get()` fields must remain
> synchronized.

------------------------------------------------------------------------

# 25. Current Stable MVP

The MVP currently includes:

``` text
Real OSM data                         ✅
834 real places                      ✅
2 geographic areas                   ✅
10 graph users                       ✅
Sparse social graph                  ✅
Interests                            ✅
Visits                               ✅
Recommendations                      ✅
Saved places                         ✅
Friend relationships                 ✅
For You mode                         ✅
Friends mode                         ✅
Discover mode                        ✅
Multi-hop geographic reasoning       ✅
Explainable recommendations          ✅
Mode-specific ranking                ✅
Map markers                          ✅
Card ↔ map interaction                ✅
Area switching                       ✅
Area map focusing                    ✅
Progressive 5-at-a-time display      ✅
Loading states                       ✅
Save / Visit / Recommend             ✅
Graph mutations                      ✅
Multiple demo users                  ✅
Stable GitHub version                ✅
```

**MVP is now locked.**

------------------------------------------------------------------------

# 26. Deliberately Out of Scope

Unless there is substantial extra time, do not add:

-   AI enrichment
-   Google Places API
-   vector search
-   embeddings
-   complex authentication
-   search engine
-   temporal decay
-   recommendation ML
-   clustering
-   real-time notifications
-   large-scale data expansion
-   production-grade personalization
-   complex profiles
-   admin dashboard

The assessment is stronger as a small complete system than as a large
incomplete product.

------------------------------------------------------------------------

# 27. Assessment Priorities

The project should be judged primarily on:

1.  Working graph-backed application
2.  Genuine multi-hop Cypher
3.  Realistic/real data
4.  Clear graph data model
5.  Explainable recommendations
6.  Map-first UX
7.  End-to-end mutation flow
8.  Honest graph-vs-relational explanation
9.  README quality
10. Hosted demo
11. Short demo video

------------------------------------------------------------------------

# 28. Strong Interview Explanation

A concise explanation:

> "I built a map-first local discovery application where recommendations
> are driven by a user's interests, social graph, and geographic
> relationships. Instead of treating these as separate tables and
> manually joining everything, I modeled them as graph relationships.
> That lets the recommendation query naturally traverse from a user to
> friends, from friends to places, and from places to nearby areas. The
> graph returns explainable signals, while the application layer handles
> scoring and ranking."

If asked:

### "Why graph instead of SQL?"

Answer honestly:

> "SQL could absolutely implement this. The reason I chose a graph is
> that the core recommendation logic is relationship-heavy and
> multi-hop. The graph makes those relationships first-class and makes
> traversals and explanations much more natural."

### "Why not just use an ML model?"

> "For this assessment I wanted the recommendation logic to be
> interpretable. Each recommendation can explain exactly which graph
> relationships contributed to it. A learned ranking model could be
> added later once enough behavioral data exists."

### "How does it scale with many friends?"

> "I don't want raw friend count to dominate the score. The
> recommendation signals are weighted and normalized by category, so a
> user with 1,000 connections doesn't automatically receive a huge score
> simply because they have more connections."

------------------------------------------------------------------------

# 29. Known Tradeoffs

### Tradeoff: query speed vs stability

We chose the known-working query over an aggressive optimization that
caused CognoDB timeouts.

### Tradeoff: synthetic social data vs real place data

Places are real OSM data; social behavior is simulated because there is
no real user activity dataset.

This is honest and appropriate for a 48-hour assessment.

### Tradeoff: simple scoring vs ML

We chose explainable weighted scoring rather than opaque ML.

### Tradeoff: two areas vs many areas

Two real areas are sufficient to demonstrate geographic graph traversal
without spending the assessment on data acquisition.

### Tradeoff: UI scope

UI polish is intentionally separated from backend MVP functionality.

------------------------------------------------------------------------

# 30. Current Project State

## Phase 1 --- Functional MVP

**LOCKED**

Do not modify the recommendation architecture unless a genuine bug
appears.

## Phase 2 --- UI

Next:

``` text
visual hierarchy
spacing
typography
cards
map/list proportions
selected-place panel
mode selector
area selector
loading states
empty/error states
responsive layout
demo-user presentation
```

## Phase 3 --- Documentation

Draft README exists alongside this reference.

Future README refinement should include:

-   product overview
-   screenshots
-   architecture diagram
-   graph schema
-   recommendation flow
-   scoring explanation
-   setup instructions
-   environment variables
-   seed/import commands
-   API endpoints
-   design decisions
-   known tradeoffs
-   demo instructions

## Phase 4 --- Deployment

After UI stabilization.

## Phase 5 --- Demo

Create:

-   60--120 second demo video
-   architecture walkthrough
-   short explanation of graph traversal
-   recommendation mode comparison
-   user-switch demonstration
-   graph mutation demonstration

------------------------------------------------------------------------

# 31. Golden Rule Going Forward

The MVP is functional.

From this point:

> **UI changes are allowed. Backend changes require a concrete reason
> and regression test.**

Do not casually modify:

``` text
recommendationQuery
recommendation route
scoring architecture
seed structure
graph schema
```

because these are now the stable foundation of the project.
