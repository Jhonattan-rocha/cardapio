// src/App.tsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import Router from './routes';
import { ToastContainer } from 'react-toastify';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './store';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <BrowserRouter>
          <GlobalStyles />
          <Router />
          <ToastContainer autoClose={4000} draggable />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
};

export default App;