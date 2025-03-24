'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, Task } from '@/types';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapSectionProps {
  location: Location;
  tasks?: Task[];
  selectedTask?: Task;
  onTempMarkerChange?: (marker: Location | null) => void;
  onCurrentLocationChange?: (location: Location | null) => void;
}

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 25px;
      height: 25px;
      background-color: ${color};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background-color: #4285F4;
      border-radius: 50%;
      border: 3px solid #A0C5F9;
      box-shadow: 0 0 8px rgba(66, 133, 244, 0.5);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const tempMarkerIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function MapSection({ 
  location, 
  tasks = [], 
  selectedTask,
  onTempMarkerChange, 
  onCurrentLocationChange 
}: MapSectionProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [tempMarker, setTempMarker] = useState<Location | null>(null);
  const [isTaggingMode, setIsTaggingMode] = useState(false);
  const initialized = useRef(false); // Track initialization

  // Fetch geolocation and set initial view only once
  useEffect(() => {
    if (initialized.current) return; // Skip if already initialized
    initialized.current = true;

    console.log('MapSection: Initializing map location');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          console.log('MapSection: Geolocation success:', newLocation);
          setUserLocation(newLocation);
          onCurrentLocationChange?.(newLocation);
          if (mapRef.current) {
            mapRef.current.setView([newLocation.lat, newLocation.lng], 14);
          }
        },
        (error) => {
          console.error('MapSection: Geolocation error:', error.message);
          setUserLocation(location);
          onCurrentLocationChange?.(location);
          if (mapRef.current) {
            mapRef.current.setView([location.lat, location.lng], 14);
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error('MapSection: Geolocation not supported');
      setUserLocation(location);
      onCurrentLocationChange?.(location);
      if (mapRef.current) {
        mapRef.current.setView([location.lat, location.lng], 14);
      }
    }
  }, [location, onCurrentLocationChange]); // Dependencies only for initial setup

  // Handle selectedTask changes separately
  useEffect(() => {
    if (mapRef.current && selectedTask?.location) {
      console.log('MapSection: Moving to selected task location:', selectedTask.location);
      mapRef.current.flyTo([selectedTask.location.lat, selectedTask.location.lng], 14, { duration: 1 });
    }
  }, [selectedTask]);

  // Handle map click for temporary marker
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;

      const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (isTaggingMode) {
          const { lat, lng } = e.latlng;
          console.log('MapSection: Setting temp marker at:', { lat, lng });
          setTempMarker({ lat, lng });
          onTempMarkerChange?.({ lat, lng });
          setIsTaggingMode(false);
        }
      };

      map.on('click', handleMapClick);
      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [isTaggingMode, onTempMarkerChange]);

  const clearTempMarker = () => {
    console.log('MapSection: Clearing temp marker');
    setTempMarker(null);
    onTempMarkerChange?.(null);
  };

  const centerOnCurrentLocation = () => {
    if (mapRef.current && userLocation) {
      console.log('MapSection: Centering on current location:', userLocation);
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1 });
    }
  };

  const toggleTaggingMode = () => {
    console.log('MapSection: Toggling tagging mode to:', !isTaggingMode);
    setIsTaggingMode((prev) => !prev);
  };

  if (!userLocation) {
    return <div className="h-full flex items-center justify-center text-white">Loading map...</div>;
  }

  return (
    <div className="h-[400px] relative rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]} // Initial center only
        zoom={14}
        className="h-full w-full"
        zoomControl={true} // Enable zoom controls
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[userLocation.lat, userLocation.lng]} icon={currentLocationIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {tempMarker && (
          <Marker position={[tempMarker.lat, tempMarker.lng]} icon={tempMarkerIcon}>
            <Popup>Temporary Marker</Popup>
          </Marker>
        )}
        {tasks.map((task) => (
          <Marker
            key={task.id}
            position={[task.location.lat, task.location.lng]}
            icon={createMarkerIcon(task.markerColor || '#FFD700')}
          >
            <Popup>{task.title}</Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute top-2 left-2 flex space-x-2 z-[1000]">
        <button
          onClick={clearTempMarker}
          className="bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
          title="Clear temporary marker"
        >
          X
        </button>
        <button
          onClick={centerOnCurrentLocation}
          className="bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-blue-600"
          title="Center on current location"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
        <button
          onClick={toggleTaggingMode}
          className={`text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
            isTaggingMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
          }`}
          title={isTaggingMode ? 'Deactivate marker tagging' : 'Activate marker tagging'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14v2H5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5v14h2V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}