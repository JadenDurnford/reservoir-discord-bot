const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
import { paths } from "@reservoir0x/reservoir-kit-client";
import dotenv from "dotenv";
import logger from "../utils/logger";

/**
 * Retrieve collection data from Reservoir
 * @param {string} name collection name to search for
 * @param {string} contractAddress collection address to search
 * @param {number} limit number of collections to return
 * @param {boolean} includeTopBid whether to include top bid info or not
 * @returns array of collection info
 */
export default async function getCollection(
  name?: string,
  contractAddress?: string,
  limit?: number | string | boolean,
  includeTopBid: boolean = false
): Promise<
  paths["/collections/v5"]["get"]["responses"]["200"]["schema"]["collections"]
> {
  // Log failure + throw if function not passed name or contract address
  if (!name && !contractAddress) {
    throw new Error();
  }

  // If limit param isn't passed default to 5
  limit = typeof limit !== "number" ? 5 : limit;

  // Set limit to the bounds of 1 <= limit <= 20
  limit = Math.min(Math.max(limit, 1), 20);

  // Prioritize contractAddress if provided, else fallback to name
  const selector = contractAddress ? { id: contractAddress } : { name: name };

  try {
    dotenv.config();
    // Authorizing with Reservoir API Key
    await sdk.auth(process.env.RESERVOIR_API_KEY);

    // Pull collection data from Reservoir
    const searchDataResponse: paths["/collections/v5"]["get"]["responses"]["200"]["schema"] =
      await sdk.getCollectionsV5({
        ...selector,
        includeTopBid: includeTopBid,
        sortBy: "allTimeVolume",
        limit: limit,
        accept: "*/*",
      });

    // Return array of collections
    return searchDataResponse.collections;
  } catch (e) {
    // Log failure + throw on error
    logger.error(
      `Failed to pull collection data for name=${name}, contractAddress=${contractAddress}, limit=${limit}, includeTopBid=${includeTopBid}`
    );
    throw new Error("Failed to pull collection data");
  }
}
