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
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
        if (((_b = searchData.topBid) === null || _b === void 0 ? void 0 : _b.price) && ((_c = searchData.topBid) === null || _c === void 0 ? void 0 : _c.maker)) {
            if ((_d = searchData.topBid.price.netAmount) === null || _d === void 0 ? void 0 : _d.native) {
                const bidEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x8b43e0)
                    .setTitle(`Collection Top Bid`)
                    .setAuthor({
                    name: searchData.name,
                    url: "https://reservoir.tools/",
                    iconURL: searchData.image,
                })
                    .setDescription(`The top bid on the collection is ${searchData.topBid.price.netAmount.native}Ξ made by [${searchData.topBid.maker.substring(0, 6)}](https://www.reservoir.market/address/${searchData.topBid.maker})`)
                    .setThumbnail((_e = searchData.image) !== null && _e !== void 0 ? _e : null)
                    .setTimestamp();
                yield interaction.update({
                    embeds: [bidEmbed],
                });
                return;
            }
            else if ((_f = searchData.topBid.price.amount) === null || _f === void 0 ? void 0 : _f.native) {
                const bidEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x8b43e0)
                    .setTitle(`Collection Top Bid`)
                    .setAuthor({
                    name: searchData.name,
                    url: "https://reservoir.tools/",
                    iconURL: `${searchData.image}`,
                })
                    .setDescription(`The top bid on the collection is ${searchData.topBid.price.amount.native}Ξ made by [${searchData.topBid.maker.substring(0, 6)}](https://www.reservoir.market/address/${searchData.topBid.maker})`)
                    .setThumbnail((_g = searchData.image) !== null && _g !== void 0 ? _g : null)
                    .setTimestamp();
                yield interaction.update({
                    embeds: [bidEmbed],
                });
                return;
            }
        }
        else {
            const bidEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0x8b43e0)
                .setTitle(`Collection Top Bid`)
                .setAuthor({
                name: searchData.name,
                url: "https://reservoir.tools/",
                iconURL: `${searchData.image}`,
            })
                .setDescription(`No bids found for ${searchData.name}`)
                .setThumbnail((_h = searchData.image) !== null && _h !== void 0 ? _h : null)
                .setTimestamp();
            yield interaction.update({
                embeds: [bidEmbed],
            });
        }
    });
}
exports.bidselect = bidselect;
//# sourceMappingURL=bidselect.js.map