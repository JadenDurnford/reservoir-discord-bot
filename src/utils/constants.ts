export default {
  RESERVOIR_ICON:
    "https://cdn.discordapp.com/icons/872790973309153280/0dc1b70867aeeb2ee32563f575c191c6.webp?size=4096",
  ALERT_COOLDOWN: 60 * 30, // 30 minute cooldown
  PRICE_CHANGE_OVERRIDE: 0.1, // 10% price change
  ALERT_ENABLED: { listings: false, sales: false, floor: true, bid: true }, // enable alerts
  TRACKED_CONTRACTS: [],
  CHANNEL_IDS: {
    mainChannel: "1037386291781840977",
    listingChannel: "11111111111111111111",
    salesChannel: "11111111111111111111",
  },
  ALERT_CONTRACT: "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42",
  APPLICATION_ID: "1033117008667099157",
  REDIS_HOST: "127.0.0.1",
  REDIS_PORT: 6379,
};
