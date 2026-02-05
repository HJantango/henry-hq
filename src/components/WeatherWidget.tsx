"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
  morningTemp: number;
  afternoonTemp: number;
  rainChance: number;
}

type LegChoice = "shorts" | "pants" | "shorts-brave" | "pants-safe";

interface LegVerdict {
  choice: LegChoice;
  emoji: string;
  reason: string;
}

function getPantsOrShorts(weather: WeatherData): LegVerdict {
  const { morningTemp, afternoonTemp, high, rainChance } = weather;
  
  // Heavy rain = pants (practical)
  if (rainChance > 60) {
    return { choice: "pants-safe", emoji: "👖", reason: "Rainy day — keep those legs dry" };
  }
  
  // Cold all day (high under 20) = pants
  if (high < 20) {
    return { choice: "pants", emoji: "👖", reason: "Cold one today — pants weather" };
  }
  
  // Warm morning (>20) and warm afternoon (>24) = easy shorts
  if (morningTemp >= 20 && afternoonTemp >= 24) {
    return { choice: "shorts", emoji: "🩳", reason: "Beautiful day — shorts all the way" };
  }
  
  // Cold morning (<18) but warms up (afternoon >24) = shorts (it'll warm up)
  if (morningTemp < 18 && afternoonTemp >= 24) {
    return { choice: "shorts-brave", emoji: "🩳", reason: "Chilly start, but she'll warm up" };
  }
  
  // Cool morning (18-20) but decent afternoon (22+) = shorts
  if (morningTemp >= 16 && morningTemp < 20 && afternoonTemp >= 22) {
    return { choice: "shorts", emoji: "🩳", reason: "Starts cool, heats up — shorts day" };
  }
  
  // Mild all day (20-23ish) = could go either way, lean shorts
  if (high >= 20 && high <= 24) {
    return { choice: "shorts-brave", emoji: "🩳", reason: "Mild day — shorts if you're game" };
  }
  
  // Default: if afternoon is warm enough, shorts
  if (afternoonTemp >= 22) {
    return { choice: "shorts", emoji: "🩳", reason: "Arvo's warm enough — go the shorts" };
  }
  
  // Otherwise pants
  return { choice: "pants", emoji: "👖", reason: "Play it safe with pants today" };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brunswick Heads, NSW coordinates: -28.54, 153.55
    // Fetch current + hourly + daily data
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-28.54&longitude=153.55&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Australia%2FSydney&forecast_days=1"
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
        
        // Get hourly temps for morning (6-9am, indices 6-9) and afternoon (12-3pm, indices 12-15)
        const hourlyTemps = data.hourly?.temperature_2m ?? [];
        const morningTemps = hourlyTemps.slice(6, 10); // 6am-9am
        const afternoonTemps = hourlyTemps.slice(12, 16); // 12pm-3pm
        
        const avgMorning = morningTemps.length > 0 
          ? morningTemps.reduce((a: number, b: number) => a + b, 0) / morningTemps.length 
          : 20;
        const avgAfternoon = afternoonTemps.length > 0 
          ? afternoonTemps.reduce((a: number, b: number) => a + b, 0) / afternoonTemps.length 
          : 25;
        
        setWeather({
          temp: Math.round(data.current?.temperature_2m ?? 0),
          description: descriptions[code] || "Unknown",
          icon: icons[code] || "🌡️",
          humidity: data.current?.relative_humidity_2m ?? 0,
          windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
          high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 25),
          low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 15),
          morningTemp: Math.round(avgMorning),
          afternoonTemp: Math.round(avgAfternoon),
          rainChance: data.daily?.precipitation_probability_max?.[0] ?? 0,
        });
        setLoading(false);
      })
      .catch(() => {
        setWeather({
          temp: 22,
          description: "Partly cloudy",
          icon: "⛅",
          humidity: 65,
          windSpeed: 12,
          high: 26,
          low: 18,
          morningTemp: 19,
          afternoonTemp: 25,
          rainChance: 10,
        });
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
  
  const verdict = getPantsOrShorts(weather);

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
          <p><span className="text-red-400">↑{weather.high}°</span> <span className="text-blue-400">↓{weather.low}°</span></p>
          <p>💧 {weather.humidity}%</p>
          <p>💨 {weather.windSpeed} km/h</p>
        </div>
      </div>
      
      {/* Pants or Shorts Verdict */}
      <div className="mt-4 pt-4 border-t border-dark-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{verdict.emoji}</span>
          <div>
            <p className="text-sm font-medium text-white">
              {verdict.choice.includes("shorts") ? "Shorts Day" : "Pants Day"}
            </p>
            <p className="text-xs text-dark-400">{verdict.reason}</p>
          </div>
          {weather.rainChance > 20 && (
            <span className="ml-auto text-xs text-dark-400">🌧️ {weather.rainChance}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
