import { NextRequest, NextResponse } from "next/server";
import { driver } from "@/lib/db";
import { recommendationQuery } from "@/lib/queries";
import {
    buildReasons,
    displayScore,
    type RecommendationMode,
} from "@/lib/recommendations";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");
    const areaId = searchParams.get("areaId");

    // ==================================================
    // RECOMMENDATION MODE
    //
    // for-you  -> personalized
    // friends  -> social graph focused
    // discover -> broader exploration
    // ==================================================

    const mode =
        (searchParams.get("mode") || "for-you") as RecommendationMode;

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
        const result =
            await driver.executeQuery(
                recommendationQuery,
                {
                    userId,
                    areaId,
                }
            );

        const recommendations =
            result.records.map((record) => {
                const matchedInterests =
                    record.get(
                        "matchedInterests"
                    ) || [];

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
                    record.get("rating") || 0;

                // ==================================================
                // MODE-SPECIFIC RANKING
                //
                // Same graph signals.
                // Different importance by mode.
                // ==================================================

                let score = 0;

                if (mode === "for-you") {
                    score =
                        matchedInterests.length *
                        25 +
                        visitors.length * 25 +
                        recommenders.length *
                        25 +
                        nearbyVisitors.length *
                        15;
                }

                if (mode === "friends") {
                    score =
                        visitors.length * 40 +
                        recommenders.length *
                        40 +
                        nearbyVisitors.length *
                        20 +
                        matchedInterests.length *
                        5;
                }

                if (mode === "discover") {
                    score =
                        Number(rating || 0) *
                        20 +
                        nearbyVisitors.length *
                        5 +
                        matchedInterests.length *
                        5;
                }

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
                    name: record.get("name"),
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
                    rating:
                        record.get(
                            "rating"
                        ),
                    priceLevel:
                        record.get(
                            "priceLevel"
                        ),

                    score,

                    displayScore:
                        displayScore(score),

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
        // ==================================================

        recommendations.sort(
            (a, b) =>
                b.score - a.score
        );

        // ==================================================
        // TOP RESULTS
        //
        // Score everything first, then rank, then take
        // the best results.
        // ==================================================

        const topRecommendations =
            recommendations.slice(0, 50);

        // Discover should always have enough places
        // for exploration.
        if (mode === "discover") {
            while (
                topRecommendations.length <
                10 &&
                recommendations.length > 0
            ) {
                const next =
                    recommendations.pop();

                if (!next) break;

                topRecommendations.push(
                    next
                );
            }
        }

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