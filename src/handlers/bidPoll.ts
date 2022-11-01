import Redis from "ioredis";
import {
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "../utils/logger";
import constants from "../utils/constants";
import getCollection from "./getCollection";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

/**
 * Check top bid events to see if a new one was created since last alert
 * @param {TextChannel} channel channel to send top bid alert to
 * @param {string} contractAddress collection to check for top bid events
 */
export async function bidPoll(
  channel: TextChannel,
  contractAddress: string,
  apiKey: string,
  redis: Redis
) {
  // Authorizing with Reservoir API Key
  await sdk.auth(apiKey);

  // Getting top bid events from Reservoir
  const topBidResponse: paths["/events/collections/top-bid/v1"]["get"]["responses"]["200"]["schema"] =
    await sdk.getEventsCollectionsTopbidV1({
      collection: contractAddress,
      sortDirection: "desc",
      limit: 1,
      accept: "*/*",
    });

  // Getting the most recent top bid event
  const topBid = topBidResponse.events?.[0];

  // Log failure + throw if top bid event couldn't be pulled
  if (!topBid?.event?.id || !topBid?.topBid?.price || !topBid?.topBid?.maker) {
    logger.error("Could not pull top bid");
    throw new Error("Could not pull top bid");
  }

  // Pull cached top bid event id from Redis
  const cachedId: string | null = await redis.get("bideventid");

  // If most recent event matches cached event exit function
  if (Number(topBid.event.id) === Number(cachedId)) {
    return;
  }

  // Pull cooldown for floor ask alert from Redis
  const eventCooldown: string | null = await redis.get("bidcooldown");

  // Pull cached top bid price from Redis
  const cachedPrice: string | null = await redis.get("bidprice");

  // If the cached price does not match the most recent price (false updates due to sudoswap pools) and process not on cooldown generate alert
  if (Number(topBid.topBid.price) !== Number(cachedPrice) && !eventCooldown) {
    // setting updated top bid event id
    const success: "OK" = await redis.set("bideventid", topBid.event.id);
    // setting updated top bid cooldown
    const cooldownSuccess: "OK" = await redis.set(
      "bidcooldown",
      "true",
      "EX",
      constants.ALERT_COOLDOWN
    );

    // Log failure + throw if top bid info couldn't be set
    if (success !== "OK" || cooldownSuccess !== "OK") {
      logger.error("Could not set new topbid eventid");
      throw new Error("Could not set new topbid eventid");
    }

    // Getting top bid collection from Reservoir
    const bidCollectionResponse = await getCollection(
      undefined,
      contractAddress,
      1,
      true
    );

    // Getting top bid collection details
    const bidCollection = bidCollectionResponse?.[0];

    // Log failure + throw if collection details don't exist
    if (!bidCollection || !bidCollection.name) {
      logger.error("Could not collect stats");
      throw new Error("Could not collect stats");
    }

    // Generating top bid token Discord alert embed
    const bidEmbed = new EmbedBuilder()
      .setColor(0x8b43e0)
      .setTitle("New Top Bid!")
      .setAuthor({
        name: bidCollection.name,
        url: `https://reservoir.market/collections/${bidCollection.id}`,
        iconURL: bidCollection.image ?? constants.RESERVOIR_ICON,
      })
      .setDescription(
        `The top bid on the collection just changed to ${
          topBid.topBid.price
        }Ξ made by [${topBid.topBid.maker.substring(
          0,
          6
        )}](https://www.reservoir.market/address/${topBid.topBid.maker})`
      )
      .setThumbnail(bidCollection.image ?? constants.RESERVOIR_ICON)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Accept offer")
        .setStyle(5)
        .setURL(
          `https://www.reservoir.market/collections/${topBid.topBid.contract}`
        )
    );

    // Sending top bid token Discord alert
    channel.send({ embeds: [bidEmbed], components: [row] });
    logger.info(
      `Successfully alerted new top bid by ${JSON.stringify(
        topBid.topBid.maker
      )}`
    );
  }
}
