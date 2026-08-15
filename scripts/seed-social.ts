import "dotenv/config";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
    process.env.COGNO_DB_URI!,
    neo4j.auth.basic(
        process.env.COGNO_DB_USERNAME!,
        process.env.COGNO_DB_PWD!
    )
);

// ==================================================
// 10 SIMULATED USERS
//
// The social graph is intentionally sparse and overlapping.
// This gives us different friend circles instead of making
// every user connected to everyone.
// ==================================================
const users = [
    { id: "u1", name: "Arjun" },
    { id: "u2", name: "Rahul" },
    { id: "u3", name: "Priya" },
    { id: "u4", name: "Aisha" },
    { id: "u5", name: "Karan" },
    { id: "u6", name: "Neha" },
    { id: "u7", name: "Rohan" },
    { id: "u8", name: "Meera" },
    { id: "u9", name: "Vikram" },
    { id: "u10", name: "Sneha" },
];

const interests = [
    { id: "i1", name: "Coffee" },
    { id: "i2", name: "Quiet" },
    { id: "i3", name: "Aesthetic" },
    { id: "i4", name: "Japanese" },
    { id: "i5", name: "Outdoor" },
    { id: "i6", name: "Food" },
];

const attributes = [
    { id: "a1", name: "Coffee" },
    { id: "a2", name: "Quiet" },
    { id: "a3", name: "Aesthetic" },
    { id: "a4", name: "Outdoor" },
    { id: "a5", name: "Food" },
    { id: "a6", name: "Japanese" },
];

const categories = [
    { id: "c1", name: "Cafe" },
    { id: "c2", name: "Restaurant" },
    { id: "c3", name: "Park" },
    { id: "c4", name: "Bakery" },
    { id: "c5", name: "Fast Food" },
    { id: "c6", name: "Bar" },
    { id: "c7", name: "Pub" },
];

// ==================================================
// USER INTEREST PROFILES
//
// Deliberately varied so different users produce
// different recommendation contexts.
// ==================================================
const interestRows = [
    // Arjun
    ["u1", "i1"],
    ["u1", "i2"],
    ["u1", "i3"],

    // Rahul
    ["u2", "i1"],
    ["u2", "i5"],
    ["u2", "i6"],

    // Priya
    ["u3", "i2"],
    ["u3", "i4"],
    ["u3", "i6"],

    // Aisha
    ["u4", "i1"],
    ["u4", "i3"],
    ["u4", "i5"],

    // Karan
    ["u5", "i4"],
    ["u5", "i6"],

    // Neha
    ["u6", "i2"],
    ["u6", "i5"],

    // Rohan
    ["u7", "i1"],
    ["u7", "i6"],

    // Meera
    ["u8", "i3"],
    ["u8", "i5"],

    // Vikram
    ["u9", "i4"],
    ["u9", "i6"],

    // Sneha
    ["u10", "i1"],
    ["u10", "i2"],
];

// ==================================================
// FRIENDSHIP GRAPH
//
// Each pair is represented in both directions because
// CONNECTED_TO is a directed graph relationship.
//
// The graph is intentionally NOT fully connected.
// ==================================================
const friendshipPairs = [
    ["u1", "u2"], // Arjun - Rahul
    ["u1", "u4"], // Arjun - Aisha

    ["u2", "u6"], // Rahul - Neha
    ["u2", "u5"], // Rahul - Karan

    ["u3", "u8"], // Priya - Meera
    ["u3", "u7"], // Priya - Rohan

    ["u4", "u5"], // Aisha - Karan

    ["u5", "u7"], // Karan - Rohan
    ["u5", "u9"], // Karan - Vikram

    ["u6", "u8"], // Neha - Meera

    ["u7", "u9"], // Rohan - Vikram

    ["u4", "u10"], // Aisha - Sneha
    ["u8", "u10"], // Meera - Sneha
];

const friendshipRows = friendshipPairs.flatMap(([a, b]) => [
    [a, b],
    [b, a],
]);

// ==================================================
// PLACE → ATTRIBUTE / CATEGORY
// ==================================================
function getPlaceMapping(category: string) {
    switch (category) {
        case "cafe":
            return { attributeId: "a1", categoryId: "c1" };

        case "restaurant":
            return { attributeId: "a5", categoryId: "c2" };

        case "park":
            return { attributeId: "a4", categoryId: "c3" };

        case "bakery":
            return { attributeId: "a5", categoryId: "c4" };

        case "fast_food":
            return { attributeId: "a5", categoryId: "c5" };

        case "bar":
            return { attributeId: "a3", categoryId: "c6" };

        case "pub":
            return { attributeId: "a3", categoryId: "c7" };

        default:
            return { attributeId: "a5", categoryId: "c2" };
    }
}

// ==================================================
// BEHAVIOUR MODEL
//
// This is seed/demo logic only.
//
// We use deterministic rules rather than Math.random()
// so every seed run produces the same graph.
//
// Important:
// - popular/demo-friendly categories get more activity
// - interest-compatible users are more likely to visit
// - activity is still varied across places
// - no place is manually forced into a ranking position
// ==================================================
const categoryInterestMap: Record<string, string[]> = {
    cafe: ["i1", "i2", "i3"],
    restaurant: ["i4", "i6"],
    park: ["i5"],
    bakery: ["i1", "i6"],
    fast_food: ["i6"],
    bar: ["i3", "i6"],
    pub: ["i3", "i6"],
};

const categoryActivityWeight: Record<string, number> = {
    cafe: 7,
    restaurant: 7,
    bakery: 6,
    park: 5,
    bar: 5,
    pub: 5,
    fast_food: 4,
};

function deterministicValue(
    placeIndex: number,
    userIndex: number,
    salt: number
) {
    return (
        (placeIndex * 37 +
            userIndex * 17 +
            salt * 13) %
        100
    );
}

function shouldVisit(
    placeIndex: number,
    userIndex: number,
    category: string,
    userInterestIds: string[]
) {
    const categoryInterests =
        categoryInterestMap[category] ?? [];

    const interestMatch = categoryInterests.some(
        (interestId) =>
            userInterestIds.includes(interestId)
    );

    const baseWeight =
        categoryActivityWeight[category] ?? 3;

    const value = deterministicValue(
        placeIndex,
        userIndex,
        1
    );

    // Stronger probability for places matching the user's
    // interests, while still allowing discovery outside them.
    if (interestMatch) {
        return value < 25 + baseWeight * 2 + ((placeIndex + userIndex) % 7);
    }

    // Occasional non-interest visits create exploration
    // and prevent the graph from becoming too predictable.
    return value < baseWeight;
}

function shouldRecommend(
    placeIndex: number,
    userIndex: number,
    category: string,
    userInterestIds: string[]
) {
    const categoryInterests =
        categoryInterestMap[category] ?? [];

    const interestMatch = categoryInterests.some(
        (interestId) =>
            userInterestIds.includes(interestId)
    );

    const value = deterministicValue(
        placeIndex,
        userIndex,
        7
    );

    // Recommendations are rarer than visits.
    if (interestMatch) {
        return value < 10 + ((placeIndex + userIndex) % 5);
    }

    return value < 3 + ((placeIndex + userIndex) % 3);
}

function shouldSave(
    placeIndex: number,
    userIndex: number,
    category: string,
    userInterestIds: string[]
) {
    const categoryInterests =
        categoryInterestMap[category] ?? [];

    const interestMatch = categoryInterests.some(
        (interestId) =>
            userInterestIds.includes(interestId)
    );

    const value = deterministicValue(
        placeIndex,
        userIndex,
        11
    );

    if (interestMatch) {
        return value < 9 + ((placeIndex + userIndex) % 4);
    }

    return value < 3 + ((placeIndex + userIndex) % 2);
}

async function seedSocial() {
    const session = driver.session();

    try {
        await driver.verifyConnectivity();
        console.log("Connected to CognoDB");

        // ==================================================
        // 0. RESET ONLY THE SYNTHETIC SOCIAL GRAPH
        //
        // IMPORTANT:
        // We intentionally delete User nodes and their
        // relationships, but NEVER delete Place nodes.
        //
        // The 834 real OSM places and their geography remain.
        // ==================================================
        await session.run(`
            MATCH (u:User)
            DETACH DELETE u
        `);

        // ==================================================
        // 1. USERS
        // ==================================================
        await session.run(
            `
            UNWIND $users AS user
            MERGE (u:User {id: user.id})
            SET u.name = user.name
            `,
            { users }
        );

        // ==================================================
        // 2. INTERESTS
        // ==================================================
        await session.run(
            `
            UNWIND $items AS item
            MERGE (i:Interest {id: item.id})
            SET i.name = item.name
            `,
            { items: interests }
        );

        // ==================================================
        // 3. ATTRIBUTES
        // ==================================================
        await session.run(
            `
            UNWIND $items AS item
            MERGE (a:Attribute {id: item.id})
            SET a.name = item.name
            `,
            { items: attributes }
        );

        // ==================================================
        // 4. CATEGORIES
        // ==================================================
        await session.run(
            `
            UNWIND $items AS item
            MERGE (c:Category {id: item.id})
            SET c.name = item.name
            `,
            { items: categories }
        );

        // ==================================================
        // 5. USER INTERESTS
        // ==================================================
        await session.run(
            `
            UNWIND $rows AS row
            MATCH (u:User {id: row[0]})
            MATCH (i:Interest {id: row[1]})
            MERGE (u)-[:LIKES]->(i)
            `,
            { rows: interestRows }
        );

        // ==================================================
        // 6. FRIENDSHIPS
        // ==================================================
        await session.run(
            `
            UNWIND $rows AS row
            MATCH (a:User {id: row[0]})
            MATCH (b:User {id: row[1]})
            MERGE (a)-[:CONNECTED_TO]->(b)
            `,
            { rows: friendshipRows }
        );

        // ==================================================
        // 7. PLACE ATTRIBUTES + CATEGORIES
        // ==================================================
        const placesResult = await session.run(`
            MATCH (p:Place)
            RETURN
                p.id AS id,
                p.category AS category,
                p.rating AS rating
        `);

        const attributeRows: string[][] = [];
        const categoryRows: string[][] = [];

        for (const record of placesResult.records) {
            const placeId = record.get("id");
            const category = record.get("category");

            const mapping = getPlaceMapping(category);

            attributeRows.push([
                placeId,
                mapping.attributeId,
            ]);

            categoryRows.push([
                placeId,
                mapping.categoryId,
            ]);
        }

        await session.run(
            `
            UNWIND $rows AS row
            MATCH (p:Place {id: row[0]})
            MATCH (a:Attribute {id: row[1]})
            MERGE (p)-[:HAS_ATTRIBUTE]->(a)
            `,
            { rows: attributeRows }
        );

        await session.run(
            `
            UNWIND $rows AS row
            MATCH (p:Place {id: row[0]})
            MATCH (c:Category {id: row[1]})
            MERGE (p)-[:HAS_CATEGORY]->(c)
            `,
            { rows: categoryRows }
        );

        // Build a simple local lookup so the deterministic
        // behaviour generator knows each user's interests.
        const userInterestMap: Record<string, string[]> =
            {};

        for (const [userId, interestId] of interestRows) {
            if (!userInterestMap[userId]) {
                userInterestMap[userId] = [];
            }

            userInterestMap[userId].push(
                interestId
            );
        }

        // ==================================================
        // 8. VISITS
        //
        // Each place gets a varied set of visitors.
        // We do NOT assign the same people to every place.
        // ==================================================
        const visitRows: string[][] = [];

        for (
            let placeIndex = 0;
            placeIndex < placesResult.records.length;
            placeIndex++
        ) {
            const record =
                placesResult.records[placeIndex];

            const category =
                record.get("category");

            for (
                let userIndex = 0;
                userIndex < users.length;
                userIndex++
            ) {
                const user = users[userIndex];

                const visited = shouldVisit(
                    placeIndex,
                    userIndex,
                    category,
                    userInterestMap[user.id] ?? []
                );

                if (visited) {
                    visitRows.push([
                        user.id,
                        record.get("id"),
                    ]);
                }
            }
        }

        await session.run(
            `
            UNWIND $rows AS row
            MATCH (u:User {id: row[0]})
            MATCH (p:Place {id: row[1]})
            MERGE (u)-[:VISITED]->(p)
            `,
            { rows: visitRows }
        );

        // ==================================================
        // 9. RECOMMENDATIONS
        //
        // Recommendations are rarer than visits.
        // They are more likely for places relevant to the
        // user's interests, but are not identical to visits.
        // ==================================================
        const recommendationRows: string[][] = [];

        for (
            let placeIndex = 0;
            placeIndex < placesResult.records.length;
            placeIndex++
        ) {
            const record =
                placesResult.records[placeIndex];

            const category =
                record.get("category");

            for (
                let userIndex = 0;
                userIndex < users.length;
                userIndex++
            ) {
                const user = users[userIndex];

                if (
                    shouldRecommend(
                        placeIndex,
                        userIndex,
                        category,
                        userInterestMap[user.id] ?? []
                    )
                ) {
                    recommendationRows.push([
                        user.id,
                        record.get("id"),
                    ]);
                }
            }
        }

        await session.run(
            `
            UNWIND $rows AS row
            MATCH (u:User {id: row[0]})
            MATCH (p:Place {id: row[1]})
            MERGE (u)-[:RECOMMENDED]->(p)
            `,
            { rows: recommendationRows }
        );

        // ==================================================
        // 10. SAVED
        //
        // Saved is independent from visits/recommendations.
        // ==================================================
        const savedRows: string[][] = [];

        for (
            let placeIndex = 0;
            placeIndex < placesResult.records.length;
            placeIndex++
        ) {
            const record =
                placesResult.records[placeIndex];

            const category =
                record.get("category");

            for (
                let userIndex = 0;
                userIndex < users.length;
                userIndex++
            ) {
                const user = users[userIndex];

                if (
                    shouldSave(
                        placeIndex,
                        userIndex,
                        category,
                        userInterestMap[user.id] ?? []
                    )
                ) {
                    savedRows.push([
                        user.id,
                        record.get("id"),
                    ]);
                }
            }
        }

        await session.run(
            `
            UNWIND $rows AS row
            MATCH (u:User {id: row[0]})
            MATCH (p:Place {id: row[1]})
            MERGE (u)-[:SAVED]->(p)
            `,
            { rows: savedRows }
        );

        // ==================================================
        // 11. VERIFICATION
        // ==================================================
        const stats = await session.run(`
            MATCH (u:User)
            WITH count(u) AS users

            MATCH (p:Place)
            WITH users, count(p) AS places

            MATCH ()-[v:VISITED]->()
            WITH users, places, count(v) AS visits

            MATCH ()-[r:RECOMMENDED]->()
            WITH users, places, visits, count(r) AS recommendations

            MATCH ()-[s:SAVED]->()
            WITH users, places, visits, recommendations, count(s) AS saved

            MATCH ()-[c:CONNECTED_TO]->()
            RETURN
                users,
                places,
                visits,
                recommendations,
                saved,
                count(c) AS connections
        `);

        const record = stats.records[0];

        console.log("\n✅ Social graph seeded successfully");

        console.log(
            `Users: ${record.get("users").toNumber()}`
        );

        console.log(
            `Places: ${record.get("places").toNumber()}`
        );

        console.log(
            `Visits: ${record.get("visits").toNumber()}`
        );

        console.log(
            `Recommendations: ${record
                .get("recommendations")
                .toNumber()}`
        );

        console.log(
            `Saved: ${record.get("saved").toNumber()}`
        );

        console.log(
            `Connections: ${record
                .get("connections")
                .toNumber()}`
        );

        console.log(
            "\nGraph design:"
        );

        console.log(
            "- 10 users"
        );

        console.log(
            "- Sparse + overlapping friendship circles"
        );

        console.log(
            "- Interest-driven but varied visits"
        );

        console.log(
            "- Independent recommendations and saves"
        );

        console.log(
            "- Real OSM places preserved"
        );
    } catch (error) {
        console.error(
            "\n❌ Social seed failed:"
        );
        console.error(error);
        process.exitCode = 1;
    } finally {
        await session.close();
        await driver.close();
    }
}

seedSocial();
