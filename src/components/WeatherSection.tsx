import React from 'react';
import { format, fromUnixTime } from 'date-fns';
import { 
  Sun, 
  Cloud, 
  Wind, 
  Droplets, 
  Eye, 
  Gauge, 
  CloudRain,
  Sunrise,
  Sunset
} from 'lucide-react';
import { WeatherData } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WeatherSectionProps {
  weather: WeatherData;
}

const getAQILabel = (aqi: number) => {
  const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const colors = ['text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
  return { label: labels[aqi - 1], color: colors[aqi - 1] };
};

export default function WeatherSection({ weather }: WeatherSectionProps) {
  const { label: aqiLabel, color: aqiColor } = getAQILabel(weather.airQuality.index);

  return (
    <div className="neomorphic p-6 rounded-xl">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-white">{weather.city.name}, {weather.city.country}</h2>
          <div className="flex gap-6 mt-2">
            <div className="flex items-center gap-2">
              <Sunrise className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-gray-300">{format(fromUnixTime(weather.city.sunrise), 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-300">{format(fromUnixTime(weather.city.sunset), 'HH:mm')}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-5xl font-bold text-white">
                    {weather.temperature.value}°{weather.temperature.unit}
                  </div>
                  <div className="text-lg text-gray-400">
                    Feels like {weather.temperature.feels_like}°
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sun className="h-12 w-12 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: <Wind className="h-5 w-5 text-blue-400" />,
                  label: 'Wind',
                  value: `${weather.wind.speed.value} ${weather.wind.speed.unit}`,
                  subtext: weather.wind.direction.name
                },
                {
                  icon: <Droplets className="h-5 w-5 text-blue-500" />,
                  label: 'Humidity',
                  value: `${weather.humidity.value}${weather.humidity.unit}`
                },
                {
                  icon: <Eye className="h-5 w-5 text-gray-500" />,
                  label: 'Visibility',
                  value: `${(weather.visibility.value / 1000).toFixed(1)} km`
                },
                {
                  icon: <Gauge className="h-5 w-5 text-purple-400" />,
                  label: 'Pressure',
                  value: `${weather.pressure.value} ${weather.pressure.unit}`
                }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="glass-card p-4 h-full">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-sm text-gray-400">{item.label}</span>
                    </div>
                    <div className="mt-2 text-white">{item.value}</div>
                    {item.subtext && (
                      <div className="text-sm text-gray-400">{item.subtext}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="glass-card p-4">
                <h3 className="text-lg font-medium text-white mb-4">Air Quality</h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">AQI</span>
                  <span className={cn("font-medium", aqiColor)}>{aqiLabel}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">PM2.5</span>
                    <span className="text-sm text-white">{weather.airQuality.components.pm2_5} μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">PM10</span>
                    <span className="text-sm text-white">{weather.airQuality.components.pm10} μg/m³</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">5-Day Forecast</h3>
            <div className="space-y-3">
              {weather.forecast.map((day, index) => (
                <motion.div
                  key={day.dt}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className="glass-card p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="w-20 text-gray-400">{format(fromUnixTime(day.dt), 'EEE')}</span>
                        {day.weather.main === 'Clear' ? (
                          <Sun className="h-5 w-5 text-yellow-400" />
                        ) : day.weather.main === 'Rain' ? (
                          <CloudRain className="h-5 w-5 text-blue-400" />
                        ) : (
                          <Cloud className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">{Math.round(day.pop * 100)}%</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{Math.round(day.temp.min)}°</span>
                          <span className="text-gray-400">-</span>
                          <span className="text-white">{Math.round(day.temp.max)}°</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}