import { combineReducers } from 'redux';
import { ADD_SCORE } from './actions';

const score = (state = 0, action) => {
    switch (action.type) {
        case ADD_SCORE:
            return state + action.payload;
        default:
            return state;
    }
};

export default combineReducers({
    score,
});
