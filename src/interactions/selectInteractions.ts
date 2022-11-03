import {
  ActionRowBuilder,
  ButtonBuilder,
  CacheType,
  SelectMenuInteraction,
  TextBasedChannel,
} from "discord.js";
import logger from "../utils/logger";
import getCollection from "../handlers/getCollection";
import { selectionEmbedGen } from "../utils/generators";
import { SelectMenuType } from "../utils/types";
import Redis from "ioredis";

/**
 * Handle to discord select menu interaction
 * @param {SelectMenuInteraction<CacheType>} interaction discord select menu interaction
 */
export async function replySelectInteraction(
  interaction: SelectMenuInteraction<CacheType>,
  redis: Redis,
  channel: TextBasedChannel
) {
  try {
    // Defer update to give time for image processing
    const message = await interaction.deferReply({ fetchReply: true });

    // Check if the reference message is returned
    if (message.reference?.messageId) {
      // Get the reference message
      const messageDet = await channel.messages.fetch(
        message.reference.messageId
      );
      // Update reference message to reset select menus to placeholder
      await interaction.webhook.editMessage(messageDet, "");
      // Get the previous message id sent by reference
      const oldMessageId = await redis.get(message.reference.messageId);
      // If the previous message exists, delete it
      if (oldMessageId) {
        const oldMessage = await channel.messages.fetch(oldMessageId);
        oldMessage.delete();
      }
      // Set the new message id
      await redis.set(message.reference.messageId, message.id);
    }

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
    const { selectionEmbed, attachment, bannerAttachment, url } =
      await selectionEmbedGen(searchDataResponse, interaction.customId);

    let row: ActionRowBuilder<ButtonBuilder> | undefined = undefined;

    // Adding embed details depending on select menu used
    switch (interaction.customId) {
      case SelectMenuType.statMenu: {
        let stats: { name: string; value: string; inline: boolean }[] = [];
        let generalDesc = `On Sale Count: ${searchData.onSaleCount}\nToken Count: ${searchData.tokenCount}`;
        let rankDesc = "";
        let volumeDesc = "";

        if (searchData.discordUrl) {
          generalDesc += `\n[Discord](${searchData.discordUrl})`;
        }
        if (searchData.externalUrl) {
          generalDesc += `\n[External Site](${searchData.externalUrl})`;
        }
        if (searchData.twitterUsername) {
          generalDesc += `\n[Twitter](https://twitter.com/${searchData.twitterUsername})`;
        }

        for (const [key, value] of Object.entries(searchData.rank)) {
          rankDesc += `${key}: ${value ?? "N/A"}\n`;
        }

        for (const [key, value] of Object.entries(searchData.volume)) {
          volumeDesc += `${key}: ${value ?? "N/A"}\n`;
        }

        stats.push(
          { name: "General Stats", value: generalDesc, inline: true },
          { name: "Rank Stats", value: rankDesc, inline: true },
          { name: "Volume Stats", value: volumeDesc, inline: true }
        );

        // Adding details for stat menu selected
        selectionEmbed
          .setTitle(`${searchData.name} Stats`)
          .setDescription(
            searchData.description && searchData.description.length > 0
              ? searchData.description
              : "No description found."
          )
          .addFields(stats)
          .setImage(
            bannerAttachment
              ? `attachment://${bannerAttachment.name}`
              : searchData.banner ?? null
          );
        break;
      }
      case SelectMenuType.bidMenu: {
        // Adding details for bid menu selected
        selectionEmbed.setTitle(`${searchData.name} Top Bid`);
        // Return top bid info if it exists, else return no bids message
        if (searchData.topBid?.price?.amount && searchData.topBid?.maker) {
          selectionEmbed.setDescription(
            `The top bid on the collection is ${
              searchData.topBid.price.amount.native
            }Ξ made by [${searchData.topBid.maker.substring(
              0,
              6
            )}](https://www.reservoir.market/address/${
              searchData.topBid.maker
            })`
          );

          row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel("Accept Offer").setStyle(5).setURL(url)
          );
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
          searchData.floorAsk?.token?.tokenId &&
          searchData.floorAsk?.sourceDomain
        ) {
          selectionEmbed.setDescription(
            `${
              searchData.floorAsk.token?.name
            } is the floor token, listed for ${
              searchData.floorAsk.price.netAmount?.native ??
              searchData.floorAsk.price.amount?.native
            }Ξ by [${searchData.floorAsk.maker.substring(
              0,
              6
            )}](https://www.reservoir.market/address/${
              searchData.floorAsk.maker
            })`
          );
          row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("Purchase")
              .setStyle(5)
              .setURL(
                `https://api.reservoir.tools/redirect/sources/${searchData.floorAsk.sourceDomain}/tokens/${searchData.floorAsk.token.contract}%3A${searchData.floorAsk.token.tokenId}/link/v2`
              )
          );
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

    let fileArray = [];

    if (attachment) {
      fileArray.push(attachment);
    }
    if (bannerAttachment) {
      fileArray.push(bannerAttachment);
    }

    // Update embed to display selected information
    await interaction.editReply({
      content: "",
      embeds: [selectionEmbed],
      files: fileArray,
      components: row ? [row] : [],
    });

    // Log success
    logger.info(
      `User ${interaction.member?.user.username}${interaction.member?.user.discriminator} Updated embed for select interaction ${id}`
    );
  } catch (e) {
    await interaction.editReply(
      "Something went wrong, please try again later."
    );
    logger.error(
      `Error in select interaction ${JSON.stringify(e)} for ${interaction}`
    );
  }
}
