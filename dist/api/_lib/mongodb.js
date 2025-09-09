"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COLLECTION = void 0;
exports.getDb = getDb;
exports.getCollection = getCollection;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Carrega variáveis do .env no ambiente local
const mongodb_1 = require("mongodb");
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "pluvio"; // seu banco
exports.DEFAULT_COLLECTION = "registros"; // sua collection
if (!MONGODB_URI) {
    throw new Error("Por favor defina a variável de ambiente MONGODB_URI");
}
let clientPromise;
if (global._mongoClientPromise) {
    clientPromise = global._mongoClientPromise;
}
else {
    const client = new mongodb_1.MongoClient(MONGODB_URI);
    clientPromise = client.connect();
    global._mongoClientPromise = clientPromise;
}
async function getDb() {
    const client = await clientPromise;
    return client.db(DB_NAME);
}
async function getCollection(name = exports.DEFAULT_COLLECTION) {
    const db = await getDb();
    return db.collection(name);
}
