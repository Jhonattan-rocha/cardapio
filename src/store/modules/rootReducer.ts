import { combineReducers } from 'redux';
import authreducer from './authReducer/reducer';

export default combineReducers({
    authreducer: authreducer,
});
