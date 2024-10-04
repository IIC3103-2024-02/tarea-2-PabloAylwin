import React from 'react';
import WebSocketComponent from './WebSocketComponent';

const App = () => {
  return (
    <div>
      <h1>Aplicación de WebSocket</h1>
      {/* Incluimos el componente que maneja la conexión WebSocket */}
      <WebSocketComponent />
    </div>
  );
};

export default App;