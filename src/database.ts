import { MongoClient, Db, Collection, Document } from 'mongodb';
import Vars from './globals';

export default class DataBase {
    protected static db: Db;

    public static async connect(uri: string, dbName: string): Promise<void> {
        const client = new MongoClient(uri);
        await client.connect();
        console.log("✅ MongoDB connected");
        DataBase.db = client.db(dbName);
    }

    protected static createCol<T extends Document>(name: string): Collection<T> {
        const col = this.db.collection<T>(name);
        Object.defineProperty(this, name, { value: col });
        return col;
    }


}
