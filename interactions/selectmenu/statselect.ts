import { CacheType, EmbedBuilder, SelectMenuInteraction } from "discord.js";
import logger from "../../utils/logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
import { paths } from "@reservoir0x/reservoir-kit-client";

export async function statselect(
  interaction: SelectMenuInteraction<CacheType>
) {
  const id = interaction.values[0];

  if (!id) {
    logger.error("No collection id recieved");
    throw new Error("No collection id recieved");
  }

  const searchDataRes = await sdk.getCollectionsV5({
    id: id,
    includeTopBid: "false",
    sortBy: "allTimeVolume",
    limit: "1",
    accept: "*/*",
  });
  const searchDataResponse =
    searchDataRes as paths["/collections/v5"]["get"]["responses"]["200"]["schema"];

  const searchData = searchDataResponse.collections?.[0];

  if (!searchData || !searchData.name) {
    logger.error("Could not collect stats");
    throw new Error("Could not collect stats");
  }

  const statEmbed = new EmbedBuilder()
    .setColor(0x8b43e0)
    .setTitle(`${searchData.name} Stats`)
    .setAuthor({
      name: searchData.name,
      url: `https://reservoir.tools/${searchData.id}`,
      iconURL:
        searchData.image ??
        "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024",
    })
    .setDescription(
      `Token Count: ${searchData.tokenCount}
      On Sale Count: ${searchData.onSaleCount}
      7 day volume: ${searchData.volume?.["7day"]}`
    )
    .setThumbnail(
      searchData.image ??
        "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024"
    )
    .setTimestamp();

  await interaction.update({
    embeds: [statEmbed],
  });
  logger.info("Updated stats embed");
}
