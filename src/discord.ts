import { Client, GatewayIntentBits, ChannelType, Events } from "discord.js";
import logger from "./utils/logger";
import { floorPoll } from "./handlers/floorPoll";
import { bidPoll } from "./handlers/bidPoll";
import replyChatInteraction from "./interactions/chatInteractions";
import { replySelectInteraction } from "./interactions/selectInteractions";

export default class Discord {
  // Tracked Collection
  contractAddress: string;
  // Discord channel to send alerts
  channelId: string;
  // Discord Bot Token
  token: string;
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
   * @param contractAddress Tracked Collection
   * @param channelId Discord channel to send alerts
   * @param token Discord Bot Token
   */
  constructor(contractAddress: string, channelId: string, token: string) {
    this.contractAddress = contractAddress;
    this.channelId = channelId;
    this.token = token;
  }

  async poll(): Promise<void> {
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

    // Get new floor price and top bid data
    await floorPoll(channel, this.contractAddress);
    await bidPoll(channel, this.contractAddress);

    // Collecting new data in 5s
    setTimeout(() => this.poll(), 5000);
  }

  /**
   * Handling Discord bot events
   */
  async handleEvents(): Promise<void> {
    // Login to Discord
    await this.client.login(this.token);

    // Handle ready
    this.client.on(Events.ClientReady, async () => {
      // Log Discord bot online
      logger.info(`Discord bot is connected as ${this.client.user?.tag}`);

      // Starting poll process
      await this.poll();
    });

    // Handle user interaction creation
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        // Handle user chat interaction
        await replyChatInteraction(interaction);
      } else if (interaction.isSelectMenu()) {
        // Handle user select menu interaction
        await replySelectInteraction(interaction);
      } else {
        // Log unknown interaction
        logger.error(`Unknown interaction passed: ${interaction}`);
      }
    });
  }
}
