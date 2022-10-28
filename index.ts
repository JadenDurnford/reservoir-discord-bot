import { Events } from "discord.js";
import dotenv from "dotenv";
import logger from "./utils/logger";
import Redis from "ioredis";
import Discord from "./utils/discord";

(async () => {
  try {
    // Setup env vars
    dotenv.config();

    // Check env vars
    const TRACKED_CONTRACT: string | undefined = process.env.TRACKED_CONTRACT;
    const CHANNEL_ID: string | undefined = process.env.CHANNEL_ID;
    const TOKEN: string | undefined = process.env.TOKEN;
    if (!TRACKED_CONTRACT || !CHANNEL_ID || !TOKEN) {
      logger.error("Missing env vars");
      throw new Error("Missing env vars");
    }

    // Setup Redis
    const redis = new Redis();

    // Setup Discord
    const discord = new Discord();
    const client = discord.client;

    // Redis Handlers
    redis.on("connect", async () => {
      logger.info("Connected to Redis client.");
      client.login(TOKEN);
    });

    // Discord Handlers
    client.on(
      "ready",
      async () => await discord.handleReady(CHANNEL_ID, TRACKED_CONTRACT)
    );
    client.on(
      Events.InteractionCreate,
      async (interaction) =>
        await discord.handleChatCommandInteraction(interaction)
    );
    client.on(
      Events.InteractionCreate,
      async (interaction) =>
        await discord.handleSelectMenuInteraction(interaction)
    );
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
