import {
  ActionRowBuilder,
  ButtonBuilder,
  CacheType,
  EmbedBuilder,
  SelectMenuInteraction,
} from "discord.js";
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
    case SelectMenuType.floorMenu: {
      loadingEmbed.setDescription("Loading collection floor price...");
      break;
    }
    default: {
      loadingEmbed.setDescription("Loading...");
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
  if (
    !searchData ||
    !searchData.name ||
    !searchData.rank ||
    !searchData.volume ||
    !searchData.createdAt
  ) {
    logger.error(`Could not collect data for ${JSON.stringify(interaction)}`);
    throw new Error("Could not collect data for selection interaction");
  }

  // Creating new embed for selection
  const { selectionEmbed, attachment } = await selectionEmbedGen(
    searchDataResponse
  );

  /*   let row: ActionRowBuilder<ButtonBuilder> | undefined = undefined; */

  // Adding embed details depending on select menu used
  switch (interaction.customId) {
    case SelectMenuType.statMenu: {
      let stats: { name: string; value: string; inline: boolean }[] = [];
      const createdAt = new Date(
        Date.parse(searchData.createdAt) * 1000
      ).toDateString();
      let generalDesc = `On Sale Count: ${searchData.onSaleCount}\nToken Count: ${searchData.tokenCount}\nCreated: ${createdAt}`;
      let rankDesc = "";
      let volumeDesc = "";

      if (!searchData.description) {
        if (searchData.discordUrl) {
          generalDesc += `\n[Discord](${searchData.discordUrl})`;
        }
        if (searchData.externalUrl) {
          generalDesc += `\n[External Site](${searchData.externalUrl})`;
        }
        if (searchData.twitterUsername) {
          generalDesc += `\n[Twitter](https://twitter.com/${searchData.twitterUsername})`;
        }
      }

      for (const [key, value] of Object.entries(searchData.rank)) {
        rankDesc += `${key}: ${value}\n`;
      }

      for (const [key, value] of Object.entries(searchData.volume)) {
        volumeDesc += `${key}: ${value}\n`;
      }

      stats.push({ name: "General Stats", value: generalDesc, inline: true });
      stats.push({ name: "Rank Stats", value: rankDesc, inline: true });
      stats.push({ name: "Volume Stats", value: volumeDesc, inline: true });

      // Adding details for stat menu selected
      selectionEmbed
        .setTitle(`${searchData.name} Stats`)
        .setDescription(searchData.description ?? "")
        .addFields(stats);
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

        /* row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("Accept Offer")
            .setStyle(5)
            .setURL(`https://www.reservoir.market/collections/${searchData.id}`)
        ); */
      } else {
        selectionEmbed.setDescription(`No bids found for ${searchData.name}`);
      }
      break;
    }
    case SelectMenuType.floorMenu: {
      // Adding details for floor menu selected
      selectionEmbed.setTitle(`${searchData.name} Floor Price`);

      // Return top bid info if it exists, else return no bids message
      if (
        searchData.floorAsk?.price &&
        searchData.floorAsk?.maker &&
        searchData.floorAsk?.token
      ) {
        selectionEmbed.setDescription(
          `${searchData.floorAsk.token?.name} is the floor token, listed for ${
            searchData.floorAsk.price.netAmount?.native ??
            searchData.floorAsk.price.amount?.native
          }Ξ by [${searchData.floorAsk.maker.substring(
            0,
            6
          )}](https://www.reservoir.market/address/${
            searchData.floorAsk.maker
          })`
        );
        /*         row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("Purchase")
            .setStyle(5)
            .setURL(
              `https://www.reservoir.market/${searchData.id}/${searchData.floorAsk.token.tokenId}`
            )
        ); */
      } else {
        selectionEmbed.setDescription(
          `No floor price found for ${searchData.name}`
        );
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
