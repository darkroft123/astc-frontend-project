"use client";
import dynamic from "next/dynamic";

interface GoogleMapProps {
  center: { lat: number; lng: number };
  height?: string;
  zoom?: number;
  autoCenter?: boolean;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  markerDraggable?: boolean;
}

// We use dynamic import for the Leaflet component to avoid SSR issues
const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false });

export function GoogleMap(props: GoogleMapProps) {
  // We use Leaflet instead of Google Maps to avoid API key and billing requirements
  return <LeafletMap {...props} />;
}