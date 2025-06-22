// components/TripMap.tsx
import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";

// Fix icon loading bug in Leaflet
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

interface Trip {
  id: string;
  kitchens: { name: string; latitude: number; longitude: number };
  delivery_points: { name: string; latitude: number; longitude: number };
}

export const TripMap = ({ trips }: { trips: Trip[] }) => {
  return (
    <MapContainer
      center={[20.5937, 78.9629]} // Center of India
      zoom={5}
      style={{ height: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {trips.map((trip) => {
        const src = [trip.kitchens.latitude, trip.kitchens.longitude];
        const dest = [
          trip.delivery_points.latitude,
          trip.delivery_points.longitude,
        ];
        return (
          <React.Fragment key={trip.id}>
            <Marker position={src}>
              <Popup>Kitchen: {trip.kitchens.name}</Popup>
            </Marker>
            <Marker position={dest}>
              <Popup>Delivery: {trip.delivery_points.name}</Popup>
            </Marker>
            <Polyline positions={[src, dest]} color="blue" />
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};
