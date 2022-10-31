import { CacheType, EmbedBuilder, SelectMenuInteraction } from "discord.js";
import logger from "../utils/logger";
import getCollection from "../handlers/getCollection";
import { selectionEmbedGen } from "../utils/generators";
import { SelectMenuType } from "../utils/types";
import constants from "../utils/constants";

/**
 * Handle to discord select menu interaction
 * @param {SelectMenuInteraction<CacheType>} interaction discord select menu interaction
 */
export async function replySelectInteraction(
  interaction: SelectMenuInteraction<CacheType>
) {
  // Defer update to give time for image processing
  await interaction.deferUpdate();

  // Building loading embed to display while loading user selection
  let loadingEmbed = new EmbedBuilder()
    .setColor(0x8b43e0)
    .setTitle("Loading...")
    .setAuthor({
      name: "Reservoir Bot",
      url: "https://reservoir.tools/",
      iconURL: constants.RESERVOIR_ICON,
    })
    .setThumbnail(constants.RESERVOIR_ICON)
    .setTimestamp();

  switch (interaction.customId) {
    case SelectMenuType.statMenu: {
      loadingEmbed.setDescription("Loading collection stats...");
      break;
    }
    case SelectMenuType.bidMenu: {
      loadingEmbed.setDescription("Loading collection top bid...");
      break;
    }
  }

  // Displaying loading embed while loading user selection
  await interaction.editReply({
    embeds: [loadingEmbed],
    files: [],
  });

  // Set the collection id
  const id = interaction.values[0];

  // Log failure + throw if collection id not provided
  if (!id) {
    logger.error(
      `No collection id received for ${JSON.stringify(interaction)}`
    );
    throw new Error("No collection id received");
  }

  // Getting collection data from Reservoir
  const searchDataResponse = await getCollection(undefined, id, 1, true);

  // Pulling first collection passed to get stats
  const searchData = searchDataResponse?.[0];

  // Log failure + throw if collection data not collected
  if (!searchData || !searchData.name) {
    logger.error(`Could not collect data for ${JSON.stringify(interaction)}`);
    throw new Error("Could not collect data for selection interaction");
  }

  // Creating new embed for selection
  const { selectionEmbed, attachment } = await selectionEmbedGen(
    searchDataResponse
  );

  // Adding embed details depending on select menu used
  switch (interaction.customId) {
    case SelectMenuType.statMenu: {
      // Adding details for stat menu selected
      selectionEmbed
        .setTitle(`${searchData.name} Stats`)
        .setDescription(
          `Token Count: ${searchData.tokenCount}\nOn Sale Count: ${searchData.onSaleCount}\n7 day volume: ${searchData.volume?.["7day"]}`
        );
      break;
    }
    case SelectMenuType.bidMenu: {
      // Adding details for bid menu selected
      selectionEmbed.setTitle(`${searchData.name} Top Bid`);

      // Return top bid info if it exists, else return no bids message
      if (searchData.topBid?.price && searchData.topBid?.maker) {
        selectionEmbed.setDescription(
          `The top bid on the collection is ${
            searchData.topBid.price.netAmount?.native ??
            searchData.topBid.price.amount?.native
          }Ξ made by [${searchData.topBid.maker.substring(
            0,
            6
          )}](https://www.reservoir.market/address/${searchData.topBid.maker})`
        );
      } else {
        selectionEmbed.setDescription(`No bids found for ${searchData.name}`);
      }
      break;
    }
    default: {
      // Log failure + throw if select menu interaction is not recognized
      logger.error("Unknown select menu interaction");
      await interaction.editReply({
        content: "Error: Unknown Selection",
      });
      return;
    }
  }

  // Update embed to display selected information
  await interaction.editReply({
    content: "",
    embeds: [selectionEmbed],
    files: attachment ? [attachment] : [],
  });

  // Log success
  logger.info(`Updated embed for select interaction ${id}`);
}
