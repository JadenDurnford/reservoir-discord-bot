import Redis from "ioredis";
import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "../utils/logger";
import handleMediaConversion from "../utils/media";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

/**
 * Check floor price events to see if it has changed since last alert
 * @param {TextChannel} channel channel to send floor price alert to
 * @param {string} contractAddress collection to check for top bid events
 */
export async function salesPoll(
  channel: TextChannel,
  contractArray: string[],
  apiKey: string,
  redis: Redis
) {
  // Authorizing with Reservoir API Key
  await sdk.auth(apiKey);

  // Getting floor ask events from Reservoir
  const salesResponse: paths["/sales/v4"]["get"]["responses"]["200"]["schema"] =
    await sdk.getSalesV4({
      contract: contractArray,
      includeTokenMetadata: "true",
      limit: "100",
      accept: "*/*",
    });

  // Getting the most recent sales event
  const sales = salesResponse.sales;

  // Log failure + throw if floor event couldn't be pulled
  if (!sales) {
    logger.error("Could not pull listings");
    throw new Error("Could not pull listings");
  }

  // Pull cached sales event id from Redis
  const cachedId: string | null = await redis.get("salesorderid");
  if (!sales[0].saleId) {
    logger.info("Couldn't set latest sales order id");
    return;
  }

  if (!cachedId) {
    channel.send(
      "Restarting sales bot, new listings will begin to populate from here..."
    );
    await redis.set("salesorderid", sales[0].saleId);
    return;
  }

  // If most recent event matchs cached event exit function
  if (sales[0].saleId === cachedId) {
    return;
  }

  const cachedListingIndex =
    sales.findIndex((order) => {
      return order.saleId === cachedId;
    }) - 1;

  if (cachedListingIndex < 0) {
    await redis.del("salesorderid");
    logger.info("cached sale not found, resetting");
  }

  for (let i = cachedListingIndex; i >= 0; i--) {
    const icon = await handleMediaConversion(
      `https://api.reservoir.tools/redirect/sources/${sales[i].orderSource}/logo/v2`,
      `${sales[i].orderSource}`
    );
    const salesEmbed = new EmbedBuilder()
      .setColor(0x8b43e0)
      .setTitle(`${sales[i].token?.name} has been sold!`)
      .setAuthor({
        name: `${sales[i].token?.collection?.name}`,
        url: `https://forgotten.market/${sales[i].token?.contract}`,
        // iconURL: `${tokenDetails.collection.image}`,
      })
      .setDescription(
        `Item: ${sales[i].token?.name}\nPrice: ${sales[i].price?.amount?.native}Ξ ($${sales[i].price?.amount?.usd})\nBuyer: ${sales[i].to}\nSeller: ${sales[i].from}`
      )
      .setThumbnail(`${sales[i].token?.image}`)
      .setFooter({
        text: `${sales[i].orderSource}`,
        iconURL: icon
          ? `attachment://${icon.name}`
          : `https://api.reservoir.tools/redirect/sources/${sales[i].orderSource}/logo/v2`,
      })
      .setTimestamp();

    // Generating floor token purchase button
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("View Sale")
        .setStyle(5)
        .setURL(`https://etherscan.io/tx/${sales[i].txHash}`)
    );
    channel.send({ embeds: [salesEmbed], components: [row], files: [icon] });
  }
  await redis.set("salesorderid", sales[0].saleId);
}
