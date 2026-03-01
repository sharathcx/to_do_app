import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";

dotenv.config();

export default class Vars {
    static get MONGO_URI() { return process.env.MONGO_URI!; }
    static get SERVER_URL() { return process.env.SERVER_URL || `http://localhost:${process.env.PORT || '3000'}`; }
    static get TEST_MODE() { return process.env.TEST_MODE === "1"; }
    static get PORT() { return process.env.PORT || 3000; }
}

