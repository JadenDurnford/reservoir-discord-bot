import Redis from "ioredis";
import { TextChannel, EmbedBuilder } from "discord.js";
const redis = new Redis();
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "../utils/logger";
import constants from "../utils/constants";
import getCollection from "./getCollection";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

export async function bidPoll(channel: TextChannel, contractAddress: string) {
  // Getting top bid events
  const topBidResponse: paths["/events/collections/top-bid/v1"]["get"]["responses"]["200"]["schema"] =
    await sdk.getEventsCollectionsTopbidV1({
      collection: contractAddress,
      sortDirection: "desc",
      limit: "1",
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

  // Pull cooldown for floor ask alert from Redis
  let eventCooldown: string | null = await redis.get("bidcooldown");

  // If most recent event doesn't match cached event and process not on cooldown generate alert
  if (Number(topBid.event.id) !== Number(cachedId) && !eventCooldown) {
    // setting updated top bid event id
    const success: "OK" = await redis.set("bideventid", topBid.event.id);
    // setting updated top bid cooldown
    const cooldownSuccess: "OK" = await redis.set(
      "bidcooldown",
      "true",
      "EX",
      60
    );

    // Log failure + throw if top bid info couldn't be set
    if (success !== "OK" || cooldownSuccess !== "OK") {
      logger.error("Could not set new topbid eventid");
      throw new Error("Could not set new topbid eventid");
    }

    // Getting top bid collection
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

    // Sending top bid token Discord alert
    channel.send({ embeds: [bidEmbed] });
    logger.info(
      `Successfully alerted new top bid by ${JSON.stringify(
        topBid.topBid.maker
      )}`
    );
  }
}
