import dotenv from "dotenv";
import logger from "./utils/logger";
import Discord from "./discord";
import waitPort from "wait-port";
import constants from "./utils/constants";

(async () => {
  try {
    // Setup env vars
    dotenv.config();

    // Check env vars
    const TOKEN: string | undefined = process.env.TOKEN;
    const RESERVOIR_API_KEY: string | undefined = process.env.RESERVOIR_API_KEY;
    const TRACKED_CONTRACTS: string[] | undefined = constants.TRACKED_CONTRACTS;
    const CHANNEL_IDS: object | undefined = constants.CHANNEL_IDS;
    const APPLICATION_ID: string | undefined = constants.APPLICATION_ID;
    const REDIS_PORT: number | undefined = constants.REDIS_PORT;
    const REDIS_HOST: string | undefined = constants.REDIS_HOST;

    if (
      !TOKEN ||
      !RESERVOIR_API_KEY ||
      !TRACKED_CONTRACTS ||
      !CHANNEL_IDS ||
      !APPLICATION_ID ||
      !REDIS_PORT ||
      !REDIS_HOST
    ) {
      logger.error("Missing env vars");
      throw new Error("Missing env vars");
    }

    const REDIS_URL = { port: REDIS_PORT, host: REDIS_HOST };

    // Setup Discord
    const discord = new Discord(TOKEN, RESERVOIR_API_KEY, REDIS_URL);

    const params = {
      host: REDIS_HOST,
      port: REDIS_PORT,
    };

    waitPort(params).then(async ({ open, ipVersion }) => {
      if (open) {
        console.log(`The port is now open on IPv${ipVersion}!`);
        // Listen for Discord events
        await discord.handleEvents();
      } else console.log("The port did not open before the timeout...");
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
