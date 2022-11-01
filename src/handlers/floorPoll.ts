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
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");

/**
 * Check floor price events to see if it has changed since last alert
 * @param {TextChannel} channel channel to send floor price alert to
 * @param {string} contractAddress collection to check for top bid events
 */
export async function floorPoll(
  channel: TextChannel,
  contractAddress: string,
  apiKey: string,
  redis: Redis
) {
  // Authorizing with Reservoir API Key
  await sdk.auth(apiKey);

  // Getting floor ask events from Reservoir
  const floorAskResponse: paths["/events/collections/floor-ask/v1"]["get"]["responses"]["200"]["schema"] =
    await sdk.getEventsCollectionsFlooraskV1({
      collection: contractAddress,
      sortDirection: "desc",
      limit: 1,
      accept: "*/*",
    });

  // Getting the most recent floor ask event
  const floorAsk = floorAskResponse.events?.[0];

  // Log failure + throw if floor event couldn't be pulled
  if (
    !floorAsk?.event?.id ||
    !floorAsk.floorAsk?.tokenId ||
    !floorAsk.floorAsk?.price ||
    !floorAsk?.event?.createdAt
  ) {
    logger.error("Could not pull floor ask");
    throw new Error("Could not pull floor ask");
  }

  // Pull cached floor ask event id from Redis
  const cachedId: string | null = await redis.get("flooreventid");
  // Hot path: check recent event doesn't match cached event

  // If most recent event matchs cached event exit function
  if (Number(floorAsk.event.id) === Number(cachedId)) {
    return;
  }

  // Pull cooldown for floor ask alert from Redis
  let eventCooldown: string | null = await redis.get("floorcooldown");

  // Pull cached floor ask price from Redis
  const cachedPrice: string | null = await redis.get("floorprice");

  // On X% change in floor ask override alert cooldown
  if (
    Number(cachedPrice) / Number(floorAsk.floorAsk.price) >
      1 + constants.PRICE_CHANGE_OVERRIDE ||
    Number(cachedPrice) / Number(floorAsk.floorAsk.price) <
      1 - constants.PRICE_CHANGE_OVERRIDE
  ) {
    eventCooldown = null;
  }

  // If process is not on cooldown generate alert
  if (!eventCooldown) {
    // setting updated floor ask event id
    const idSuccess: "OK" = await redis.set("flooreventid", floorAsk.event.id);
    // setting updated floor ask cooldown
    const cooldownSuccess: "OK" = await redis.set(
      "floorcooldown",
      "true",
      "EX",
      constants.ALERT_COOLDOWN
    );
    // setting updated floor ask price
    const priceSuccess: "OK" = await redis.set(
      "floorprice",
      floorAsk.floorAsk.price
    );

    // Log failure + throw if floor ask info couldn't be set
    if (
      idSuccess !== "OK" ||
      cooldownSuccess !== "OK" ||
      priceSuccess !== "OK"
    ) {
      logger.error("Could not set new floorprice info");
      throw new Error("Could not set new floorprice info");
    }

    // Getting floor ask token from Reservoir
    const tokenResponse: paths["/tokens/v5"]["get"]["responses"]["200"]["schema"] =
      await sdk.getTokensV5({
        tokens: [`${contractAddress}:${floorAsk.floorAsk.tokenId}`],
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

    // create attributes array for discord fields if the attributes exist
    const attributes: { name: string; value: string; inline: boolean }[] =
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
        `${floorToken.token.name} is now the floor token, listed for ${
          floorAsk.floorAsk.price
        }Ξ by [${floorToken.token.owner.substring(
          0,
          6
        )}](https://www.reservoir.market/address/${
          floorToken.token.owner
        })\nLast Sale: ${floorToken.token.lastSell.value}Ξ\nRarity Rank: ${
          floorToken.token.rarityRank
        }`
      )
      .addFields(attributes)
      .setThumbnail(`${floorToken.token.image}`)
      .setTimestamp(new Date(floorAsk.event.createdAt));

    // Generating floor token purchase button
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Purchase")
        .setStyle(5)
        .setURL(
          `https://www.reservoir.market/${contractAddress}/${floorAsk.floorAsk.tokenId}`
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
