import { NextRequest, NextResponse } from "next/server";
import { driver } from "@/lib/db";
import { recommendationQuery } from "@/lib/queries";
import type { RecommendationMode } from "@/lib/recommendations";
import {
    calculateScore,
    buildReasons,
    displayScore,
} from "@/lib/recommendations";

// ==================================================
// RECOMMENDATIONS API
//
// Flow:
//
// CognoDB / Cypher
//       ↓
// Graph relationships
//       ↓
// TypeScript scoring
//       ↓
// Mode-specific 100-point score
//       ↓
// Ranked recommendations
//       ↓
// UI
// ==================================================

export async function GET(request: NextRequest) {
    const { searchParams } =
        new URL(request.url);

    const userId =
        searchParams.get("userId");

    const areaId =
        searchParams.get("areaId");

    // ==================================================
    // RECOMMENDATION MODE
    //
    // for-you  -> personalized
    // friends  -> social graph focused
    // discover -> exploration focused
    // ==================================================

    const mode =
        (searchParams.get("mode") ||
            "for-you") as RecommendationMode;

    if (
        mode !== "for-you" &&
        mode !== "friends" &&
        mode !== "discover"
    ) {
        return NextResponse.json(
            {
                error:
                    "Invalid recommendation mode",
            },
            { status: 400 }
        );
    }

    if (!userId || !areaId) {
        return NextResponse.json(
            {
                error:
                    "userId and areaId are required",
            },
            { status: 400 }
        );
    }

    try {
        // ==================================================
        // GET GRAPH SIGNALS
        // ==================================================

        const result =
            await driver.executeQuery(
                recommendationQuery,
                {
                    userId,
                    areaId,
                }
            );

        // ==================================================
        // SCORE EVERY CANDIDATE
        //
        // We score EVERYTHING first.
        // Then we sort.
        // Then we take the top 50.
        //
        // This prevents an early LIMIT from affecting ranking.
        // ==================================================

        const recommendations =
            result.records.map((record) => {
                const matchedInterests =
                    record.get(
                        "matchedInterests"
                    ) || [];

                const totalUserInterests =
                    Number(
                        record.get(
                            "totalUserInterests"
                        ) || 0
                    );

                const visitors =
                    record.get(
                        "visitors"
                    ) || [];

                const recommenders =
                    record.get(
                        "recommenders"
                    ) || [];

                const nearbyVisitors =
                    record.get(
                        "nearbyVisitors"
                    ) || [];

                const nearbyAreas =
                    record.get(
                        "nearbyAreas"
                    ) || [];

                const rating =
                    Number(
                        record.get(
                            "rating"
                        ) || 0
                    );

                // ==================================================
                // BOUNDED 100-POINT SCORE
                //
                // 100 is the intentional total of the scoring
                // categories, not a cap applied afterward.
                // ==================================================

                const scoreBreakdown =
                    calculateScore(
                        mode,
                        matchedInterests,
                        totalUserInterests,
                        visitors,
                        recommenders,
                        nearbyVisitors,
                        rating
                    );

                const reasons =
                    buildReasons(
                        mode,
                        matchedInterests,
                        visitors,
                        recommenders,
                        nearbyVisitors,
                        nearbyAreas
                    );

                return {
                    id: record.get("id"),

                    name: record.get(
                        "name"
                    ),

                    description:
                        record.get(
                            "description"
                        ),

                    latitude:
                        record.get(
                            "latitude"
                        ),

                    longitude:
                        record.get(
                            "longitude"
                        ),

                    category:
                        record.get(
                            "category"
                        ),

                    rating,

                    priceLevel:
                        record.get(
                            "priceLevel"
                        ),

                    area:
                        record.get(
                            "area"
                        ),

                    // Raw total is already 0-100.
                    score:
                        scoreBreakdown.total,

                    // Rounded percentage for UI.
                    displayScore:
                        displayScore(
                            scoreBreakdown.total
                        ),

                    // Useful for debugging,
                    // README and future explanation UI.
                    scoreBreakdown,

                    reasons,

                    matchedInterests,
                    visitors,
                    recommenders,

                    nearbyVisitors,
                    nearbyAreas,
                };
            });

        // ==================================================
        // RANK
        // Highest recommendation score first.
        //
        // Rating is used only as a tie-breaker.
        // ==================================================

        recommendations.sort(
            (a, b) =>
                b.score - a.score ||
                b.rating - a.rating
        );

        // ==================================================
        // RETURN TOP CANDIDATES
        //
        // Frontend still loads only 5 at a time.
        // API keeps a larger ranked pool available.
        // ==================================================

        const topRecommendations =
            recommendations.slice(0, 50);

        return NextResponse.json(
            topRecommendations
        );
    } catch (error) {
        console.error(
            "Recommendation error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to load recommendations",
            },
            { status: 500 }
        );
    }
}