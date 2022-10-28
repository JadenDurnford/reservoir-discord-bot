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
const discord_js_1 = require("discord.js");
const logger_1 = __importDefault(require("./logger"));
const floorPoll_1 = require("./floorPoll");
const bidPoll_1 = require("./bidPoll");
const collection_1 = require("../interactions/commands/collection");
const stats_1 = require("../interactions/commands/stats");
const topbid_1 = require("../interactions/commands/topbid");
const statselect_1 = require("../interactions/selectmenu/statselect");
const bidselect_1 = require("../interactions/selectmenu/bidselect");
class Discord {
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
            ],
        });
    }
    handleReady(CHANNEL_ID, TRACKED_CONTRACT) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info("Discord bot logged in");
            const channel = this.client.channels.cache.get(CHANNEL_ID);
            if (!channel) {
                logger_1.default.error("Could not connect to channel");
                throw new Error("Could not connect to channel");
            }
            else if (channel.type !== discord_js_1.ChannelType.GuildText) {
                logger_1.default.error("Channel is not a text channel");
                throw new Error("Channel is not a text channel");
            }
            yield (0, floorPoll_1.floorPoll)(channel, TRACKED_CONTRACT);
            yield (0, bidPoll_1.bidPoll)(channel, TRACKED_CONTRACT);
        });
    }
    handleChatCommandInteraction(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isChatInputCommand())
                return;
            switch (interaction.commandName) {
                case "collection": {
                    yield (0, collection_1.collection)(interaction);
                    break;
                }
                case "stats": {
                    yield (0, stats_1.stats)(interaction);
                    break;
                }
                case "topbid": {
                    yield (0, topbid_1.topbid)(interaction);
                    break;
                }
                default: {
                    logger_1.default.error("Unknown Command");
                    yield interaction.reply({
                        content: "Error: Unknown Command",
                    });
                }
            }
        });
    }
    handleSelectMenuInteraction(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isSelectMenu())
                return;
            switch (interaction.customId) {
                case "statselect": {
                    yield (0, statselect_1.statselect)(interaction);
                    break;
                }
                case "bidselect": {
                    yield (0, bidselect_1.bidselect)(interaction);
                    break;
                }
                default: {
                    logger_1.default.error("Unknown Select Command");
                    yield interaction.reply({
                        content: "Error: Unknown Selection",
                    });
                }
            }
        });
    }
}
exports.default = Discord;
//# sourceMappingURL=discord.js.map