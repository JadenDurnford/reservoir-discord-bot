import Redis from "ioredis";
import {
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
const redis = new Redis();
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "../utils/logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

export async function floorPoll(channel: TextChannel, contractAddress: string) {
  // Getting floor ask events
  const floorAskResponse: paths["/events/collections/floor-ask/v1"]["get"]["responses"]["200"]["schema"] =
    await sdk.getEventsCollectionsFlooraskV1({
      collection: contractAddress,
      sortDirection: "desc",
      limit: "1",
      accept: "*/*",
    });

  // Getting the most recent floor ask event
  const floorAsk = floorAskResponse.events?.[0];

  // Log failure + throw if floor event couldn't be pulled
  if (
    !floorAsk?.event?.id ||
    !floorAsk.collection?.id ||
    !floorAsk.floorAsk?.tokenId ||
    !floorAsk.floorAsk?.price
  ) {
    logger.error("Could not pull floor ask");
    throw new Error("Could not pull floor ask");
  }

  // Pull cached floor ask event id from Redis
  const cachedId: string | null = await redis.get("flooreventid");

  // If most recent event doesn't match cached event generate alert
  if (Number(floorAsk.event.id) !== Number(cachedId)) {
    // setting updated floor ask event id
    const success: "OK" = await redis.set("flooreventid", floorAsk.event.id);

    // Log failure + throw if event id couldn't be set
    if (success !== "OK") {
      logger.error("Could not set new floorprice eventid");
      throw new Error("Could not set new floorprice eventid");
    }

    // Getting floor ask token
    const tokenResponse: paths["/tokens/v5"]["get"]["responses"]["200"]["schema"] =
      await sdk.getTokensV5({
        tokens: [`${floorAsk.collection.id}:${floorAsk.floorAsk.tokenId}`],
        sortBy: "floorAskPrice",
        limit: 1,
        includeTopBid: false,
        includeAttributes: true,
        accept: "*/*",
      });

    // Getting the token details
    const floorToken = tokenResponse.tokens?.[0];

    // Log failure + throw if token details don't exist
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
    let attributes: { name: string; value: string; inline: boolean }[] =
      floorToken.token.attributes?.map((attr) => {
        return { name: attr.key ?? "", value: attr.value ?? "", inline: true };
      }) ?? [];

    // Generating floor token Discord alert embed
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

    // Generating floor token purchase button
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Purchase")
        .setStyle(5)
        .setURL(
          `https://www.reservoir.market/${floorAsk.collection.id}/${floorAsk.floorAsk.tokenId}`
        )
    );

    // Sending floor token Discord alert
    channel.send({ embeds: [floorEmbed], components: [row] });
    logger.info(
      `Successfully alerted new floor price for ${JSON.stringify(
        floorToken.token
      )}`
    );
  }
}
