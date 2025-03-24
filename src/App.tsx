import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import MapSection from './components/MapSection';
import WeatherSection from './components/WeatherSection';
import { Message, WeatherData, Location } from './types';
import { getChatResponse } from './lib/gemini';

function App() {
  console.log('App: EMERGENCY LOG - THIS IS THE RIGHT FILE');
  window.alert('App.tsx is running'); // Temporary alert for confirmation

  const [messages, setMessages] = useState<Message[]>([]);
  const [location, setLocation] = useState<Location>({ lat: 51.505, lng: -0.09 });
  const [attractions, setAttractions] = useState<Array<{ name: string; location: Location }>>([]);
  const [tempMarker, setTempMarker] = useState<Location | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationLoaded, setLocationLoaded] = useState<boolean>(false);
  
  // Mock weather data with enhanced structure
  const mockWeather: WeatherData = {
    city: {
      name: "London",
      country: "GB",
      sunrise: 1709186400, // Example timestamp
      sunset: 1709226000,  // Example timestamp
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

  // useEffect(() => {
  //   // Set a fallback timeout - if geolocation takes longer than 5 seconds, use default
  //   const fallbackTimer = setTimeout(() => {
  //     if (!locationLoaded) {
  //       console.log('App: Geolocation taking too long, using default location:', location);
  //       setCurrentLocation(location);
  //       setLocationLoaded(true);
  //     }
  //   }, 5000);

  //   return () => clearTimeout(fallbackTimer);
  // }, [location, locationLoaded]);

  const handleSendMessage = async (content: string) => {
    if (!locationLoaded || !currentLocation) {
      console.log('App: Cannot send message, location not ready. locationLoaded:', locationLoaded, 'currentLocation:', currentLocation);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), content: 'Please wait, location is still loading...', sender: 'bot', timestamp: new Date() },
      ]);
      return;
    }
    // ... (rest of handleSendMessage unchanged)
  };

  const handleLocationChange = (loc: Location | null) => {
    console.log('App: handleLocationChange called with:', loc);
    if (loc) {
      console.log('App: Before setting state - currentLocation:', currentLocation, 'locationLoaded:', locationLoaded);
      setCurrentLocation((prev) => {
        console.log('App: Setting currentLocation - prev:', prev, 'new:', loc);
        setLocationLoaded(true);
        return loc;
      });
      console.log('App: Location successfully set to:', loc);
      console.log('App: After setting state - currentLocation:', currentLocation, 'locationLoaded:', locationLoaded);
    } else {
      console.warn('App: Received null location in handleLocationChange');
    }
  };

  useEffect(() => {
    console.log('App: useEffect for state logging triggered');
    console.log('App: State updated - currentLocation:', currentLocation, 'locationLoaded:', locationLoaded);
  }, [currentLocation, locationLoaded]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[calc(100vh-3rem)]">
          {locationLoaded && currentLocation ? (
            <>
              <ChatWindow
                messages={messages}
                onSendMessage={handleSendMessage}
                currentLocation={currentLocation}
              />
            </>
          ) : (
            <>
              <div className="h-full flex items-center justify-center text-white">
                Loading location... Please wait.
              </div>
            </>
          )}
        </div>
        <div className="space-y-6">
          <MapSection
            location={location}
            attractions={attractions}
            onTempMarkerChange={(marker) => {
              console.log('App: Temp marker updated:', marker);
              setTempMarker(marker);
            }}
            onCurrentLocationChange={handleLocationChange}
          />
          <WeatherSection weather={mockWeather} />
        </div>
      </div>
    </div>
  );
}

export default App;