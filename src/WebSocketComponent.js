import React, { useEffect, useState } from 'react';
import FlightMap from './FlightMap';  // Importar el componente del mapa

const WebSocketComponent = () => {
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [flights, setFlights] = useState([]);
  const [planes, setPlanes] = useState([]);
  const sessionKey = 'activeWebSocket';  // Clave para guardar el estado en localStorage

  const userId = '19625758';  // Usa tu ID de usuario real aquí
  const username = 'pabloaylwin';  // Opcional

  useEffect(() => {
    let socket;

    const connectWebSocket = () => {
      // Verificar si ya hay otra pestaña conectada con el mismo ID
      const activeSession = localStorage.getItem(sessionKey);
      if (activeSession) {
        console.warn("Ya hay otra pestaña conectada con el mismo ID.");
        return;  // Evitar abrir una nueva conexión si ya hay una activa
      }

      // Marcar esta pestaña como conectada
      localStorage.setItem(sessionKey, 'connected');

      // Crear la conexión WebSocket
      socket = new WebSocket('wss://tarea-2.2024-2.tallerdeintegracion.cl/connect');

      socket.onopen = () => {
        console.log("Conexión WebSocket establecida.");

        // Envía el evento JOIN al abrir la conexión
        const joinEvent = {
          type: 'join',
          id: userId,
          username: username
        };
        socket.send(JSON.stringify(joinEvent));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Mensaje recibido:", data);
        handleEvent(data);
      };

      socket.onerror = (error) => {
        console.error("WebSocket Error: ", error);
      };

      socket.onclose = (event) => {
        console.log("Conexión WebSocket cerrada:", event.reason);
        
        // Eliminar el estado de conexión del `localStorage`
        localStorage.removeItem(sessionKey);

        // Intentar reconectar si no fue denegado
        if (event.reason !== 'denied') {
          setTimeout(connectWebSocket, 5000);
        }
      };
    };

    const handleEvent = (event) => {
      switch (event.type) {
        case 'accepted':
          console.log("Conexión aceptada por el servidor");
          break;
        case 'denied':
          console.error("Conexión denegada:", event.reason);
          alert("Ya estás conectado con este ID en otra sesión.");
          // Detener cualquier intento de reconexión si es denegado
          localStorage.removeItem(sessionKey);
          break;
        case 'disconnected':
          console.warn("Desconectado por el servidor:", event.message);
          alert("Fuiste desconectado por el servidor.");
          break;
        case 'flights':
          handleFlights(event.flights);
          setFlights(Object.values(event.flights));  // Actualizar vuelos
          break;
        case 'plane':
          handlePlane(event.plane);
          setPlanes((prevPlanes) => [...prevPlanes, event.plane]);  // Actualizar aviones
          break;
        case 'take-off':
          handleTakeOff(event.flight_id);
          break;
        case 'landing':
          handleLanding(event.flight_id);
          break;
        case 'crashed':
          handleCrash(event.flight_id);
          break;
        case 'message':
          handleMessage(event.message);
          break;
        default:
          console.warn("Evento no reconocido:", event.type);
      }
    };

    const handleFlights = (flights) => {
      console.log("Vuelos activos:", flights);
    };

    const handlePlane = (plane) => {
      console.log("Actualización de avión:", plane);
    };

    const handleTakeOff = (flight_id) => {
      console.log("Despegue del vuelo:", flight_id);
    };

    const handleLanding = (flight_id) => {
      console.log("Aterrizaje del vuelo:", flight_id);
    };

    const handleCrash = (flight_id) => {
      console.log("Accidente del vuelo:", flight_id);
    };

    const handleMessage = (message) => {
      console.log("Mensaje recibido:", message);
      setMessages((prev) => [...prev, message]);
    };

    connectWebSocket();

    // Cerrar el WebSocket al salir o recargar la página
    window.onbeforeunload = () => {
      localStorage.removeItem(sessionKey);  // Limpiar `localStorage` al cerrar
      if (socket) {
        socket.close();
      }
    };

    // Limpiar WebSocket al desmontar el componente
    return () => {
      localStorage.removeItem(sessionKey);  // Limpiar `localStorage` al desmontar
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Función para enviar mensajes de chat
  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;

    const chatEvent = {
      type: 'chat',
      content: chatMessage
    };

    const socket = new WebSocket('wss://tarea-2.2024-2.tallerdeintegracion.cl/connect');
    socket.onopen = () => {
      socket.send(JSON.stringify(chatEvent));
      setChatMessage("");  // Limpiar el mensaje después de enviarlo
    };
  };

  return (
    <>
      {/* Sección de mensajes de chat */}
      <div>
        <h1>Mensajes recibidos:</h1>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg.name}: {msg.content} ({msg.level})</li>
          ))}
        </ul>

        <h2>Enviar mensaje de chat:</h2>
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder="Escribe un mensaje"
        />
        <button onClick={sendChatMessage}>Enviar</button>
      </div>

      {/* Sección del mapa */}
      <div>
        <h1>Mapa de vuelos y aviones</h1>
        <FlightMap flights={flights} planes={planes} />  {/* Pasar los vuelos y aviones al mapa */}
      </div>
    </>
  );
};

export default WebSocketComponent;