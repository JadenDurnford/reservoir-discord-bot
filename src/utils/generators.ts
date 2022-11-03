import {
  EmbedBuilder,
  SelectMenuBuilder,
  ActionRowBuilder,
  AttachmentBuilder,
} from "discord.js";
import constants from "./constants";
import { paths } from "@reservoir0x/reservoir-kit-client";
import logger from "./logger";
import { SelectMenuType } from "./types";
import handleMediaConversion from "./media";
import axios from "axios";

/**
 * Basic discord embed template generator
 * @param {string} name Collection name
 * @param {paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"]} searchData Collection info
 * @param {string} fieldValue List of collections to display
 * @returns Basic discord embed
 */
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

/**
 * Discord embed generator for select menu interaction
 * @param {paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"]} searchDataResponse Collection info
 * @returns embed for discord selection interactions
 */
export async function selectionEmbedGen(
  searchDataResponse: paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"],
  menuId: string
) {
  // Getting first collection from response
  const searchData = searchDataResponse?.[0];

  // Log failure + throw if searchData not passed
  if (!searchData || !searchData.name) {
    logger.error("searchData not passed to selection embed builder");
    throw new Error("searchData is undefined");
  }

  // If floor price menu is used, return token image else return collection image
  // If
  let image: string | undefined;
  let banner: string | undefined;
  let url: string = `https://reservoir.market/collections/${searchData.id}`;
  if (menuId === SelectMenuType.floorMenu) {
    if (searchData.floorAsk?.token) {
      url = `https://api.reservoir.tools/redirect/sources/${searchData.floorAsk.sourceDomain}/tokens/${searchData.floorAsk.token.contract}%3A${searchData.floorAsk.token.tokenId}/link/v2`;
    }
    image = searchData.floorAsk?.token?.image;
  } else if (menuId === SelectMenuType.statMenu) {
    url = `https://reservoir.market/collections/${searchData.id}`;
    image = searchData.image;
    if (searchData.banner) {
      banner = searchData.banner;
    }
  } else if (menuId === SelectMenuType.bidMenu) {
    if (searchData.topBid?.price) {
      if (searchData.topBid.sourceDomain === "opensea.io") {
        url = `https://${searchData.topBid.sourceDomain}/collection/${searchData.slug}`;
      } else if (searchData.topBid.sourceDomain === "looksrare.org") {
        url = `https://${searchData.topBid.sourceDomain}/collections/${searchData.id}`;
      } else if (searchData.topBid.sourceDomain === "x2y2.io") {
        url = `https://${searchData.topBid.sourceDomain}/collection/${searchData.slug}/items`;
      }
    } else {
      url = `https://reservoir.market/collections/${searchData.id}`;
    }
    image = searchData.image;
  }

  const returnImage = image ?? constants.RESERVOIR_ICON;

  // If image is webp, convert to png
  const { headers } = await axios.get(returnImage);
  let bannerResponse = null;
  if (banner) {
    bannerResponse = await axios.get(banner);
  }
  let attachment: AttachmentBuilder | undefined = undefined;
  let bannerAttachment: AttachmentBuilder | undefined = undefined;
  if (headers["content-type"] === "image/webp") {
    attachment = await handleMediaConversion(returnImage, searchData.name);
  }
  if (
    banner &&
    bannerResponse &&
    bannerResponse["headers"]["content-type"] === "image/webp"
  ) {
    bannerAttachment = await handleMediaConversion(
      banner,
      searchData.name + "banner"
    );
  }

  // Return selection embed template
  return {
    selectionEmbed: new EmbedBuilder()
      .setColor(0x8b43e0)
      .setAuthor({
        name: searchData.name,
        url: url ?? `https://reservoir.market/collections/${searchData.id}`,
        iconURL: attachment
          ? `attachment://${attachment.name}`
          : returnImage ?? undefined,
      })
      .setThumbnail(
        attachment ? `attachment://${attachment.name}` : returnImage ?? null
      )
      .setTimestamp(),
    attachment: attachment,
    bannerAttachment: bannerAttachment,
    url: url,
  };
}

/**
 * Discord select menu action row generator
 * @param {{ label: string; value: string }[]} selectOptions array of discord select menu options
 * @returns array of discord action row select menu objects
 */
export function selectMenuGen(
  selectOptions: { label: string; value: string }[]
) {
  return [
    // Set up component menus
    {
      id: SelectMenuType.statMenu,
      placeholder: "Select collection to view stats",
    },
    {
      id: SelectMenuType.bidMenu,
      placeholder: "Select collection to view top bid",
    },
    {
      id: SelectMenuType.floorMenu,
      placeholder: "Select collection to view floor price",
    },
  ].map(({ id, placeholder }) =>
    // Create menu from component details
    new ActionRowBuilder<SelectMenuBuilder>().addComponents(
      new SelectMenuBuilder()
        .setCustomId(id)
        .setPlaceholder(placeholder)
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(selectOptions)
    )
  );
}
