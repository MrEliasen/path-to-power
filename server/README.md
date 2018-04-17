# Path to Power - Server

This is the server for the game "Path to Power". Path to Power is an open source [MUD](https://en.wikipedia.org/wiki/MUD), made with NodeJS and React.

## Demo

You can play the official version [here](https://pathtopower.online), if you would like to give it a try!

## Requirements

* NodeJS 8.9.4+
* You must have mongoDB installed and running (version 3.6).

## Installation

1. Clone or download this repository
2. Go to the `./server` directory
3. Run `npm install` or `yarn`
    * The `./server/config` dirctory will be generated post-install
4. Make any necessary changes to the config files, as you please. 
5. Run `npm start` or `yarn start`.

## Serving

Then you want to deploy your server, run the following (optional, but recommended):

1. Compile your code with `npm run build`
    * This will compile your code to `./server/build`.
2. Run your compiled code with `npm run serve`; 

## Customising Game Data

To learn about how you add/edit game content, please see the [wiki](https://github.com/MrEliasen/path-to-power/wiki) for more information.