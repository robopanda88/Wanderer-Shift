import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

async function getCoordinatesFromPlaceName(placeName: string): Promise<[number, number] | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(placeName)}&limit=1&appid=${apiKey}`;
  console.log('Fetching coordinates for:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      const { lon, lat } = data[0];
      console.log('Location found:', [lon, lat]);
      return [lon, lat];
    }
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

async function getPlaceNameFromCoordinates(lat: number, lon: number): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
  console.log('Fetching place name from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      return data[0].name || data[0].city || 'this spot';
    }
    return null;
  } catch (error) {
    console.error('Error fetching place name:', error);
    return null;
  }
}

async function getWeatherData(lat: number, lon: number): Promise<any | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  console.log('Fetching weather data from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod === 200) return data;
    return null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

async function getWeatherForecast(lat: number, lon: number): Promise<any | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  console.log('Fetching weather forecast from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod === '200') return data;
    return null;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
}

async function getCurrentAirPollution(lat: number, lon: number): Promise<any | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  console.log('Fetching current air pollution from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.list && data.list.length > 0) return data.list[0];
    return null;
  } catch (error) {
    console.error('Error fetching air pollution:', error);
    return null;
  }
}

async function getForecastAirPollution(lat: number, lon: number): Promise<any[] | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  console.log('Fetching forecast air pollution from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.list && data.list.length > 0) return data.list;
    return null;
  } catch (error) {
    console.error('Error fetching forecast air pollution:', error);
    return null;
  }
}

async function getNearbyPOIs(lat: number, lon: number, radiusKm: number): Promise<any[] | null> {
  if (lat < -90 || lat > 90) {
    console.error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    return null;
  }
  if (lon < -180 || lon > 180) {
    console.error(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
    return null;
  }

  const radiusMeters = radiusKm * 1000;
  const query = `[out:json][timeout:25];
(
  node["tourism"="attraction"](around:${radiusMeters},${lat},${lon});
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
  node["leisure"="park"](around:${radiusMeters},${lat},${lon});
);
out body;`.replace(/\s+/g, ' ');

  const url = 'https://overpass-api.de/api/interpreter';
  console.log('Fetching POIs from Overpass API with radius:', radiusKm, 'km');
  console.log('Full query:', query);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('Raw Overpass response:', data);

    if (data.elements && data.elements.length > 0) {
      console.log('POIs found:', data.elements.slice(0, 10));
      return data.elements.slice(0, 10); // Increased to 10
    }
    console.log('No POIs found in response:', data);
    return null;
  } catch (error) {
    console.error('Network error fetching POIs from Overpass API:', error);
    return null;
  }
}

export async function getChatResponse(
  message: string,
  tempMarkerCoords?: [number, number],
  currentLocationCoords?: [number, number]
) {
  console.log('Received in getChatResponse:', { message, tempMarkerCoords, currentLocationCoords });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: `
            You’re a friendly, chatty Map assistant who loves helping out with a warm, natural tone. You can:
            1. Set tasks with coordinates (e.g., "Can you remind me to Shop for Groceries by 15th April?").
            2. Plan travel (e.g., "Plan a trip to Paris" or "Set a travel plan for Paris{location=temporary marker} for 7 days").
            3. Share weather and air quality info (e.g., "Tell me about the location{location=temporary marker}?" or "Tell me about London").
            4. List nearby activities (e.g., "What are the things I can do in Paris (within 15 km)?").

            When parsing commands:
            - Use temporary marker coordinates [${
              tempMarkerCoords ? tempMarkerCoords.join(', ') : 'not provided'
            }] when "{temporary marker}" is mentioned.
            - Use current location coordinates [${
              currentLocationCoords ? currentLocationCoords.join(', ') : 'not provided'
            }] for "current location" or travel starting points.
            - If a place name is given (e.g., "Paris"), fetch its coordinates.
            - For "Tell me about...":
              - Include weather (temp °C, feels-like, condition, humidity, wind, precipitation, sunrise/sunset).
              - Add air quality (AQI 1-5, PM2.5, O3 in µg/m³) and health tips.
              - Mention tomorrow’s air quality trend.
              - Suggest POIs within **5 km** only (e.g., attractions, parks).
            - For "What are the things I can do in...":
              - Parse for radius (e.g., "within 15 km", "within 500 m"); default to **5 km** if not specified.
              - Suggest up to **10 POIs** within the specified radius, tailored to weather/air quality.
              - Prefix each POI with an icon placeholder: [star] for attractions, [utensils] for restaurants, [tree] for parks, [beer] for pubs, [museum] for museums.
            - For "Plan a trip to...":
              - Use 5-day forecast, current weather, air quality, and 10 km POIs.
              - Suggest things to carry/wear and activities.
            - Format naturally with:
              - **Bold** for emphasis (e.g., **13°C**).
              - Bullet points (- item) for lists (e.g., POIs, packing tips).
            - Use the location name (e.g., "Guwahati") instead of coordinates in responses.
            - Add local vibe (landmark, fun fact) and casual suggestions.
            - Assume current date is ${new Date().toISOString().split('T')[0]}, dates as DD/MM/YYYY, times as HH:MM (24-hour).
            - No JSON—just a formatted, chatty response.
          `,
        },
        {
          role: 'model',
          parts: "Hey there! I’m your go-to buddy for weather, trips, and fun stuff to do. Give me a place or a question, and I’ll whip up something helpful with a smile. What’s up?",
        },
      ],
    });

    let finalCoords: [number, number] | undefined = tempMarkerCoords;
    let weatherData: any = null;
    let forecastWeatherData: any = null;
    let currentAirData: any = null;
    let forecastAirData: any[] | null = null;
    let nearbyPOIs: any[] | null = null;
    let locationName = '';
    let radiusKm = 5;

    const isCurrentLocationInfo = message.toLowerCase().includes('current location');
    const isThingsToDo = message.toLowerCase().includes('things i can do in') || message.toLowerCase().includes('things to do near');
    const isTripPlanning = message.toLowerCase().includes('plan a trip to');

    if (isThingsToDo) {
      const radiusMatch = message.match(/within\s+(\d+\.?\d*)\s*(km|m)/i);
      if (radiusMatch) {
        const value = parseFloat(radiusMatch[1]);
        const unit = radiusMatch[2].toLowerCase();
        radiusKm = unit === 'km' ? value : value / 1000;
      }
    }

    if (isCurrentLocationInfo) {
      if (currentLocationCoords) {
        finalCoords = currentLocationCoords;
        weatherData = await getWeatherData(finalCoords[1], finalCoords[0]);
        currentAirData = await getCurrentAirPollution(finalCoords[1], finalCoords[0]);
        forecastAirData = await getForecastAirPollution(finalCoords[1], finalCoords[0]);
        nearbyPOIs = await getNearbyPOIs(finalCoords[1], finalCoords[0], isThingsToDo ? radiusKm : 5);
        locationName = (await getPlaceNameFromCoordinates(finalCoords[1], finalCoords[0])) || 'your current spot';
        if (isTripPlanning) forecastWeatherData = await getWeatherForecast(finalCoords[1], finalCoords[0]);
      } else {
        return { content: "Oops, I can’t find your current location. Check your location settings and let’s try again!", data: null };
      }
    } else {
      const placeMatch = message.match(/(?:about|for|to|do in|near)\s+([A-Za-z\s]+)(?={location=temporary marker}|\?|for\s+\d+\s+days|within\s+\d+\s*(km|m)|$)/i);
      if (message.includes('{temporary marker}') && tempMarkerCoords) {
        finalCoords = tempMarkerCoords;
        weatherData = await getWeatherData(finalCoords[1], finalCoords[0]);
        currentAirData = await getCurrentAirPollution(finalCoords[1], finalCoords[0]);
        forecastAirData = await getForecastAirPollution(finalCoords[1], finalCoords[0]);
        nearbyPOIs = await getNearbyPOIs(finalCoords[1], finalCoords[0], isThingsToDo ? radiusKm : 5);
        locationName = (await getPlaceNameFromCoordinates(finalCoords[1], finalCoords[0])) || 'that spot you marked';
        if (isTripPlanning) forecastWeatherData = await getWeatherForecast(finalCoords[1], finalCoords[0]);
      } else if (placeMatch) {
        const placeName = placeMatch[1].trim();
        if (placeName.toLowerCase() !== 'the current location' && placeName.toLowerCase() !== 'current location') {
          const coords = await getCoordinatesFromPlaceName(placeName);
          if (coords) {
            finalCoords = coords;
            weatherData = await getWeatherData(coords[1], coords[0]);
            currentAirData = await getCurrentAirPollution(coords[1], coords[0]);
            forecastAirData = await getForecastAirPollution(coords[1], coords[0]);
            nearbyPOIs = await getNearbyPOIs(coords[1], coords[0], isThingsToDo ? radiusKm : 5);
            locationName = placeName;
            if (isTripPlanning) forecastWeatherData = await getWeatherForecast(coords[1], coords[0]);
          }
        }
      }
    }

    if (!finalCoords && (message.includes('{temporary marker}') || message.toLowerCase().includes('location') || message.toLowerCase().includes('about') || message.toLowerCase().includes('for') || message.toLowerCase().includes('to') || isThingsToDo || isTripPlanning)) {
      return { content: "Hmm, I’m not sure where you mean! Drop a marker or give me a place name to play with, okay?", data: null };
    }

    let promptWithCoords = message;
    if (finalCoords) {
      promptWithCoords = `${message}\nCoordinates: [${finalCoords.join(', ')}]\nLocation name: ${locationName}`;
      if (weatherData) promptWithCoords += `\nWeather data: ${JSON.stringify(weatherData)}`;
      if (currentAirData) promptWithCoords += `\nCurrent air pollution data: ${JSON.stringify(currentAirData)}`;
      if (forecastAirData) promptWithCoords += `\nForecast air pollution data: ${JSON.stringify(forecastAirData.slice(0, 24))}`;
      if (nearbyPOIs) promptWithCoords += `\nNearby POIs (within ${isThingsToDo ? radiusKm : 5} km): ${JSON.stringify(nearbyPOIs)}`;
      if (forecastWeatherData) promptWithCoords += `\n5-day weather forecast: ${JSON.stringify(forecastWeatherData)}`;
    }

    console.log('Sending prompt to LLM:', promptWithCoords);

    const result = await chat.sendMessage(promptWithCoords);
    const response = result.response.text();

    return {
      content: response.trim() || 'Hey, I’ve got nothing yet—give me a place or a nudge!',
      data: nearbyPOIs ? { pois: nearbyPOIs, center: { lat: finalCoords![1], lng: finalCoords![0] }, radiusKm } : null,
    };
  } catch (error) {
    console.error('Error getting chat response:', error);
    return { content: 'Yikes, something went off the rails. Let’s try again soon!', data: null };
  }
}