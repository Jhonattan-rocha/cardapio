import { persistStore } from 'redux-persist';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './modules/rootReducer';
import persistedReducers from './modules/reduxpersist';

const store = configureStore({
    reducer: persistedReducers(rootReducer),
});

export const persistor = persistStore(store);
export default store;
