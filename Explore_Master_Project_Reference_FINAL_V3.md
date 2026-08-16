# EXPLORE --- Graph-Based Local Discovery

## Master Project Reference --- Canonical MVP + Assessment + Demo + Submission

**Status:** Functional MVP locked\
**Assessment:** Wexa AI --- CognoDB Graph Database Take-Home\
**Assessment window:** 48 hours\
**Primary stack:** Next.js + TypeScript + Tailwind CSS + CognoDB + Neo4j
driver + MapLibre GL\
**Current phase:** UI polish → README → deployment → demo/submission\
**Purpose of this file:** Single source of truth for continuing the
project without reconstructing previous decisions.

> **IMPORTANT:** This document supersedes older planning/handoff notes
> where they describe features as "planned" or "not yet implemented."
> The current canonical MVP state is the one documented here.

------------------------------------------------------------------------

# 1. Executive Summary

Explore is a **map-first social/local discovery application**.

A user selects an area such as **HSR Layout** and receives place
recommendations based on:

-   personal interests
-   friends' visits
-   friends' recommendations
-   nearby geographic/social activity
-   place quality
-   exploration context

The central technical idea is that recommendations come from
**relationships in a graph**, rather than treating places as isolated
rows with flat attributes.

The map is the **product surface**.

The graph is the **reasoning layer**.

Cypher retrieves graph-derived signals.

TypeScript applies recommendation policy, scoring, ranking and
explanation construction.

The UI turns those signals into human-readable reasons and a focused
graph explanation.

## One-sentence product thesis

> **Explore helps you discover places that make sense for you by
> combining geography, your interests and activity in your social
> graph.**

## Core product loop

``` text
REAL PLACES
    ↓
GRAPH MODEL
    ↓
USER + INTERESTS
    ↓
FRIENDS + ACTIVITY
    ↓
MULTI-HOP GRAPH TRAVERSAL
    ↓
GRAPH SIGNALS
    ↓
MODE-SPECIFIC 100-POINT SCORE
    ↓
RANKING + EXPLANATION
    ↓
MAP + RECOMMENDATION CARDS
    ↓
SAVE / VISIT / RECOMMEND
    ↓
GRAPH MUTATION
    ↓
FUTURE RECOMMENDATION CONTEXT
```

------------------------------------------------------------------------

# 2. Assessment Context --- Wexa AI Assignment

The original Wexa AI assignment asks for:

> Build a small, complete application backed by a graph database, using
> CognoDB as the database layer.

The assignment is explicitly intended to evaluate:

-   graph data modeling
-   engineering architecture
-   working application development
-   judgment in selecting a problem where a graph genuinely earns its
    place
-   ability to explain and defend implementation decisions

The use case is the candidate's choice, but the assignment specifically
says the interesting questions should involve **connections and
relationships rather than merely rows in a table**.

The assignment also explicitly states that **originality counts**.

## Assignment deliverable

The final submission must contain:

1.  GitHub repository
2.  Hosted application demo link
3.  Short screen recording

The assignment states that the hosted application demo and short screen
recording are **mandatory**.

The repository should contain:

-   full source code
-   application
-   data-loading scripts
-   Cypher queries
-   README
-   graph data-model diagram
-   setup/run instructions
-   CognoDB creation instructions
-   explanation of main queries
-   screenshots

The submission email goes to:

``` text
hr@wexa.ai
```

Subject:

``` text
CognoDB Assignment 2 – <Your Name>
```

The assignment also says to keep the CognoDB instance running until Wexa
responds, in case they need to try the application against live data.

AI coding assistants are allowed, but the candidate must be able to
**explain and defend every part of the submission** in the follow-up
interview.

------------------------------------------------------------------------

# 3. Why Explore Is a Good Graph Use Case

## Generic local discovery

A conventional local discovery application can answer:

> "What places exist here?"

Explore asks a richer question:

> "Which places make sense for me here, considering what I like and what
> people connected to me actually do?"

That question is relationship-heavy.

A recommendation may depend on a chain such as:

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

Another signal may be:

``` text
User
  ↓ LIKES
Interest
  ↑
Place
  ↓ HAS_ATTRIBUTE
Attribute
```

The important point is not that SQL or NoSQL cannot implement this.

They can.

The reason for choosing a graph is that **relationships are first-class
and recommendation logic depends heavily on traversing those
relationships**.

## Honest graph-vs-relational explanation

> "SQL could absolutely implement this. We chose a graph because the
> recommendation context is relationship-heavy and multi-hop. We need to
> traverse users, friends, interests, visits, recommendations and
> geographic relationships, and explain why a place was selected. The
> graph representation makes those traversals and explanations more
> direct."

### Why not SQL/PostGIS?

SQL/PostGIS remains a valid and strong choice for:

-   straightforward place storage
-   tabular data
-   geospatial queries
-   conventional filtering

The graph is preferable here because the **social and recommendation
relationships are central to the product**, not because relational
databases are incapable.

### Why not NoSQL?

NoSQL would be reasonable for flexible place documents.

The differentiator here is relationship traversal.

### Why not ML?

For the assessment, deterministic and explainable scoring is more
defensible than introducing an opaque learned ranking model without
sufficient behavioral data.

> "For this assessment I wanted the recommendation logic to be
> interpretable. Each recommendation can explain exactly which graph
> relationships contributed to it. A learned ranking model could be
> added later once enough behavioral data exists."

------------------------------------------------------------------------

# 4. Originality / Product Differentiation

The project should not be presented as:

> "I made another restaurant recommendation app."

The stronger framing is:

> **Explore is a map-first discovery system where the recommendation
> context itself is modeled as a social + geographic graph.**

The differentiation comes from combining:

1.  geography
2.  personal interests
3.  direct friend activity
4.  explicit friend recommendations
5.  indirect nearby-area social activity
6.  explainable multi-hop graph reasoning
7.  live graph mutations

The assessment demo should make this visible.

The strongest product story is not merely:

``` text
Place → Score
```

It is:

``` text
User
 ↓
Interests / Friends
 ↓
Graph traversal
 ↓
Relationship signals
 ↓
Recommendation
 ↓
Explanation
 ↓
User action
 ↓
Graph mutation
 ↓
Future context
```

------------------------------------------------------------------------

# 5. Assessment Requirements --- Complete Compliance Checklist

This section exists specifically so that no requirement from the
original assignment gets forgotten.

## 5.1 Data and queries

The assignment requires:

### Thoughtful graph data model

Required:

-   labeled nodes
-   typed relationships
-   properties
-   simple graph diagram in README

Explore provides:

-   User
-   Place
-   Interest
-   Attribute
-   Category
-   Area

with typed relationships:

-   LIKES
-   CONNECTED_TO
-   VISITED
-   RECOMMENDED
-   SAVED
-   HAS_ATTRIBUTE
-   HAS_CATEGORY
-   LOCATED_IN
-   NEAR

See the full graph model in Section 8.

### Real or realistic seed data

Explore uses:

-   real OpenStreetMap-derived place data
-   controlled simulated social data

The social data is simulated because no real user-activity dataset was
supplied.

This is intentional and should be stated honestly.

### Multi-hop Cypher

The assignment explicitly requires at least one traversal of **2 or more
hops**.

Explore demonstrates substantially more than two hops.

Representative traversal:

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

### Query awkward relationally

The recommendation problem combines:

-   user interests
-   direct social activity
-   friend recommendations
-   nearby-area activity
-   place metadata
-   geographic relationships

The graph representation makes these connected traversals natural.

The README should explicitly include one representative query and
explain why the traversal is relationship-heavy.

### Parameterized queries

Queries use parameters such as:

``` text
$userId
$areaId
```

No user input should be interpolated into Cypher strings.

### No string-concatenated Cypher

Do not introduce:

``` ts
`MATCH ... WHERE u.id = '${userId}'`
```

Use parameterized driver queries instead.

------------------------------------------------------------------------

# 6. Engineering Requirements --- Complete Compliance Checklist

The assessment explicitly requires:

## Environment-based credentials

CognoDB:

-   URI
-   username
-   password

must come from environment variables.

Never commit credentials.

Never expose CognoDB credentials to the browser.

## Clear project structure

The application should remain understandable and walkable line by line.

Current architecture:

``` text
Next.js frontend
    ↓
Next.js API routes
    ↓
neo4j-driver
    ↓
CognoDB
```

## Graceful database failure

The application should handle database/API failures gracefully.

The UI should have:

-   loading state
-   empty state
-   error state

Do not leave the user with a blank or broken interface if the
recommendation request fails.

------------------------------------------------------------------------

# 7. Technology Stack

Current confirmed stack:

-   Next.js 16.3.1
-   Next.js App Router
-   TypeScript
-   Tailwind CSS
-   CognoDB
-   Neo4j-compatible Cypher
-   official `neo4j-driver`
-   MapLibre GL JS 5.23.0
-   OpenFreeMap
-   Liberty vector basemap
-   OpenStreetMap/OpenMapTiles-based map data
-   Node.js 20.20.2
-   npm 10.8.2
-   Windows development environment

Mapbox was intentionally avoided because it requested payment details.

Do not switch map providers unless there is a concrete technical reason.

------------------------------------------------------------------------

# 8. Graph Data Model

## 8.1 Nodes

  ---------------------------------------------------------------------
  Node                               Purpose
  ---------------------------------- ----------------------------------
  `User`                             Demo user and social/behavioral
                                     context

  `Place`                            Real-world place shown on the map
                                     and scored as a candidate

  `Interest`                         User preference such as Coffee

  `Attribute`                        Semantic place characteristic

  `Category`                         Place classification

  `Area`                             Geographic region such as HSR
                                     Layout or Koramangala
  ---------------------------------------------------------------------

## 8.2 Relationships

  -----------------------------------------------------------------------
  Relationship            Meaning                 Signal type
  ----------------------- ----------------------- -----------------------
  `LIKES`                 User has an interest    Personal preference

  `CONNECTED_TO`          User connected to       Social graph
                          another user            

  `VISITED`               User visited a place    Activity/history

  `RECOMMENDED`           User explicitly         Intentional social
                          recommended a place     signal

  `SAVED`                 User saved a place      Personal intent

  `HAS_ATTRIBUTE`         Place has an attribute  Semantic matching

  `HAS_CATEGORY`          Place belongs to a      Classification
                          category                

  `LOCATED_IN`            Place belongs to an     Geographic context
                          area                    

  `NEAR`                  Area is near another    Indirect geographic
                          area                    context
  -----------------------------------------------------------------------

## 8.3 Graph structure

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

## 8.4 Geographic graph

``` text
Place
  ↓ LOCATED_IN
Area
  ↓ NEAR
Nearby Area
```

Current supported areas:

-   HSR Layout
-   Koramangala

They have a nearby relationship.

## 8.5 Critical semantic distinction

A friend visiting the exact recommended place is **direct evidence**.

A friend visiting another place in a nearby area is **indirect
contextual evidence**.

Never say:

> "Rahul visited this place"

when the actual graph only establishes:

> "Rahul visited a place in nearby Koramangala."

This distinction is important both technically and for explainability.

------------------------------------------------------------------------

# 9. Real Geographic Data

The MVP uses real OpenStreetMap-derived place data.

Current dataset:

``` text
834 places total

HSR Layout: 321
Koramangala: 513
```

Place data includes:

-   OSM ID
-   name
-   latitude
-   longitude
-   category
-   OSM tags
-   available metadata

Local data:

``` text
scripts/osm-places.json
```

Import-related scripts:

``` text
scripts/import-osm.ts
scripts/ingest-osm.ts
```

The extraction process originally encountered:

-   HTTP 429
-   HTTP 504

and was simplified using a working Overpass endpoint.

The important product-level point is:

> The visible place dataset is real geographic data rather than a fake
> set of manually invented locations.

------------------------------------------------------------------------

# 10. Social Seed Data

Social activity is intentionally simulated.

Reason:

-   the assessment provides no real social-activity dataset
-   controlled data makes the recommendation behavior deterministic
-   deterministic behavior makes the demo reproducible

Current known seed scale:

``` text
Users:             10
Connections:       26
Visits:            2213
Recommendations:  730
Saved:             629
Places:            834
```

The social graph is deliberately:

-   sparse
-   overlapping
-   varied in interests
-   varied in visits
-   varied in recommendations
-   independent in saves

This prevents every demo user from producing identical recommendation
contexts.

## Demo users

Four users are exposed in the UI for convenient demonstration:

``` text
Arjun  → u1
Rahul  → u2
Priya  → u3
Aisha  → u4
```

The remaining users remain in the graph to provide additional social
diversity.

------------------------------------------------------------------------

# 11. Seed Script Safety

There is an older destructive script:

``` text
scripts/seed.ts
```

**DO NOT RUN IT casually.**

It resets/deletes graph data.

The social graph should be seeded with:

``` text
scripts/seed-social.ts
```

The social seed preserves the real OSM places and creates the social
graph around them.

This distinction is important for future maintenance.

------------------------------------------------------------------------

# 12. Recommendation Architecture

The recommendation pipeline is intentionally split into
responsibilities.

``` text
CognoDB / Cypher
      ↓
Graph relationships / signals
      ↓
TypeScript scoring
      ↓
Mode-specific 100-point score
      ↓
Human-readable reasons
      ↓
Rank candidates
      ↓
Top 50 API pool
      ↓
Progressive frontend presentation
```

## Cypher responsibility

Cypher retrieves graph-derived facts/signals such as:

-   user interests
-   matching place attributes
-   friends
-   friends who visited the exact place
-   friends who recommended the exact place
-   friends who visited places in nearby areas
-   place metadata
-   total user-interest count

## TypeScript responsibility

TypeScript owns:

-   scoring policy
-   mode-specific weights
-   normalization
-   bounded category scoring
-   explanation construction
-   ranking
-   sorting
-   returning top results

This separation is important:

> **Cypher retrieves graph facts. TypeScript decides recommendation
> policy.**

This makes the graph useful without pretending that Cypher itself is the
entire recommendation engine.

------------------------------------------------------------------------

# 13. Recommendation Modes

There are three modes.

## 13.1 For You

Question:

> "What should I personally try?"

Priority:

-   personal interest match
-   direct social evidence
-   nearby social activity
-   place quality

Signals:

``` text
Interest match
Friend visits
Friend recommendations
Nearby activity
Place quality
```

## 13.2 Friends

Question:

> "What are people in my network into?"

Priority:

-   friend visits
-   friend recommendations
-   nearby activity
-   lighter interest matching
-   lighter place quality

Signals:

``` text
Friend visits
Friend recommendations
Nearby activity
Interest match
Place quality
```

Direct friend activity is intentionally weighted more heavily.

## 13.3 Discover

Question:

> "What else is worth discovering?"

Priority:

-   place quality
-   interests
-   exploration
-   lighter social evidence
-   nearby context

Signals:

``` text
Place quality
Interest match
Nearby activity
Friend visits
Friend recommendations
Exploration bonus
```

Discover does not require strong direct social evidence.

## Important behavior

The same place may legitimately appear in:

-   For You
-   Friends
-   Discover

because the modes operate on the **same underlying graph signals with
different weighting policies**.

Therefore:

``` text
same place ≠ same recommendation logic
```

------------------------------------------------------------------------

# 14. Canonical Recommendation Scoring

The current model is a **bounded 100-point model**.

Important:

> 100 is not an arbitrary cap applied after an unlimited raw score.

The total is intentionally constructed from bounded category maxima.

This avoids the problem where a user with many friends can accumulate
many social events and overwhelm other signals.

## 14.1 Social signal saturation

Social signals use saturation:

``` text
0 friends  → 0% of category
1 friend   → 60%
2 friends  → 80%
3+ friends → 100%
```

This prevents high-cardinality social data from dominating the ranking.

## 14.2 Interest normalization

Conceptually:

``` text
interestScore =
  min(matchedInterests / totalUserInterests, 1)
  × categoryMaximum
```

This means a user with many interests is not unfairly penalized or
rewarded simply because their interest list is larger.

## 14.3 Quality score

Rating is mapped from 0--5 into the relevant category maximum:

``` text
qualityScore =
  (clampedRating / 5)
  × categoryMaximum
```

------------------------------------------------------------------------

# 15. For You Scoring

  Signal                     Maximum
  ------------------------ ---------
  Interest match                  35
  Friend visits                   25
  Friend recommendations          25
  Nearby activity                 10
  Place quality                    5
  **Total**                  **100**

For You emphasizes personal relevance plus direct social evidence.

------------------------------------------------------------------------

# 16. Friends Scoring

  Signal                     Maximum
  ------------------------ ---------
  Friend visits                   35
  Friend recommendations          35
  Interest match                  10
  Nearby activity                 15
  Place quality                    5
  **Total**                  **100**

Friends shifts the scoring budget toward what connected users actually
did or recommended.

------------------------------------------------------------------------

# 17. Discover Scoring

  Signal                     Maximum
  ------------------------ ---------
  Place quality                   35
  Interest match                  25
  Nearby activity                 15
  Friend visits                    5
  Friend recommendations           5
  Exploration bonus               15
  **Total**                  **100**

Exploration bonus:

``` text
0 direct social signals → 15
1 direct social signal  → 8
2+ direct social signals → 0
```

The goal is to give Discover a reason to surface places that do not
already have strong direct social evidence.

------------------------------------------------------------------------

# 18. Canonical Scoring Pseudocode

``` text
if mode == "for-you":
    interests = interestScore(matched, totalInterests, 35)
    friendVisits = saturatedScore(visitors, 25)
    friendRecommendations = saturatedScore(recommenders, 25)
    nearbyActivity = saturatedScore(nearbyVisitors, 10)
    quality = qualityScore(rating, 5)

if mode == "friends":
    friendVisits = saturatedScore(visitors, 35)
    friendRecommendations = saturatedScore(recommenders, 35)
    interests = interestScore(matched, totalInterests, 10)
    nearbyActivity = saturatedScore(nearbyVisitors, 15)
    quality = qualityScore(rating, 5)

if mode == "discover":
    quality = qualityScore(rating, 35)
    interests = interestScore(matched, totalInterests, 25)
    nearbyActivity = saturatedScore(nearbyVisitors, 15)
    friendVisits = saturatedScore(visitors, 5)
    friendRecommendations = saturatedScore(recommenders, 5)

    directSocialCount =
        visitors.length + recommenders.length

    if directSocialCount == 0:
        exploration = 15
    elif directSocialCount == 1:
        exploration = 8
    else:
        exploration = 0

total =
    interests
    + friendVisits
    + friendRecommendations
    + nearbyActivity
    + quality
    + exploration
```

The API scores candidates, sorts them and keeps up to:

``` text
50 recommendations
```

The frontend progressively exposes smaller batches.

------------------------------------------------------------------------

# 19. Recommendation Explainability

A score alone is not the product explanation.

Explore converts graph evidence into human-readable reasons.

Examples:

``` text
Matches your Coffee interest
Matches your Quiet interest
Rahul visited this place
Rahul recommended this place
Friends are active in nearby Koramangala
```

## Explanation rules

### Interest

Present as direct personal relevance:

``` text
Matches your Coffee interest
```

### Exact-place friend visit

Present as direct friend evidence:

``` text
Rahul visited this place
```

### Exact-place friend recommendation

Present as direct friend evidence:

``` text
Rahul recommended this place
```

### Nearby activity

Present only as nearby context:

``` text
Friends are active in nearby Koramangala
```

Never upgrade indirect context into a direct visit claim.

### Discover

When direct social evidence is absent, Discover can communicate
exploration:

``` text
A new place to explore
```

------------------------------------------------------------------------

# 20. Three Explanation Layers

Explore has three complementary explanation surfaces.

## Layer 1 --- Recommendation card

Quick reason for clicking.

Example:

``` text
Matches your Coffee interest
Rahul visited this place
```

## Layer 2 --- Place detail/story

Richer context:

-   rating
-   description
-   reasons
-   friend activity
-   available actions

## Layer 3 --- Explanation graph

A focused visualization of the relationships that contributed to the
recommendation.

The explanation graph is **not the full database graph**.

It is a projection containing only the relevant relationships for the
selected recommendation.

------------------------------------------------------------------------

# 21. Explanation Graph

Representative structure:

``` text
Coffee
   │
   ↓
 Place
 ↗    ↖
Friend Friend
visited recommended
```

The graph can change according to recommendation mode so that the
visualization answers the user's current question.

Supported interactions:

-   drag nodes
-   pan
-   zoom
-   fit graph to readable framing

Confirmed UI decision:

> The "How was this ranked?" button was removed.

The focused graph itself is the visual explanation surface.

------------------------------------------------------------------------

# 22. Map-First UX

The map is not decorative.

It is the primary exploration surface.

## Current principles

-   user starts with geography
-   recommendations appear in spatial context
-   real places appear as map markers
-   recommendation cards coexist with the map
-   card selection and marker selection are synchronized
-   selected places focus the camera
-   area changes update the recommendation context
-   loading clears stale recommendation content

## No fake search

Do not expose unsupported search functionality merely to make the UI
look complete.

Area selection is currently the supported discovery interaction.

------------------------------------------------------------------------

# 23. Map Architecture

``` text
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
       ↕
Recommendation cards
       ↕
selectedPlace state
       ↕
map marker selection
```

Current map behavior includes:

-   real map
-   MapLibre
-   OpenFreeMap Liberty style
-   navigation controls
-   recommendation-driven marker placement
-   card ↔ marker synchronization
-   selected place focus
-   area focus
-   progressive recommendation display
-   loading handling

------------------------------------------------------------------------

# 24. Important MapLibre Bug

A marker-hover bug occurred because the marker element's CSS `transform`
was overwritten.

MapLibre uses `transform` to position markers.

Bad:

``` css
transform: scale(...);
```

This caused markers to jump to the top-left.

Correct principle:

> Never overwrite MapLibre's positioning transform.

Use properties such as:

``` text
box-shadow
background
opacity
border
```

for visual styling.

------------------------------------------------------------------------

# 25. Progressive Recommendation Rendering

The API can return up to 50 ranked recommendations.

The frontend does not render all 50 markers at once.

Instead:

``` text
First 5
  ↓
Next 5
  ↓
Next 5
  ↓
...
```

Only the visible recommendation set should become visible map markers.

Purpose:

-   prevent map overload
-   keep the recommendation tray readable
-   make the interface feel progressive
-   avoid visual clutter

------------------------------------------------------------------------

# 26. Area Switching

Current real areas:

``` text
HSR Layout
Koramangala
```

The same recommendation system is used across areas.

Area is a query/context parameter, not a separate recommendation engine.

Conceptually:

``` text
HSR Layout selected
    ↓
map focuses on HSR
    ↓
recommendations for HSR
    ↓
markers/cards update

Koramangala selected
    ↓
map focuses on Koramangala
    ↓
recommendations for Koramangala
    ↓
markers/cards update
```

Two areas are intentionally sufficient for the assessment.

They demonstrate:

``` text
Place
 ↓ LOCATED_IN
Area
 ↓ NEAR
Nearby Area
```

without consuming the assessment time on large-scale geographic data
acquisition.

------------------------------------------------------------------------

# 27. Place Actions / Graph Mutations

The application supports three independent actions:

``` text
Save
Visit
Recommend
```

Relationships:

``` text
(User)-[:SAVED]->(Place)

(User)-[:VISITED]->(Place)

(User)-[:RECOMMENDED]->(Place)
```

## Semantics

  Action      Relationship    Meaning
  ----------- --------------- ----------------------
  Save        `SAVED`         Keep for later
  Visit       `VISITED`       Activity/history
  Recommend   `RECOMMENDED`   Explicit endorsement

These actions are intentionally independent.

A user can have all three relationships to the same place.

------------------------------------------------------------------------

# 28. Action API

Current action route:

``` text
POST /api/places/action
```

It creates the appropriate relationship using `MERGE`.

Current recommendation route:

``` text
GET /api/recommendations
```

Correct architecture:

``` text
src/app/api/
├── recommendations/
│   └── route.ts       ← GET
│
└── places/
    └── action/
        └── route.ts   ← POST
```

Database writes happen through server/API code.

CognoDB credentials must never be exposed to the browser.

------------------------------------------------------------------------

# 29. Critical Mutation Boundary

A visit does **not** automatically remove a place from recommendation
candidates.

An earlier attempt was made to add:

``` text
NOT VISITED
```

to the recommendation candidate query.

That caused recommendation results to become empty.

The change was reverted.

Current intentional boundary:

> **Graph mutation and stable candidate generation are loosely coupled
> for the MVP.**

Do not modify the stable recommendation query just to create a
nice-to-have behavior such as:

``` text
Visit
 ↓
immediately disappear from recommendations
```

The graph mutation itself works.

------------------------------------------------------------------------

# 30. The A → B Graph Demonstration

This is one of the strongest demonstrations in the project.

``` text
User A
  ↓ RECOMMENDED
Place X

User B
  ↓ CONNECTED_TO
User A

Future recommendation for User B
  ↓
"User A recommended this place"
```

This demonstrates that the graph is **live application state**.

One user's action can become another user's future recommendation
context.

This is much stronger than merely showing that a database write
succeeded.

------------------------------------------------------------------------

# 31. Demo Users

Four users are exposed in the UI:

``` text
Arjun
Rahul
Priya
Aisha
```

The graph contains 10 users in total.

The social graph is intentionally sparse and overlapping so that
different users have different contexts.

A strong demo can use:

``` text
Arjun
  ↓
HSR Layout
  ↓
For You

Switch to Rahul
  ↓
HSR Layout
  ↓
different social context
  ↓
different recommendations
```

Repeated places across users are expected.

Multiple friends can naturally visit the same place.

------------------------------------------------------------------------

# 32. Current Stable MVP

The following are considered part of the locked MVP:

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
Card ↔ map interaction               ✅
Area switching                       ✅
Area map focusing                    ✅
Progressive 5-at-a-time display      ✅
Loading states                       ✅
Save / Visit / Recommend             ✅
Graph mutations                      ✅
Multiple demo users                  ✅
Stable GitHub version                ✅
```

**MVP is locked.**

------------------------------------------------------------------------

# 33. UI State Requirements

The Wexa assessment explicitly evaluates design effort and asks for:

-   sensible layout/navigation
-   readable typography
-   intentional UI/UX
-   loading states
-   empty states
-   error states

Current/final UI polish checklist:

-   visual hierarchy
-   spacing
-   typography
-   recommendation cards
-   map/list proportions
-   selected-place panel
-   mode selector
-   area selector
-   loading states
-   empty states
-   error states
-   responsive layout
-   demo-user presentation

The UI should feel intentional without expanding the product scope.

------------------------------------------------------------------------

# 34. Current UI Source-of-Truth Decisions

These decisions are locked.

## Removed: percentage-match badge

Do not describe the UI as showing:

``` text
94% match
```

The raw recommendation score remains an internal ranking mechanism.

The user should understand recommendations through:

-   reasons
-   social context
-   graph explanation
-   place context

## Removed: "How was this ranked?"

Do not claim this button exists.

The focused explanation graph is the visual explanation surface.

## No fake search

Do not expose a search control that is not actually implemented.

## No GPS-based automatic visits

Do not claim a place was visited merely because a user's device is near
it.

------------------------------------------------------------------------

# 35. Current Application Architecture

``` text
                    ┌──────────────────────┐
                    │      Next.js UI      │
                    │                      │
                    │  Map                 │
                    │  Recommendation tray │
                    │  Place detail        │
                    │  Actions             │
                    │  Explanation graph   │
                    └──────────┬───────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │     Next.js API      │
                    │                      │
                    │ GET recommendations  │
                    │ POST place action    │
                    └──────────┬───────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │    neo4j-driver      │
                    └──────────┬───────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │       CognoDB        │
                    │ Neo4j-compatible     │
                    │ graph database       │
                    └──────────────────────┘
```

## Layer responsibilities

  Layer               Responsibility
  ------------------- ---------------------------------------------------
  Cypher              Retrieve graph-derived facts/signals
  TypeScript          Apply recommendation policy and scoring
  API                 Validate, query, score, rank, return JSON
  Frontend            Present map, recommendations, reasons and actions
  Explanation graph   Show relevant relationship evidence

------------------------------------------------------------------------

# 36. Known Repository Structure

Known structure:

``` text
src/
├── app/
│   ├── api/
│   │   ├── recommendations/
│   │   │   └── route.ts
│   │   ├── places/
│   │   │   └── action/
│   │   │       └── route.ts
│   │   ├── explore/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│
├── components/
│   └── ExploreMap.tsx
│
└── lib/
    ├── recommendations.ts
    └── mockData.ts

scripts/
├── test-db.ts
├── seed-social.ts
├── seed.ts
├── import-osm.ts
└── ingest-osm.ts
```

The exact repository may contain additional files.

When modifying the project:

> Inspect the actual repository before creating duplicate utilities,
> components, routes or data models.

------------------------------------------------------------------------

# 37. Database Connection

CognoDB connection has been successfully established.

Known smoke test:

``` text
npm run db:test
```

Previously verified:

``` text
URI exists: true
Username exists: true
Password exists: true
CognoDB connected
```

Credentials must remain in environment variables.

Never hardcode:

-   URI
-   username
-   password

Never send credentials to the client.

------------------------------------------------------------------------

# 38. Important Debugging History

These lessons should be retained because they are useful for interviews
and future maintenance.

## Missing `neo4j-driver`

An earlier error:

``` text
Can't resolve 'neo4j-driver'
```

The issue was that the dependency had not been installed in the actual
working project directory.

Known working project directory from the development environment:

``` text
D:\Learn\map-graph\map-graph
```

## Multiple lockfiles

The project contained multiple lockfiles, producing a Next.js
workspace-root warning.

Do not blindly restructure the repository just to eliminate a warning
unless it causes an actual issue.

## Cypher / TypeScript result mismatch

TypeScript once attempted to read:

``` text
totalUserInterests
```

while the Cypher result did not expose that field.

The query/schema contract was corrected.

Lesson:

> Cypher return fields and TypeScript `record.get()` fields must remain
> synchronized.

## GET/POST route mix-up

At one point the action POST route was accidentally restored into the
recommendation route.

That produced:

``` text
GET /api/recommendations
→ 405
```

Correct structure:

``` text
recommendations/route.ts → GET
places/action/route.ts   → POST
```

## React feedback loop

Selection/state update behavior needed guarding to prevent unnecessary
feedback loops.

Maintain a clear `selectedPlace` concept so map state and recommendation
state remain synchronized.

------------------------------------------------------------------------

# 39. Performance Tradeoff

Current recommendation requests take approximately:

``` text
~9 seconds locally
```

This is slower than ideal.

An optimization attempt produced:

``` text
context deadline exceeded
```

and approximately:

``` text
66–67 seconds
```

Therefore:

> **The known-working \~9-second implementation is preferred for the
> assessment over a risky optimization.**

Performance optimization is post-MVP.

Potential future work:

-   query profiling
-   indexing
-   reducing intermediate row expansion
-   query restructuring
-   caching

Do not risk the stable recommendation engine immediately before
submission.

Interview framing:

> "We found an optimization that actually made the query substantially
> worse on the available CognoDB tier, so we kept the stable version and
> documented performance optimization as future work."

This is an engineering tradeoff, not something to hide.

------------------------------------------------------------------------

# 40. Important Seed/Data Tradeoffs

## Real places + simulated social data

This is intentional.

``` text
Places       → real OSM data
Social data  → controlled simulated data
```

Reason:

There is no real social activity dataset available for the assessment.

The correct explanation is:

> "The places are real OSM data; the social behavior is simulated
> because there is no real user activity dataset. This makes the
> recommendation behavior deterministic and reproducible for the
> assessment."

Do not call the simulated social activity real-world user behavior.

------------------------------------------------------------------------

# 41. Important Product Tradeoffs

## Two areas instead of many

Two real areas are enough to demonstrate:

``` text
Place → Area → NEAR → Area
```

without spending the assessment on geographic acquisition.

## Deterministic scoring instead of ML

The system is explainable and reproducible.

## Bounded category scoring

Prevents large friend counts from dominating the recommendation.

## Map-first instead of feature-heavy

The map is the product surface.

## Focused explanation graph

More useful than dumping the entire database graph into the UI.

## Independent actions

Save, Visit and Recommend have distinct meanings and can coexist.

------------------------------------------------------------------------

# 42. Known Limitations

Current limitations:

-   social behavior is simulated
-   only two geographic areas are included
-   authentication is demo-oriented
-   recommendation latency is not production-grade
-   ranking is deterministic
-   GPS-based visit detection is not implemented
-   raw score is intentionally not a prominent UI element

These should be acknowledged rather than hidden.

The goal is a strong **48-hour assessment MVP**, not a production-scale
consumer application.

------------------------------------------------------------------------

# 43. Deliberately Out of Scope

Do not expand the MVP into these unless there is substantial extra time
and a genuine reason:

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
-   large-scale geographic expansion
-   production-grade personalization
-   complex profiles
-   admin dashboard
-   full social network
-   messaging/chat/stories
-   payments/reservations
-   review moderation
-   continuous background GPS
-   follower ecosystem
-   complex AI chatbot

The assessment is stronger as:

> **a small, complete system**

than:

> **a large, incomplete product.**

------------------------------------------------------------------------

# 44. Future Extensions

These are valid future directions, but not MVP requirements.

## Geographic expansion

Add:

-   Indiranagar
-   Whitefield
-   MG Road
-   additional neighborhoods

## Production authentication

Replace dummy demo-user selection with real authentication.

## User-confirmed GPS suggestions

Instead of silently recording visits:

``` text
GPS detects likely place
        ↓
"Looks like you visited Cafe Two. Add it?"
        ↓
User confirms
        ↓
VISITED relationship
```

Never silently create a visit.

## Learned ranking

Use feedback and behavior to learn weights once sufficient data exists.

## AI enrichment

Use AI to convert unstructured place descriptions/reviews into
controlled attributes:

``` text
Coffee
Quiet
Aesthetic
Outdoor
Work Friendly
```

Then create:

``` text
(Place)-[:HAS_ATTRIBUTE]->(Attribute)
```

AI should enrich the graph, not replace it.

## Temporal signals

Potential future signals:

-   recency
-   time-of-day
-   seasonal activity

## Performance

Potential improvements:

-   query profiling
-   indexing
-   caching
-   reducing row expansion
-   query restructuring

------------------------------------------------------------------------

# 45. Assessment Priorities

The project should be optimized around these priorities, in this order:

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

These priorities should guide the remaining work.

------------------------------------------------------------------------

# 46. README Requirements --- Final Checklist

The README must include:

## Product

-   project overview
-   problem statement
-   product thesis
-   key product loop
-   screenshots

## Graph

-   Why a graph database?
-   graph-vs-relational explanation
-   node types
-   relationship types
-   graph diagram
-   representative multi-hop query
-   explanation of why the query is relationship-heavy
-   parameterized query explanation

## Recommendation system

-   recommendation modes
-   signals
-   scoring model
-   bounded category maxima
-   saturation
-   interest normalization
-   explanation approach

## Architecture

-   frontend
-   API
-   neo4j-driver
-   CognoDB
-   map
-   recommendation pipeline
-   mutation pipeline

## Setup

-   prerequisites
-   CognoDB account
-   CognoDB instance creation
-   environment variables
-   install commands
-   seed/import commands
-   run commands
-   database smoke test

## Data

-   real OSM place data
-   simulated social data
-   dataset scale
-   supported areas
-   seed strategy

## Engineering

-   error handling
-   parameterized Cypher
-   secrets handling
-   route structure
-   known tradeoffs

## Demo

-   how to run the demo
-   demo users
-   recommended demo sequence

## Limitations

-   simulated social activity
-   two areas
-   deterministic ranking
-   demo authentication
-   performance limitation
-   no GPS

## Future work

-   geographic expansion
-   production auth
-   learned ranking
-   AI enrichment
-   GPS suggestions
-   performance improvements

------------------------------------------------------------------------

# 47. README Source-of-Truth Rules

The README must **not** accidentally document old implementation
decisions.

Never say:

-   the old raw additive score is the current scoring model
-   the UI shows a percentage match
-   the "How was this ranked?" button exists
-   nearby activity means the friend visited the recommended place
-   simulated social activity is real user behavior
-   authentication is production-grade
-   GPS visits are implemented
-   AI ranking exists
-   the explanation graph is the complete database graph
-   100 is an arbitrary cap
-   recommendation latency is production-optimized

The canonical truth is:

> 100 is the sum of bounded category maxima.

------------------------------------------------------------------------

# 48. Strong Interview Explanation

Use this concise version:

> "I built a map-first local discovery application where recommendations
> are driven by a user's interests, social graph, and geographic
> relationships. Instead of treating these as separate tables and
> manually joining everything, I modeled them as graph relationships.
> That lets the recommendation query naturally traverse from a user to
> friends, from friends to places, and from places to nearby areas. The
> graph returns explainable signals, while the application layer handles
> scoring and ranking."

## If asked: Why graph instead of SQL?

> "SQL could absolutely implement this. The reason I chose a graph is
> that the core recommendation logic is relationship-heavy and
> multi-hop. The graph makes those relationships first-class and makes
> traversals and explanations much more natural."

## If asked: Why not ML?

> "For this assessment I wanted the recommendation logic to be
> interpretable. Each recommendation can explain exactly which graph
> relationships contributed to it. A learned ranking model could be
> added later once enough behavioral data exists."

## If asked: How does it scale with many friends?

> "I don't want raw friend count to dominate the score. The
> recommendation signals are weighted and normalized by category, so a
> user with 1,000 connections doesn't automatically receive a huge score
> simply because they have more connections."

## If asked: Is the social data real?

> "The place data is real OpenStreetMap data. The social activity is
> controlled simulated data because there isn't a real social-activity
> dataset available for the assessment. That makes the demo
> deterministic and reproducible."

## If asked: Why only two areas?

> "Two real areas were enough to demonstrate the geographic graph
> traversal. I prioritized demonstrating the graph relationship clearly
> rather than spending the 48-hour assessment on large-scale data
> acquisition."

## If asked: Why is the recommendation request slow?

> "The current stable query takes roughly nine seconds locally on the
> assessment database tier. We tested an optimization, but it caused
> CognoDB timeouts and roughly 66--67 second responses, so we kept the
> known-working version and documented query profiling, indexing and
> caching as future work."

------------------------------------------------------------------------

# 49. Canonical Demo Story

The strongest demo should be short and causal.

## Step 1 --- Open Explore

Show:

-   map-first interface
-   current demo user
-   recommendation tray

## Step 2 --- Select HSR Layout

Show:

-   area context
-   real map
-   real places

## Step 3 --- Use For You

Show:

-   recommendation cards
-   clear personal/social reasons

## Step 4 --- Select a recommendation

Example:

``` text
Cafe One
```

Show:

-   place details
-   reasons
-   friend activity

## Step 5 --- Open explanation graph

Connect the visible reason to the graph.

For example:

``` text
Your Coffee interest
        ↓
      Place
        ↑
Rahul visited
        ↑
Friend relationship
```

## Step 6 --- Switch to Friends

Show that the same graph can be prioritized differently.

Explain:

> "The underlying graph signals are shared, but the scoring policy
> changes."

## Step 7 --- Switch to Discover

Show a place that is useful to explore without strong direct social
evidence.

Explain:

> "Discover intentionally gives exploration and place quality more
> weight."

## Step 8 --- Perform an action

Use:

-   Recommend
-   Visit
-   or Save

## Step 9 --- Explain the graph mutation

Show:

``` text
User action
    ↓
Graph relationship
    ↓
Potential future recommendation signal
```

## Step 10 --- Switch user

Switch from:

``` text
Arjun
```

to:

``` text
Rahul
```

Show that the same area can produce different recommendation context.

## Step 11 --- Close with architecture

Final explanation:

> "The graph finds the relationships, TypeScript applies the
> recommendation policy, and the UI explains the result."

------------------------------------------------------------------------

# 50. Demo Principle

Do not try to demonstrate every feature independently.

Demonstrate one causal chain:

``` text
graph relationship
       ↓
recommendation
       ↓
human explanation
       ↓
focused explanation graph
       ↓
user action
       ↓
graph mutation
       ↓
future recommendation context
```

This is the core story of the project.

------------------------------------------------------------------------

# 51. Suggested 60--120 Second Demo Structure

``` text
0–10 sec
Open app + show map

10–20 sec
Select HSR + show real places

20–40 sec
For You + select recommendation + explain reasons

40–55 sec
Open explanation graph

55–70 sec
Switch Friends → explain different weighting

70–85 sec
Switch Discover → show exploration behavior

85–100 sec
Recommend / Visit / Save

100–115 sec
Switch user → show different graph context

115–120 sec
Architecture close
```

The recording should prioritize the product story over lengthy code
walkthroughs.

------------------------------------------------------------------------

# 52. Submission Checklist

Before sending the assignment:

## GitHub

-   [ ] Repository accessible to Wexa
-   [ ] Full source code committed
-   [ ] README complete
-   [ ] Graph diagram included
-   [ ] Main Cypher queries included/explained
-   [ ] Seed/import scripts included
-   [ ] Screenshots included
-   [ ] No credentials committed
-   [ ] No accidental debug secrets

## Application

-   [ ] Production/hosted build works
-   [ ] CognoDB connection works from hosted environment
-   [ ] Environment variables configured
-   [ ] Demo user login works
-   [ ] Map loads
-   [ ] Places/markers load
-   [ ] Recommendations load
-   [ ] For You works
-   [ ] Friends works
-   [ ] Discover works
-   [ ] Reasons are readable
-   [ ] Explanation graph works
-   [ ] Save works
-   [ ] Visit works
-   [ ] Recommend works
-   [ ] Area switching works
-   [ ] Loading state works
-   [ ] Empty state works
-   [ ] Error state works

## Demo

-   [ ] 60--120 second recording
-   [ ] Clear causal story
-   [ ] Graph traversal visible
-   [ ] Recommendation explanation visible
-   [ ] Mode comparison visible
-   [ ] User switching visible
-   [ ] Graph mutation demonstrated

## Database

-   [ ] CognoDB instance running
-   [ ] Seed data present
-   [ ] Real OSM data present
-   [ ] No accidental destructive seed execution
-   [ ] Credentials configured only through environment variables

## Email

-   [ ] Repository URL
-   [ ] Hosted demo URL
-   [ ] Recording link/file as appropriate
-   [ ] Subject: `CognoDB Assignment 2 – <Your Name>`
-   [ ] Send to: `hr@wexa.ai`

Keep the CognoDB instance running until Wexa responds.

------------------------------------------------------------------------

# 53. Final Pre-Submission Technical Verification

Run through these manually.

## Graph verification

Confirm:

``` text
User
 → CONNECTED_TO
Friend
 → VISITED / RECOMMENDED
Place
 → LOCATED_IN
Area
 → NEAR
Area
```

Confirm the multi-hop query works.

## Recommendation verification

Confirm:

-   user-specific recommendations differ
-   For You prioritizes personal relevance
-   Friends prioritizes direct social evidence
-   Discover surfaces broader exploration
-   nearby activity is described indirectly
-   explanations correspond to actual graph evidence

## Mutation verification

Confirm:

``` text
Save    → SAVED
Visit   → VISITED
Recommend → RECOMMENDED
```

Confirm the three relationships can coexist.

## API verification

Confirm:

``` text
GET  /api/recommendations
POST /api/places/action
```

Do not mix the two routes.

## Security verification

Confirm:

-   no CognoDB credentials in source
-   no credentials in client code
-   environment variables are used
-   no string-concatenated Cypher

## UI verification

Confirm:

-   no percentage match badge
-   no "How was this ranked?" button
-   no fake search
-   loading state
-   empty state
-   error state
-   readable cards
-   map and list proportions
-   responsive behavior

------------------------------------------------------------------------

# 54. Golden Rules for Future Changes

The MVP is functional and locked.

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

These are the stable foundation.

Before any backend change:

1.  inspect the current implementation
2.  understand the existing contract
3.  identify the concrete problem
4.  make the smallest change
5.  test the affected flow
6.  test recommendations again
7.  verify graph mutations
8.  verify UI behavior

Do not rewrite working architecture simply because another
implementation looks cleaner.

------------------------------------------------------------------------

# 55. Rules for Coding Agents / Codex

When continuing this project with an AI coding assistant:

1.  **First inspect the existing repository.**
2.  Preserve working code.
3.  Do not invent duplicate API routes.
4.  Do not invent duplicate database clients.
5.  Do not invent duplicate data models.
6.  Do not rewrite the recommendation query unless explicitly required.
7.  Do not replace the current MapLibre/OpenFreeMap foundation without a
    concrete failure.
8.  Do not hardcode place coordinates into UI components when
    coordinates already come from the API.
9.  Keep map state and recommendation state synchronized through
    `selectedPlace`.
10. Keep database credentials in environment variables.
11. Use API/server code for database writes.
12. Never expose CognoDB credentials to the browser.
13. After each implementation layer, run the app and test before moving
    on.
14. Prefer small components over turning `page.tsx` into one huge file.
15. If an exact Cypher/scoring behavior is unclear, inspect the actual
    source code.
16. Never invent missing implementation details.
17. Preserve the stable recommendation architecture.
18. Treat this document as the project context, but treat the actual
    repository as the source of truth for exact code behavior.

------------------------------------------------------------------------

# 56. Engineering Lessons Worth Remembering for Interviews

These are useful stories but should not dominate the demo.

## Lesson 1 --- Graph modeling is a product decision

The graph was selected because the recommendation question is
relationship-heavy.

## Lesson 2 --- Direct and indirect evidence must remain semantically distinct

``` text
Friend visited exact place
```

is different from:

``` text
Friend visited nearby area
```

## Lesson 3 --- Naive additive scoring does not scale

Raw friend counts can dominate a score.

Solution:

-   category maxima
-   saturation
-   normalization

## Lesson 4 --- Stable query beats risky optimization before deadline

A query that takes \~9 seconds is preferable to an optimization that
turns into a 66--67 second timeout.

## Lesson 5 --- UI should explain causes, not just expose a number

The percentage score was removed.

Reasons and graph evidence are more useful.

## Lesson 6 --- Framework behavior matters

MapLibre owns marker transforms.

Do not override them.

## Lesson 7 --- API contracts matter

Cypher return fields and TypeScript `record.get()` fields must stay
synchronized.

## Lesson 8 --- Mutations and recommendation candidate generation can be decoupled

The Visit → remove-from-recommendations behavior was intentionally
reverted after it caused empty results.

------------------------------------------------------------------------

# 57. Current Known Data Examples

Representative seeded places:

## Cafe One

``` text
id: p1
name: Cafe One
description: Quiet coffee spot with a relaxed atmosphere.
latitude: 12.9116
longitude: 77.6389
rating: 4.5
priceLevel: 2
```

Example reasons:

``` text
Matches your Coffee interest
Matches your Quiet interest
Rahul visited this place
Rahul recommended this place
```

## Cafe Two

``` text
id: p2
name: Cafe Two
description: Aesthetic cafe with outdoor seating.
latitude: 12.914
longitude: 77.640
rating: 4.3
priceLevel: 2
```

Example reasons:

``` text
Matches your Coffee interest
Matches your Aesthetic interest
Priya visited this place
Priya recommended this place
```

## Japanese House

``` text
id: p3
name: Japanese House
description: Cozy Japanese restaurant.
latitude: 12.910
longitude: 77.635
rating: 4.6
priceLevel: 3
```

Example:

``` text
Rahul visited this place
```

These examples are useful for demos and interview explanations.

------------------------------------------------------------------------

# 58. Source-of-Truth Hierarchy

When information conflicts between older documents, use this order:

## 1. Actual current repository/code

For exact implementation details.

## 2. This document

For the canonical current product, architecture, assessment and demo
narrative.

## 3. Older master/handoff documents

Use them for history and debugging context, but do not assume their
"planned" or "not implemented" sections describe the current state.

This matters because older handoff documents were created at earlier
implementation stages.

For example, an older handoff may say:

``` text
Database-driven map markers — not yet implemented
```

while the current MVP now has:

``` text
Database-driven map markers — implemented
```

The current project state wins.

------------------------------------------------------------------------

# 59. What Must Never Be Claimed

Never claim:

-   SQL/NoSQL cannot build this
-   the social data is real user behavior
-   production authentication exists
-   GPS automatically records visits
-   AI ranking exists
-   ML ranking exists
-   recommendation latency is production-grade
-   the percentage match is shown
-   "How was this ranked?" exists
-   nearby activity means direct visitation
-   the explanation graph is the full database graph
-   the 100-point score is an arbitrary post-hoc cap
-   all geographic coverage is production-scale
-   the app is a Google Maps replacement
-   the app is a complete social network

Honesty is part of the technical story.

------------------------------------------------------------------------

# 60. What Makes This Submission Strong

The project is strongest when the evaluator can see all of these in one
coherent loop:

``` text
REAL PLACE DATA
       ↓
CLEAR GRAPH MODEL
       ↓
MULTI-HOP CYPHER
       ↓
GRAPH-DERIVED SIGNALS
       ↓
MODE-SPECIFIC SCORING
       ↓
EXPLAINABLE RECOMMENDATION
       ↓
MAP-FIRST UX
       ↓
USER ACTION
       ↓
GRAPH MUTATION
       ↓
DIFFERENT FUTURE CONTEXT
```

This directly demonstrates the capabilities the assessment is trying to
evaluate.

------------------------------------------------------------------------

# 61. Final Project Summary

> **Explore is a map-first local discovery application powered by a
> social graph. Real places are connected to geographic areas, while
> users are connected to friends, interests, visits, recommendations and
> saves. When a user explores an area, Cypher retrieves
> relationship-derived signals such as matching interests, friends who
> visited the exact place, friends who recommended it, and friends
> active in nearby areas. TypeScript converts those signals into a
> bounded 100-point score whose weighting changes between For You,
> Friends and Discover. The system then explains recommendations in
> human terms and exposes the relevant graph relationships visually.
> User actions mutate the graph, creating the possibility for one user's
> behavior to become another user's future recommendation context.**

------------------------------------------------------------------------

# 62. Final State --- LOCKED

## Product

**Explore --- Graph-Based Local Discovery**

## Thesis

Map-first discovery using:

-   geography
-   interests
-   social relationships
-   graph traversal
-   explainable recommendations

## Database

**CognoDB**

## Driver

**neo4j-driver**

## Frontend

**Next.js + TypeScript + Tailwind**

## Map

**MapLibre GL JS + OpenFreeMap Liberty**

## Data

``` text
834 real OSM places
10 users
26 connections
2213 visits
730 recommendations
629 saves
2 geographic areas
```

## Recommendation modes

``` text
For You
Friends
Discover
```

## Actions

``` text
Save
Visit
Recommend
```

## Core graph

``` text
User
 ↓
Friend
 ↓
Place
 ↓
Area
 ↓
Nearby Area
```

## Explainability

``` text
Reasons
+
Focused explanation graph
```

## Assessment strengths

``` text
Working graph-backed app
Genuine multi-hop traversal
Real place data
Clear graph model
Explainable recommendations
Map-first UX
End-to-end graph mutations
Honest graph justification
README
Hosted demo
Short recording
```

## Current phase

``` text
MVP
 ↓
UI polish
 ↓
README finalization
 ↓
Deployment
 ↓
Demo recording
 ↓
Submission
```

------------------------------------------------------------------------

# 63. FINAL GOLDEN RULE

**We are close. Do not expand the product now.**

The remaining work should primarily be:

``` text
UI polish
README
Hosted deployment
Demo verification
Screen recording
Submission
```

Only return to backend architecture if a **real bug** is discovered.

The project's strongest story is already complete:

> **The graph is not decorative storage. It is the relationship layer
> that makes the recommendation context meaningful and explainable.**
> ---

# 64. Implementation-Fidelity Addendum --- Important for Claude / Coding Agents

This section exists because the master document is a **project
narrative**, while the repository is the **exact implementation source
of truth**. Claude should use this section to understand the current
code contracts without assuming that older planning documents are
current.

## 64.1 Current recommendation architecture --- exact responsibility split

The current implementation is:

``` text
CognoDB / Cypher
    ↓
graph-derived signals
    ↓
TypeScript calculateScore()
    ↓
scoreBreakdown
    ↓
buildReasons()
    ↓
sort by score DESC, rating DESC
    ↓
slice top 50
    ↓
JSON API
    ↓
frontend progressively displays 5 at a time
```

**Important correction to older project history:**

Older versions of the recommendation query calculated a raw score in
Cypher. That is **not the current architecture**.

The current architecture keeps scoring in TypeScript.

The current Cypher query returns graph facts/signals.

Claude should not resurrect the older Cypher-side scoring model.

------------------------------------------------------------------------

# 65. Exact Current Scoring Behavior

The canonical `calculateScore()` implementation has three supporting
functions.

## 65.1 `saturatedScore()`

``` text
count <= 0 → 0
count == 1 → maxPoints × 0.6
count == 2 → maxPoints × 0.8
count >= 3 → maxPoints
```

This is a **stepwise saturation function**, not a linear function.

Examples:

``` text
max = 25

0 friends → 0
1 friend  → 15
2 friends → 20
3+        → 25
```

## 65.2 `interestScore()`

``` text
if matchedCount <= 0:
    0

if totalUserInterests <= 0:
    0

otherwise:

min(
    matchedCount / totalUserInterests,
    1
) × maxPoints
```

This means:

``` text
2 matched / 4 total
= 50% of category maximum

3 matched / 4 total
= 75% of category maximum

4 matched / 4 total
= 100% of category maximum

5 matched / 4 total
= still 100%
```

The zero-interest guard is important because division by zero must never
occur.

## 65.3 `qualityScore()`

Rating is expected on a 0--5 scale.

``` text
if rating <= 0:
    0

otherwise:

clamp rating to [0, 5]
divide by 5
multiply by category maximum
```

Therefore a rating above 5 is safely clamped.

Example:

``` text
rating = 4.5
max = 5

4.5 / 5 × 5
= 4.5
```

For Discover:

``` text
rating = 4.5
max = 35

4.5 / 5 × 35
= 31.5
```

------------------------------------------------------------------------

# 66. Exact Score Rounding

The internal category values and total are rounded to **one decimal
place** in `ScoreBreakdown`.

``` text
interests
friendVisits
friendRecommendations
nearbyActivity
quality
exploration
total
```

are all returned as numeric values rounded to one decimal.

The implementation therefore preserves useful precision for debugging
and explanation while keeping the score bounded.

------------------------------------------------------------------------

# 67. Score vs Display Score --- Important Distinction

The current API contains both:

``` text
score
displayScore
scoreBreakdown
```

### `score`

The actual bounded recommendation total:

``` text
0–100
```

with one decimal precision.

### `displayScore`

A rounded/clamped integer derived from the total:

``` text
Math.round(
    clamp(score, 0, 100)
)
```

### `scoreBreakdown`

The complete category-level internal breakdown.

**Current UI decision:**

The percentage-match/score badge was removed.

Therefore:

> The existence of `displayScore` in the API does NOT mean the UI should
> display a percentage match.

Do not remove or redesign the internal API field merely because the UI
badge was removed unless the actual current repository requires it.

------------------------------------------------------------------------

# 68. Exact Ranking Order

The API:

1.  scores every returned candidate
2.  sorts all candidates
3.  uses recommendation score descending as the primary order
4.  uses place rating descending as a tie-breaker
5.  keeps the first 50

Conceptually:

``` text
sort:
    higher score first

if scores equal:
    higher rating first

then:
    top 50
```

This is important.

**Rating is not an independent primary recommendation signal after
scoring.**

It is the tie-breaker in final ordering, while rating can also
contribute to the `quality` score depending on mode.

------------------------------------------------------------------------

# 69. Exact Recommendation API Contract

## Endpoint

``` text
GET /api/recommendations
```

## Required query parameters

``` text
userId
areaId
```

## Optional query parameter

``` text
mode
```

Default:

``` text
for-you
```

Valid values:

``` text
for-you
friends
discover
```

Invalid mode:

``` text
HTTP 400
{
  "error": "Invalid recommendation mode"
}
```

Missing `userId` or `areaId`:

``` text
HTTP 400
{
  "error": "userId and areaId are required"
}
```

Database/recommendation failure:

``` text
HTTP 500
{
  "error": "Failed to load recommendations"
}
```

## Example

``` text
/api/recommendations?userId=u1&areaId=area1&mode=for-you
```

------------------------------------------------------------------------

# 70. Recommendation Response Shape

Each recommendation currently contains the equivalent of:

``` text
id
name
description
latitude
longitude
category
rating
priceLevel
area

score
displayScore
scoreBreakdown

reasons

matchedInterests
visitors
recommenders
nearbyVisitors
nearbyAreas
```

This contract is important because the frontend uses the same
recommendation object for:

-   cards
-   map markers
-   selection
-   place details
-   explanation context
-   progressive rendering

Do not create a second place/recommendation model in the frontend unless
there is a concrete reason.

------------------------------------------------------------------------

# 71. Exact Current Graph Query Behavior

The current recommendation query does **not** calculate the final
recommendation score.

It retrieves:

``` text
matchedInterests
totalUserInterests
visitors
recommenders
nearbyVisitors
nearbyAreas
rating
place metadata
```

## Candidate scope

Candidates are:

``` text
Place
    ↓ LOCATED_IN
selected Area
```

Only places in the selected area are candidates.

## Interest signal

The query finds:

``` text
User
  ↓ LIKES
Interest

Place
  ↓ HAS_ATTRIBUTE
Attribute
```

and computes the intersection:

``` text
userInterests ∩ placeAttributes
```

as:

``` text
matchedInterests
```

It also returns:

``` text
totalUserInterests
```

for normalized scoring.

## Direct visit signal

``` text
User
  ↓ CONNECTED_TO
Friend
  ↓ VISITED
Exact Place
```

Returned as:

``` text
visitors
```

## Direct recommendation signal

``` text
User
  ↓ CONNECTED_TO
Friend
  ↓ RECOMMENDED
Exact Place
```

Returned as:

``` text
recommenders
```

## Nearby signal

``` text
User
  ↓ CONNECTED_TO
Friend
  ↓ VISITED
Place
  ↓ LOCATED_IN
Nearby Area

Selected Area
  ↓ NEAR
Nearby Area
```

Returned as:

``` text
nearbyVisitors
nearbyAreas
```

This is indirect geographic/social context.

------------------------------------------------------------------------

# 72. Current Query Optimization Decision

The stable current query uses smaller independent subqueries for signals
rather than chaining many large `OPTIONAL MATCH` operations together.

The reason:

Older chained `OPTIONAL MATCH` logic could create large intermediate row
combinations before:

``` text
collect(DISTINCT ...)
```

removed duplicates.

The optimized approach calculates signals independently per
candidate/context and preserves the same recommendation semantics.

This is part of the performance history.

Do not replace the current query with the older raw additive Cypher
query.

------------------------------------------------------------------------

# 73. Exact Explanation Rules in Current Code

`buildReasons()` currently creates reasons from the same graph evidence.

## Interest reasons

For every matched interest:

``` text
Matches your <Interest> interest
```

This is currently available across all three modes.

## Direct visit reasons

For every exact-place visitor:

``` text
<Friend> visited this place
```

## Direct recommendation reasons

For every exact-place recommender:

``` text
<Friend> recommended this place
```

## Nearby reason

Nearby context is intentionally shown only when:

``` text
visitors.length === 0
AND
recommenders.length === 0
AND
nearbyVisitors.length > 0
AND
nearbyAreas.length > 0
```

Then the current implementation uses the first nearby area:

``` text
Friends are active in nearby <nearbyAreas[0]>
```

This avoids cluttering every card with the same nearby reason when
direct evidence already exists.

## Discover reason

When:

``` text
mode === "discover"
AND
visitors.length === 0
AND
recommenders.length === 0
```

the implementation adds:

``` text
A new place to explore beyond your direct social graph
```

This is consistent with the Discover exploration bonus.

------------------------------------------------------------------------

# 74. Exact Discover Semantics

The exploration bonus is based on:

``` text
directSocialCount =
    visitors.length +
    recommenders.length
```

It does **not** count nearby activity as direct social evidence.

Therefore:

``` text
nearby activity only
```

can still receive:

``` text
exploration = 15
```

because there is no direct exact-place friend visit/recommendation.

This distinction is important.

------------------------------------------------------------------------

# 75. Current Frontend Recommendation State

The current Explore page maintains:

``` text
mode
recommendations
loading
error
visibleCount
selectedPlaceId
actionLoading
actionStates
```

The initial progressive count is:

``` text
5
```

Visible recommendations are effectively:

``` text
recommendations.slice(0, visibleCount)
```

When a new recommendation request starts, stale results are cleared
immediately:

``` text
recommendations = []
visibleCount = 5
selectedPlaceId = null
```

This prevents stale recommendations from remaining visible while a new
area/mode/user context is loading.

------------------------------------------------------------------------

# 76. Area Loading Rule

The recommendation request should not run until the user has:

``` text
userId
AND
selected area
```

The initial Explore state can therefore show the map/area overview
without immediately firing a recommendation query.

This avoids an unnecessary request before the user has chosen the
discovery context.

------------------------------------------------------------------------

# 77. Selection Contract

The selected place is represented by its ID:

``` text
selectedPlaceId
```

The selected recommendation is derived from the recommendation list.

Conceptually:

``` text
selectedPlace =
    recommendations.find(
        place.id === selectedPlaceId
    )
```

This keeps one canonical selection identity between:

``` text
recommendation card
map marker
place detail
map camera
```

Do not introduce separate independent selected-card and selected-marker
states.

------------------------------------------------------------------------

# 78. What Claude Should Attach / Read

For **understanding the project**, this master document is sufficient
for:

-   product thesis
-   assessment requirements
-   graph model
-   scoring philosophy
-   scoring weights
-   recommendation modes
-   explainability
-   UI decisions
-   demo story
-   engineering history
-   tradeoffs
-   limitations
-   future work
-   submission checklist

However, it is **not sufficient to reproduce or safely modify the exact
implementation by itself**.

For Claude coding work, provide:

### Required

1.  **This master reference**
2.  **The current repository/source code**

### Especially important source files

``` text
src/lib/queries.ts
src/lib/recommendations.ts
src/lib/db.ts

src/app/api/recommendations/route.ts
src/app/api/places/action/route.ts

src/app/explore/page.tsx
src/components/ExploreMap.tsx

scripts/seed-social.ts
scripts/import-osm.ts
scripts/ingest-osm.ts
```

Also provide:

``` text
package.json
README.md
.env.example
```

but **never provide actual secret values**.

The master document tells Claude **why** the system is structured this
way.

The repository tells Claude **exactly how** it is currently implemented.

Both together are the correct handoff.

------------------------------------------------------------------------

# 79. Current Implementation vs Historical Artifacts

There are older files in the project history with names/versions such
as:

``` text
queries(1).ts
queries(2).ts
queries(3).ts
queries(4).ts
queries(5).ts
recommendations-fixed.ts
route-fixed.ts
Explore_page_final_v3.tsx
Explore_page_final_v5.tsx
Explore_page_final_v6.tsx
```

These are useful historical evidence, but Claude should **not** assume
that every similarly named file is current.

The repository's actual imported/current files take precedence.

Particularly important:

-   older query versions contained raw Cypher-side scoring
-   one older query excluded visited places
-   one older implementation exposed UI score/"How" behavior that was
    later removed

Do not mix those historical versions into the current architecture.

------------------------------------------------------------------------

# 80. One Important Documentation Improvement Still Needed

The master reference is now strong as a **canonical project narrative**,
but the final README should eventually include the **actual current
representative Cypher query**, not merely a conceptual traversal
diagram.

The README should show enough of the real query to demonstrate:

``` text
$userId
$areaId
User → Friend → Place
Place → Area
Area → NEAR → Area
User → Interest
Place → Attribute
```

while keeping the README readable.

The exact full query remains in the repository.

This matters because the Wexa assignment explicitly asks for the main
queries to be explained.

------------------------------------------------------------------------

# 81. Claude Handoff Prompt

When giving this project to Claude, use this context:

> You are continuing an existing project called **Explore ---
> Graph-Based Local Discovery**, built for the Wexa AI CognoDB take-home
> assessment.
>
> Read the attached **Explore Master Project Reference** completely
> before making changes.
>
> The project is a **functional, locked MVP**. Do not redesign the
> recommendation architecture.
>
> The product is a map-first local discovery application using:
>
> -   Next.js
> -   TypeScript
> -   Tailwind
> -   MapLibre
> -   OpenFreeMap
> -   CognoDB / Neo4j-compatible Cypher
> -   official `neo4j-driver`
>
> The graph contains users, interests, places, attributes, categories
> and areas connected by typed relationships.
>
> The recommendation architecture is:
>
> ``` text
> Cypher → graph signals → TypeScript scoring → explanations → sort → top 50 → frontend
> ```
>
> **Cypher does not calculate the current final recommendation score.**
>
> The current scoring system is a bounded 100-point model with
> mode-specific category maxima:
>
> ``` text
> For You:
>   interests 35
>   friend visits 25
>   friend recommendations 25
>   nearby activity 10
>   quality 5
>
> Friends:
>   friend visits 35
>   friend recommendations 35
>   interests 10
>   nearby activity 15
>   quality 5
>
> Discover:
>   quality 35
>   interests 25
>   nearby activity 15
>   friend visits 5
>   friend recommendations 5
>   exploration 15
> ```
>
> Social counts saturate:
>
> ``` text
> 0 → 0%
> 1 → 60%
> 2 → 80%
> 3+ → 100%
> ```
>
> Interest matching is normalized against the user's total interests.
>
> Rating is normalized from 0--5 into the quality category.
>
> Discover exploration:
>
> ``` text
> directSocialCount = visitors + recommenders
> 0 → 15
> 1 → 8
> 2+ → 0
> ```
>
> Scores are rounded to one decimal internally.
>
> Ranking:
>
> ``` text
> score DESC
> rating DESC as tie-break
> top 50
> ```
>
> The frontend initially displays 5 and progressively exposes more.
>
> The percentage-match UI was removed.
>
> The "How was this ranked?" UI was removed.
>
> The focused explanation graph remains the explanation surface.
>
> Nearby activity is **indirect context** and must never be described as
> a friend visiting the recommended place.
>
> Save, Visit and Recommend are independent graph mutations.
>
> A previous attempt to exclude visited places caused empty
> recommendations and was reverted. Do not reintroduce that behavior
> without a deliberate new requirement and regression testing.
>
> The stable recommendation query takes roughly 9 seconds locally. A
> tested optimization reached roughly 66--67 seconds/timeouts, so
> performance work is deferred.
>
> **First inspect the repository. Do not invent files, routes, schema or
> scoring behavior.**
>
> If the master document and code disagree on exact implementation
> details, inspect the current repository and determine which code is
> actually active before changing anything.
>
> The current goal is not to expand the MVP. The remaining work is
> primarily UI polish, README, deployment, demo and submission.

------------------------------------------------------------------------

# 82. Brutal Completeness Assessment

After re-checking the assignment, canonical reference, README draft,
scoring implementation, recommendation route and current query
artifacts:

## Product understanding

**Complete.**

## Assessment requirements

**Complete.**

## Graph model

**Complete.**

## Recommendation philosophy

**Complete.**

## Exact scoring weights

**Complete.**

## Exact scoring mechanics

**Now documented explicitly.**

## Ranking/tie-break behavior

**Now documented explicitly.**

## API contract

**Now documented explicitly.**

## Explanation behavior

**Now documented explicitly.**

## Current Cypher responsibility

**Now documented explicitly.**

## Historical implementation conflicts

**Now explicitly called out.**

## Claude handoff

**Now sufficient at the architecture + behavior level.**

## Exact code reproducibility

**Requires the repository.**

That last distinction is important.

A master document should explain the system.

It should **not pretend to replace the source code**.

------------------------------------------------------------------------

# 83. Final Recommendation for Claude

Give Claude **both**:

``` text
Explore_Master_Project_Reference_FINAL_V2.md
+
current repository
```

Do **not** give Claude only the master document if you are asking it to
modify code.

The master document answers:

``` text
What are we building?
Why did we build it this way?
What decisions are locked?
What behavior is intentional?
What should not be changed?
What happened during development?
What does the assessment require?
How should this be explained?
```

The repository answers:

``` text
What code is actually running?
What are the exact imports?
What are the current file names?
What are the exact Cypher queries?
What is the current UI implementation?
What are the exact API contracts?
```

That combination is the safest handoff.

------------------------------------------------------------------------

# 84. Final Golden Rule for the Master Reference

This document is now a **canonical behavioral and decision reference**,
not a replacement for the repository.

If Claude ever says:

> "The document says X, so I'll implement X"

the correct next step is:

> **Check whether the current repository already implements X and
> preserve it unless there is a concrete reason to change it.**

That rule prevents the biggest failure mode when handing an
almost-finished project to another coding agent. ---

# 85. Assignment Source Nuance --- Hosted Demo / Recording

One wording inconsistency exists inside the supplied Wexa assignment PDF
and should be preserved rather than silently "fixed."

The opening page says:

``` text
Deliverable: A GitHub repository URL
(hosted demo link optional but encouraged)
```

However, the later **Deliverables** section explicitly says:

``` text
Mandatory: a hosted application demo link
and a short screen recording.
```

The later submission section also asks for the repository URL and says
to include the demo link if available.

For this project, treat the **specific later Deliverables section as
authoritative for submission planning**:

``` text
GitHub repository
+
hosted application demo
+
short screen recording
```

This is why the project checklist treats the hosted demo and recording
as required.

Do not omit the hosted deployment or recording on the assumption that
the opening-page wording makes them optional.

------------------------------------------------------------------------

# 86. Final Source-of-Truth Hierarchy

When sources disagree, use this order:

``` text
1. Actual current repository code
       ↓
2. Explicit current implementation decisions in this master reference
       ↓
3. Wexa assignment requirements
       ↓
4. Historical project artifacts / old source files
```

With one qualification:

**Assignment requirements control what must be submitted; repository
code controls what the current implementation actually does.**

Therefore:

-   never change working code merely because the README/reference is
    phrased differently;
-   never document an old implementation as current;
-   never claim an assignment requirement is satisfied without checking
    the actual application;
-   never infer exact code behavior from the conceptual diagrams when
    the source is available.

------------------------------------------------------------------------

# 87. Final Pre-Claude Sanity Check

Before handing this to Claude, the project context now covers all five
layers:

### Product

``` text
What Explore is
Why it exists
Who/what it helps
What the core loop is
What is intentionally out of scope
```

### Graph / backend

``` text
Node model
Relationship model
Multi-hop traversal
Direct vs indirect signals
Cypher responsibility
TypeScript responsibility
Scoring mechanics
Ranking
Mutation model
API contracts
```

### Frontend

``` text
Map-first UX
Recommendation modes
Selection synchronization
Progressive loading
Loading/error/empty behavior
Removed UI elements
User/area/mode flow
```

### Assessment / submission

``` text
Wexa requirements
README requirements
Hosted deployment
Recording
Repository contents
Environment/secrets
Seed/data requirements
Final verification
```

### Agent handoff

``` text
Current-vs-historical source distinction
Repository-first rule
Stable architecture
Forbidden accidental regressions
Required files for Claude
Claude handoff prompt
```

There is no remaining **known project-context gap that would materially
prevent Claude from understanding the intended system**.

The only thing the document deliberately does not replace is the actual
source repository, because exact code behavior must come from the
repository itself.
