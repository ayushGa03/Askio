import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

// Create Redis client with Redis v4 syntax
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
});

// Handle Redis events
client.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("ready", () => {
  console.log("Redis client ready");
});

// Connect to Redis
await client.connect();

/**
 * Add token to blacklist
 * @param {string} token - The JWT token to blacklist
 * @param {number} expiresIn - Time in seconds until the token expires
 */
export const blacklistToken = async (token, expiresIn) => {
  try {
    // Set the token in Redis with TTL equal to token expiration time
    // Using the token as key and a simple value (timestamp when blacklisted)
    await client.setEx(
      `blacklist:${token}`,
      expiresIn,
      JSON.stringify({ blacklistedAt: new Date().toISOString() })
    );
    console.log("Token added to blacklist");
  } catch (error) {
    console.error("Error adding token to blacklist:", error.message);
    throw error;
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token) => {
  try {
    const result = await client.get(`blacklist:${token}`);
    return result !== null; // If result exists, token is blacklisted
  } catch (error) {
    console.error("Error checking token blacklist:", error.message);
    // In case of Redis error, return false to allow request (fail open)
    return false;
  }
};

/**
 * Clear a specific token from blacklist (if needed for recovery)
 * @param {string} token - The JWT token to remove from blacklist
 */
export const removeTokenFromBlacklist = async (token) => {
  try {
    await client.del(`blacklist:${token}`);
    console.log("Token removed from blacklist");
  } catch (error) {
    console.error("Error removing token from blacklist:", error.message);
    throw error;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => client;

export default client;
