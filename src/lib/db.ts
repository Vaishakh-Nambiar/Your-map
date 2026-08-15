import neo4j from "neo4j-driver";

const uri = process.env.COGNO_DB_URI;
const username = process.env.COGNO_DB_USERNAME;
const password = process.env.COGNO_DB_PWD;

if (!uri || !username || !password) {
    throw new Error("Missing CognoDB environment variables");
}

export const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password)
);