const path = `.env.${process.env.NODE_ENV || 'development'}`
require("dotenv").config({ path })
const redis = require("redis")


console.log("redis port-->", `redis://${process.env.REDIS_BASE_URL}:${process.env.REDIS_PORT}`);


const baseRedisClient = redis.createClient({
    url: `redis://${process.env.REDIS_BASE_URL}:${process.env.REDIS_PORT}`,
});

const redisCall = async () => {
    await baseRedisClient.connect();
    console.log("✅ Connected to Redis on", process.env.REDIS_BASE_URL, "port", process.env.REDIS_PORT);
}

baseRedisClient.on("error", (err) => {
    console.log("Error occured while establishing redis connection");
    console.error(err);
});

module.exports = { redisCall, baseRedisClient }

