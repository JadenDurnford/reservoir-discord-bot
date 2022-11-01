import dotenv from "dotenv";
import logger from "./utils/logger";
import Discord from "./discord";
import Redis from "ioredis";

(async () => {
  try {
    // Setup env vars
    dotenv.config();

    // Check env vars
    const TRACKED_CONTRACT: string | undefined = process.env.TRACKED_CONTRACT;
    const CHANNEL_ID: string | undefined = process.env.CHANNEL_ID;
    const TOKEN: string | undefined = process.env.TOKEN;
    const RESERVOIR_API_KEY: string | undefined = process.env.RESERVOIR_API_KEY;
    if (!TRACKED_CONTRACT || !CHANNEL_ID || !TOKEN || !RESERVOIR_API_KEY) {
      logger.error("Missing env vars");
      throw new Error("Missing env vars");
    }

    // Setup Discord
    const discord = new Discord(
      TRACKED_CONTRACT,
      CHANNEL_ID,
      TOKEN,
      RESERVOIR_API_KEY
    );

    const redis = new Redis();
    redis.on("ready", async () => {
      // Listen for Discord events
      await discord.handleEvents();
    });
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      throw new Error(e.message);
    } else {
      logger.error(e);
      throw new Error("Unexpected error");
    }
  }
})();
