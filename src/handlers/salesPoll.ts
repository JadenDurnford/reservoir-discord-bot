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
import getCollection from "./getCollection";
import constants from "../utils/constants";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

/**
 * Check sales to see if there are new ones since the last alert
 * @param {TextChannel} channel channel to send new sales alerts
 * @param {string[]} contractArray collections to check for new sales
 * @param {string} apiKey Reservoir API Key
 * @param {Redis} redis Redis instance to save order ids
 */
export async function salePoll(
  channel: TextChannel,
  contractArray: string[],
  apiKey: string,
  redis: Redis
) {
  if (!constants.ALERT_ENABLED.sales) {
    logger.info("sales disabled");
    return;
  }
  try {
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
    const cachedId: string | null = await redis.get("saleorderid");
    if (!sales[0].saleId) {
      logger.error("Couldn't set latest sales order id");
      return;
    }

    if (!cachedId) {
      channel.send(
        "Restarting sales bot, new listings will begin to populate from here..."
      );
      await redis.set("saleorderid", sales[0].saleId);
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
      await redis.del("saleorderid");
      logger.info("cached sale not found, resetting");
    }

    for (let i = cachedListingIndex; i >= 0; i--) {
      const name = sales[i].token?.name;
      const image = sales[i].token?.image;

      if (!sales[i].orderSource) {
        logger.error(
          `couldn't return sale order source for ${sales[i].txHash}`
        );
        continue;
      }

      if (!name || !image) {
        logger.error(
          `couldn't return sale order name and image for ${sales[i].txHash}`
        );
        continue;
      }

      const collection = await getCollection(
        undefined,
        sales[i].token?.contract,
        1,
        false
      );

      if (!collection?.[0].image || !collection?.[0].name) {
        logger.error(
          `couldn't return sale order collection data for ${sales[i].txHash}`
        );
        continue;
      }
      const marketIcon = await handleMediaConversion(
        `https://api.reservoir.tools/redirect/sources/${sales[i].orderSource}/logo/v2`,
        `${sales[i].orderSource}`
      );

      const thumbnail = await handleMediaConversion(image, name);

      const authorIcon = await handleMediaConversion(
        collection[0].image,
        collection[0].name
      );

      const salesEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle(`${sales[i].token?.name} has been sold!`)
        .setAuthor({
          name: `${sales[i].token?.collection?.name}`,
          url: `https://forgotten.market/${sales[i].token?.contract}`,
          iconURL: `attachment://${authorIcon.name}`,
        })
        .setDescription(
          `Item: ${sales[i].token?.name}\nPrice: ${sales[i].price?.amount?.native}Ξ ($${sales[i].price?.amount?.usd})\nBuyer: ${sales[i].to}\nSeller: ${sales[i].from}`
        )
        .setThumbnail(`attachment://${thumbnail.name}`)
        .setFooter({
          text: `${sales[i].orderSource}`,
          iconURL: marketIcon
            ? `attachment://${marketIcon.name}`
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
      channel.send({
        embeds: [salesEmbed],
        components: [row],
        files: [marketIcon, thumbnail, authorIcon],
      });
    }
    await redis.set("saleorderid", sales[0].saleId);
  } catch (e) {
    logger.error(`Error ${e} updating new sales`);
  }
}
