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
exports.statselect = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = __importDefault(require("../../utils/logger"));
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
function statselect(interaction) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const id = interaction.values[0];
        if (!id) {
            logger_1.default.error("No collection id recieved");
            throw new Error("No collection id recieved");
        }
        const searchDataRes = yield sdk.getCollectionsV5({
            id: id,
            includeTopBid: "false",
            sortBy: "allTimeVolume",
            limit: "1",
            accept: "*/*",
        });
        const searchDataResponse = searchDataRes;
        const searchData = (_a = searchDataResponse.collections) === null || _a === void 0 ? void 0 : _a[0];
        if (!searchData || !searchData.name) {
            logger_1.default.error("Could not collect stats");
            throw new Error("Could not collect stats");
        }
        const statEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0x8b43e0)
            .setTitle(`${searchData.name} Stats`)
            .setAuthor({
            name: searchData.name,
            url: `https://reservoir.tools/${searchData.id}`,
            iconURL: (_b = searchData.image) !== null && _b !== void 0 ? _b : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024",
        })
            .setDescription(`Token Count: ${searchData.tokenCount}
      On Sale Count: ${searchData.onSaleCount}
      7 day volume: ${(_c = searchData.volume) === null || _c === void 0 ? void 0 : _c["7day"]}`)
            .setThumbnail((_d = searchData.image) !== null && _d !== void 0 ? _d : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024")
            .setTimestamp();
        yield interaction.update({
            embeds: [statEmbed],
        });
        logger_1.default.info("Updated stats embed");
    });
}
exports.statselect = statselect;
//# sourceMappingURL=statselect.js.map