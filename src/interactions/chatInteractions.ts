import { CacheType, ChatInputCommandInteraction } from "discord.js";
import logger from "../utils/logger";
import getCollection from "../handlers/getCollection";
import { baseEmbedGen, selectMenuGen } from "../utils/generators";

export default async function replyChatInteraction(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  // Get collection name and number of items to search for
  const { value: name } = interaction.options.get("name", true);
  const limit = interaction.options.get("limit", false)?.value;

  // Throw error if no collection name was received
  if (typeof name !== "string") {
    logger.error(`No collection name received for ${interaction}`);
    throw new Error("No collection name received");
  }

  const searchData = await getCollection(name, undefined, limit, undefined);

  if (!searchData) {
    logger.error(
      `Could not collect collections for ${JSON.stringify(interaction)}`
    );
    throw new Error("Could not collect collections");
  }

  let selectOptions: { label: string; value: string }[] = searchData.map(
    (collection) => {
      if (!collection.name || !collection.id) {
        logger.error(
          `Could not collect collection details for ${JSON.stringify(
            interaction
          )}`
        );
        throw new Error("Could not collect collection details");
      }
      return { label: collection.name, value: collection.id };
    }
  );

  const fieldValue = selectOptions
    .map(
      (collection, i) =>
        `**${i + 1}. [${
          collection.label
        }](https://www.reservoir.market/collections/${collection.value})**`
    )
    .join("\n");

  const chatCommandEmbed = baseEmbedGen(name, searchData, fieldValue);

  await interaction.reply({
    embeds: [chatCommandEmbed],
    components: selectOptions.length !== 0 ? selectMenuGen(selectOptions) : [],
  });

  logger.info(
    `Successfully called collection command: name=${name}, limit=${
      limit ?? "not provided"
    }`
  );
}
