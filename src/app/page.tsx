'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ChatWindow from '@/components/ChatWindow';
import WeatherSection from '@/components/WeatherSection';
import TodoSection from '@/components/TodoSection';
import { Message, WeatherData, Location, Task } from '@/types';
import { getChatResponse } from '@/lib/gemini';

// Dynamically import MapSection with no SSR to avoid leaflet window issues
const MapSection = dynamic(() => import('@/components/MapSection'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] relative bg-slate-800 rounded-lg animate-pulse" />
  ),
});

// Mock tasks data remains unchanged
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Shop for groceries at Whole Foods',
    dueDate: new Date(),
    completed: false,
    location: { lat: 51.506, lng: -0.091 },
    locationName: 'Whole Foods Market',
    markerColor: '#FF5733'
  },
  {
    id: '2',
    title: 'Meeting at Central Park',
    dueDate: new Date(),
    completed: false,
    location: { lat: 51.504, lng: -0.089 },
    locationName: 'Central Park',
    markerColor: '#33FF57'
  },
  {
    id: '3',
    title: 'Gym session',
    dueDate: new Date(Date.now() + 86400000),
    completed: false,
    location: { lat: 51.505, lng: -0.088 },
    locationName: 'Fitness Center',
    markerColor: '#3357FF'
  }
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

  // Mock weather data
  const mockWeather: WeatherData = {
    city: {
      name: "London",
      country: "GB",
      sunrise: 1709186400,
      sunset: 1709226000,
      timezone: 0
    },
    temperature: {
      value: 22,
      min: 18,
      max: 24,
      feels_like: 23,
      unit: "C"
    },
    humidity: {
      value: 65,
      unit: "%"
    },
    pressure: {
      value: 1013,
      unit: "hPa"
    },
    wind: {
      speed: {
        value: 5.2,
        unit: "m/s",
        name: "Gentle Breeze"
      },
      direction: {
        value: 250,
        code: "WSW",
        name: "West-Southwest"
      }
    },
    clouds: {
      value: 40,
      name: "Scattered Clouds"
    },
    visibility: {
      value: 8000
    },
    airQuality: {
      index: 2,
      components: {
        co: 230.31,
        no2: 12.94,
        o3: 80.12,
        pm2_5: 8.5,
        pm10: 12.3
      }
    },
    forecast: [
      {
        dt: 1709186400,
        temp: {
          day: 22,
          min: 18,
          max: 24,
          night: 17
        },
        weather: {
          id: 800,
          main: "Clear",
          description: "clear sky",
          icon: "01d"
        },
        pop: 0.1,
        humidity: 65
      },
      {
        dt: 1709272800,
        temp: {
          day: 21,
          min: 17,
          max: 23,
          night: 16
        },
        weather: {
          id: 801,
          main: "Clouds",
          description: "few clouds",
          icon: "02d"
        },
        pop: 0.2,
        humidity: 68
      },
      {
        dt: 1709359200,
        temp: {
          day: 20,
          min: 16,
          max: 22,
          night: 15
        },
        weather: {
          id: 500,
          main: "Rain",
          description: "light rain",
          icon: "10d"
        },
        pop: 0.6,
        humidity: 72
      },
      {
        dt: 1709445600,
        temp: {
          day: 19,
          min: 15,
          max: 21,
          night: 14
        },
        weather: {
          id: 800,
          main: "Clear",
          description: "clear sky",
          icon: "01d"
        },
        pop: 0.1,
        humidity: 70
      },
      {
        dt: 1709532000,
        temp: {
          day: 21,
          min: 17,
          max: 23,
          night: 16
        },
        weather: {
          id: 801,
          main: "Clouds",
          description: "few clouds",
          icon: "02d"
        },
        pop: 0.3,
        humidity: 67
      }
    ]
  };

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
      return;
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
        tempMarker ? [tempMarker.lat, tempMarker.lng] : undefined,
        currentLocation ? [currentLocation.lat, currentLocation.lng] : undefined
      );
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data,
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Home: Error getting chat response:', error);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), content: 'Sorry, something went wrong.', sender: 'bot', timestamp: new Date() },
      ]);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
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

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Header />
      <main className="pt-16">
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <div className="h-[400px] relative">
                <MapSection
                  location={location}
                  tasks={tasks}
                  selectedTask={selectedTask}
                  onTempMarkerChange={setTempMarker}
                  onCurrentLocationChange={handleLocationChange}
                />
              </div>
              {locationLoaded && currentLocation ? (
                <ChatWindow
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentLocation={currentLocation}
                />
              ) : (
                <div className="h-[calc(100vh-400px-6rem)] flex items-center justify-center text-white bg-slate-800 rounded-lg">
                  Loading location... Please wait.
                </div>
              )}
            </div>
            
            <div className="lg:col-span-3 space-y-6">
              <TodoSection
                tasks={tasks}
                onTaskToggle={handleTaskToggle}
                onTaskSelect={handleTaskSelect}
                selectedTask={selectedTask}
              />
              <WeatherSection weather={mockWeather} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;