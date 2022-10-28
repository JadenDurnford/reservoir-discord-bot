import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import logger from "../../utils/logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
import { paths } from "@reservoir0x/reservoir-kit-client";

export async function collection(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const { value: name } = interaction.options.get("name", true);
  let limit = interaction.options.get("limit", false)?.value;

  if (!name) {
    logger.error("No collection name recieved");
    throw new Error("No collection name recieved");
  }

  if (!limit) {
    limit = 5;
  }

  if (typeof limit !== "number") {
    logger.error("Unknown limit value received");
    throw new Error("Unknown limit value received");
  }

  if (limit > 20) {
    limit = 20;
  } else if (limit < 1) {
    limit = 1;
  }

  const searchDataRes = await sdk.getCollectionsV5({
    name: name,
    includeTopBid: "false",
    sortBy: "allTimeVolume",
    limit: limit,
    accept: "*/*",
  });
  const searchDataResponse =
    searchDataRes as paths["/collections/v5"]["get"]["responses"]["200"]["schema"];

  const searchData = searchDataResponse.collections;

  if (!searchData) {
    logger.error("Could not collect collections");
    throw new Error("Could not collect collections");
  }

  let fieldValue = "";

  searchData.forEach((collection) => {
    fieldValue += `**[${collection.name}](https://www.reservoir.market/collections/${collection.id})**
    `;
  });

  const collectionEmbed = new EmbedBuilder()
    .setColor(0x8b43e0)
    .setTitle("Search Results")
    .setAuthor({
      name: "Reservoir Bot",
      url: "https://reservoir.tools/",
      iconURL:
        "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096",
    })
    .setDescription(
      searchData.length != 0
        ? `**The top ${searchData.length} results for "${name}" are:**
      ${fieldValue}`
        : `**No results found for "${name}"**`
    )
    .setThumbnail(
      "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096"
    )
    .setTimestamp();

  await interaction.reply({
    embeds: [collectionEmbed],
  });
  logger.info(
    `Successfully called collection command: name=${name}, limit=${limit}`
  );
}
