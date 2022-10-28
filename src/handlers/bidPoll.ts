import Redis from "ioredis";
import { TextChannel, EmbedBuilder } from "discord.js";
const redis = new Redis();
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "../utils/logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

export async function bidPoll(
  channel: TextChannel,
  contractAddress: string
): Promise<void> {
  enum params {
    collection,
    limit,
    accept = "*/*",
  }

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

  if (Number(topBid.event.id) !== Number(initialId)) {
    const success: "OK" = await redis.set("bideventid", topBid.event.id);
    if (success !== "OK") {
      logger.error("Could not set new topbid eventid");
      throw new Error("Could not set new topbid eventid");
    }

    const bidCollectionRes = await sdk.getCollectionsV5({
      id: contractAddress,
      includeTopBid: "false",
      sortBy: "allTimeVolume",
      limit: "1",
      accept: "*/*",
    });

    const bidCollectionResponse =
      bidCollectionRes as paths["/collections/v5"]["get"]["responses"]["200"]["schema"];

    const bidCollection = bidCollectionResponse.collections?.[0];

    if (!bidCollection || !bidCollection.name) {
      logger.error("Could not collect stats");
      throw new Error("Could not collect stats");
    }

    const bidEmbed = new EmbedBuilder()
      .setColor(0x8b43e0)
      .setTitle("New Top Bid!")
      .setAuthor({
        name: bidCollection.name,
        url: "https://reservoir.tools/",
        iconURL: bidCollection.image,
      })
      .setDescription(
        `The top bid on the collection just changed to ${
          topBid.topBid.price
        }Ξ made by [${topBid.topBid.maker.substring(
          0,
          6
        )}](https://www.reservoir.market/address/${topBid.topBid.maker})`
      )
      // FIXME:
      .setThumbnail(bidCollection.image ?? null)
      .setTimestamp();

    channel.send({ embeds: [bidEmbed] });
    logger.info("Successfully alerted new top bid");
  }
}
