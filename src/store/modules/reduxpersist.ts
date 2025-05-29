import storage from "redux-persist/lib/storage";
import { persistReducer } from 'redux-persist';
import type { Reducer } from "redux";

export default function reducers(reducers: Reducer){
    const persistReducers = persistReducer(
        {
            key: "BASE",
            storage,
            whitelist: ['authreducer'],
        }, reducers
    );

    return persistReducers;
};

