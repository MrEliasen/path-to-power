import { combineReducers } from 'redux';

import BuildingReducer from './components/building/redux/reducer';
import PlayerReducer from './components/player/redux/reducer';
import ItemReducer from './components/item/redux/reducer';
import GameReducer from './core/redux/reducer';

const rootReducer = combineReducers({
    players: PlayerReducer,
    game: GameReducer
});

export default rootReducer;
