import axios from "axios";
import Redis from "ioredis";
import {
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
const redis = new Redis();
// import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "./logger";

export async function floorPoll(channel: TextChannel, contractAddress: string) {
  await redis.connect();

  const {
    data: {
      events: [res],
    },
  } = await axios.get(
    `https://api.reservoir.tools/events/collections/floor-ask/v1?collection=${contractAddress}&sortDirection=desc&limit=1`
  );
  /* const response =
    res as paths["/events/collections/floor-ask/v1"]["get"]["responses"]["200"]["schema"]["events"][]; */
  if (!res) {
    logger.error("Could not pull floor ask");
    throw new Error("Could not pull floor ask");
  }

  const initialId: string | null = await redis.get("flooreventid");
  if (res.event.id !== initialId) {
    const success: "OK" = await redis.set("flooreventid", res.event.id);
    if (success !== "OK") {
      logger.error("Could not set new floorprice eventid");
      throw new Error("Could not set new floorprice eventid");
    }

    const {
      data: {
        tokens: [floorToken],
      },
    } = await axios.get(
      `https://api.reservoir.tools/tokens/v5?tokens=${res.floorAsk.contract}%3A${res.floorAsk.tokenId}&sortBy=floorAskPrice&limit=1&includeTopBid=false&includeAttributes=true`
    );

    if (!floorToken) {
      logger.error("Could not pull floor token");
      throw new Error("Could not pull floor token");
    }

    const attributes = floorToken.token.attributes.map((attr) => {
      return { name: attr.key, value: attr.value, inline: true };
    });
    const floorEmbed = new EmbedBuilder()
      .setColor(0x8b43e0)
      .setTitle("New Floor Listing!")
      .setAuthor({
        name: `${floorToken.token.collection.name}`,
        url: "https://reservoir.tools/",
        iconURL: `${floorToken.token.collection.image}`,
      })
      .setDescription(
        `${floorToken.token.name} was just listed for ${
          res.floorAsk.price
        }Ξ by [${floorToken.token.owner.substring(
          0,
          6
        )}](https://www.reservoir.market/address/${floorToken.token.owner})
        Last Sale: ${floorToken.token.lastSell.value}Ξ
        Rarity Rank: ${floorToken.token.rarityRank}
        
        `
      )
      .addFields(attributes)
      .setThumbnail(`${floorToken.token.image}`)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Purchase")
        .setStyle(5)
        .setURL(
          `https://www.reservoir.market/${res.floorAsk.contract}/${res.floorAsk.tokenId}`
        )
    );
    channel.send({ embeds: [floorEmbed], components: [row] });
  }

  setTimeout(floorPoll, 2500);
}
