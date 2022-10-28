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
exports.bidPoll = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const discord_js_1 = require("discord.js");
const redis = new ioredis_1.default();
const logger_1 = __importDefault(require("./logger"));
const sdk = require("api")("@reservoirprotocol/v1.0#6e6s1kl9rh5zqg");
function bidPoll(channel, contractAddress) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const topBidRes = yield sdk.getEventsCollectionsTopbidV1({
            collection: contractAddress,
            sortDirection: "desc",
            limit: "1",
            accept: "*/*",
        });
        const topBidResponse = topBidRes;
        const topBid = (_a = topBidResponse.events) === null || _a === void 0 ? void 0 : _a[0];
        if (!((_b = topBid === null || topBid === void 0 ? void 0 : topBid.event) === null || _b === void 0 ? void 0 : _b.id) || !((_c = topBid === null || topBid === void 0 ? void 0 : topBid.topBid) === null || _c === void 0 ? void 0 : _c.price) || !((_d = topBid === null || topBid === void 0 ? void 0 : topBid.topBid) === null || _d === void 0 ? void 0 : _d.maker)) {
            logger_1.default.error("Could not pull top bid");
            throw new Error("Could not pull top bid");
        }
        const initialId = yield redis.get("bideventid");
        /* logger.info(
          "initial bid id: " +
            typeof Number(initialId) +
            " | current bid id: " +
            typeof topBid.event.id
        ); */
        if (Number(topBid.event.id) !== Number(initialId)) {
            const success = yield redis.set("bideventid", topBid.event.id.toString());
            if (success !== "OK") {
                logger_1.default.error("Could not set new topbid eventid");
                throw new Error("Could not set new topbid eventid");
            }
            const bidCollectionRes = yield sdk.getCollectionsV5({
                id: contractAddress,
                includeTopBid: "false",
                sortBy: "allTimeVolume",
                limit: "1",
                accept: "*/*",
            });
            const bidCollectionResponse = bidCollectionRes;
            const bidCollection = (_e = bidCollectionResponse.collections) === null || _e === void 0 ? void 0 : _e[0];
            if (!bidCollection || !bidCollection.name) {
                logger_1.default.error("Could not collect stats");
                throw new Error("Could not collect stats");
            }
            const bidEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0x8b43e0)
                .setTitle("New Top Bid!")
                .setAuthor({
                name: bidCollection.name,
                url: "https://reservoir.tools/",
                iconURL: bidCollection.image,
            })
                .setDescription(`The top bid on the collection just changed to ${topBid.topBid.price}Ξ made by [${topBid.topBid.maker.substring(0, 6)}](https://www.reservoir.market/address/${topBid.topBid.maker})`)
                .setThumbnail((_f = bidCollection.image) !== null && _f !== void 0 ? _f : null)
                .setTimestamp();
            channel.send({ embeds: [bidEmbed] });
            logger_1.default.info("Successfully alerted new top bid");
        }
        setTimeout(bidPoll, 2500, channel, contractAddress);
    });
}
exports.bidPoll = bidPoll;
//# sourceMappingURL=bidPoll.js.map