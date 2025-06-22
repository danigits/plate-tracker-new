// components/DeliveryRouteMap.tsx
import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

type Point = {
  name: string;
  latitude: number;
  longitude: number;
};

interface DeliveryRouteProps {
  kitchen: Point;
  deliveryPoints: Point[];
}

export const DeliveryRouteMap = ({
  kitchen,
  deliveryPoints,
}: DeliveryRouteProps) => {
  const allPoints = [kitchen, ...deliveryPoints, kitchen];
  const polylinePositions = allPoints.map((p) => [p.latitude, p.longitude]);

  return (
    <MapContainer
      center={[kitchen.latitude, kitchen.longitude]}
      zoom={12}
      style={{ height: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {allPoints.map((point, idx) => (
        <Marker key={idx} position={[point.latitude, point.longitude]}>
          <Popup>
            {idx === 0
              ? `Kitchen (Start)`
              : idx === allPoints.length - 1
              ? "Kitchen (Return)"
              : point.name}
          </Popup>
        </Marker>
      ))}
      <Polyline positions={polylinePositions} color="green" />
    </MapContainer>
  );
};
