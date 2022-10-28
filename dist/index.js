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
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./utils/logger"));
const ioredis_1 = __importDefault(require("ioredis"));
const discord_1 = __importDefault(require("./utils/discord"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Setup env vars
        dotenv_1.default.config();
        // Check env vars
        const TRACKED_CONTRACT = process.env.TRACKED_CONTRACT;
        const CHANNEL_ID = process.env.CHANNEL_ID;
        const TOKEN = process.env.TOKEN;
        if (!TRACKED_CONTRACT || !CHANNEL_ID || !TOKEN) {
            logger_1.default.error("Missing env vars");
            throw new Error("Missing env vars");
        }
        // Setup Redis
        const redis = new ioredis_1.default();
        // Setup Discord
        const discord = new discord_1.default();
        const client = discord.client;
        // Redis Handlers
        redis.on("connect", () => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.default.info("Connected to Redis client.");
            client.login(TOKEN);
        }));
        // Discord Handlers
        client.on("ready", () => __awaiter(void 0, void 0, void 0, function* () { return yield discord.handleReady(CHANNEL_ID, TRACKED_CONTRACT); }));
        client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () { return yield discord.handleChatCommandInteraction(interaction); }));
        client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () { return yield discord.handleSelectMenuInteraction(interaction); }));
    }
    catch (e) {
        if (e instanceof Error) {
            logger_1.default.error(e);
            throw new Error(e.message);
        }
        else {
            logger_1.default.error(e);
            throw new Error("Unexpected error");
        }
    }
}))();
//# sourceMappingURL=index.js.map