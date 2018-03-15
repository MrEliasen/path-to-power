import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';

import AppReducer from './components/app/reducer';
import AuthReducer from './components/auth/reducer';
import AccountReducer from './components/account/reducer';
import CharacterReducer from './components/game/character/reducer';
import GameReducer from './components/game/reducer';
import EventsReducer from './components/game/events/reducer';
import MapReducer from './components/game/map/reducer';
import ShopReducer from './components/game/shop/reducer';

// refactored reducers
import InventoryReducer from './components/game/inventory-menu/reducer';
import PlayersReducer from './components/game/players/reducer';
import StatsReducer from './components/game/stats-menu/reducer';

const rootReducer = combineReducers({
    app: AppReducer,
    auth: AuthReducer,
    account: AccountReducer,
    inventorymenu: InventoryReducer,
    playersmenu: PlayersReducer,
    statsmenu: StatsReducer,
    game: GameReducer,
    character: CharacterReducer,
    events: EventsReducer,
    map: MapReducer,
    shop: ShopReducer,
    router: routerReducer,
});

export default rootReducer;
