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
import Discord from "./discord";

/* class Main {
  private redis: RedisClient;
  private discord: Discord;
}



 */

async function main() {
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
  });

  // Discord Handlers
  client.on(
    "ready",
    async () => await discord.handleReady(CHANNEL_ID, TRACKED_CONTRACT)
  );
  client.on(
    Events.InteractionCreate,
    async (interaction) => await discord.handleChatCommand(interaction)
  );

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

  client.login(TOKEN);
}

try {
  await main();
} catch (e) {
  logger.error(e);
  throw new Error(e);
}
