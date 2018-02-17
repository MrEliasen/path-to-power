# Path to Power - Server

This is the server for the game "Path to Power". Path to Power is an open source [MUD](https://en.wikipedia.org/wiki/MUD), made with NodeJS and React.

## Demo

You can play the official version [here](https://pathtopower.online), if you would like to give it a try!

## Requirements

* You must have mongoDB installed and running (recommend 3.6+).
* You must have a Twitch Application ID. You can create a new application [here](https://dev.twitch.tv).

## Installation

1. Clone or download this repository
2. Go to the `./server` directory
3. Run `npm install` or `yarn`
    * The config.json file and data directory is generated post npm/yarn install.
4. Edit the configuration file `config.json` with your Twitch Application information and credentials.
5. (Optional): Edit the `game/data/` files to fit your game
6. Run `npm start` or `yarn start`.

## Serving

Then you want to deploy your server, run the following (optional, but recommended):

1. Compile your code with `npm run build`
    * This will compile your code to `./server/dist`.
2. Run your compiled code with `npm run server` or enter the `./server/dist` directory and run `node index.js`; 

## Customising Game Data

To learn about how you add/edit game content, please see the [wiki](https://github.com/MrEliasen/path-to-power/wiki) for more information.