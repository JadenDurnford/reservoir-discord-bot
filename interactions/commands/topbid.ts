import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";
import logger from "../../utils/logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
import { paths } from "@reservoir0x/reservoir-kit-client";

export async function topbid(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const { value: name } = interaction.options.get("name", true);

  if (!name) {
    logger.error("No collection name recieved");
    throw new Error("No collection name recieved");
  }

  const searchDataRes = await sdk.getCollectionsV5({
    name: name,
    includeTopBid: "false",
    sortBy: "allTimeVolume",
    limit: "5",
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
  let selectOptions: { label: string; value: string }[] = [];

  searchData.forEach((collection, i) => {
    fieldValue += `**${i + 1}. [${
      collection.name
    }](https://www.reservoir.market/collections/${collection.id})**
    `;
    if (!collection.name || !collection.id) {
      logger.error("Could not collect collection details");
      throw new Error("Could not collect collection details");
    }
    selectOptions.push({ label: collection.name, value: collection.id });
  });

  const bidEmbed = new EmbedBuilder()
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
      ${fieldValue}
      Please select the collection below to view top bid`
        : `**No results found for "${name}"**`
    )
    .setThumbnail(
      "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096"
    )
    .setTimestamp();

  const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    new SelectMenuBuilder()
      .setCustomId("bidselect")
      .setPlaceholder("Nothing selected")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(selectOptions)
  );

  await interaction.reply({
    embeds: [bidEmbed],
    components: [row],
  });

  logger.info(`Successfully called topbid command: name=${name}`);
}
