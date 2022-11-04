import {
  CacheType,
  ChatInputCommandInteraction,
  Client,
  DMChannel,
  PartialDMChannel,
  TextChannel,
} from "discord.js";
import logger from "../utils/logger";
import getCollection from "../handlers/getCollection";
import { baseEmbedGen, selectMenuGen } from "../utils/generators";
import { AlertType, CommandType } from "../utils/types";
import constants from "../utils/constants";

/**
 * Handle to discord chat interaction
 * @param {ChatInputCommandInteraction<CacheType>} interaction discord chat interaction
 */
export default async function replyChatInteraction(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  try {
    switch (interaction.commandName) {
      case CommandType.collection: {
        try {
          // Get collection name and number of items to search for
          const { value: name } = interaction.options.get("name", true);
          const limit = interaction.options.get("limit", false)?.value;

          // Log failure + throw if no collection name was received
          if (typeof name !== "string") {
            logger.error(`No collection name received for ${interaction}`);
            throw new Error("No collection name received");
          }

          // Getting collection data from Reservoir
          const searchData = await getCollection(
            name,
            undefined,
            limit,
            undefined
          );

          // Log failure + throw if collection data not collected
          if (!searchData) {
            logger.error(
              `Could not collect collections for ${JSON.stringify(interaction)}`
            );
            throw new Error("Could not collect collections");
          }

          // Creating array of options for select menu if they exist
          const selectOptions: { label: string; value: string }[] =
            searchData.map((collection) => {
              // Log failure + throw if name or contract address don't exist for an option
              if (!collection.name || !collection.id) {
                logger.error(
                  `Could not collect collection details for ${JSON.stringify(
                    interaction
                  )}`
                );
                throw new Error("Could not collect collection details");
              }
              return { label: collection.name, value: collection.id };
            });

          // Creating discord description of collections returned
          const fieldValue = selectOptions
            .map(
              (collection, i) =>
                `**${i + 1}. [${
                  collection.label
                }](https://www.reservoir.market/collections/${
                  collection.value
                })**`
            )
            .join("\n");

          // Creating new embed for data collected
          const chatCommandEmbed = baseEmbedGen(name, searchData, fieldValue);

          const selectMenu = selectMenuGen(selectOptions);

          // Replying to chat command with embed and selection menus
          try {
            await interaction.reply({
              embeds: [chatCommandEmbed],
            });
            await interaction.followUp({
              components: selectOptions.length !== 0 ? selectMenu : [],
              ephemeral: true,
            });
          } catch (e) {
            if (e instanceof Error) {
              logger.error(e);
              throw new Error(e.message);
            } else {
              logger.error(e);
              throw new Error("Unexpected error in chat interaction");
            }
          }

          // Log success
          logger.info(
            `User ${interaction.member?.user.username}${
              interaction.member?.user.discriminator
            } successfully called collection command: name=${name}, limit=${
              limit ?? "not provided"
            }`
          );
        } catch (e) {
          await interaction.reply(
            "Something went wrong, please try again later."
          );
          logger.error(
            `Error in chat interaction ${JSON.stringify(e)} for ${interaction}`
          );
        }
        break;
      }
      case CommandType.disableAlert: {
        const { value: name } = interaction.options.get("name", true);
        switch (name) {
          case AlertType.listings: {
            constants.ALERT_ENABLED.listings = false;
            await interaction.reply({
              content: `listings alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.listings
              )}`,
              ephemeral: true,
            });
            break;
          }
          case AlertType.sales: {
            constants.ALERT_ENABLED.sales = false;
            await interaction.reply({
              content: `sales alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.sales
              )}`,
              ephemeral: true,
            });
            break;
          }
          case AlertType.floor: {
            constants.ALERT_ENABLED.floor = false;
            await interaction.reply({
              content: `floor alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.floor
              )}`,
              ephemeral: true,
            });
            break;
          }
          case AlertType.bid: {
            constants.ALERT_ENABLED.bid = false;
            await interaction.reply({
              content: `bid alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.bid
              )}`,
              ephemeral: true,
            });
            break;
          }
        }
        // Log success
        logger.info(`Successfully disabled ${name}`);
        break;
      }
      case CommandType.enableAlert: {
        const { value: name } = interaction.options.get("name", true);
        switch (name) {
          case AlertType.listings: {
            constants.ALERT_ENABLED.listings = true;
            await interaction.reply({
              content: `listings alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.listings
              )}`,
              ephemeral: true,
            });
            break;
          }
          case AlertType.sales: {
            constants.ALERT_ENABLED.sales = true;
            await interaction.reply({
              content: `sales alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.sales
              )}`,
              ephemeral: true,
            });
            break;
          }
          case AlertType.floor: {
            constants.ALERT_ENABLED.floor = true;
            await interaction.reply({
              content: `floor alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.floor
              )}`,
              ephemeral: true,
            });
            break;
          }
          case AlertType.bid: {
            constants.ALERT_ENABLED.bid = true;
            await interaction.reply({
              content: `bid alert is now set to ${JSON.stringify(
                constants.ALERT_ENABLED.bid
              )}`,
              ephemeral: true,
            });
            break;
          }
        }
        // Log success
        logger.info(`Successfully enabled ${name}`);
        break;
      }

      case CommandType.listAlerts: {
        await interaction.reply({
          content: JSON.stringify(constants.ALERT_ENABLED),
          ephemeral: true,
        });
        break;
      }
    }
  } catch (e) {
    await interaction.reply("Something went wrong, please try again later.");
    logger.error(
      `Error in chat interaction ${JSON.stringify(e)} for ${interaction}`
    );
  }
}
