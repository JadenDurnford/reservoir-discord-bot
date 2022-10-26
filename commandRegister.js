const axios = require("axios");
require("dotenv").config();

let slash_commands = [
  {
    name: "stats",
    type: 1,
    description: "Retrieve stats for an NFT collection",
    options: [
      {
        "name": "name",
        "description": "search for collections that match a string",
        "type": 3,
        "required": true,
      },
    ],
  },
  {
    name: "collection",
    description: "Search for NFT Collections",
    options: [
      {
        "name": "name",
        "description": "Search for collections that match a string",
        "type": 3,
        "required": true,
      },
      {
        "name": "limit",
        "description": "Number of items returned (max: 20)",
        "type": 4,
      },
    ],
  },
];

const url = `https://discord.com/api/v10/applications/${process.env.APPLICATION_ID}/commands`;

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bot ${process.env.TOKEN}`,
};

axios
  .put(url, JSON.stringify(slash_commands), { headers: headers })
  .then((response) => {
    console.log("Registered all commands");
  })
  .catch((error) => {
    console.error("Error registering commands");
    console.log(error.response.data.errors.options["0"].name._errors);
  });
