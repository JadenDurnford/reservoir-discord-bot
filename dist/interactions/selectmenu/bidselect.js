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
exports.bidselect = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = __importDefault(require("../../utils/logger"));
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
function bidselect(interaction) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __awaiter(this, void 0, void 0, function* () {
        const id = interaction.values[0];
        if (!id) {
            logger_1.default.error("No collection id recieved");
            throw new Error("No collection id recieved");
        }
        const searchDataRes = yield sdk.getCollectionsV5({
            id: id,
            includeTopBid: "true",
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
        if (((_b = searchData.topBid) === null || _b === void 0 ? void 0 : _b.price) && ((_c = searchData.topBid) === null || _c === void 0 ? void 0 : _c.maker)) {
            if ((_d = searchData.topBid.price.netAmount) === null || _d === void 0 ? void 0 : _d.native) {
                const bidEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x8b43e0)
                    .setTitle(`Collection Top Bid`)
                    .setAuthor({
                    name: searchData.name,
                    url: `https://reservoir.tools/${searchData.id}`,
                    iconURL: (_e = searchData.image) !== null && _e !== void 0 ? _e : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024",
                })
                    .setDescription(`The top bid on the collection is ${searchData.topBid.price.netAmount.native}Ξ made by [${searchData.topBid.maker.substring(0, 6)}](https://www.reservoir.market/address/${searchData.topBid.maker})`)
                    .setThumbnail((_f = searchData.image) !== null && _f !== void 0 ? _f : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024")
                    .setTimestamp();
                yield interaction.update({
                    embeds: [bidEmbed],
                });
            }
            else if ((_g = searchData.topBid.price.amount) === null || _g === void 0 ? void 0 : _g.native) {
                const bidEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x8b43e0)
                    .setTitle(`Collection Top Bid`)
                    .setAuthor({
                    name: searchData.name,
                    url: `https://reservoir.tools/${searchData.id}`,
                    iconURL: (_h = searchData.image) !== null && _h !== void 0 ? _h : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024",
                })
                    .setDescription(`The top bid on the collection is ${searchData.topBid.price.amount.native}Ξ made by [${searchData.topBid.maker.substring(0, 6)}](https://www.reservoir.market/address/${searchData.topBid.maker})`)
                    .setThumbnail((_j = searchData.image) !== null && _j !== void 0 ? _j : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024")
                    .setTimestamp();
                yield interaction.update({
                    embeds: [bidEmbed],
                });
            }
        }
        else {
            const bidEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0x8b43e0)
                .setTitle(`Collection Top Bid`)
                .setAuthor({
                name: searchData.name,
                url: `https://reservoir.tools/${searchData.id}`,
                iconURL: (_k = searchData.image) !== null && _k !== void 0 ? _k : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024",
            })
                .setDescription(`No bids found for ${searchData.name}`)
                .setThumbnail((_l = searchData.image) !== null && _l !== void 0 ? _l : "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=1024")
                .setTimestamp();
            yield interaction.update({
                embeds: [bidEmbed],
            });
        }
        logger_1.default.info("Updated topbid embed");
    });
}
exports.bidselect = bidselect;
//# sourceMappingURL=bidselect.js.map