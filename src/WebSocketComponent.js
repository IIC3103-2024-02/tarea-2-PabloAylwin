/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import FlightMap from './FlightMap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const WebSocketComponent = () => {
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [flights, setFlights] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [takeOffs] = useState([]);  // Despegues
  const [landings] = useState([]);  // Aterrizajes
  const [crashes, setCrashes] = useState([]);  // Accidentes
  const [planePaths, setPlanePaths] = useState({});  // Guardar las trayectorias de los aviones
  const sessionKey = 'activeWebSocket';
  const socketRef = useRef(null);

  const userId = '19625758';  // Usa tu ID de usuario real aquí
  const username = 'pabloaylwin';  // Opcional

  const disconnectWebSocket = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'disconnect',
        id: userId
      }));
      socketRef.current.close();
      console.log("Conexión WebSocket cerrada correctamente.");
      localStorage.removeItem(sessionKey);
    }
  };

  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket('wss://tarea-2.2024-2.tallerdeintegracion.cl/connect');

      socketRef.current.onopen = () => {
        console.log("Conexión WebSocket establecida.");
        if (socketRef.current.readyState === WebSocket.OPEN) {
          const joinEvent = {
            type: 'join',
            id: userId,
            username: username
          };
          socketRef.current.send(JSON.stringify(joinEvent));
        }
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Mensaje recibido:", data);
        handleEvent(data);
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket Error: ", error);
      };

      socketRef.current.onclose = (event) => {
        console.log("Conexión WebSocket cerrada:", event.reason);
        localStorage.removeItem(sessionKey);
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
          localStorage.removeItem(sessionKey);
          break;
        case 'disconnected':
          console.warn("Desconectado por el servidor:", event.message);
          alert("Fuiste desconectado por el servidor.");
          break;
        case 'flights':
          setFlights(Object.values(event.flights));  // Actualizar vuelos
          break;
        case 'plane':
          handlePlane(event.plane);
          break;
        case 'take-off':
          handleTakeOff(event);
          break;
        case 'landing':
          handleLanding(event);
          break;
        case 'crashed':
          handleCrash(event);
          break;
        case 'message':
          handleMessage(event.message);
          break;
        default:
          console.warn("Evento no reconocido:", event.type);
      }
    };

    // Función para detectar si el avión cruza el borde del mapa
    const hasCrossedBoundary = (prevPosition, currentPosition) => {
      const longDiff = Math.abs(prevPosition[1] - currentPosition[1]);

      // Si la diferencia de longitud es mayor que un umbral (por ejemplo, 180 grados), significa que cruzó el límite
      return longDiff > 180;
    };

    // Actualizar la trayectoria del avión evitando la línea larga horizontal
    const updatePlanePath = (plane) => {
      setPlanePaths((prevPaths) => {
        const prevPath = prevPaths[plane.flight_id] || [];
        const lastPosition = prevPath[prevPath.length - 1];
        const currentPosition = [plane.position.lat, plane.position.long];

        if (lastPosition && hasCrossedBoundary(lastPosition, currentPosition)) {
          // Si cruza el límite, comenzamos una nueva trayectoria sin conectar el último punto
          return {
            ...prevPaths,
            [plane.flight_id]: [currentPosition]
          };
        } else {
          // Si no cruza el límite, agregamos la nueva posición normalmente
          return {
            ...prevPaths,
            [plane.flight_id]: [...prevPath, currentPosition]
          };
        }
      });
    };

    // Dentro del WebSocket onmessage para manejar los planes
    const handlePlane = (plane) => {
      console.log("Actualización de avión:", plane);
      setPlanes((prevPlanes) => {
        const updatedPlanes = prevPlanes.filter(p => p.flight_id !== plane.flight_id);
        return [...updatedPlanes, plane];
      });

      // Actualizar la trayectoria del avión y verificar si cruza el borde
      updatePlanePath(plane);
    };

    const handleTakeOff = (takeOff) => {
      console.log("Despegue:", takeOff.flight_id);
      
      // Actualizar el estado del avión a 'takeoff'
      setPlanes((prevPlanes) => {
        const updatedPlanes = prevPlanes.map((plane) =>
          plane.flight_id === takeOff.flight_id
            ? { ...plane, status: 'takeoff' }
            : plane
        );
        return updatedPlanes;
      });
    
      // Eliminar el estado de despegue después de 1 minuto (o el tiempo que definas)
      setTimeout(() => {
        setPlanes((prevPlanes) =>
          prevPlanes.filter((plane) => plane.flight_id !== takeOff.flight_id)
        );
      }, 10000);  // Cambia a 60000 (1 minuto) o al tiempo deseado
    };

    const handleLanding = (landing) => {
      console.log("Aterrizaje:", landing.flight_id);
    
      // Actualizar el estado del avión a 'arrived'
      setPlanes((prevPlanes) => {
        const updatedPlanes = prevPlanes.map((plane) =>
          plane.flight_id === landing.flight_id
            ? { ...plane, status: 'arrived' }
            : plane
        );
        return updatedPlanes;
      });
    
      // Eliminar el avión del mapa después de 1 minuto
      setTimeout(() => {
        setPlanes((prevPlanes) =>
          prevPlanes.filter((plane) => plane.flight_id !== landing.flight_id)
        );
      }, 10000);
    };

    const handleCrash = (crash) => {
      console.log("Accidente:", crash.flight_id);
    
      // Encontrar el avión correspondiente
      const crashedPlane = planes.find(p => p.flight_id === crash.flight_id);
      
      if (crashedPlane) {
        // Actualizar la lista de accidentes con la última posición del avión accidentado
        setCrashes((prevCrashes) => [...prevCrashes, {
          flight_id: crash.flight_id,
          position: crashedPlane.position // Usamos la última posición del avión
        }]);
    
        // Eliminar el avión accidentado de la lista de aviones activos
        setPlanes((prevPlanes) => prevPlanes.filter(p => p.flight_id !== crash.flight_id));
      }
    
      toast.error(`Accidente del vuelo ${crash.flight_id}`);
    
      // Eliminar el crash después de 1 minuto
      setTimeout(() => {
        setCrashes((prevCrashes) => prevCrashes.filter(c => c.flight_id !== crash.flight_id));
      }, 60000);
    };

    const handleMessage = (message) => {
      console.log("Mensaje recibido:", message);
      
      // Capturar fecha y hora actual
      const now = new Date();
      const formattedTime = now.toLocaleTimeString();
      const formattedDate = now.toLocaleDateString();
    
      // Incluir la fecha y hora en el mensaje
      const messageWithTime = {
        ...message,
        time: `${formattedDate} ${formattedTime}`
      };
    
      setMessages((prev) => [...prev, messageWithTime]);
    };

    connectWebSocket();

    window.onbeforeunload = () => {
      disconnectWebSocket();
    };

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;

    const chatEvent = {
      type: 'chat',
      content: chatMessage
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(chatEvent));
      setChatMessage("");
    } else {
      console.error('El WebSocket no está abierto para enviar mensajes.');
    }
  };

  // Función para ordenar los vuelos primero por aeropuerto de origen, luego por aeropuerto de destino
  const sortedFlights = flights.sort((a, b) => {
    if (a.departure.name < b.departure.name) return -1;
    if (a.departure.name > b.departure.name) return 1;
    if (a.destination.name < b.destination.name) return -1;
    if (a.destination.name > b.destination.name) return 1;
    return 0;
  });

  return (
    <div className="container-fluid">
      <ToastContainer />  {/* Contenedor para las notificaciones de toast */}
      <div className="row">
        {/* Mapa de vuelos y aviones */}
        <div className="col-md-8" style={{ height: '600px' }}>
          <h1>Mapa de vuelos y aviones</h1>
          <FlightMap 
            flights={flights} 
            planes={planes}
            planePaths={planePaths}  // Trajectory of planes
            takeOffs={takeOffs}
            landings={landings}
            crashes={crashes}  // Pasar crashes al mapa
          />
        </div>

        {/* Chat */}
        <div className="col-md-4 d-flex flex-column" style={{ height: '600px' }}>
          <h2>Chat</h2>
          <div className="overflow-auto mb-2 flex-grow-1" style={{ border: '1px solid #ccc', padding: '10px' }}>
            <ul>
              {messages.map((msg, index) => (
                <li key={index} style={{ color: msg.level === "warn" ? 'red' : 'inherit' }}>
                  <strong>{msg.name}:</strong> {msg.content} 
                  <em>({msg.level})</em> 
                  <span className="text-muted" style={{ marginLeft: '10px' }}>
                    {msg.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Escribe un mensaje"
            />
            <button className="btn btn-primary" onClick={sendChatMessage}>
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de vuelos */}
      <div className="row mt-4">
        <div className="col">
          <h2>Tabla de vuelos</h2>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID Vuelo</th>
                <th>Aeropuerto de salida</th>
                <th>Aeropuerto de destino</th>
              </tr>
            </thead>
            <tbody>
              {sortedFlights.map((flight) => (
                <tr key={flight.id}>
                  <td>{flight.id}</td>
                  <td>{flight.departure.name} ({flight.departure.city.name}, {flight.departure.city.country.name})</td>
                  <td>{flight.destination.name} ({flight.destination.city.name}, {flight.destination.city.country.name})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WebSocketComponent;