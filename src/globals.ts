import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";

dotenv.config();

export default class Vars {
    static MONGO_URI = process.env.MONGO_URI!;
    static SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || '3000'}`;
    static TEST_MODE: boolean = process.env.TEST_MODE === "1";
    static PORT = process.env.PORT || 3000;
}

