import { Db, MongoClient } from "mongodb"

/**
 * MongoDB connection helper.
 *
 * Set MONGODB_URI (and optionally MONGODB_DB) in `.env.local`:
 *   MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net"
 *   MONGODB_DB="nadihatiman"
 */

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "nadihatiman"

declare global {
  // Reuse the client across hot reloads in development.
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient> | null = null

export function isMongoConfigured(): boolean {
  return Boolean(uri)
}

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    )
  }
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect()
    }
    clientPromise = global._mongoClientPromise
  } else if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect()
  }
  const client = await clientPromise
  return client.db(dbName)
}
