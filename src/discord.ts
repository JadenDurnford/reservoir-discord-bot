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
import replyChatInteraction from "./interactions/chatInteractions";
import { replySelectInteraction } from "./interactions/selectInteractions";
import commandBuilder from "./utils/commands";
import Redis from "ioredis";
import constants from "./utils/constants";

export default class Discord {
  // Tracked Collection
  private contractAddress: string;
  // Discord channel to send alerts
  private channelId: string;
  // Discord Bot Token
  private token: string;
  // Reservoir API Key
  private apiKey: string;
  // Discord Bot Application ID
  private applicationId: string;
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
   * @param {string} contractAddress Tracked Collection
   * @param channelId Discord channel to send alerts
   * @param token Discord Bot Token
   */
  constructor(
    contractAddress: string,
    channelId: string,
    token: string,
    apiKey: string,
    applicationId: string,
    redisURL: {}
  ) {
    this.contractAddress = contractAddress;
    this.channelId = channelId;
    this.token = token;
    this.apiKey = apiKey;
    this.applicationId = applicationId;
    this.redisURL = redisURL;
  }

  /**
   * Check for new floor price and top bid events, and alert the channel if there are any
   */
  async poll(channel: TextChannel): Promise<void> {
    // Setting up Redis
    const redis = new Redis(this.redisURL);

    // Get new floor price and top bid data
    Promise.allSettled([
      floorPoll(channel, this.contractAddress, this.apiKey, redis),
      bidPoll(channel, this.contractAddress, this.apiKey, redis),
    ]);
    // Collecting new data in 5s
    setTimeout(() => this.poll(channel), 5000);
  }

  /**
   * Handling Discord bot events
   */
  async handleEvents(): Promise<void> {
    // Make sure commands are registered
    await commandBuilder(this.applicationId, this.token);

    // Handle ready
    this.client.on(Events.ClientReady, async () => {
      // Log Discord bot online
      logger.info(`Discord bot is connected as ${this.client.user?.tag}`);
      // Getting bot channel
      const channel = this.client.channels.cache.get(this.channelId);

      // Log failure + throw on channel not found
      if (!channel) {
        logger.error("Could not connect to channel");
        throw new Error("Could not connect to channel");
      }

      // Log failure + throw on incorrect channel type
      if (channel.type !== ChannelType.GuildText) {
        logger.error("Channel is not a text channel");
        throw new Error("Channel is not a text channel");
      }
      // Starting poll process
      if (constants.ALERT_ENABLED) {
        await this.poll(channel);
      }
    });

    // Setting up Redis
    const redis = new Redis(this.redisURL);

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
