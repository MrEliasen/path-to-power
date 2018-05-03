# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).   
This project does **not** yet adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.2.0] - TBD 
### Added   
- New mailing system.
    Supporting the following transportations methods:
    - SMTP
    - SendGrid
    - Log/file
- DotEnv support server-side.
- More directory aliases like `shared` which references the `server/shared` directory.
- New and simplied installation. `yarn` or `npm install` and your are done.
- Message when whispering yourself in-game.
- "How to play" link to top navigation.
- Forms now submit on "enter" key press.
- Weighted loot drop system.
- updateAllClients method to character manager.
- More "trash" items.
- Add config options for rep gains on buy/sell drugs.
- Add session TTL configuration option.
- New progress system
    - Skills:
        - Snooping
        - First Aid

### Changed   
- /giveitem command now only works in development.
- NOTIFICATION_SET type is now shared.
- Server file and folder scructure has been completely overhauled:
    - rename `game` => `src`.
    - Logs now have its own directory.
    - Build output is now output to `build` instead of `dist`.
    - All `sample` files and folders are now generated from the `post-install` script.
- Server environment presets has been updated.
- Server build procedure.
- Hide 3rd party connections when none are linked from account page.
- Default redirect to /game instead of /account on login.
- Move method call to update item prices on "new day", from shop resupply to the actual timer method.
- Increase default number of spawned NPCs

### Fixed   
- API not listening on HTTPs when a certificate is provided.
- Debug and info logging events not saving to file.
- Missing/invisible text on the NPC details button.
- Cash not updating on the character card.
- Errors on the character select screen not showing.
- Various spelling mistakes.
- Game maps init not ignoring `.` files.
- Missing server configuration references.
- Account activation links not redirecting to client.
- Missing `account not activated` notification.
- Players menu staying open after clicking `whisper`.
- Registration page not rendering when strategies where not loaded.
- Account activation success message showing as an error.
- Character creation form resetting after creating a new character.
- Prices of items in player's inventory not updating.
- Adding stackable items to shops throws an error.
- Trash items being resellable.
- Fix `releaseTarget` not referencing the correct character/NPC object.


## [0.1.0] - 2018-04-08   
Initial official release.