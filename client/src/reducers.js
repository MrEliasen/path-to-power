import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';

import AuthReducer from './components/auth/reducer';
import CharacterReducer from './components/character/reducer';
import GameReducer from './components/game/reducer';
import EventsReducer from './components/events/reducer';
import PlayerMapReducer from './components/playermap/reducer';
import ShopReducer from './components/shop/reducer';

// refactored reducers
import InventoryReducer from './components/inventory-menu/reducer';
import PlayersReducer from './components/players-menu/reducer';
import StatsReducer from './components/stats-menu/reducer';

const rootReducer = combineReducers({
    inventorymenu: InventoryReducer,
    playersmenu: PlayersReducer,
    statsmenu: StatsReducer,
    auth: AuthReducer,
    game: GameReducer,
    character: CharacterReducer,
    events: EventsReducer,
    map: PlayerMapReducer,
    shop: ShopReducer,
    router: routerReducer,
});

export default rootReducer;
