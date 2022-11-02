### <div align="center">Reservoir Discord Bot</div>

<div align="center">An open source Discord bot built using Reservoir</div>

## About The Project

Reservoir Discord Bot provides communities easy to use commands and alerts for their
Discord server, which can be expanded and customized to their liking. Come test the bot out now in the [Reservoir discord server](https://discord.gg/fwUcYFSscT)!

The Discord bot ships with the following functionality:

- Automated alerts for new floor listings and top collection bids

<p align="center">
<image src="https://i.imgur.com/OpYAk1A.png" width="500">
</p>

- Collection search to view stats, current top bid, and current floor price

```
/collection [name: collection name to search for (ex. forgotten runes)] [limit: number of collections to return]
```

<p align="center">
<image src="https://i.imgur.com/HUREMOC.png" width="500">
<image src="https://i.imgur.com/EXTp6tu.png" width="500">
<image src="https://i.imgur.com/YQ8LmA2.png" width="500">
<image src="https://i.imgur.com/NTxwvqJ.png" width="500">
</p>

## Getting Started

### Prerequisites

1. Install [Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
2. Request a free [Reservoir API Key](https://docs.reservoir.tools/reference/overview#/0.%20Auth/postApikeys)
3. [Setup a Discord application and bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#setting-up-a-bot-application)

### Built With

- [ReservoirKit Client](https://docs.reservoir.tools/docs/reservoirkit-client)
- [Reservoir Protocol and API](https://reservoir.tools/)
- [TypeScript](https://www.typescriptlang.org/)
- [Discord.js](https://discord.js.org/#/)

### Installation

#### Method 1: Docker Setup (Recommended)

1. Install [Docker](https://docs.docker.com/compose/install/)
2. Fork this repository, and follow these instructions to get your Discord bot running

```bash
# Copy env vars sample file
cp .env.sample .env

# Set env vars in editor of your choice
vim .env

# Create and start the docker container
docker compose up -d
```

#### Method 2: Manual Setup

1. Install [Redis](https://redis.io/docs/getting-started/installation/) and start the server on the default port (6379)
2. Fork this repository, and follow these instructions to get your Discord bot running

```bash
# Copy env vars sample file
cp .env.sample .env

# Set env vars in editor of your choice
vim .env

# Download dependencies
npm install

# Start the Discord bot
npm run start
```

### Configuration

Environment Variables
| Environment Variable | Description | Example |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| TOKEN | [Your Discord bot's token](https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-bot-s-token) | NzkyNzE1NDU0MTk2MDg4ODQy.X-hvzA.Ovy4MCQywSkoMRRclStW4xAYK7I |
| APPLICATION_ID | [Your Discord application id](https://support-dev.discord.com/hc/en-us/articles/360028717192-Where-can-I-find-my-Application-Team-Server-ID-) | 5736050287834562 |
| CHANNEL_ID | [The Discord channel you want the bot active in](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) | 123456789098765432 |
| TRACKED_CONTRACT | The contract address of the collection you want to be alerted of floor price and top bid changes | 0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb |
| RESERVOIR_API_KEY | Reservoir API key provided by the Reservoir Protocol. [Get your own API key](https://api.reservoir.tools/#/0.%20Auth/postApikeys). | 123e4567-e89b-12d3-a456-426614174000 |
| REDIS_HOST | Redis host to connect to (For Docker set to "redis") | 127.0.0.1 |
| REDIS_PORT | Redis port to connect to (For Docker set to "6379") | 6379 |

Optional Variables
| Constant | Description | Default |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| ALERT_COOLDOWN | Number of seconds to wait before sending a new floor price or top bid alert | 60 \* 30 (30 minutes) |
| PRICE_CHANGE_OVERRIDE | Percentage change in floor price to override alert cooldown | 0.1 (10%) |
| ALERT_ENABLED | Enable/disable new floor price and top bid event alerts | true (enabled) |

## Contact

Twitter: [@reservoir0x](https://twitter.com/reservoir0x)
Discord: [Reservoir Protocol](https://discord.gg/j5K9fESNwh)
Project Link: [Reservoir Protocol](https://reservoirprotocol.github.io/)
