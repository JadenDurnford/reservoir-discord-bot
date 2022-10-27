import axios from "axios";
import {
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  Events,
  GatewayIntentBits,
  ChannelType,
} from "discord.js";
import dotenv from "dotenv";
import logger from "./logger";
import Redis from "ioredis";
import { bidPoll } from "./bidPoll";
import { floorPoll } from "./floorPoll";

/* class Main {
  private redis: RedisClient;
  private discord: Discord;
}

class Discord {
}

async function main() {
  // Check env vars

  // Create new discord class
  const d = new Main();
  
  // Handlers
  client.on("ready", async () => await d.handleReady());
  
}

try {
  await main();
} catch (e) {
  logger.error(e);
  throw new Error(e);
} */

dotenv.config();
const redis = new Redis();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TRACKED_CONTRACT: string | undefined = process.env.TRACKED_CONTRACT;
const CHANNEL_ID: string | undefined = process.env.CHANNEL_ID;
if (!TRACKED_CONTRACT || !CHANNEL_ID) {
  logger.error("Missing env vars");
  throw new Error("Missing env vars");
}

/**
 * Checks if key exists. If it doesn't sets it to newValue
 * @param {string} key to check
 * @param {string} newValue to set if key does not exist
 */
async function checkKeyOrSet(key: string, newValue: string): Promise<void> {
  const cachedKey: string | null = await redis.get(key);
  if (!cachedKey) {
    const success = await redis.set(key, newValue);
    if (success !== "OK") {
      logger.error(`Could not initialize ${key} key in Redis`);
      throw new Error(`Failed initializing ${key} key in Redis`);
    }
  }
}

redis.on("connect", async () => {
  logger.info("Connected to Redis client.");

  // Checking if floorprice and topbid prices are saved
  await checkKeyOrSet("floorprice", "999999999");
  await checkKeyOrSet("topbid", "0.0000000001");
});

client.on("ready", async () => {
  logger.info("Discord bot logged in");
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) {
    logger.error("Could not connect to channel");
    throw new Error("Could not connect to channel");
  } else if (channel.type !== ChannelType.GuildText) {
    logger.error("Channel is not a text channel");
    throw new Error("Channel is not a text channel");
  }

  await floorPoll(channel, TRACKED_CONTRACT);
  await bidPoll(channel, TRACKED_CONTRACT);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "collection") {
    try {
      const { value: name } = interaction.options.get("name", true);
      let limit = interaction.options.get("limit", false)?.value || -1;

      if (!name) {
        logger.error("No collection name recieved");
        throw new Error("No collection name recieved");
      }

      if (!limit) {
        limit = 5;
      }

      let contracts = "";

      if (options.findIndex((obj) => obj.name == "limit") != -1) {
        const quantity =
          options[options.findIndex((obj) => obj.name == "limit")].value;
        if (quantity >= 20) {
          limit = 20;
        } else if (quantity < 1) {
          limit = 1;
        } else {
          limit = quantity;
        }
      }

      const {
        data: { collections: searchResults },
      } = await axios.get(
        `https://api.reservoir.tools/search/collections/v1?name=${name}&limit=${limit}`
      );

      searchResults.map((coll) => {
        contracts += "&contract=" + coll.contract;
      });

      const {
        data: { collections: collData },
      } = await axios.get(
        `https://api.reservoir.tools/collections/v5?includeTopBid=true&sortBy=allTimeVolume${contracts}`
      );

      let fieldValue = "";
      searchResults.map((coll) => {
        const currentColl =
          collData[collData.findIndex((obj) => obj.name == coll.name)];
        fieldValue += `**[${
          coll.name
        }](https://www.reservoir.market/collections/${coll.contract})**
      ${
        currentColl.floorAsk.price
          ? "Floor Ask: " + currentColl.floorAsk.price.amount.native
          : "No floor ask found"
      }
      ${
        currentColl.topBid.price
          ? "Top Bid: " + currentColl.topBid.price.amount.native
          : "No bids found"
      }
      `;
        if (currentColl.floorAsk.price && currentColl.topBid.price) {
          fieldValue += `Spread: ${
            currentColl.floorAsk.price.amount.native -
            currentColl.topBid.price.amount.native
          }
        `;
        }
      });

      const testEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle("Search Results")
        .setAuthor({
          name: "Reservoir Bot",
          url: "https://reservoir.tools/",
          iconURL:
            "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096",
        })
        .setDescription(
          searchResults.length != 0
            ? `**The top ${searchResults.length} results for "${name}" are:**
        ${fieldValue}`
            : `**No results found for "${name}"**`
        )
        .setThumbnail(
          "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096"
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [testEmbed],
      });
      return;
    } catch (error) {
      console.log(error);
      await interaction.reply(
        "Error searching for collections, try again later"
      );
      return;
    }
  }

  if (interaction.commandName === "stats") {
    try {
      const options = interaction.options._hoistedOptions;
      const name =
        options[options.findIndex((obj) => obj.name == "name")].value;
      let contracts = "";

      const {
        data: { collections: searchResults },
      } = await axios.get(
        `https://api.reservoir.tools/search/collections/v1?name=${name}&limit=5`
      );

      searchResults.map((coll) => {
        contracts += "&contract=" + coll.contract;
      });

      let fieldValue = "";
      let counter = 1;
      const selectOptions = searchResults.map((coll) => {
        fieldValue += `**${counter}. [${coll.name}](https://www.reservoir.market/collections/${coll.contract})**
      `;
        counter++;
        return { label: coll.name, value: coll.contract };
      });

      const testEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle("Search Results")
        .setAuthor({
          name: "Reservoir Bot",
          url: "https://reservoir.tools/",
          iconURL:
            "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096",
        })
        .setDescription(
          searchResults.length != 0
            ? `**The top ${searchResults.length} results for "${name}" are:**
        ${fieldValue}
        Please select the collection to view stats for below`
            : `**No results found for "${name}"**`
        )
        .setThumbnail(
          "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096"
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
          .setCustomId("statselect")
          .setPlaceholder("Nothing selected")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(selectOptions)
      );

      await interaction.reply({
        embeds: [testEmbed],
        components: [row],
      });
      return;
    } catch (error) {
      console.log(error);
      await interaction.reply(
        "No collections found matching your search term, please try again."
      );
      return;
    }
  }

  if (interaction.commandName === "topbid") {
    try {
      const options = interaction.options._hoistedOptions;
      const name =
        options[options.findIndex((obj) => obj.name == "name")].value;
      let contracts = "";

      const {
        data: { collections: searchResults },
      } = await axios.get(
        `https://api.reservoir.tools/search/collections/v1?name=${name}&limit=5`
      );

      searchResults.map((coll) => {
        contracts += "&contract=" + coll.contract;
      });

      let fieldValue = "";
      let counter = 1;
      const selectOptions = searchResults.map((coll) => {
        fieldValue += `**${counter}. [${coll.name}](https://www.reservoir.market/collections/${coll.contract})**
      `;
        counter++;
        return { label: coll.name, value: coll.contract };
      });

      const testEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle("Search Results")
        .setAuthor({
          name: "Reservoir Bot",
          url: "https://reservoir.tools/",
          iconURL:
            "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096",
        })
        .setDescription(
          searchResults.length != 0
            ? `**The top ${searchResults.length} results for "${name}" are:**
        ${fieldValue}
        Please select the collection to view stats for below`
            : `**No results found for "${name}"**`
        )
        .setThumbnail(
          "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096"
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
          .setCustomId("bidselect")
          .setPlaceholder("Nothing selected")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(selectOptions)
      );

      await interaction.reply({
        embeds: [testEmbed],
        components: [row],
      });
      return;
    } catch (error) {
      console.log(error);
      await interaction.reply({
        content:
          "No collections found matching your search term, please try again.",
      });
      return;
    }
  }

  console.log("Unknown Command");
  await interaction.reply({
    content: "Error: Unknown Command",
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isSelectMenu()) return;

  if (interaction.customId === "statselect") {
    try {
      const {
        data: { collections: collStats },
      } = await axios.get(
        `https://api.reservoir.tools/collections/v5?id=${interaction.values[0]}&includeTopBid=false&sortBy=allTimeVolume&limit=1`
      );
      const statEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle(`${collStats[0].name} Stats`)
        .setAuthor({
          name: "Reservoir Bot",
          url: "https://reservoir.tools/",
          iconURL:
            "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024",
        })
        .setDescription(
          `Token Count: ${collStats[0].tokenCount}
        On Sale Count: ${collStats[0].onSaleCount}
        7 day volume: ${collStats[0].volume["7day"]}`
        )
        .setThumbnail(
          "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024"
        )
        .setTimestamp();

      await interaction.update({
        embeds: [statEmbed],
      });
      return;
    } catch (error) {
      console.log(error);
      await interaction.update({
        content: "Error pulling collection stats, try again later",
        embeds: [],
        components: [],
      });
      return;
    }
  }

  if (interaction.customId === "bidselect") {
    try {
      const {
        data: { collections: bidCollData },
      } = await axios.get(
        `https://api.reservoir.tools/collections/v5?id=${interaction.values[0]}&includeTopBid=true&sortBy=allTimeVolume&limit=1`
      );

      if (bidCollData[0].topBid.price != null) {
        if (bidCollData[0].topBid.price.netAmount.native != null) {
          const bidEmbed = new EmbedBuilder()
            .setColor(0x8b43e0)
            .setTitle(`Collection Top Bid`)
            .setAuthor({
              name: bidCollData[0].name,
              url: "https://reservoir.tools/",
              iconURL: bidCollData[0].image,
            })
            .setDescription(
              `The top bid on the collection is ${
                bidCollData[0].topBid.price.netAmount.native
              }Ξ made by [${bidCollData[0].topBid.maker.substring(
                0,
                6
              )}](https://www.reservoir.market/address/${
                bidCollData[0].topBid.maker
              })`
            )
            .setThumbnail(bidCollData[0].image)
            .setTimestamp();

          await interaction.update({
            embeds: [bidEmbed],
          });
          return;
        } else if (bidCollData[0].topBid.price.amount.native != null) {
          const bidEmbed = new EmbedBuilder()
            .setColor(0x8b43e0)
            .setTitle(`Collection Top Bid`)
            .setAuthor({
              name: `${bidCollData[0].name}`,
              url: "https://reservoir.tools/",
              iconURL: `${bidCollData[0].image}`,
            })
            .setDescription(
              `The top bid on the collection is ${
                bidCollData[0].topBid.price.amount.native
              }Ξ made by [${bidCollData[0].topBid.maker.substring(
                0,
                6
              )}](https://www.reservoir.market/address/${
                bidCollData[0].topBid.maker
              })`
            )
            .setThumbnail(`${bidCollData[0].image}`)
            .setTimestamp();

          await interaction.update({
            embeds: [bidEmbed],
          });
          return;
        }
      } else {
        const bidEmbed = new EmbedBuilder()
          .setColor(0x8b43e0)
          .setTitle(`Collection Top Bid`)
          .setAuthor({
            name: `${bidCollData[0].name}`,
            url: "https://reservoir.tools/",
            iconURL: `${bidCollData[0].image}`,
          })
          .setDescription(`No bids found for ${bidCollData[0].name}`)
          .setThumbnail(`${bidCollData[0].image}`)
          .setTimestamp();

        await interaction.update({
          embeds: [bidEmbed],
        });
        return;
      }
    } catch (error) {
      console.log(error.requestBody.json.data);
      await interaction.update({
        content: "Error pulling collection stats, try again later",
        embeds: [],
        components: [],
      });
      return;
    }
  }

  console.log("Unknown Selection");
  await interaction.reply({
    content: "Error: Unknown Selection",
  });
});

client.login(process.env.TOKEN);
