import { CacheType, SelectMenuInteraction, EmbedBuilder } from "discord.js";
import logger from "../../utils/logger";
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
import { paths } from "@reservoir0x/reservoir-kit-client";

export async function bidselect(interaction: SelectMenuInteraction<CacheType>) {
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

  if (searchData.topBid?.price && searchData.topBid?.maker) {
    if (searchData.topBid.price.netAmount?.native) {
      const bidEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle(`Collection Top Bid`)
        .setAuthor({
          name: searchData.name,
          url: "https://reservoir.tools/",
          iconURL: searchData.image,
        })
        .setDescription(
          `The top bid on the collection is ${
            searchData.topBid.price.netAmount.native
          }Ξ made by [${searchData.topBid.maker.substring(
            0,
            6
          )}](https://www.reservoir.market/address/${searchData.topBid.maker})`
        )
        .setThumbnail(searchData.image ?? null)
        .setTimestamp();

      await interaction.update({
        embeds: [bidEmbed],
      });
      return;
    } else if (searchData.topBid.price.amount?.native) {
      const bidEmbed = new EmbedBuilder()
        .setColor(0x8b43e0)
        .setTitle(`Collection Top Bid`)
        .setAuthor({
          name: searchData.name,
          url: "https://reservoir.tools/",
          iconURL: `${searchData.image}`,
        })
        .setDescription(
          `The top bid on the collection is ${
            searchData.topBid.price.amount.native
          }Ξ made by [${searchData.topBid.maker.substring(
            0,
            6
          )}](https://www.reservoir.market/address/${searchData.topBid.maker})`
        )
        .setThumbnail(searchData.image ?? null)
        .setTimestamp();

      await interaction.update({
        embeds: [bidEmbed],
      });
      return;
    }
  } else {
    const bidEmbed = new EmbedBuilder()
      .setColor(0x8b43e0)
      .setTitle(`Collection Top Bid`)
      .setAuthor({
        name: searchData.name,
        url: "https://reservoir.tools/",
        iconURL: `${searchData.image}`,
      })
      .setDescription(`No bids found for ${searchData.name}`)
      .setThumbnail(searchData.image ?? null)
      .setTimestamp();

    await interaction.update({
      embeds: [bidEmbed],
    });
  }
}
