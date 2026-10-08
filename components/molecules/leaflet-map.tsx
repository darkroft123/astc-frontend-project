"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface LeafletMapProps {
  center: { lat: number; lng: number };
  height?: string;
  zoom?: number;
  autoCenter?: boolean;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  markerDraggable?: boolean;
}

function MapUpdater({
  center,
  zoom,
  autoCenter,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  autoCenter: boolean;
}) {
  const map = useMap();
  const prevCenter = useRef(center);
  useEffect(() => {
    if (autoCenter && (prevCenter.current.lat !== center.lat || prevCenter.current.lng !== center.lng)) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
      prevCenter.current = center;
    }
  }, [center, autoCenter, map, zoom]);
  return null;
}

function MapEvents({
  onCenterChange,
  markerDraggable,
}: {
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  markerDraggable: boolean;
}) {
  useMapEvents({
    click(e: any) {
      if (markerDraggable && onCenterChange) {
        onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function LeafletMap({
  center,
  height = "300px",
  zoom = 17,
  autoCenter = false,
  onCenterChange,
  markerDraggable = true,
}: LeafletMapProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        className="w-full bg-muted animate-pulse rounded-xl border border-border"
        style={{ height, minHeight: height }}
      />
    );
  }

  const handleDragEnd = (e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    if (onCenterChange) {
      onCenterChange({ lat: position.lat, lng: position.lng });
    }
  };

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-border relative z-0"
      style={{ height, minHeight: height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[center.lat, center.lng]}
          draggable={markerDraggable}
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        />
        <MapUpdater center={center} zoom={zoom} autoCenter={autoCenter} />
        <MapEvents
          onCenterChange={onCenterChange}
          markerDraggable={markerDraggable}
        />
      </MapContainer>
    </div>
  );
}
