'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, Task, POI } from '@/types';
import L from 'leaflet';
import { X, Navigation, Plus, Cloud, Gauge, Wind, Thermometer, Droplets, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Fix for default marker icon
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
  onSearchThingsToDo?: (query: string) => Promise<{ content: string; data: { pois: any[]; center: Location; radiusKm: number } | null }>;
}

const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="width: 24px; height: 24px; background-color: #4285F4; border-radius: 50%; border: 4px solid #A0C5F9; box-shadow: 0 0 10px rgba(66, 133, 244, 0.6);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const tempMarkerIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const createPOIMarkerIcon = (category: string) => {
  const categoryStyles: { [key: string]: { color: string; emoji: string } } = {
    attraction: { color: '#FFD700', emoji: '🌟' },
    restaurant: { color: '#FF5733', emoji: '🍴' },
    park: { color: '#28A745', emoji: '🌳' },
    pub: { color: '#8B4513', emoji: '🍺' },
    museum: { color: '#6A5ACD', emoji: '🏛️' },
    unknown: { color: '#17A2B8', emoji: '📍' },
  };

  const { color, emoji } = categoryStyles[category.toLowerCase()] || categoryStyles.unknown;
  return L.divIcon({
    className: 'poi-marker',
    html: `
      <div style="width: 30px; height: 30px; background-color: ${color}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 16px;">${emoji}</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || '';

interface TileLayerConfig {
  url: string;
  icon: LucideIcon;
  color: string;
  label: string;
}

const tileLayers: Record<string, TileLayerConfig> = {
  base: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', icon: Map, color: 'text-blue-400', label: 'Base Map' },
  clouds: { url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Cloud, color: 'text-gray-400', label: 'Cloud Cover' },
  pressure: { url: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Gauge, color: 'text-purple-400', label: 'Sea Level Pressure' },
  wind: { url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Wind, color: 'text-teal-400', label: 'Wind Speed' },
  temperature: { url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Thermometer, color: 'text-red-400', label: 'Temperature' },
  precipitation: { url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Droplets, color: 'text-blue-500', label: 'Precipitation' },
};

const MapEventsHandler: React.FC<{
  isTaggingMode: boolean;
  setTempMarker: (loc: Location | null) => void;
  onTempMarkerChange?: (marker: Location | null) => void;
}> = ({ isTaggingMode, setTempMarker, onTempMarkerChange }) => {
  useMapEvents({
    click(e) {
      if (isTaggingMode) {
        const newMarker = { lat: e.latlng.lat, lng: e.latlng.lng };
        console.log('MapSection: Setting temporary marker at:', newMarker);
        setTempMarker(newMarker);
        onTempMarkerChange?.(newMarker);
      }
    },
  });
  return null;
};

export default function MapSection({ 
  location, 
  tasks = [], 
  selectedTask,
  onTempMarkerChange, 
  onCurrentLocationChange,
  onSearchThingsToDo
}: MapSectionProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [tempMarker, setTempMarker] = useState<Location | null>(null);
  const [isTaggingMode, setIsTaggingMode] = useState(false);
  const [activeLayer, setActiveLayer] = useState<string>('base');
  const [loadedLayers, setLoadedLayers] = useState<Record<string, L.TileLayer>>({});
  const [pois, setPois] = useState<POI[]>([]);
  const [searchCenter, setSearchCenter] = useState<Location | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          onCurrentLocationChange?.(newLocation);
          if (mapRef.current) mapRef.current.setView([newLocation.lat, newLocation.lng], 14);
        },
        (error) => {
          setUserLocation(location);
          onCurrentLocationChange?.(location);
          if (mapRef.current) mapRef.current.setView([location.lat, location.lng], 14);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setUserLocation(location);
      onCurrentLocationChange?.(location);
      if (mapRef.current) mapRef.current.setView([location.lat, location.lng], 14);
    }
  }, [location, onCurrentLocationChange]);

  const handleThingsToDo = async (query: string) => {
    if (!onSearchThingsToDo || !userLocation) return;

    console.log('MapSection: Searching for things to do with query:', query);
    const { content, data } = await onSearchThingsToDo(query);
    if (data) {
      const { pois: rawPois, center, radiusKm } = data;
      const mappedPois: POI[] = rawPois.map(poi => ({
        id: poi.id.toString(),
        lat: poi.lat,
        lng: poi.lon,
        name: poi.tags.name || 'Unnamed',
        category: poi.tags.amenity || poi.tags.leisure || poi.tags.tourism || 'unknown',
      }));
      console.log('MapSection: Setting POIs:', mappedPois);
      setPois(mappedPois);
      setSearchCenter(center);
      setSearchRadius(radiusKm * 1000);

      if (mapRef.current) {
        console.log('MapSection: Flying to center:', center, 'with radius:', radiusKm);
        mapRef.current.flyTo([center.lat, center.lng], 12, { duration: 1 });
        setActiveLayer('base');
        Object.keys(loadedLayers).forEach(key => {
          if (loadedLayers[key]) mapRef.current?.removeLayer(loadedLayers[key]);
        });
      }
    } else {
      console.log('MapSection: No data returned from search');
    }
  };

  const clearTempMarker = () => {
    setTempMarker(null);
    onTempMarkerChange?.(null);
    setPois([]);
    setSearchCenter(null);
    setSearchRadius(0);
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

  const handleLayerChange = (layerKey: string) => {
    if (!mapRef.current || !API_KEY || layerKey === activeLayer) return;

    const map = mapRef.current;

    if (activeLayer && activeLayer !== 'base' && loadedLayers[activeLayer]) {
      map.removeLayer(loadedLayers[activeLayer]);
    }

    if (!loadedLayers[layerKey] && layerKey !== 'base') {
      const newLayer = L.tileLayer(tileLayers[layerKey].url, {
        attribution: '© OpenWeatherMap',
        opacity: 0.7,
      });
      setLoadedLayers((prev) => ({ ...prev, [layerKey]: newLayer }));
      newLayer.addTo(map);
    } else if (layerKey !== 'base') {
      loadedLayers[layerKey].addTo(map);
    }

    setActiveLayer(layerKey);
  };

  if (!userLocation) {
    return <div className="h-full flex items-center justify-center text-white">Loading map...</div>;
  }

  return (
    <div className="h-[400px] relative rounded-lg overflow-hidden shadow-lg bg-muted/20">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        className="h-full w-full"
        zoomControl={true}
        ref={mapRef}
      >
        <TileLayer
          url={tileLayers.base.url}
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {activeLayer !== 'base' && loadedLayers[activeLayer] && <TileLayer url={tileLayers[activeLayer].url} />}
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
            icon={L.divIcon({
              className: 'task-marker',
              html: `<div style="width: 30px; height: 30px; background-color: ${task.markerColor || '#00D4FF'}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              popupAnchor: [0, -15],
            })}
          >
            <Popup>{task.title}</Popup>
          </Marker>
        ))}
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={createPOIMarkerIcon(poi.category)}
          >
            <Popup>{`${poi.name} (${poi.category})`}</Popup>
          </Marker>
        ))}
        {searchCenter && searchRadius > 0 && (
          <Circle
            center={[searchCenter.lat, searchCenter.lng]}
            radius={searchRadius}
            pathOptions={{
              color: '#4285F4', // Always blue, no temp marker dependency
              fillColor: '#A0C5F9',
              fillOpacity: 0.2,
            }}
          />
        )}
        <MapEventsHandler
          isTaggingMode={isTaggingMode}
          setTempMarker={setTempMarker}
          onTempMarkerChange={onTempMarkerChange}
        />
      </MapContainer>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex space-x-3 z-[1000]">
        <button
          onClick={clearTempMarker}
          className={cn("neomorphic w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-accent text-accent-foreground hover:bg-accent/80 transition-all duration-200 glow-accent")}
          title="Clear temporary marker and POIs"
        >
          <X size={20} />
        </button>
        <button
          onClick={() => centerOnCurrentLocation()}
          className={cn("neomorphic w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-primary text-primary-foreground hover:bg-primary/80 transition-all duration-200 glow-primary")}
          title="Center on current location"
        >
          <Navigation size={20} />
        </button>
        <button
          onClick={toggleTaggingMode}
          className={cn(
            "neomorphic w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
            isTaggingMode ? "bg-green-500 text-white hover:bg-green-600 glow-green-500" : "bg-secondary text-foreground hover:bg-secondary/80 glow-secondary"
          )}
          title={isTaggingMode ? 'Deactivate marker tagging' : 'Activate marker tagging'}
        >
          <Plus size={20} className={isTaggingMode ? "rotate-45" : ""} />
        </button>
        <button
          onClick={() => handleThingsToDo('Things to do in this location')}
          className={cn("neomorphic w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-teal-500 text-white hover:bg-teal-600 transition-all duration-200 glow-teal-500")}
          title="Find things to do at current location"
        >
          <Map size={20} />
        </button>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-3 z-[1000]">
        {Object.entries(tileLayers).map(([key, { icon: Icon, color, label }]) => (
          <button
            key={key}
            onClick={() => handleLayerChange(key)}
            disabled={activeLayer === key}
            className={cn(
              "neomorphic w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-secondary text-foreground hover:bg-secondary/80 transition-all duration-200 relative group glow-secondary",
              activeLayer === key && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon size={20} className={color} />
            <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}