'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ChatWindow from '@/components/ChatWindow';
import WeatherSection from '@/components/WeatherSection';
import TodoSection from '@/components/TodoSection';
import { Message, Location, Task } from '@/types';
import { getChatResponse } from '@/lib/gemini';

const MapSection = dynamic(() => import('@/components/MapSection'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] relative bg-slate-800/50 rounded-lg animate-pulse" />
  ),
});

interface POI {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Shop for groceries at Whole Foods',
    dueDate: new Date(),
    completed: false,
    location: { lat: 51.506, lng: -0.091 },
    locationName: 'Whole Foods Market',
    markerColor: '#FF5733',
  },
  {
    id: '2',
    title: 'Meeting at Central Park',
    dueDate: new Date(),
    completed: false,
    location: { lat: 51.504, lng: -0.089 },
    locationName: 'Central Park',
    markerColor: '#33FF57',
  },
  {
    id: '3',
    title: 'Gym session',
    dueDate: new Date(Date.now() + 86400000),
    completed: false,
    location: { lat: 51.505, lng: -0.088 },
    locationName: 'Fitness Center',
    markerColor: '#3357FF',
  },
];

function Home() {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [location, setLocation] = useState<Location>({ lat: 51.505, lng: -0.09 });
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [tempMarker, setTempMarker] = useState<Location | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationLoaded, setLocationLoaded] = useState<boolean>(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [searchCenter, setSearchCenter] = useState<Location | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!locationLoaded || !currentLocation) {
      console.log('Home: Cannot send message, location not ready. locationLoaded:', locationLoaded, 'currentLocation:', currentLocation);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), content: 'Please wait, location is still loading...', sender: 'bot', timestamp: new Date() },
      ]);
      return { content: 'Location not ready', data: null };
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await getChatResponse(
        content,
        tempMarker ? [tempMarker.lng, tempMarker.lat] : undefined, // [lon, lat]
        currentLocation ? [currentLocation.lng, currentLocation.lat] : undefined // [lon, lat]
      );
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data,
      };
      setMessages((prev) => [...prev, botResponse]);

      // Update POIs if present
      if (response.data) {
        setPois(response.data.pois);
        setSearchCenter(response.data.center);
        setSearchRadius(response.data.radiusKm * 1000); // Convert km to meters
      }

      return response; // For ChatWindow
    } catch (error) {
      console.error('Home: Error getting chat response:', error);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), content: 'Sorry, something went wrong.', sender: 'bot', timestamp: new Date() },
      ]);
      return { content: 'Error occurred', data: null };
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task === selectedTask ? undefined : task);
    if (task.location) {
      setLocation(task.location);
    }
  };

  const handleLocationChange = (loc: Location | null) => {
    console.log('Home: handleLocationChange called with:', loc);
    if (loc) {
      setCurrentLocation(loc);
      setLocationLoaded(true);
      console.log('Home: Location successfully set to:', loc);
    } else {
      console.warn('Home: Received null location in handleLocationChange');
    }
  };

  const handlePOIsUpdated = (pois: POI[], center: Location, radiusKm: number) => {
    setPois(pois);
    setSearchCenter(center);
    setSearchRadius(radiusKm * 1000); // Convert km to meters
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2A44] to-[#1A3657]">
      <Header />
      <main className="pt-20 pb-12">
        <div className="content-container max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <div className="glass-card p-1 shadow-lg">
                <div className="h-[400px] relative">
                  <MapSection
                    location={location}
                    tasks={tasks}
                    selectedTask={selectedTask}
                    onTempMarkerChange={setTempMarker}
                    onCurrentLocationChange={handleLocationChange}
                    onSearchThingsToDo={async (query) => {
                      const response = await handleSendMessage(query);
                      return response;
                    }}
                  />
                </div>
              </div>
              {locationLoaded && currentLocation ? (
                <ChatWindow
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentLocation={currentLocation}
                  onPOIsUpdated={handlePOIsUpdated}
                />
              ) : (
                <div className="h-[calc(100vh-400px-6rem)] flex items-center justify-center text-foreground glass-card">
                  <div className="text-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading location... Please wait.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-8">
              <TodoSection
                tasks={tasks}
                onTaskToggle={handleTaskToggle}
                onTaskSelect={handleTaskSelect}
                selectedTask={selectedTask}
              />
              {locationLoaded && currentLocation ? (
                <WeatherSection currentLocation={currentLocation} />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-foreground glass-card">
                  <div className="text-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading weather...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;