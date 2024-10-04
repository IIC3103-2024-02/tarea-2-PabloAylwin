import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import planeIcon from './plane-solid.svg';  // Ruta de la imagen del avión
import './styles.css';  // Importar el archivo CSS

const calculateRotationAngle = (from, to) => {
    const deltaY = to.lat - from.lat;
    const deltaX = to.long - from.long;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);  // Convertir de radianes a grados
    return angle;
};

// Crear un ícono con rotación dinámica
const createRotatedIcon = (rotationAngle) => {
    return L.divIcon({
        className: 'rotated-icon',  // Clase CSS para aplicar la rotación
        html: `<img src="${planeIcon}" style="transform: rotate(${rotationAngle}deg); width: 40px; height: 40px;" />`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};

const FlightMap = ({ flights, planes }) => {
  return (
    <MapContainer center={[0, 0]} zoom={2} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Mostrar aeropuertos y rutas */}
      {flights.map((flight) => (
        <>
          {/* Marcador para el aeropuerto de salida */}
          <Marker key={flight.id} position={[flight.departure.location.lat, flight.departure.location.long]}>
            <Popup>
              <p>Aeropuerto de salida: {flight.departure.name}</p>
              <p>Ciudad: {flight.departure.city.name}, {flight.departure.city.country.name}</p>
            </Popup>
          </Marker>

          {/* Marcador para el aeropuerto de destino */}
          <Marker key={flight.id + "_dest"} position={[flight.destination.location.lat, flight.destination.location.long]}>
            <Popup>
              <p>Aeropuerto de destino: {flight.destination.name}</p>
              <p>Ciudad: {flight.destination.city.name}, {flight.destination.city.country.name}</p>
            </Popup>
          </Marker>

          {/* Línea entre el aeropuerto de salida y destino */}
          <Polyline positions={[
            [flight.departure.location.lat, flight.departure.location.long],
            [flight.destination.location.lat, flight.destination.location.long]
          ]} />
        </>
      ))}

      {/* Mostrar aviones */}
      {planes.map((plane, index) => {
        const rotationAngle = calculateRotationAngle(plane.position, plane.heading);  // Calcular la rotación
        return (
            <Marker
            key={index}
            position={[plane.position.lat, plane.position.long]}
            icon={createRotatedIcon(rotationAngle)}  // Aplicar ícono rotado
            >
            <Popup>
                <p>ID Vuelo: {plane.flight_id}</p>
                <p>Aerolínea: {plane.airline.name}</p>
                <p>Capitán: {plane.captain}</p>
                <p>Estado: {plane.status}</p>
                <p>ETA: {plane.ETA}</p>
            </Popup>
            </Marker>
        );
        })}

    </MapContainer>
  );
};

export default FlightMap;