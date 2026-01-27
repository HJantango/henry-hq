"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brunswick Heads, NSW coordinates: -28.54, 153.55
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-28.54&longitude=153.55&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Australia%2FSydney"
    )
      .then((r) => r.json())
      .then((data) => {
        const code = data.current?.weather_code ?? 0;
        const descriptions: Record<number, string> = {
          0: "Clear sky",
          1: "Mainly clear",
          2: "Partly cloudy",
          3: "Overcast",
          45: "Foggy",
          48: "Fog",
          51: "Light drizzle",
          53: "Drizzle",
          55: "Heavy drizzle",
          61: "Light rain",
          63: "Rain",
          65: "Heavy rain",
          71: "Light snow",
          73: "Snow",
          75: "Heavy snow",
          80: "Rain showers",
          81: "Moderate showers",
          82: "Heavy showers",
          95: "Thunderstorm",
        };
        const icons: Record<number, string> = {
          0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
          51: "🌦️", 53: "🌧️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
          71: "🌨️", 73: "🌨️", 75: "🌨️", 80: "🌦️", 81: "🌧️", 82: "⛈️", 95: "⛈️",
        };
        setWeather({
          temp: Math.round(data.current?.temperature_2m ?? 0),
          description: descriptions[code] || "Unknown",
          icon: icons[code] || "🌡️",
          humidity: data.current?.relative_humidity_2m ?? 0,
          windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
        });
        setLoading(false);
      })
      .catch(() => {
        setWeather({ temp: 22, description: "Partly cloudy", icon: "⛅", humidity: 65, windSpeed: 12 });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass p-5 animate-pulse">
        <div className="h-4 bg-dark-600 rounded w-1/3 mb-3" />
        <div className="h-8 bg-dark-600 rounded w-1/2" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="glass-hover p-5 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
      <p className="text-xs font-medium text-dark-300 uppercase tracking-wider mb-3">
        Brunswick Heads
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{weather.icon}</span>
          <div>
            <p className="text-3xl font-bold text-white">{weather.temp}°</p>
            <p className="text-sm text-dark-300">{weather.description}</p>
          </div>
        </div>
        <div className="text-right text-xs text-dark-400 space-y-1">
          <p>💧 {weather.humidity}%</p>
          <p>💨 {weather.windSpeed} km/h</p>
        </div>
      </div>
    </div>
  );
}
