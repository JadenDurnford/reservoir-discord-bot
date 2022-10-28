import {
  Client,
  GatewayIntentBits,
  ChannelType,
  CacheType,
  Interaction,
} from "discord.js";
import logger from "./logger";
import { floorPoll } from "./floorPoll";
import { bidPoll } from "./bidPoll";
import { collection } from "../interactions/commands/collection";
import { stats } from "../interactions/commands/stats";
import { topbid } from "../interactions/commands/topbid";
import { statselect } from "../interactions/selectmenu/statselect";
import { bidselect } from "../interactions/selectmenu/bidselect";

export default class Discord {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  async handleReady(CHANNEL_ID: string, TRACKED_CONTRACT: string) {
    logger.info("Discord bot logged in");

    const channel = this.client.channels.cache.get(CHANNEL_ID);

    if (!channel) {
      logger.error("Could not connect to channel");
      throw new Error("Could not connect to channel");
    } else if (channel.type !== ChannelType.GuildText) {
      logger.error("Channel is not a text channel");
      throw new Error("Channel is not a text channel");
    }

    await floorPoll(channel, TRACKED_CONTRACT);
    await bidPoll(channel, TRACKED_CONTRACT);
  }

  async handleChatCommandInteraction(interaction: Interaction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
      case "collection": {
        await collection(interaction);
        break;
      }
      case "stats": {
        await stats(interaction);
        break;
      }
      case "topbid": {
        await topbid(interaction);
        break;
      }
      default: {
        logger.error("Unknown Command");
        await interaction.reply({
          content: "Error: Unknown Command",
        });
      }
    }
  }

  async handleSelectMenuInteraction(interaction: Interaction<CacheType>) {
    if (!interaction.isSelectMenu()) return;

    switch (interaction.customId) {
      case "statselect": {
        await statselect(interaction);
        break;
      }
      case "bidselect": {
        await bidselect(interaction);
        break;
      }
      default: {
        logger.error("Unknown Select Command");
        await interaction.reply({
          content: "Error: Unknown Selection",
        });
      }
    }
  }
}
