/*
==================================================
GRAPH RECOMMENDATION QUERY

IMPORTANT ARCHITECTURE

Cypher:
    Finds graph relationships/signals

TypeScript:
    Calculates recommendation score
    Applies mode-specific weights
    Builds explanations
    Sorts recommendations

DIRECT SOCIAL SIGNAL:
User
 ↓ CONNECTED_TO
Friend
 ↓ VISITED
THIS Place

DIRECT RECOMMENDATION:
User
 ↓ CONNECTED_TO
Friend
 ↓ RECOMMENDED
THIS Place

INDIRECT GEOGRAPHIC SIGNAL:
User
 ↓ CONNECTED_TO
Friend
 ↓ VISITED
Place
 ↓ LOCATED_IN
Nearby Area
        ↑
       NEAR
        ↓
Selected Area

The nearby signal is contextual.
It does NOT mean the friend visited the
recommended place itself.
==================================================
*/

export const recommendationQuery = `
MATCH (u:User {id: $userId})

MATCH (selectedArea:Area {id: $areaId})


// ==================================================
// USER-LEVEL CONTEXT
//
// Calculate these once per request.
// They do not depend on the individual place.
// ==================================================

OPTIONAL MATCH (u)-[:LIKES]->(userInterest:Interest)

WITH
    u,
    selectedArea,
    collect(DISTINCT userInterest.name) AS userInterests

OPTIONAL MATCH (u)-[:CONNECTED_TO]->(userFriend:User)

WITH
    u,
    selectedArea,
    userInterests,
    collect(DISTINCT userFriend.name) AS friendNames


// ==================================================
// PLACES IN SELECTED AREA
// ==================================================

MATCH (p:Place)-[:LOCATED_IN]->(area:Area)

WHERE area = selectedArea


// ==================================================
// 1. USER INTERESTS ↔ PLACE ATTRIBUTES
// ==================================================

OPTIONAL MATCH (p)-[:HAS_ATTRIBUTE]->(attribute:Attribute)

WITH
    u,
    p,
    area,
    selectedArea,
    userInterests,
    friendNames,

    collect(DISTINCT attribute.name)
        AS placeAttributes

WITH
    u,
    p,
    area,
    selectedArea,
    userInterests,
    friendNames,
    placeAttributes,

    [
        x IN userInterests
        WHERE x IN placeAttributes
    ] AS matchedInterests


// ==================================================
// 2. DIRECT FRIEND VISITS
//
// Friend visited THIS exact place.
// ==================================================

OPTIONAL MATCH
    (u)-[:CONNECTED_TO]->(friend:User)
    -[:VISITED]->(p)

WITH
    u,
    p,
    area,
    selectedArea,
    userInterests,
    friendNames,
    matchedInterests,

    collect(DISTINCT friend.name)
        AS visitors


// ==================================================
// 3. DIRECT FRIEND RECOMMENDATIONS
//
// Friend recommended THIS exact place.
// ==================================================

OPTIONAL MATCH
    (u)-[:CONNECTED_TO]->(friend2:User)
    -[:RECOMMENDED]->(p)

WITH
    u,
    p,
    area,
    selectedArea,
    userInterests,
    friendNames,
    matchedInterests,
    visitors,

    collect(DISTINCT friend2.name)
        AS recommenders


// ==================================================
// 4. NEARBY SOCIAL ACTIVITY
//
// This is an INDIRECT geographic signal.
//
// Friend visited a place in an area near the
// selected area.
//
// It is intentionally separate from direct
// place-level activity.
// ==================================================

OPTIONAL MATCH
    (u)-[:CONNECTED_TO]->(nearbyFriend:User)
    -[:VISITED]->(nearbyPlace:Place)
    -[:LOCATED_IN]->(nearbyArea:Area)

WHERE
    (selectedArea)-[:NEAR]->(nearbyArea)
    AND nearbyArea.id <> $areaId

WITH
    p,
    area,
    matchedInterests,
    userInterests,
    friendNames,
    visitors,
    recommenders,

    collect(DISTINCT nearbyFriend.name)
        AS nearbyVisitors,

    collect(DISTINCT nearbyArea.name)
        AS nearbyAreas


// ==================================================
// RETURN GRAPH SIGNALS
//
// NO SCORE HERE.
//
// TypeScript handles the 100-point model and
// mode-specific scoring.
// ==================================================

RETURN
    p.id AS id,
    p.name AS name,
    p.description AS description,
    p.latitude AS latitude,
    p.longitude AS longitude,
    p.category AS category,
    p.rating AS rating,
    p.priceLevel AS priceLevel,
    area.name AS area,

    matchedInterests,

    size(userInterests)
        AS totalUserInterests,

    size(friendNames)
        AS totalFriends,

    visitors,
    recommenders,

    nearbyVisitors,
    nearbyAreas
`;