# Path to Power - Server

This is the server for the game "Path to Power". Path to Power is an open source [MUD](https://en.wikipedia.org/wiki/MUD), made with NodeJS and React.

## Installation

1. Create a new project on [Twitch.tv](https://dev.twitch.tv).
2. Clone the repository
3. Go to the `./server` directory
4. Run `npm install` or `yarn` to install dependencies
5. Run `npm start` or `yarn start`. 
6. At first run, it will copy the data files to a new directory and propt you for your Twitch.tv application Client Id.

You can skip step 5, if you manually moved/copied the `./server/game/data.new` to `./server/game/data`, copied  `./server/config.new.json` to `./server/config.json` and added your client id to the config.json file.

## Add/Remove/Update Content

All content, like shops, NPCS, items etc. are all stored in `*.json` files, and loaded at server boot up.
To learn about how you add/edit content, please see the [wiki](https://github.com/MrEliasen/path-to-power/wiki) for more information.