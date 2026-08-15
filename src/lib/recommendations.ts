/*
  Recommendation scoring

  The recommendation engine uses a bounded 100-point model.

  IMPORTANT:
  100 is the TOTAL available score, not a cap applied after
  calculating an arbitrary raw score.

  Each signal category has a maximum contribution. This prevents
  high-cardinality signals (for example, a user having many friends)
  from overwhelming the rest of the recommendation model.
*/

export type RecommendationMode =
    | "for-you"
    | "friends"
    | "discover";

export type ScoreBreakdown = {
    interests: number;
    friendVisits: number;
    friendRecommendations: number;
    nearbyActivity: number;
    quality: number;
    exploration: number;
    total: number;
};

// --------------------------------------------------
// Saturated / bounded social signal
//
// 0 friends -> 0
// 1 friend  -> 60% of category
// 2 friends -> 80%
// 3+        -> 100%
//
// This means having 1000 friends does not produce
// 1000x the score.
// --------------------------------------------------
function saturatedScore(
    count: number,
    maxPoints: number
) {
    if (count <= 0) return 0;
    if (count === 1) return maxPoints * 0.6;
    if (count === 2) return maxPoints * 0.8;

    return maxPoints;
}

// --------------------------------------------------
// Interest signal
//
// We compare matched interests against the user's
// total interests. This gives the category a bounded
// maximum regardless of how many interests the user has.
// --------------------------------------------------
function interestScore(
    matchedCount: number,
    totalUserInterests: number,
    maxPoints: number
) {
    if (matchedCount <= 0 || totalUserInterests <= 0) {
        return 0;
    }

    return Math.min(
        matchedCount / totalUserInterests,
        1
    ) * maxPoints;
}

// --------------------------------------------------
// Place quality
//
// Rating is 0-5 and maps directly into the category cap.
// --------------------------------------------------
function qualityScore(
    rating: number,
    maxPoints: number
) {
    if (!rating || rating <= 0) return 0;

    return (
        Math.min(Math.max(rating, 0), 5) / 5
    ) * maxPoints;
}

// --------------------------------------------------
// Calculate the final 100-point score.
//
// The mode changes the allocation of the 100 available
// points, not the existence of the underlying graph signals.
// --------------------------------------------------
export function calculateScore(
    mode: RecommendationMode,
    matchedInterests: string[],
    totalUserInterests: number,
    visitors: string[],
    recommenders: string[],
    nearbyVisitors: string[],
    rating: number
): ScoreBreakdown {
    let interests = 0;
    let friendVisits = 0;
    let friendRecommendations = 0;
    let nearbyActivity = 0;
    let quality = 0;
    let exploration = 0;

    if (mode === "for-you") {
        // ----------------------------------------------
        // FOR YOU — personalization focused
        // ----------------------------------------------
        interests = interestScore(
            matchedInterests.length,
            totalUserInterests,
            35
        );

        friendVisits = saturatedScore(
            visitors.length,
            25
        );

        friendRecommendations = saturatedScore(
            recommenders.length,
            25
        );

        nearbyActivity = saturatedScore(
            nearbyVisitors.length,
            10
        );

        quality = qualityScore(rating, 5);
    }

    if (mode === "friends") {
        // ----------------------------------------------
        // FRIENDS — social graph focused
        // ----------------------------------------------
        friendVisits = saturatedScore(
            visitors.length,
            35
        );

        friendRecommendations = saturatedScore(
            recommenders.length,
            35
        );

        interests = interestScore(
            matchedInterests.length,
            totalUserInterests,
            10
        );

        nearbyActivity = saturatedScore(
            nearbyVisitors.length,
            15
        );

        quality = qualityScore(rating, 5);
    }

    if (mode === "discover") {
        // ----------------------------------------------
        // DISCOVER — quality + exploration focused
        //
        // Exploration bonus means the place is not already
        // strongly represented in the user's direct social
        // graph. It is a small bonus, not a recommendation
        // by itself.
        // ----------------------------------------------
        quality = qualityScore(rating, 35);

        interests = interestScore(
            matchedInterests.length,
            totalUserInterests,
            25
        );

        nearbyActivity = saturatedScore(
            nearbyVisitors.length,
            15
        );

        friendVisits = saturatedScore(
            visitors.length,
            5
        );

        friendRecommendations = saturatedScore(
            recommenders.length,
            5
        );

        const directSocialCount =
            visitors.length +
            recommenders.length;

        if (directSocialCount === 0) {
            exploration = 15;
        } else if (directSocialCount === 1) {
            exploration = 8;
        }
    }

    const total =
        interests +
        friendVisits +
        friendRecommendations +
        nearbyActivity +
        quality +
        exploration;

    return {
        interests: Number(interests.toFixed(1)),
        friendVisits: Number(friendVisits.toFixed(1)),
        friendRecommendations: Number(
            friendRecommendations.toFixed(1)
        ),
        nearbyActivity: Number(
            nearbyActivity.toFixed(1)
        ),
        quality: Number(quality.toFixed(1)),
        exploration: Number(
            exploration.toFixed(1)
        ),
        total: Number(total.toFixed(1)),
    };
}

// --------------------------------------------------
// Build explanations that match the recommendation mode.
//
// IMPORTANT:
// Nearby activity is INDIRECT context.
// We never describe it as if a friend visited the
// recommended place itself.
// --------------------------------------------------
export function buildReasons(
    mode: RecommendationMode,
    matchedInterests: string[],
    visitors: string[],
    recommenders: string[],
    nearbyVisitors: string[],
    nearbyAreas: string[]
) {
    const reasons: string[] = [];

    // Direct interest relationship
    if (
        mode === "for-you" ||
        mode === "discover" ||
        mode === "friends"
    ) {
        matchedInterests.forEach((interest) => {
            reasons.push(
                `Matches your ${interest} interest`
            );
        });
    }

    // Direct place relationships
    visitors.forEach((friend) => {
        reasons.push(
            `${friend} visited this place`
        );
    });

    recommenders.forEach((friend) => {
        reasons.push(
            `${friend} recommended this place`
        );
    });

    // Nearby activity is intentionally presented as
    // CONTEXT, not as direct evidence about this place.
    //
    // We only show it when there is no direct friend
    // activity for this particular place. This avoids
    // cluttering every card with the same nearby reason.
    if (
        visitors.length === 0 &&
        recommenders.length === 0 &&
        nearbyVisitors.length > 0 &&
        nearbyAreas.length > 0
    ) {
        reasons.push(
            `Friends are active in nearby ${nearbyAreas[0]}`
        );
    }

    // Discover-specific explanation
    if (
        mode === "discover" &&
        visitors.length === 0 &&
        recommenders.length === 0
    ) {
        reasons.push(
            "A new place to explore beyond your direct social graph"
        );
    }

    return reasons;
}

// --------------------------------------------------
// UI score
//
// No arbitrary cap is needed anymore.
// The score is already constructed to be <= 100.
// --------------------------------------------------
export function displayScore(score: number) {
    return Math.round(
        Math.min(Math.max(score, 0), 100)
    );
}