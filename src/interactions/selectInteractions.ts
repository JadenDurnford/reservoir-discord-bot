import { CacheType, SelectMenuInteraction } from "discord.js";
import logger from "../utils/logger";
import getCollection from "../handlers/getCollection";
import { selectionEmbedGen } from "../utils/generators";
import { selectMenuType } from "../utils/types";

export async function replySelectInteraction(
  interaction: SelectMenuInteraction<CacheType>
) {
  const id = interaction.values[0];

  if (!id) {
    logger.error(
      `No collection id received for ${JSON.stringify(interaction)}`
    );
    throw new Error("No collection id received");
  }

  const searchDataResponse = await getCollection(undefined, id, 1, true);

  // Pulling first collection passed to get stats
  const searchData = searchDataResponse?.[0];

  if (!searchData || !searchData.name) {
    logger.error(`Could not collect data for ${JSON.stringify(interaction)}`);
    throw new Error("Could not collect data for selection interaction");
  }
  const selectionEmbed = selectionEmbedGen(searchDataResponse);

  switch (interaction.customId) {
    case selectMenuType.statMenu: {
      selectionEmbed.setTitle(`${searchData.name} Stats`).setDescription(
        `Token Count: ${searchData.tokenCount}
        On Sale Count: ${searchData.onSaleCount}
        7 day volume: ${searchData.volume?.["7day"]}`
      );
      break;
    }
    case selectMenuType.bidMenu: {
      selectionEmbed.setTitle(`${searchData.name} Top Bid`);

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
      logger.error("Unknown select menu interaction");
      await interaction.update({
        content: "Error: Unknown Selection",
      });
    }
  }
  await interaction.reply({
    embeds: [selectionEmbed],
  });
  logger.info(
    `Updated embed for select interaction ${JSON.stringify(interaction)}`
  );
}
