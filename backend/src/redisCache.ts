import { createClient } from "redis";

export const redisClient = createClient({
  socket: {
    host: "localhost",
    port: 6379
  }
});

export const connectRedis = async () => {
  redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
  });

  await redisClient.connect();
  console.log("✅ Redis Connected");
};