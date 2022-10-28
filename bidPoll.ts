import Redis from "ioredis";
import { TextChannel, EmbedBuilder } from "discord.js";
const redis = new Redis();
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "./logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

export async function bidPoll(channel: TextChannel, contractAddress: string) {
  const topBidRes = await sdk.getEventsCollectionsTopbidV1({
    collection: contractAddress,
    sortDirection: "desc",
    limit: "1",
    accept: "*/*",
  });
  const topBidResponse =
    topBidRes as paths["/events/collections/top-bid/v1"]["get"]["responses"]["200"]["schema"];

  const topBid = topBidResponse.events?.[0];

  if (!topBid?.event?.id || !topBid?.topBid?.price || !topBid?.topBid?.maker) {
    logger.error("Could not pull top bid");
    throw new Error("Could not pull top bid");
  }

  const initialId: string | null = await redis.get("bideventid");
  if (topBid.event.id !== Number(initialId)) {
    const success: "OK" = await redis.set(
      "bideventid",
      topBid.event.id.toString()
    );
    if (success !== "OK") {
      logger.error("Could not set new topbid eventid");
      throw new Error("Could not set new topbid eventid");
    }

    const bidCollection = await sdk.getCollectionsV5({
      id: contractAddress,
      includeTopBid: "false",
      sortBy: "allTimeVolume",
      limit: "1",
      accept: "*/*",
    });

    const bidEmbed = new EmbedBuilder()
      .setColor(0x8b43e0)
      .setTitle("New Top Bid!")
      .setAuthor({
        name: `${bidCollection.name}`,
        url: "https://reservoir.tools/",
        iconURL: `${bidCollection.image}`,
      })
      .setDescription(
        `The top bid on the collection just changed to ${
          topBid.topBid.price
        }Ξ made by [${topBid.topBid.maker.substring(
          0,
          6
        )}](https://www.reservoir.market/address/${topBid.topBid.maker})`
      )
      .setThumbnail(`${bidCollection.image}`)
      .setTimestamp();
    channel.send({ embeds: [bidEmbed] });
    logger.info("Successfully alert new top bid");
  }
  setTimeout(bidPoll, 2500);
}
