import dotenv from "dotenv";
dotenv.config(); // Carrega variáveis do .env no ambiente local

import { MongoClient, Db, Collection, Document } from "mongodb";

declare global {
  // cache global para evitar múltiplas conexões em serverless
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "daee"; // seu banco
export const DEFAULT_COLLECTION = "registros";    // sua collection

if (!MONGODB_URI) {
  throw new Error("Por favor defina a variável de ambiente MONGODB_URI");
}

let clientPromise: Promise<MongoClient>;
if (global._mongoClientPromise) {
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export async function getCollection<T extends Document = Document>(
  name: string = DEFAULT_COLLECTION
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
