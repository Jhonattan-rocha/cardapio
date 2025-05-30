import { persistStore } from 'redux-persist';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './modules/rootReducer';
import persistedReducers from './modules/reduxpersist';

const store = configureStore({
    reducer: persistedReducers(rootReducer),
    middleware(getDefaultMiddleware) {
        return getDefaultMiddleware({ serializableCheck: false });
    },
});

export const persistor = persistStore(store);
export default store;
