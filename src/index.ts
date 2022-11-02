import dotenv from "dotenv";
import logger from "./utils/logger";
import Discord from "./discord";
import waitPort from "wait-port";

(async () => {
  try {
    // Setup env vars
    dotenv.config();

    // Check env vars
    const TRACKED_CONTRACT: string | undefined = process.env.TRACKED_CONTRACT;
    const CHANNEL_ID: string | undefined = process.env.CHANNEL_ID;
    const TOKEN: string | undefined = process.env.TOKEN;
    const RESERVOIR_API_KEY: string | undefined = process.env.RESERVOIR_API_KEY;
    const APPLICATION_ID: string | undefined = process.env.APPLICATION_ID;
    const REDIS_HOST: string | undefined = process.env.REDIS_HOST;
    const REDIS_PORT: number | undefined = Number(process.env.REDIS_PORT);
    if (
      !TRACKED_CONTRACT ||
      !CHANNEL_ID ||
      !TOKEN ||
      !RESERVOIR_API_KEY ||
      !APPLICATION_ID ||
      !REDIS_HOST ||
      !REDIS_PORT
    ) {
      logger.error("Missing env vars");
      throw new Error("Missing env vars");
    }

    const REDIS_URL = { REDIS_PORT, REDIS_HOST };

    // Setup Discord
    const discord = new Discord(
      TRACKED_CONTRACT,
      CHANNEL_ID,
      TOKEN,
      RESERVOIR_API_KEY,
      APPLICATION_ID,
      REDIS_URL
    );

    const params = {
      host: REDIS_HOST,
      port: REDIS_PORT,
    };

    waitPort(params)
      .then(async ({ open, ipVersion }) => {
        if (open) {
          console.log(`The port is now open on IPv${ipVersion}!`);
          // Listen for Discord events
          await discord.handleEvents();
        } else console.log("The port did not open before the timeout...");
      })
      .catch((err) => {
        logger.error(
          `An unknown error occured while waiting for the port: ${err}`
        );
        throw new Error(err);
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
