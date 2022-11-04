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
export async function listingPoll(
  channel: TextChannel,
  contractArray: string[],
  apiKey: string,
  redis: Redis
) {
  try {
    // Authorizing with Reservoir API Key
    await sdk.auth(apiKey);

    // Getting floor ask events from Reservoir
    const listingResponse: paths["/orders/asks/v3"]["get"]["responses"]["200"]["schema"] =
      await sdk.getOrdersAsksV3({
        contracts: contractArray,
        includePrivate: "false",
        includeMetadata: "true",
        includeRawData: "false",
        sortBy: "createdAt",
        limit: "500",
        accept: "*/*",
      });

    // Getting the most recent floor ask event
    const listings = listingResponse.orders;

    // Log failure + throw if floor event couldn't be pulled
    if (!listings) {
      logger.error("Could not pull listings");
      throw new Error("Could not pull listings");
    }

    // Pull cached listing event id from Redis
    const cachedId: string | null = await redis.get("listingsorderid");

    if (!cachedId) {
      channel.send(
        "Restarting listing bot, new listings will begin to populate from here..."
      );
      await redis.set("listingsorderid", listings[0].id);
      return;
    }

    // If most recent event matchs cached event exit function
    if (listings[0].id === cachedId) {
      return;
    }

    const cachedListingIndex =
      listings.findIndex((order) => {
        return order.id === cachedId;
      }) - 1;

    if (cachedListingIndex < 0) {
      await redis.del("listingsorderid");
      logger.info("cached listing not found, resetting");
    }

    for (let i = cachedListingIndex; i >= 0; i--) {
      if (listings[i].tokenSetId === listings[i + 1].tokenSetId) {
        logger.info(
          `skipping duplicated listing order from other marketplace ${listings[i].id}`
        );
        continue;
      }

      if (!listings[i].source?.icon || !listings[i].source?.name) {
        logger.error(
          `couldn't return listing order source for ${listings[i].id}`
        );
        continue;
      }

      const tokenResponse: paths["/tokens/v5"]["get"]["responses"]["200"]["schema"] =
        await sdk.getTokensV5({
          tokenSetId: listings[i].tokenSetId,
          sortBy: "floorAskPrice",
          limit: "20",
          includeTopBid: "false",
          includeAttributes: "true",
          accept: "*/*",
        });
      const tokenDetails = tokenResponse.tokens?.[0].token;

      if (
        !tokenDetails ||
        !tokenDetails?.collection ||
        !tokenDetails.attributes ||
        !tokenDetails.collection.image ||
        !tokenDetails.collection.name ||
        !tokenDetails.image ||
        !tokenDetails.name
      ) {
        logger.error(
          `couldn't return listing order collection data for ${listings[i].id}`
        );
        continue;
      }

      // create attributes array for discord fields if the attributes exist
      const attributes: { name: string; value: string; inline: boolean }[] =
        tokenDetails.attributes.map((attr) => {
          return {
            name: attr.key ?? "",
            value: attr.value ?? "",
            inline: true,
          };
        }) ?? [];

      const sourceIcon = await handleMediaConversion(
        `${listings[i].source?.icon}`,
        `${listings[i].source?.name}`
      );

      const authorIcon = await handleMediaConversion(
        tokenDetails.collection.image,
        tokenDetails.collection.name
      );

      const image = await handleMediaConversion(
        tokenDetails.image,
        tokenDetails.name
      );

      const listingEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle(`${tokenDetails.name?.trim()} has been listed!`)
        .setAuthor({
          name: `${tokenDetails.collection.name}`,
          url: `https://forgotten.market/${tokenDetails.contract}`,
          iconURL: `attachment://${authorIcon.name}`,
        })
        .setDescription(
          `Item: ${tokenDetails.name}\nPrice: ${listings[i].price?.amount?.native}Ξ ($${listings[i].price?.amount?.usd})\nFrom: ${listings[i].maker}`
        )
        .addFields(attributes)
        .setImage(`attachment://${image.name}`)
        .setFooter({
          text: `${listings[i].source?.name}`,
          iconURL: `attachment://${sourceIcon.name}`,
        })
        .setTimestamp();

      // Generating floor token purchase button
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Purchase")
          .setStyle(5)
          .setURL(
            `https://forgotten.market/${tokenDetails.contract}/${tokenDetails.tokenId}`
          )
      );
      channel.send({
        embeds: [listingEmbed],
        components: [row],
        files: [sourceIcon, authorIcon, image],
      });
    }
    await redis.set("listingsorderid", listings[0].id);
  } catch (e) {
    logger.error(`Error ${e} updating new listings`);
  }
}
