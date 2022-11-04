import axios from "axios";
import logger from "./logger";
import { AlertType } from "./types";

/**
 * Register Discord bot commands
 * @param APPLICATION_ID Discord bot application id
 * @param TOKEN Discord bot token
 */
export default async function commandBuilder(
  APPLICATION_ID: string,
  TOKEN: string
): Promise<void> {
  try {
    // Collection command details
    let slash_commands = [
      {
        name: "collection",
        type: 1,
        description: "Search for NFT Collections using an identifying name",
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
      {
        name: "disablealert",
        type: 1,
        description: "Disable an alert",
        default_member_permission: "0",
        options: [
          {
            "name": "name",
            "description": "alert to disable",
            "type": 3,
            "required": true,
            "choices": [
              {
                "name": AlertType.listings,
                "value": AlertType.listings,
              },
              {
                "name": AlertType.sales,
                "value": AlertType.sales,
              },
              {
                "name": AlertType.floor,
                "value": AlertType.floor,
              },
              {
                "name": AlertType.bid,
                "value": AlertType.bid,
              },
            ],
          },
        ],
      },
      {
        name: "enablealert",
        type: 1,
        description: "Enable an alert",
        default_member_permission: "0",
        options: [
          {
            "name": "name",
            "description": "alert to enable",
            "type": 3,
            "required": true,
            "choices": [
              {
                "name": AlertType.listings,
                "value": AlertType.listings,
              },
              {
                "name": AlertType.sales,
                "value": AlertType.sales,
              },
              {
                "name": AlertType.floor,
                "value": AlertType.floor,
              },
              {
                "name": AlertType.bid,
                "value": AlertType.bid,
              },
            ],
          },
        ],
      },
      {
        name: "listalerts",
        type: 1,
        description: "list all alert",
        default_member_permission: "0",
      },
    ];

    // Discord command setup api endpoint
    const url = `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;

    // Discord api headers
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bot ${TOKEN}`,
    };

    // Add commands to Discord bot
    const registerCommands = await axios.put(
      url,
      JSON.stringify(slash_commands),
      { headers: headers }
    );

    // Return success if commands are registered, else throw
    if (registerCommands.status === 200 || registerCommands.status === 201) {
      logger.info(
        `Successfully registered commands: ${JSON.stringify(
          registerCommands.data
        )}`
      );
      return;
    } else {
      logger.error("Could not register commands");
      throw new Error("Could not register commands");
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      throw new Error(e.message);
    } else {
      logger.error(e);
      throw new Error("Unexpected error");
    }
  }
}
