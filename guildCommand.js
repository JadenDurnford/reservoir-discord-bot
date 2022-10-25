const axios = require("axios");
require("dotenv").config();

const url =
  "https://discord.com/api/v10/applications/1033117008667099157/commands";

const json = {
  "name": "stats",
  "type": 1,
  "description": "Retrieve stats for an NFT collection",
  "options": [
    {
      "name": "name",
      "description": "search for collections that match a string",
      "type": 3,
      "required": true,
    },
  ],
};

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bot ${process.env.TOKEN}`,
};

axios
  .post(url, json, { headers: headers })
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log(error.response.data.errors.options["0"].name._errors);
  });

/* const url =
  "https://discord.com/api/v10/applications/1033117008667099157/commands/1033488457777029120";

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bot ${process.env.TOKEN}`,
};

const json = {
  "options": [
    {
      "name": "name",
      "description": "search for collections that match a string",
      "type": 3,
      "required": true,
    },
    {
      "name": "limit",
      "description": "number of items returned (max: 20)",
      "type": 4,
    },
  ],
};

axios.patch(url, json, { headers: headers }).then((response) => {
  console.log(response);
}); */
