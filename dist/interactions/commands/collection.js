"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collection = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = __importDefault(require("../../utils/logger"));
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
function collection(interaction) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { value: name } = interaction.options.get("name", true);
        let limit = (_a = interaction.options.get("limit", false)) === null || _a === void 0 ? void 0 : _a.value;
        if (!name) {
            logger_1.default.error("No collection name recieved");
            throw new Error("No collection name recieved");
        }
        if (!limit) {
            limit = 5;
        }
        if (typeof limit !== "number") {
            logger_1.default.error("Unknown limit value received");
            throw new Error("Unknown limit value received");
        }
        const searchDataRes = yield sdk.getCollectionsV5({
            name: name,
            includeTopBid: "false",
            sortBy: "allTimeVolume",
            limit: limit,
            accept: "*/*",
        });
        const searchDataResponse = searchDataRes;
        const searchData = searchDataResponse.collections;
        if (!searchData) {
            logger_1.default.error("Could not collect collections");
            throw new Error("Could not collect collections");
        }
        let fieldValue = "";
        searchData.forEach((collection) => {
            fieldValue += `**[${collection.name}](https://www.reservoir.market/collections/${collection.id})**
    `;
        });
        const collectionEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0x8b43e0)
            .setTitle("Search Results")
            .setAuthor({
            name: "Reservoir Bot",
            url: "https://reservoir.tools/",
            iconURL: "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096",
        })
            .setDescription(searchData.length != 0
            ? `**The top ${searchData.length} results for "${name}" are:**
      ${fieldValue}`
            : `**No results found for "${name}"**`)
            .setThumbnail("https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096")
            .setTimestamp();
        yield interaction.reply({
            embeds: [collectionEmbed],
        });
        logger_1.default.info(`Successfully called collection command: name=${name}, limit=${limit}`);
    });
}
exports.collection = collection;
//# sourceMappingURL=collection.js.map