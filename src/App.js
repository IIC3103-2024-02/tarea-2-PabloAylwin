import React from 'react';
import WebSocketComponent from './WebSocketComponent';

const App = () => {
  return (
    <div>
      {/* Incluimos el componente que maneja la conexión WebSocket */}
      <WebSocketComponent />
    </div>
  );
};

export default App;