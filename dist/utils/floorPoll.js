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
exports.floorPoll = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const discord_js_1 = require("discord.js");
const redis = new ioredis_1.default();
const logger_1 = __importDefault(require("./logger"));
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
function floorPoll(channel, contractAddress) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __awaiter(this, void 0, void 0, function* () {
        const floorAskRes = yield sdk.getEventsCollectionsFlooraskV1({
            collection: contractAddress,
            sortDirection: "desc",
            limit: "1",
            accept: "*/*",
        });
        const floorAskResponse = floorAskRes;
        const floorAsk = (_a = floorAskResponse.events) === null || _a === void 0 ? void 0 : _a[0];
        if (!((_b = floorAsk === null || floorAsk === void 0 ? void 0 : floorAsk.event) === null || _b === void 0 ? void 0 : _b.id) ||
            !((_c = floorAsk.collection) === null || _c === void 0 ? void 0 : _c.id) ||
            !((_d = floorAsk.floorAsk) === null || _d === void 0 ? void 0 : _d.tokenId) ||
            !((_e = floorAsk.floorAsk) === null || _e === void 0 ? void 0 : _e.price)) {
            logger_1.default.error("Could not pull floor ask");
            throw new Error("Could not pull floor ask");
        }
        // pull initial floor ask event id
        const initialId = yield redis.get("flooreventid");
        logger_1.default.info("initial floor id: " +
            typeof Number(initialId) +
            " | current floor id: " +
            typeof Number(floorAsk.event.id));
        if (Number(floorAsk.event.id) !== Number(initialId)) {
            // setting new floor ask event id
            const success = yield redis.set("flooreventid", floorAsk.event.id.toString());
            if (success !== "OK") {
                logger_1.default.error("Could not set new floorprice eventid");
                throw new Error("Could not set new floorprice eventid");
            }
            const tokenRes = yield sdk.getTokensV5({
                tokens: `${floorAsk.collection.id}:${floorAsk.floorAsk.tokenId}`,
                sortBy: "floorAskPrice",
                limit: "1",
                includeTopBid: "false",
                includeAttributes: "false",
                accept: "*/*",
            });
            const tokenResponse = tokenRes;
            const floorToken = (_f = tokenResponse.tokens) === null || _f === void 0 ? void 0 : _f[0];
            if (!((_g = floorToken === null || floorToken === void 0 ? void 0 : floorToken.token) === null || _g === void 0 ? void 0 : _g.collection) ||
                !((_h = floorToken === null || floorToken === void 0 ? void 0 : floorToken.token) === null || _h === void 0 ? void 0 : _h.owner) ||
                !((_j = floorToken === null || floorToken === void 0 ? void 0 : floorToken.token) === null || _j === void 0 ? void 0 : _j.lastSell) ||
                !((_k = floorToken === null || floorToken === void 0 ? void 0 : floorToken.token) === null || _k === void 0 ? void 0 : _k.name)) {
                logger_1.default.error("Could not pull floor token");
                throw new Error("Could not pull floor token");
            }
            // create attributes array if they exist
            let attributes;
            if (floorToken.token.attributes) {
                attributes = floorToken.token.attributes.map((attr) => {
                    var _a, _b;
                    return { name: (_a = attr.key) !== null && _a !== void 0 ? _a : "", value: (_b = attr.value) !== null && _b !== void 0 ? _b : "", inline: true };
                });
            }
            else {
                attributes = [];
            }
            const floorEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0x8b43e0)
                .setTitle("New Floor Listing!")
                .setAuthor({
                name: `${floorToken.token.collection.name}`,
                url: "https://reservoir.tools/",
                iconURL: `${floorToken.token.collection.image}`,
            })
                .setDescription(`${floorToken.token.name} was just listed for ${floorAsk.floorAsk.price}Ξ by [${floorToken.token.owner.substring(0, 6)}](https://www.reservoir.market/address/${floorToken.token.owner})
        Last Sale: ${floorToken.token.lastSell.value}Ξ
        Rarity Rank: ${floorToken.token.rarityRank}
        
        `)
                .addFields(attributes)
                .setThumbnail(`${floorToken.token.image}`)
                .setTimestamp();
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setLabel("Purchase")
                .setStyle(5)
                .setURL(`https://www.reservoir.market/${floorAsk.collection.id}/${floorAsk.floorAsk.tokenId}`));
            channel.send({ embeds: [floorEmbed], components: [row] });
            logger_1.default.info("Successfully alerted new floor price");
        }
        setTimeout(floorPoll, 2500, channel, contractAddress);
    });
}
exports.floorPoll = floorPoll;
//# sourceMappingURL=floorPoll.js.map