import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

async function getCoordinatesFromPlaceName(placeName: string): Promise<[number, number] | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.error('OpenWeatherMap API key not found');
    return null;
  }

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
    console.log('No coordinates found for:', placeName);
    return null;
  } catch (error) {
    console.error('Error fetching coordinates from OpenWeatherMap:', error);
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
            You are a helpful Map assistant. Keep responses concise and friendly. You can:
            1. Set tasks with coordinates (e.g., "Can you remind me to Shop for Groceries by 15th April?").
            2. Plan travel (e.g., "Set a travel plan for Paris{location=temporary marker} for 7 days" or "Plan a trip for Paris for 7 days").
            3. Show weather or info for a location (e.g., "Tell me about the location{location=temporary marker}?" or "Tell me about the current location").
            
            When parsing commands:
            - Use the temporary marker coordinates [${
              tempMarkerCoords ? tempMarkerCoords.join(', ') : 'not provided'
            }] when "{temporary marker}" is mentioned or coords are implied.
            - Use the current location coordinates [${
              currentLocationCoords ? currentLocationCoords.join(', ') : 'not provided'
            }] as the starting point for travel plans and for info requests about "current location".
            - If no coordinates are provided and a place name is given (e.g., "Paris"), use those coordinates as the destination for travel or the target for info.
            - If no location is clear, return a message asking for a marker.
            - Assume the current date is ${new Date().toISOString().split('T')[0]} unless specified.
            - Format dates as DD/MM/YYYY.
            
            Return a natural language response followed by a JSON object in one of these formats:
            1. Tasks: {"action":"task","name":"task name","date":"DD/MM/YYYY","coords":[longitude, latitude]}
            2. Travel: {"action":"travel","name":"city name","length":"days","date":"DD/MM/YYYY","start":[longitude, latitude],"destination":[longitude, latitude]}
            3. Info: {"action":"info","coords":[longitude, latitude]}
            
            Separate the natural language response and JSON with a single line break (\n). Provide the JSON as a valid string without additional markers.
          `,
        },
        {
          role: 'model',
          parts: "I'll help you with tasks, travel, and info in a friendly way. If you mention a temporary marker, I’ll use its coordinates. Let’s get started!",
        },
      ],
    });

    let finalCoords: [number, number] | undefined = tempMarkerCoords;

    const isCurrentLocationInfo = message.toLowerCase().includes('current location');
    if (isCurrentLocationInfo) {
      if (currentLocationCoords) {
        finalCoords = currentLocationCoords;
        console.log('Using current location coords:', finalCoords);
      } else {
        console.log('No current location coords available');
        return {
          content: "Sorry, I couldn’t determine your current location. Please ensure location access is enabled.",
          data: null,
        };
      }
    } else {
      const placeMatch = message.match(/(?:about|for|to)\s+([A-Za-z\s]+)(?={location=temporary marker}|\?|for\s+\d+\s+days|$)/i);
      if (!finalCoords && placeMatch) {
        const placeName = placeMatch[1].trim();
        if (placeName.toLowerCase() !== 'the current location' && placeName.toLowerCase() !== 'current location') {
          console.log('Detected place name:', placeName);
          const coords = await getCoordinatesFromPlaceName(placeName);
          finalCoords = coords ?? undefined;
        }
      }
    }

    if (!finalCoords && (message.includes('{temporary marker}') || message.toLowerCase().includes('location') || message.toLowerCase().includes('about') || message.toLowerCase().includes('for') || message.toLowerCase().includes('to'))) {
      return {
        content: "Sorry, I couldn’t figure out the location. For a more precise location, drop a marker using the button provided, or try specifying a valid place name.",
        data: null,
      };
    }

    const isTravelCommand = message.toLowerCase().includes('travel') || message.toLowerCase().includes('trip');
    let promptWithCoords = message;

    if (isTravelCommand && currentLocationCoords && finalCoords) {
      promptWithCoords = `${message}\nStart coordinates: [${currentLocationCoords.join(', ')}]\nDestination coordinates: [${finalCoords.join(', ')}]`;
    } else if (finalCoords) {
      promptWithCoords = `${message}\nCoordinates: [${finalCoords.join(', ')}]`;
    }

    console.log('Sending prompt to LLM:', promptWithCoords);

    const result = await chat.sendMessage(promptWithCoords);
    const response = result.response.text();

    const splittedResponse = response.split('\n');
    const [naturalResponse = '', jsonStr = ''] = splittedResponse.filter((e) => e);

    let jsonData = null;
    try {
      if (jsonStr.trim()) {
        jsonData = JSON.parse(jsonStr.trim());
      }
    } catch (parseError) {
      console.error('Error parsing JSON from response:', parseError, 'Raw JSON:', jsonStr);
    }

    console.log('Parsed JSON:', jsonData);

    return {
      content: naturalResponse.trim() || 'Got it! How can I assist you?',
      data: jsonData,
    };
  } catch (error) {
    console.error('Error getting chat response:', error);
    return {
      content: 'I apologize, but I’m having trouble processing your request right now. Please try again later.',
      data: null,
    };
  }
}