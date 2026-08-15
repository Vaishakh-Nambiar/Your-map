import "dotenv/config";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
    process.env.COGNO_DB_URI!,
    neo4j.auth.basic(
        process.env.COGNO_DB_USERNAME!,
        process.env.COGNO_DB_PWD!
    )
);

async function seed() {
    try {
        await driver.verifyConnectivity();

        console.log("Connected to CognoDB");

        await driver.executeQuery(`
      MATCH (n)
      DETACH DELETE n
    `);

        // USERS
        await driver.executeQuery(`
      UNWIND $users AS user
      MERGE (u:User {id: user.id})
      SET u.name = user.name
    `, {
            users: [
                { id: "u1", name: "Arjun" },
                { id: "u2", name: "Rahul" },
                { id: "u3", name: "Priya" }
            ]
        });

        // INTERESTS
        await driver.executeQuery(`
      UNWIND $items AS item
      MERGE (i:Interest {id: item.id})
      SET i.name = item.name
    `, {
            items: [
                { id: "i1", name: "Coffee" },
                { id: "i2", name: "Quiet" },
                { id: "i3", name: "Aesthetic" },
                { id: "i4", name: "Japanese" },
                { id: "i5", name: "Outdoor" }
            ]
        });

        // ATTRIBUTES
        await driver.executeQuery(`
      UNWIND $items AS item
      MERGE (a:Attribute {id: item.id})
      SET a.name = item.name
    `, {
            items: [
                { id: "a1", name: "Coffee" },
                { id: "a2", name: "Quiet" },
                { id: "a3", name: "Aesthetic" },
                { id: "a4", name: "Work Friendly" },
                { id: "a5", name: "Outdoor" },
                { id: "a6", name: "Japanese" }
            ]
        });

        // CATEGORIES
        await driver.executeQuery(`
      UNWIND $items AS item
      MERGE (c:Category {id: item.id})
      SET c.name = item.name
    `, {
            items: [
                { id: "c1", name: "Cafe" },
                { id: "c2", name: "Restaurant" },
                { id: "c3", name: "Park" }
            ]
        });

        // AREAS
        await driver.executeQuery(`
      UNWIND $items AS item
      MERGE (a:Area {id: item.id})
      SET a.name = item.name
      SET a.city = item.city
    `, {
            items: [
                {
                    id: "area1",
                    name: "HSR Layout",
                    city: "Bangalore"
                },
                {
                    id: "area2",
                    name: "Koramangala",
                    city: "Bangalore"
                }
            ]
        });

        // PLACES
        await driver.executeQuery(`
      UNWIND $places AS place
      MERGE (p:Place {id: place.id})
      SET
        p.name = place.name,
        p.description = place.description,
        p.latitude = place.latitude,
        p.longitude = place.longitude,
        p.rating = place.rating,
        p.priceLevel = place.priceLevel
    `, {
            places: [
                {
                    id: "p1",
                    name: "Cafe One",
                    description: "Quiet coffee spot with a relaxed atmosphere.",
                    latitude: 12.9116,
                    longitude: 77.6389,
                    rating: 4.5,
                    priceLevel: 2
                },
                {
                    id: "p2",
                    name: "Cafe Two",
                    description: "Aesthetic cafe with outdoor seating.",
                    latitude: 12.9140,
                    longitude: 77.6400,
                    rating: 4.3,
                    priceLevel: 2
                },
                {
                    id: "p3",
                    name: "Japanese House",
                    description: "Cozy Japanese restaurant.",
                    latitude: 12.9100,
                    longitude: 77.6350,
                    rating: 4.6,
                    priceLevel: 3
                }
            ]
        });

        // USER → INTEREST
        await driver.executeQuery(`
      UNWIND $rows AS row
      MATCH (u:User {id: row.userId})
      MATCH (i:Interest {id: row.interestId})
      MERGE (u)-[:LIKES]->(i)
    `, {
            rows: [
                { userId: "u1", interestId: "i1" },
                { userId: "u1", interestId: "i2" },
                { userId: "u1", interestId: "i3" },

                { userId: "u2", interestId: "i1" },
                { userId: "u2", interestId: "i5" },

                { userId: "u3", interestId: "i2" },
                { userId: "u3", interestId: "i4" }
            ]
        });

        // PLACE → ATTRIBUTE
        await driver.executeQuery(`
      UNWIND $rows AS row
      MATCH (p:Place {id: row.placeId})
      MATCH (a:Attribute {id: row.attributeId})
      MERGE (p)-[:HAS_ATTRIBUTE]->(a)
    `, {
            rows: [
                { placeId: "p1", attributeId: "a1" },
                { placeId: "p1", attributeId: "a2" },
                { placeId: "p1", attributeId: "a4" },

                { placeId: "p2", attributeId: "a1" },
                { placeId: "p2", attributeId: "a3" },
                { placeId: "p2", attributeId: "a5" },

                { placeId: "p3", attributeId: "a6" }
            ]
        });

        // PLACE → CATEGORY
        await driver.executeQuery(`
      UNWIND $rows AS row
      MATCH (p:Place {id: row.placeId})
      MATCH (c:Category {id: row.categoryId})
      MERGE (p)-[:HAS_CATEGORY]->(c)
    `, {
            rows: [
                { placeId: "p1", categoryId: "c1" },
                { placeId: "p2", categoryId: "c1" },
                { placeId: "p3", categoryId: "c2" }
            ]
        });

        // PLACE → AREA
        await driver.executeQuery(`
      UNWIND $rows AS row
      MATCH (p:Place {id: row.placeId})
      MATCH (a:Area {id: row.areaId})
      MERGE (p)-[:LOCATED_IN]->(a)
    `, {
            rows: [
                { placeId: "p1", areaId: "area1" },
                { placeId: "p2", areaId: "area1" },
                { placeId: "p3", areaId: "area1" }
            ]
        });

        // FRIENDSHIPS
        await driver.executeQuery(`
      UNWIND $rows AS row
      MATCH (a:User {id: row.a})
      MATCH (b:User {id: row.b})
      MERGE (a)-[:CONNECTED_TO]->(b)
    `, {
            rows: [
                { a: "u1", b: "u2" },
                { a: "u1", b: "u3" },
                { a: "u2", b: "u1" },
                { a: "u3", b: "u1" }
            ]
        });

        // VISITS
        await driver.executeQuery(`
      UNWIND $rows AS row
      MATCH (u:User {id: row.userId})
      MATCH (p:Place {id: row.placeId})
      MERGE (u)-[:VISITED]->(p)
    `, {
            rows: [
                { userId: "u2", placeId: "p1" },
                { userId: "u2", placeId: "p3" },
                { userId: "u3", placeId: "p2" }
            ]
        });

        // RECOMMENDATIONS
        await driver.executeQuery(`
      UNWIND $rows AS row
      MATCH (u:User {id: row.userId})
      MATCH (p:Place {id: row.placeId})
      MERGE (u)-[:RECOMMENDED]->(p)
    `, {
            rows: [
                { userId: "u2", placeId: "p1" },
                { userId: "u3", placeId: "p2" }
            ]
        });

        console.log("✅ Graph seeded successfully");

    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        await driver.close();
    }
}

seed();