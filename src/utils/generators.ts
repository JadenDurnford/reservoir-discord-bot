import { EmbedBuilder, SelectMenuBuilder, ActionRowBuilder } from "discord.js";
import constants from "./constants";
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "./logger";

// Basic discord embed template generator
export function baseEmbedGen(
  name: string | undefined,
  searchData: paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"],
  fieldValue: string
) {
  // Log failure + throw if searchData not passed
  if (!searchData) {
    logger.error("searchData not passed to base embed generator");
    throw new Error("searchData is undefined");
  }

  // Return basic discord embed template
  return new EmbedBuilder()
    .setColor(0x8b43e0)
    .setTitle("Search Results")
    .setAuthor({
      name: "Reservoir Bot",
      url: "https://reservoir.tools/",
      iconURL: constants.RESERVOIR_ICON,
    })
    .setDescription(
      searchData.length != 0
        ? `**The top ${searchData.length} results for "${name}" are:**\n${fieldValue}`
        : `**No results found for "${name}"**`
    )
    .setThumbnail(constants.RESERVOIR_ICON)
    .setTimestamp();
}

// Discord embed generator for select menu interaction
export function selectionEmbedGen(
  searchDataResponse: paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"]
) {
  // Getting first collection from response
  const searchData = searchDataResponse?.[0];

  // Log failure + throw if searchData not passed
  if (!searchData || !searchData.name) {
    logger.error("searchData not passed to selection embed builder");
    throw new Error("searchData is undefined");
  }

  // Return selection embed template
  return new EmbedBuilder()
    .setColor(0x8b43e0)
    .setAuthor({
      name: searchData.name,
      url: `https://reservoir.tools/${searchData.id}`,
      iconURL: searchData.image ?? constants.RESERVOIR_ICON,
    })
    .setThumbnail(searchData.image ?? constants.RESERVOIR_ICON)
    .setTimestamp();
}

// Discord select menu action row generator
export function selectMenuGen(
  selectOptions: { label: string; value: string }[]
) {
  // Creating stat select menu
  const statSelectMenu = new SelectMenuBuilder()
    .setCustomId("statselect")
    .setPlaceholder("Select collection to view stats")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(selectOptions);

  // Creating bid select menu
  const bidSelectMenu = statSelectMenu
    .setCustomId("bidselect")
    .setPlaceholder("Select collection to view top bid");

  // Creating stat select action row
  const statSelectRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    statSelectMenu
  );

  // Creating bid select action row
  const bidSelectRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    bidSelectMenu
  );

  // Return array of select action rows
  return [statSelectRow, bidSelectRow];
}
