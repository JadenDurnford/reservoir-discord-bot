import dotenv from "dotenv";
import logger from "./utils/logger";
import Discord from "./discord";

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

    // Setup Discord
    const discord = new Discord(TRACKED_CONTRACT, CHANNEL_ID, TOKEN);

    // Listen for Discord events
    await discord.handleEvents();
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
