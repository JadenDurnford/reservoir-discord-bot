import axios from "axios";
import Redis from "ioredis";
import { TextChannel, EmbedBuilder } from "discord.js";
const redis = new Redis();
import logger from "./logger";

export async function bidPoll(channel: TextChannel, contractAddress: string) {
  await redis.connect();

  const {
    data: {
      events: [bidData],
    },
  } = await axios.get(
    `https://api.reservoir.tools/events/collections/top-bid/v1?collection=${contractAddress}&sortDirection=desc&limit=1`
  );

  if (!bidData) {
    logger.error("Could not pull top bid");
    throw new Error("Could not pull top bid");
  }

  const initialId: string | null = await redis.get("bideventid");
  if (bidData.event.id !== initialId) {
    const success: "OK" = await redis.set("bideventid", bidData.topBid.price);
    if (success !== "OK") {
      logger.error("Could not set new topbid eventid");
      throw new Error("Could not set new topbid eventid");
    }
    const {
      data: {
        collections: [bidCollData],
      },
    } = await axios.get(
      `https://api.reservoir.tools/collections/v5?id=${contractAddress}&includeTopBid=false&sortBy=allTimeVolume&limit=1`
    );
    const bidEmbed = new EmbedBuilder()
      .setColor(0x8b43e0)
      .setTitle("New Top Bid!")
      .setAuthor({
        name: `${bidCollData.name}`,
        url: "https://reservoir.tools/",
        iconURL: `${bidCollData.image}`,
      })
      .setDescription(
        `The top bid on the collection just went up to ${
          bidData.topBid.price
        }Ξ made by [${bidData[0].topBid.maker.substring(
          0,
          6
        )}](https://www.reservoir.market/address/${bidData.topBid.maker})`
      )
      .setThumbnail(`${bidCollData.image}`)
      .setTimestamp();
    channel.send({ embeds: [bidEmbed] });
  }
  setTimeout(bidPoll, 2500);
}
