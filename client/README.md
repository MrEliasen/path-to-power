# Path to Power - Client

This is the client for the game "Path to Power". Path to Power is an open source [MUD](https://en.wikipedia.org/wiki/MUD), made with NodeJS and React.

## Demo

You can play the official version [here](https://pathtopower.online), if you would like to give it a try!

## Requirements

You must have a Twitch Application ID. You can create a new application [here](https://dev.twitch.tv).
    * The OAuth Redirect URI must match the callbackUrl in your `config.js`.
    * Default: http://localhost:8080/auth

## Installation

1. Clone or download this repository
4. Go to the `./client` directory
5. Run `npm install` or `yarn` to install dependencies
    * The config.js file is generated post npm/yarn install.
4. Edit the configuration file `config.json` with your information and credentials.
3. Add your Twitch.tv application Client Id to the new config file
6. Run `npm start` or `yarn start`

## Serving

Then you want to deploy your client, compile your code with `npm run build`.    
This will compile your code to `./server/dist`. You can now upload the content of the `dist` directory to your web host.    
Remember to add the .htaccess file as well (ht.access in the repository, just rename it).

## How To Play

To see a guide on how to play the game, please see the [wiki](https://github.com/MrEliasen/path-to-power/wiki) for more information.