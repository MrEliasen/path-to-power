# Path to Power (Server)

This is the server for the game "Path to Power". Path to Power is an open source [MUD](https://en.wikipedia.org/wiki/MUD), made with NodeJS and React.

It uses (at the time of writing) Twitch.tv as authentication method, but other/more options are likely to be added at a later date.

## Installation

Please note: As there is no "official" stable release yet, breaking changes are likely to be introduced at every commit, without warning.

1. Create a new project on [Twitch.tv](https://dev.twitch.tv).
2. Clone the repository
3. Run `npm install` or `yarn` to install dependencies
4. Run `npm start` or `yarn start`. 
5. At first run, it will copy the data files to a new directory and propt you for your Twitch.tv application Client Id.

You can skip step 5, if you manually moved/copied the `./game/data.new` to `./game/data`, copied  `./config.new.json` to `./config.json` and added your client id to the config.json file.

## Add/Remove/Update Content

All content, like shops, NPCS, items etc. are all stored in `*.json` files, and loaded at server boot up.
To learn about how you add/edit content, please see the [wiki](https://github.com/MrEliasen/path-to-power-server/wiki) for more information.

## Contributing

If you would would like to contribute, please see [CONTRIBUTING.md](https://github.com/MrEliasen/path-to-power-server/blob/master/.github/CONTRIBUTING.md). Thank you!

## Credits/Sources

[UNODC](https://stats.unodc.org/) for information on drugs.    
[CITYMAYORS](http://www.citymayors.com/statistics/largest-cities-population-125.html) for information on cities.

## License

Release under the Creative Commons Attribution 3.0 Unported (CC BY 3.0) (for [Humans](https://creativecommons.org/licenses/by/3.0/), for [Lawyers](https://github.com/MrEliasen/path-to-power-server/blob/master/LICENSE.md)).

## Acknowledgement

> This project would very likely never have happened, was it not for the amazing support from everyone who tuned > in to my live streams on [Twitch.tv](https://twitch.tv/sirmre).
> 
> Furthermore, this project is based on the game **Streetwars Online 2** (2000), a game by B.Smith aka Wuzzbent.
> I would very likely not have become a developer where it not for you making your game open source.
>  
> Thank you. - MrEliasen aka SirMrE
