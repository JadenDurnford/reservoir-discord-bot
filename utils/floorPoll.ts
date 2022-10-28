import Redis from "ioredis";
import {
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
const redis = new Redis();
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "./logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

export async function floorPoll(channel: TextChannel, contractAddress: string) {
  const floorAskRes = await sdk.getEventsCollectionsFlooraskV1({
    collection: contractAddress,
    sortDirection: "desc",
    limit: "1",
    accept: "*/*",
  });
  const floorAskResponse =
    floorAskRes as paths["/events/collections/floor-ask/v1"]["get"]["responses"]["200"]["schema"];

  const floorAsk = floorAskResponse.events?.[0];

  if (
    !floorAsk?.event?.id ||
    !floorAsk.collection?.id ||
    !floorAsk.floorAsk?.tokenId ||
    !floorAsk.floorAsk?.price
  ) {
    logger.error("Could not pull floor ask");
    throw new Error("Could not pull floor ask");
  }

  // pull initial floor ask event id
  const initialId: string | null = await redis.get("flooreventid");
  /* logger.info(
    "initial floor id: " +
      typeof Number(initialId) +
      " | current floor id: " +
      typeof floorAsk.event.id
  ); */
  if (Number(floorAsk.event.id) !== Number(initialId)) {
    // setting new floor ask event id
    const success: "OK" = await redis.set(
      "flooreventid",
      floorAsk.event.id.toString()
    );
    if (success !== "OK") {
      logger.error("Could not set new floorprice eventid");
      throw new Error("Could not set new floorprice eventid");
    }

    const tokenRes = await sdk.getTokensV5({
      tokens: `${floorAsk.collection.id}:${floorAsk.floorAsk.tokenId}`,
      sortBy: "floorAskPrice",
      limit: "1",
      includeTopBid: "false",
      includeAttributes: "false",
      accept: "*/*",
    });
    const tokenResponse =
      tokenRes as paths["/tokens/v5"]["get"]["responses"]["200"]["schema"];

    const floorToken = tokenResponse.tokens?.[0];

    if (
      !floorToken?.token?.collection ||
      !floorToken?.token?.owner ||
      !floorToken?.token?.lastSell ||
      !floorToken?.token?.name
    ) {
      logger.error("Could not pull floor token");
      throw new Error("Could not pull floor token");
    }

    // create attributes array if they exist
    let attributes: { name: string; value: string; inline: boolean }[] | [];
    if (floorToken.token.attributes) {
      attributes = floorToken.token.attributes.map((attr) => {
        return { name: attr.key ?? "", value: attr.value ?? "", inline: true };
      });
    } else {
      attributes = [];
    }

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
          floorAsk.floorAsk.price
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
          `https://www.reservoir.market/${floorAsk.collection.id}/${floorAsk.floorAsk.tokenId}`
        )
    );
    channel.send({ embeds: [floorEmbed], components: [row] });
    logger.info("Successfully alerted new floor price");
  }
  setTimeout(floorPoll, 2500, channel, contractAddress);
}
