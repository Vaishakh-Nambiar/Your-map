import "dotenv/config";
import fs from "node:fs/promises";
import neo4j from "neo4j-driver";

const uri = process.env.COGNO_DB_URI!;
const username = process.env.COGNO_DB_USERNAME!;
const password = process.env.COGNO_DB_PWD!;

if (!uri || !username || !password) {
    throw new Error("Missing Neo4j environment variables");
}

const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password)
);

type Place = {
    id: string;
    osmId: string;
    name: string;
    latitude: number;
    longitude: number;
    category: string;
    areaId: string;
    areaName: string;
    tags: Record<string, string>;
};

async function main() {
    const raw = await fs.readFile(
        "scripts/osm-places.json",
        "utf8"
    );

    const places = JSON.parse(raw) as Place[];

    const session = driver.session();

    try {
        console.log(`Importing ${places.length} real places...`);

        // Remove old demo places/areas.
        await session.run(`
            MATCH (p:Place)
            DETACH DELETE p
        `);

        await session.run(`
            MATCH (a:Area)
            DETACH DELETE a
        `);

        // Create areas.
        await session.run(`
            UNWIND $areas AS area
            MERGE (a:Area {id: area.id})
            SET a.name = area.name
        `, {
            areas: [
                {
                    id: "area1",
                    name: "HSR Layout",
                },
                {
                    id: "area2",
                    name: "Koramangala",
                },
            ],
        });

        // Create places.
        await session.run(`
            UNWIND $places AS place

            MERGE (p:Place {id: place.id})

            SET
                p.osmId = place.osmId,
                p.name = place.name,
                p.description = place.name + " in " + place.areaName,
                p.latitude = place.latitude,
                p.longitude = place.longitude,
                p.category = place.category,
                p.rating = 4.0,
                p.priceLevel = 2

            WITH p, place

            MATCH (a:Area {id: place.areaId})

            MERGE (p)-[:LOCATED_IN]->(a)
        `, {
            places,
        });

        // Geographic relationship between our two areas.
        await session.run(`
            MATCH (hsr:Area {id: "area1"})
            MATCH (kor:Area {id: "area2"})

            MERGE (hsr)-[:NEAR]->(kor)
            MERGE (kor)-[:NEAR]->(hsr)
        `);

        // Verification.
        const result = await session.run(`
            MATCH (a:Area)
            OPTIONAL MATCH (p:Place)-[:LOCATED_IN]->(a)
            RETURN
                a.id AS areaId,
                a.name AS area,
                count(p) AS places
            ORDER BY a.id
        `);

        console.log("\n✅ Import complete\n");

        for (const record of result.records) {
            console.log(
                `${record.get("area")}: ${record.get("places").toNumber()} places`
            );
        }

        const relationshipResult = await session.run(`
            MATCH (a1:Area)-[:NEAR]->(a2:Area)
            RETURN a1.name AS from, a2.name AS to
        `);

        console.log("\nArea relationships:");

        for (const record of relationshipResult.records) {
            console.log(
                `${record.get("from")} → NEAR → ${record.get("to")}`
            );
        }
    } finally {
        await session.close();
    }

    await driver.close();
}

main().catch((error) => {
    console.error("\n❌ Import failed");
    console.error(error);
    process.exit(1);
});