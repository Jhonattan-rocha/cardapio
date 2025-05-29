import axios from 'axios';
import store from '../store';
import * as actions from '../store/modules/authReducer/actions';

const api = axios.create({
    baseURL: "http://localhost:8000/api/v1/"
});

// Interceptor de respostas
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            store.dispatch(actions.Loguot()); // se for Vuex
        }

        return Promise.reject(error); // repassa o erro
    }
);

export default api;
