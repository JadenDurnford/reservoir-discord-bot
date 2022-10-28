import { EmbedBuilder, SelectMenuBuilder, ActionRowBuilder } from "discord.js";
import constants from "./constants";
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "./logger";

export function baseEmbedGen(
  name: string | undefined,
  searchData: paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"],
  fieldValue: string
) {
  if (!searchData) {
    throw new Error("searchData is undefined");
  }

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

export function selectionEmbedGen(
  searchDataResponse: paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"]
) {
  const searchData = searchDataResponse?.[0];

  if (!searchData || !searchData.name) {
    throw new Error("searchData is undefined");
  }

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

export function selectMenuGen(
  selectOptions: { label: string; value: string }[]
) {
  const statSelectMenu = new SelectMenuBuilder()
    .setCustomId("statselect")
    .setPlaceholder("Select collection to view stats")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(selectOptions);

  const bidSelectMenu = statSelectMenu
    .setCustomId("bidselect")
    .setPlaceholder("Select collection to view top bid");

  const statSelectRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    statSelectMenu
  );
  const bidSelectRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    bidSelectMenu
  );

  return [statSelectRow, bidSelectRow];
}
