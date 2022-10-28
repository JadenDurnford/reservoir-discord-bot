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
exports.stats = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = __importDefault(require("../../utils/logger"));
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
function stats(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const { value: name } = interaction.options.get("name", true);
        if (!name) {
            logger_1.default.error("No collection name recieved");
            throw new Error("No collection name recieved");
        }
        const searchDataRes = yield sdk.getCollectionsV5({
            name: name,
            includeTopBid: "false",
            sortBy: "allTimeVolume",
            limit: "5",
            accept: "*/*",
        });
        const searchDataResponse = searchDataRes;
        const searchData = searchDataResponse.collections;
        if (!searchData) {
            logger_1.default.error("Could not collect collections");
            throw new Error("Could not collect collections");
        }
        let fieldValue = "";
        let selectOptions = [];
        searchData.forEach((collection, i) => {
            fieldValue += `**${i + 1}. [${collection.name}](https://www.reservoir.market/collections/${collection.id})**
    `;
            if (!collection.name || !collection.id) {
                logger_1.default.error("Could not collect collection details");
                throw new Error("Could not collect collection details");
            }
            selectOptions.push({ label: collection.name, value: collection.id });
        });
        const testEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0x8b43e0)
            .setTitle("Search Results")
            .setAuthor({
            name: "Reservoir Bot",
            url: "https://reservoir.tools/",
            iconURL: "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096",
        })
            .setDescription(searchData.length != 0
            ? `**The top ${searchData.length} results for "${name}" are:**
      ${fieldValue}
      Please select the collection to view stats for below`
            : `**No results found for "${name}"**`)
            .setThumbnail("https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096")
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.SelectMenuBuilder()
            .setCustomId("statselect")
            .setPlaceholder("Nothing selected")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(selectOptions));
        yield interaction.reply({
            embeds: [testEmbed],
            components: [row],
        });
        logger_1.default.info(`Successfully called stats command: name=${name}`);
    });
}
exports.stats = stats;
//# sourceMappingURL=stats.js.map