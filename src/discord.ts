import {
  Client,
  GatewayIntentBits,
  ChannelType,
  Events,
  TextChannel,
} from "discord.js";
import logger from "./utils/logger";
import { floorPoll } from "./handlers/floorPoll";
import { bidPoll } from "./handlers/bidPoll";
import { listingPoll } from "./handlers/listingPoll";
import { salePoll } from "./handlers/salesPoll";
import replyChatInteraction from "./interactions/chatInteractions";
import { replySelectInteraction } from "./interactions/selectInteractions";
import commandBuilder from "./utils/commands";
import Redis from "ioredis";
import constants from "./utils/constants";

export default class Discord {
  // Discord Bot Token
  private token: string;
  // Reservoir API Key
  private apiKey: string;
  // Redis connection url
  private redisURL: {};
  // Setting Discord bot permissions
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  /**
   * Initialize new Discord bot
   * @param {string} token Discord Bot Token
   * @param {string} apiKey Reservoir API Key
   * @param {object} redisURL Redis connection url
   */
  constructor(token: string, apiKey: string, redisURL: {}) {
    this.token = token;
    this.apiKey = apiKey;
    this.redisURL = redisURL;
  }

  /**
   * Alert new listings, sales, floor price and top bid
   */
  async poll(
    listingChannel: TextChannel,
    salesChannel: TextChannel,
    mainChannel: TextChannel,
    redis: Redis
  ): Promise<void> {
    // Call polling functions
    await Promise.allSettled([
      listingPoll(
        listingChannel,
        constants.TRACKED_CONTRACTS,
        this.apiKey,
        redis
      ),
      salePoll(salesChannel, constants.TRACKED_CONTRACTS, this.apiKey, redis),
      floorPoll(mainChannel, constants.ALERT_CONTRACT, this.apiKey, redis),
      bidPoll(mainChannel, constants.ALERT_CONTRACT, this.apiKey, redis),
    ]).then(() => {
      // Collecting new data in 1s
      setTimeout(
        () => this.poll(listingChannel, salesChannel, mainChannel, redis),
        1000
      );
    });
  }

  /**
   * Handling Discord bot events
   */
  async handleEvents(): Promise<void> {
    // Make sure commands are registered
    await commandBuilder(constants.APPLICATION_ID, this.token);
    // Setting up Redis
    const redis = new Redis(this.redisURL);

    // Handle ready
    this.client.on(Events.ClientReady, async () => {
      // Log Discord bot online
      logger.info(`Discord bot is connected as ${this.client.user?.tag}`);

      // Getting bot channels
      const mainChannel = this.client.channels.cache.get(
        constants.CHANNEL_IDS.mainChannel
      );
      const listingChannel = this.client.channels.cache.get(
        constants.CHANNEL_IDS.listingChannel
      );
      const salesChannel = this.client.channels.cache.get(
        constants.CHANNEL_IDS.salesChannel
      );

      // Log failure + throw on channel not found
      if (!listingChannel || !salesChannel || !mainChannel) {
        logger.error("Could not connect to channels");
        throw new Error("Could not connect to channels");
      }

      // Log failure + throw on incorrect channel type
      if (
        listingChannel.type !== ChannelType.GuildText ||
        salesChannel.type !== ChannelType.GuildText ||
        mainChannel.type !== ChannelType.GuildText
      ) {
        logger.error(
          `One of the channels is not a text channel listingChannel:${listingChannel.type}, salesChannel:${salesChannel.type}, mainChannel:${mainChannel.type}`
        );
        throw new Error("One of the channels is not a text channel");
      }

      // Starting poll process
      if (constants.ALERT_ENABLED) {
        this.poll(listingChannel, salesChannel, mainChannel, redis);
      }
    });

    // Handle user interaction creation
    this.client.on(Events.InteractionCreate, async (interaction) => {
      // Getting bot channel
      if (!interaction.channelId) {
        logger.error("Could not connect to channel");
        throw new Error("Could not connect to channel");
      }
      await this.client.channels.fetch(interaction.channelId);
      const channel = this.client.channels.cache.get(interaction.channelId);
      // Log failure + throw on channel not found
      if (!channel) {
        logger.error("Could not connect to channel");
        throw new Error("Could not connect to channel");
      }

      // Log failure + throw on incorrect channel type
      if (
        channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.DM
      ) {
        logger.error(
          `interaction called in unsupported ChannelType ${channel.type}`
        );
        return;
      }

      if (interaction.isChatInputCommand()) {
        // Handle user chat interaction
        await replyChatInteraction(interaction);
      } else if (interaction.isSelectMenu()) {
        // Handle user select menu interaction
        await replySelectInteraction(interaction, redis, channel);
      } else {
        // Log unknown interaction
        logger.error(`Unknown interaction passed: ${interaction}`);
      }
    });

    // Login to Discord
    await this.client.login(this.token);
  }
}
