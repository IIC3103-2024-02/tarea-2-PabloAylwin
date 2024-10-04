import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Crea un root en lugar de usar ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);