// src/App.tsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import Router from './routes';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <GlobalStyles />
      <Router />
    </BrowserRouter>
  );
};

export default App;