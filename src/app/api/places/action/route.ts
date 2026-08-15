import { NextRequest, NextResponse } from "next/server";
import { driver } from "@/lib/db";

type Action =
    | "save"
    | "visit"
    | "recommend";

export async function POST(
    request: NextRequest
) {
    try {
        const body =
            await request.json();

        const userId = body.userId;
        const placeId = body.placeId;
        const action =
            body.action as Action;

        if (
            !userId ||
            !placeId ||
            !action
        ) {
            return NextResponse.json(
                {
                    error:
                        "userId, placeId and action are required",
                },
                { status: 400 }
            );
        }

        if (
            action !== "save" &&
            action !== "visit" &&
            action !== "recommend"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid action",
                },
                { status: 400 }
            );
        }

        const relationship = {
            save: "SAVED",
            visit: "VISITED",
            recommend: "RECOMMENDED",
        }[action];

        const result =
            await driver.executeQuery(
                `
                MATCH (u:User {id: $userId})
                MATCH (p:Place {id: $placeId})

                MERGE (u)-[r:${relationship}]->(p)

                RETURN
                    u.name AS userName,
                    p.name AS placeName
                `,
                {
                    userId,
                    placeId,
                }
            );

        if (
            result.records.length ===
            0
        ) {
            return NextResponse.json(
                {
                    error:
                        "User or place not found",
                },
                { status: 404 }
            );
        }

        const record =
            result.records[0];

        return NextResponse.json({
            success: true,
            action,
            userName:
                record.get(
                    "userName"
                ),
            placeName:
                record.get(
                    "placeName"
                ),
        });
    } catch (error) {
        console.error(
            "Place action error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to update place",
            },
            { status: 500 }
        );
    }
}