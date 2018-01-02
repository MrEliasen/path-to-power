import { combineReducers } from 'redux';

//import BuildingReducer from './components/building/redux/reducer';
import ItemReducer from './components/item/redux/reducer';
import MapReducer from './components/map/redux/reducer';
import ShopReducer from './components/shop/redux/reducer';
import NPCReducer from './components/npc/redux/reducer';
import CharacterReducer from './components/character/redux/reducer';

const rootReducer = combineReducers({
    characters: CharacterReducer,
    maps: MapReducer,
    items: ItemReducer,
    npcs: NPCReducer,
    shops: ShopReducer
});

export default rootReducer;