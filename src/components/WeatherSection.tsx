'use client';

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
import { Paper, Text, Grid, Group, Stack, Card, SimpleGrid } from '@mantine/core';
import { motion } from 'framer-motion';

interface WeatherSectionProps {
  weather: WeatherData;
}

const getAQILabel = (aqi: number) => {
  const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const colors = ['green', 'blue', 'yellow', 'orange', 'red'];
  return { label: labels[aqi - 1], color: colors[aqi - 1] };
};

export default function WeatherSection({ weather }: WeatherSectionProps) {
  const { label: aqiLabel, color: aqiColor } = getAQILabel(weather.airQuality.index);

  return (
    <Paper radius="lg" p="xl" withBorder shadow="sm">
      <Stack>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Text size="xl" fw={700}>{weather.city.name}, {weather.city.country}</Text>
          <Group gap="xl" mt="xs">
            <Group gap="xs">
              <Sunrise size={16} className="text-orange-400" />
              <Text size="sm">{format(fromUnixTime(weather.city.sunrise), 'HH:mm')}</Text>
            </Group>
            <Group gap="xs">
              <Sunset size={16} className="text-red-400" />
              <Text size="sm">{format(fromUnixTime(weather.city.sunset), 'HH:mm')}</Text>
            </Group>
          </Group>
        </motion.div>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="48" fw={700} style={{ lineHeight: 1 }}>
                      {weather.temperature.value}°{weather.temperature.unit}
                    </Text>
                    <Text size="lg" c="dimmed">
                      Feels like {weather.temperature.feels_like}°
                    </Text>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sun size={48} className="text-yellow-400" />
                  </motion.div>
                </Group>
              </motion.div>

              <SimpleGrid cols={2}>
                {[
                  {
                    icon: <Wind size={20} className="text-blue-400" />,
                    label: 'Wind',
                    value: `${weather.wind.speed.value} ${weather.wind.speed.unit}`,
                    subtext: weather.wind.direction.name
                  },
                  {
                    icon: <Droplets size={20} className="text-blue-500" />,
                    label: 'Humidity',
                    value: `${weather.humidity.value}${weather.humidity.unit}`
                  },
                  {
                    icon: <Eye size={20} className="text-gray-500" />,
                    label: 'Visibility',
                    value: `${(weather.visibility.value / 1000).toFixed(1)} km`
                  },
                  {
                    icon: <Gauge size={20} className="text-purple-400" />,
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
                    <Card withBorder padding="md" className="hover:shadow-md transition-shadow">
                      <Group gap="xs">
                        {item.icon}
                        <Text size="sm" c="dimmed">{item.label}</Text>
                      </Group>
                      <Text mt="xs">{item.value}</Text>
                      {item.subtext && (
                        <Text size="sm" c="dimmed">{item.subtext}</Text>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </SimpleGrid>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card withBorder className="hover:shadow-md transition-shadow">
                  <Text fw={500} mb="md">Air Quality</Text>
                  <Group justify="space-between" mb="sm">
                    <Text>AQI</Text>
                    <Text c={aqiColor} fw={500}>{aqiLabel}</Text>
                  </Group>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">PM2.5</Text>
                      <Text size="sm">{weather.airQuality.components.pm2_5} μg/m³</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">PM10</Text>
                      <Text size="sm">{weather.airQuality.components.pm10} μg/m³</Text>
                    </Group>
                  </Stack>
                </Card>
              </motion.div>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack>
              <Text fw={500}>5-Day Forecast</Text>
              <Stack gap="xs">
                {weather.forecast.map((day, index) => (
                  <motion.div
                    key={day.dt}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <Card withBorder className="hover:shadow-md transition-shadow">
                      <Group justify="space-between">
                        <Group>
                          <Text w={80}>{format(fromUnixTime(day.dt), 'EEE')}</Text>
                          {day.weather.main === 'Clear' ? (
                            <Sun size={20} className="text-yellow-400" />
                          ) : day.weather.main === 'Rain' ? (
                            <CloudRain size={20} className="text-blue-400" />
                          ) : (
                            <Cloud size={20} className="text-gray-400" />
                          )}
                        </Group>
                        <Group gap="md">
                          <Text c="dimmed">{Math.round(day.pop * 100)}%</Text>
                          <Group gap="xs">
                            <Text>{Math.round(day.temp.min)}°</Text>
                            <Text c="dimmed">-</Text>
                            <Text>{Math.round(day.temp.max)}°</Text>
                          </Group>
                        </Group>
                      </Group>
                    </Card>
                  </motion.div>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}