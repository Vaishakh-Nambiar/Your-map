import "dotenv/config";

console.log("URI exists:", !!process.env.COGNO_DB_URI);
console.log("Username exists:", !!process.env.COGNO_DB_USERNAME);
console.log("Password exists:", !!process.env.COGNO_DB_PWD);

import neo4j from "neo4j-driver";

const driver = neo4j.driver(
    process.env.COGNO_DB_URI!,
    neo4j.auth.basic(
        process.env.COGNO_DB_USERNAME!,
        process.env.COGNO_DB_PWD!
    )
);

async function main() {
    try {
        await driver.verifyConnectivity();
        console.log("✅ CognoDB connected");

        const result = await driver.executeQuery(
            "RETURN 1 AS result"
        );

        console.log("Result:", result.records[0].get("result"));
    } catch (error) {
        console.error("❌ Connection failed:", error);
    } finally {
        await driver.close();
    }
}

main();