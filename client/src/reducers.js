import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';

import AppReducer from './components/app/reducer';
import AuthReducer from './components/auth/reducer';
import CharacterReducer from './components/game/character/reducer';
import GameReducer from './components/game/reducer';
import EventsReducer from './components/game/events/reducer';
import LocationReducer from './components/game/location/reducer';
import ShopReducer from './components/game/shop/reducer';

// refactored reducers
import InventoryReducer from './components/game/inventory-menu/reducer';
import PlayersReducer from './components/game/players-menu/reducer';
import StatsReducer from './components/game/stats-menu/reducer';

const rootReducer = combineReducers({
    app: AppReducer,
    inventorymenu: InventoryReducer,
    playersmenu: PlayersReducer,
    statsmenu: StatsReducer,
    auth: AuthReducer,
    game: GameReducer,
    character: CharacterReducer,
    events: EventsReducer,
    location: LocationReducer,
    shop: ShopReducer,
    router: routerReducer,
});

export default rootReducer;
