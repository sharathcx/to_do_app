import express, { json } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import compression from "compression";
import mongoose from "mongoose";
import { error } from "console";
import dotenv from "dotenv"
import fastAPIfy from "./fastapify";
import Vars from "globals";
import { errorHandler } from "./utils/apiUtils"
import DataBase from "./database";


dotenv.config()

async function bootstrap(){
    const app = fastAPIfy(express(), Vars.SERVER_URL);
    app.use(cookieParser());
    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);

            try {
                const hostname = new URL(origin).hostname;

                // Allowed conditions:
                // 1. localhost:3000
                // 2. rapidstore.app
                // 3. any subdomain of rapidstore.app
                if (
                    (hostname === "localhost") ||
                    hostname === "rapidstore.app" || hostname === 'hoppscotch.io' ||
                    hostname.endsWith(".rapidstore.app") || Vars.TEST_MODE
                ) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            } catch (err) {
                callback(new Error("Invalid origin"));
            }
        },
        credentials: true,
    }))
    app.use(json());
    app.use(errorHandler);
    await DataBase.connect(Vars.MONGO_URI, "ToDo");
    const PORT = '3000';
    app.listen(parseInt(PORT),() =>{
        console.log(`Listening on http://localhost:${PORT}`);
    } );

}

bootstrap().catch((err) => {
    console.error('❌ Failed to start app:', err);
    process.exit(1);
});


