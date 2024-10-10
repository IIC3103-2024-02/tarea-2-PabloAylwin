import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import planeIcon from './plane-solid.svg';  // Ruta de la imagen del avión
import originPin from './map-pin-solid-3.svg';  // Ruta del icono de aeropuerto de origen
import destPin from './map-pin-solid-2.svg';  // Ruta del icono de aeropuerto de destino
import crashIcon from './skull-crossbones-solid.svg';  // Ruta del ícono de accidente
import landingIcon from './plane-arrival-solid.svg';  // Imagen para despegue
import takeoffIcon from './plane-departure-solid.svg';  // Imagen para aterrizaje
import './styles.css';  // Importar el archivo CSS

// Crear un ícono para los aeropuertos
const airportOriginIcon = L.icon({
  iconUrl: originPin,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const airportDestIcon = L.icon({
  iconUrl: destPin,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Crear un ícono de accidente
const crashMarkerIcon = L.icon({
  iconUrl: crashIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Crear un ícono con rotación dinámica para los aviones
const createRotatedIcon = (rotationAngle) => {
  return L.divIcon({
    className: 'rotated-icon',
    html: `<img src="${planeIcon}" style="transform: rotate(${rotationAngle}deg); width: 40px; height: 40px;" />`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Crear un ícono para takeoff
const takeoffMarkerIcon = L.icon({
  iconUrl: takeoffIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Crear un ícono para landing
const landingMarkerIcon = L.icon({
  iconUrl: landingIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Función para calcular el ángulo de rotación basándose en la posición del avión y la del aeropuerto de destino
const calculateRotationAngle = (planePosition, destinationPosition) => {
  const deltaY = destinationPosition[0] - planePosition[0];
  const deltaX = destinationPosition[1] - planePosition[1];
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);  // Convertir de radianes a grados
  return angle;
};

const FlightMap = ({ flights = [], planes = [], planePaths = {}, takeoffs = [], landings = [], crashes = [] }) => {
  return (
    <MapContainer
      center={[0, 0]} 
      zoom={2} 
      minZoom={2}  
      maxZoom={10}  
      worldCopyJump={true}  
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Mostrar aeropuertos y rutas */}
      {flights.map((flight) => (
        <React.Fragment key={flight.id}>
          <Marker
            position={[flight.departure.location.lat, flight.departure.location.long]}
            icon={airportOriginIcon}
          >
            <Popup>
              <p>Aeropuerto de salida: {flight.departure.name}</p>
            </Popup>
          </Marker>

          <Marker
            position={[flight.destination.location.lat, flight.destination.location.long]}
            icon={airportDestIcon}
          >
            <Popup>
              <p>Aeropuerto de destino: {flight.destination.name}</p>
            </Popup>
          </Marker>

          <Polyline 
            positions={[
              [flight.departure.location.lat, flight.departure.location.long],
              [flight.destination.location.lat, flight.destination.location.long]
            ]}
          />
        </React.Fragment>
      ))}

      {/* Mostrar aviones */}
      {planes.map((plane) => {
      let icon;
      let rotationAngle = 0;
      
      const flight = flights.find(f => f.id === plane.flight_id);

      // Cambiar el ícono dependiendo del estado del avión
      if (plane.status === 'takeoff') {
        icon = takeoffMarkerIcon;  // Ícono para el estado de despegue
      } else if (plane.status === 'arrived') {
        icon = landingMarkerIcon;  // Ícono para aterrizaje
      } else {
        if (flight && flight.destination && flight.destination.location) {
          const destinationPosition = [flight.destination.location.lat, flight.destination.location.long];
          const planePosition = [plane.position.lat, plane.position.long];
          rotationAngle = calculateRotationAngle(planePosition, destinationPosition);
        }
        icon = createRotatedIcon(rotationAngle);  // Ícono para aviones volando
      }

      return (
        <React.Fragment key={plane.flight_id}>
          <Marker
            position={[plane.position.lat, plane.position.long]}
            icon={icon}
          >
            <Popup>
              <p><strong>ID Vuelo:</strong> {plane.flight_id}</p>
              <p><strong>Aerolínea:</strong> {plane.airline.name}</p>
              <p><strong>Capitán:</strong> {plane.captain}</p>
              <p><strong>Estado:</strong> {plane.status}</p>
              <p><strong>ETA:</strong> {plane.ETA}</p>
            </Popup>
          </Marker>

          {planePaths[plane.flight_id] && plane.status === 'flying' && (
            <Polyline positions={planePaths[plane.flight_id]} color="darkgreen" />
          )}
        </React.Fragment>
      );
    })}

      {takeoffs.map((takeoff) => (
        takeoff.position && (
          <Circle
            key={takeoff.flight_id + "_takeoff"}
            center={[takeoff.position.lat, takeoff.position.long]}
            radius={50000}
            color="green"
            fillOpacity={0.5}
          />
        )
      ))}

      {landings.map((landing) => (
        landing.position && (
          <Circle
            key={landing.flight_id + "_landing"}
            center={[landing.position.lat, landing.position.long]}
            radius={50000}
            color="orange"
            fillOpacity={0.5}
          />
        )
      ))}

      {crashes.map((crash) => (
        crash.position && (
          <Marker
            key={crash.flight_id + "_crash"}
            position={[crash.position.lat, crash.position.long]}
            icon={crashMarkerIcon}
          >
            <Popup>
              <p><strong>Accidente del vuelo:</strong> {crash.flight_id}</p>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
};

export default FlightMap;