'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WiHumidity, WiRain, WiStrongWind, WiDaySunny, WiCloudy, WiRainMix, WiSnow, WiThunderstorm, WiFog } from 'react-icons/wi';
import { FiArrowLeft } from 'react-icons/fi';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type WeatherData = {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  dt_txt: string;
};

type ForecastData = {
  list: WeatherData[];
  city: {
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
  };
};

export default function CityDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode ? JSON.parse(savedMode) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Group forecast data by day
  const dailyForecast = forecastData?.list.reduce((acc: Record<string, WeatherData[]>, item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Get current weather (most recent data point)
  const currentWeather = forecastData?.list[0];

  // Format sunrise and sunset times
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <WiDaySunny className="weather-icon sunny" size={48} />;
      case 'clouds':
        return <WiCloudy className="weather-icon cloudy" size={48} />;
      case 'rain':
        return <WiRainMix className="weather-icon rainy" size={48} />;
      case 'snow':
        return <WiSnow className="weather-icon snowy" size={48} />;
      case 'thunderstorm':
        return <WiThunderstorm className="weather-icon thunder" size={48} />;
      case 'fog':
      case 'mist':
      case 'haze':
        return <WiFog className="weather-icon foggy" size={48} />;
      default:
        return <WiDaySunny className="weather-icon sunny" size={48} />;
    }
  };

  // Fetch weather data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_KEY_WEATHER;
        const city = params.id;
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);
        const data = await response.json();
        setForecastData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch weather data');
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">Loading weather data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-text">{error}</div>
      </div>
    );
  }

  if (!forecastData) {
    return null;
  }

  return (
    <div className={`weather-app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="container">
        <div className="header-controls">
          <button
            onClick={() => router.back()}
            className="back-button"
          >
            <FiArrowLeft /> Back
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <h1 className="city-title">
          {forecastData.city.name}, {forecastData.city.country}
        </h1>
        <p className="current-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Current Weather */}
        {currentWeather && (
          <div className="current-weather">
            <div className="weather-main">
              <div className="weather-icon-container">
                {getWeatherIcon(currentWeather.weather[0].main)}
                <div className="weather-details">
                  <h2 className="temperature">
                    {Math.round(currentWeather.main.temp)}°C
                  </h2>
                  <p className="weather-description">
                    {currentWeather.weather[0].description}
                  </p>
                  <p className="feels-like">
                    Feels like {Math.round(currentWeather.main.feels_like)}°C
                  </p>
                </div>
              </div>
              <div className="weather-stats">
                <div className="weather-stat">
                  <WiHumidity className="stat-icon humidity" size={24} />
                  <div className="stat-details">
                    <p className="stat-label">Humidity</p>
                    <p className="stat-value">{currentWeather.main.humidity}%</p>
                  </div>
                </div>
                <div className="weather-stat">
                  <WiStrongWind className="stat-icon wind" size={24} />
                  <div className="stat-details">
                    <p className="stat-label">Wind</p>
                    <p className="stat-value">{currentWeather.wind.speed} m/s</p>
                  </div>
                </div>
                <div className="weather-stat">
                  <WiDaySunny className="stat-icon sun" size={24} />
                  <div className="stat-details">
                    <p className="stat-label">Sunrise/Sunset</p>
                    <p className="stat-value">
                      {formatTime(forecastData.city.sunrise)} / {formatTime(forecastData.city.sunset)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hourly Forecast */}
        <div className="hourly-forecast">
          <h2 className="section-title">Hourly Forecast</h2>
          <div className="hourly-container">
            <div className="hourly-scroll">
              {forecastData.list.slice(0, 12).map((hour, index) => (
                <div key={index} className="hourly-item">
                  <p className="hourly-time">
                    {new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit' })}
                  </p>
                  {getWeatherIcon(hour.weather[0].main)}
                  <p className="hourly-temp">
                    {Math.round(hour.main.temp)}°C
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Forecast */}
        <div className="daily-forecast">
          <h2 className="section-title">5-Day Forecast</h2>
          {dailyForecast && Object.entries(dailyForecast).slice(0, 5).map(([date, dayData], index) => {
            const day = dayData[0];
            const maxTemp = Math.max(...dayData.map(d => d.main.temp_max));
            const minTemp = Math.min(...dayData.map(d => d.main.temp_min));
            
            return (
              <div key={index} className="daily-item">
                <div className="daily-day">
                  <p>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                </div>
                <div className="daily-weather">
                  {getWeatherIcon(day.weather[0].main)}
                  <p className="daily-description">
                    {day.weather[0].description}
                  </p>
                </div>
                <div className="daily-temps">
                  <p className="daily-max">
                    {Math.round(maxTemp)}°C
                  </p>
                  <p className="daily-min">
                    {Math.round(minTemp)}°C
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Temperature Trend Chart */}
        <div className="weather-chart">
          <h2 className="section-title">Temperature Trend</h2>
          <Chart 
            options={{
              chart: { 
                foreColor: darkMode ? '#E5E7EB' : '#374151', 
                background: 'transparent',
                toolbar: { show: true }
              },
              theme: { mode: darkMode ? 'dark' : 'light' },
              xaxis: { 
                categories: forecastData.list.map(item => 
                  new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit' }))
              },
              stroke: { curve: 'smooth' },
              colors: ['#EF4444'],
              tooltip: {
                enabled: true,
                y: {
                  formatter: (value) => `${value}°C`
                }
              }
            }} 
            series={[
              { 
                name: 'Temperature', 
                data: forecastData.list 
                .filter((_, index) => index % 4 === 0)
                .map(item => Math.round(item.main.temp))
              }
            ]}
            type="line" 
            height={350} 
          />
        </div>

        {/* Additional Weather Charts */}
        <div className="chart-grid">
          <div className="weather-chart">
            <h2 className="section-title">Humidity Trend</h2>
            <Chart 
              options={{
                chart: { 
                  foreColor: darkMode ? '#E5E7EB' : '#374151', 
                  background: 'transparent',
                  toolbar: { show: false }
                },
                theme: { mode: darkMode ? 'dark' : 'light' },
                xaxis: { 
                  categories: forecastData.list.map(item => 
                    new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit' }))
                },
                stroke: { curve: 'smooth' },
                colors: ['#3B82F6'],
                tooltip: {
                  enabled: true,
                  y: {
                    formatter: (value) => `${value}%`
                  }
                }
              }} 
              series={[
                { 
                  name: 'Humidity', 
                  data: forecastData.list
                  .filter((_, index) => index % 4 === 0)
                  .map(item => item.main.humidity)
                }
              ]}
              type="line" 
              height={400} 
            />
          </div>
          <div className="weather-chart">
            <h2 className="section-title">Wind Speed</h2>
            <Chart 
              options={{
                chart: { 
                  foreColor: darkMode ? '#E5E7EB' : '#374151', 
                  background: 'transparent',
                  toolbar: { show: false }
                },
                theme: { mode: darkMode ? 'dark' : 'light' },
                xaxis: { 
                  categories: forecastData.list.map(item => 
                    new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit' }))
                },
                stroke: { curve: 'smooth' },
                colors: ['#10B981'],
                tooltip: {
                  enabled: true,
                  y: {
                    formatter: (value) => `${value} m/s`
                  }
                }
              }} 
              series={[
                { 
                  name: 'Wind Speed', 
                  data: forecastData.list
                  .filter((_, index) => index % 4 === 0)
                  .map(item => item.wind.speed)
                }
              ]}
              type="line" 
              height={400} 
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --bg-color: #f9fafb;
          --text-color: #111827;
          --card-bg: #ffffff;
          --card-border: #e5e7eb;
          --hover-bg: #f3f4f6;
          --error-bg: #fef2f2;
          --error-text: #b91c1c;
          --button-bg: #ffffff;
          --button-text: #374151;
          --button-border: #e5e7eb;
          --label-color: #4b5563;
          --value-color: #111827;
          --positive-change: #10b981;
          --table-header-bg: #f9fafb;
          --table-row-hover: #f3f4f6;
          --table-border: #e5e7eb;
          --sunny-color: #f59e0b;
          --cloudy-color: #9ca3af;
          --rainy-color: #3b82f6;
          --snowy-color: #93c5fd;
          --thunder-color: #8b5cf6;
          --foggy-color: #d1d5db;
          --humidity-color: #3b82f6;
          --wind-color: #6b7280;
          --sun-color: #f59e0b;
        }

        .dark-mode {
          --bg-color: #111827;
          --text-color: #f3f4f6;
          --card-bg: #1f2937;
          --card-border: #374151;
          --hover-bg: #1f2937;
          --error-bg: rgba(127, 29, 29, 0.1);
          --error-text: #fca5a5;
          --button-bg: #1f2937;
          --button-text: #f3f4f6;
          --button-border: #374151;
          --label-color: #9ca3af;
          --value-color: #f3f4f6;
          --positive-change: #34d399;
          --table-header-bg: rgba(31, 41, 55, 0.5);
          --table-row-hover: rgba(31, 41, 55, 0.5);
          --table-border: #374151;
          --sunny-color: #fbbf24;
          --cloudy-color: #9ca3af;
          --rainy-color: #60a5fa;
          --snowy-color: #bfdbfe;
          --thunder-color: #a78bfa;
          --foggy-color: #d1d5db;
          --humidity-color: #60a5fa;
          --wind-color: #9ca3af;
          --sun-color: #fbbf24;
        }

        body {
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .weather-app {
          min-height: 100vh;
          background-color: var(--bg-color);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .header-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .back-button, .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          background-color: var(--button-bg);
          color: var(--button-text);
          border: 1px solid var(--button-border);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .back-button:hover, .theme-toggle:hover {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          background-color: var(--hover-bg);
        }

        .city-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-color);
          text-transform: capitalize;
        }

        .current-date {
          color: var(--label-color);
          margin-bottom: 2rem;
        }

        .current-weather {
          background-color: var(--card-bg);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--card-border);
          transition: all 0.2s ease;
        }

        .weather-main {
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 768px) {
          .weather-main {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .weather-icon-container {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        @media (min-width: 768px) {
          .weather-icon-container {
            margin-bottom: 0;
          }
        }

        .weather-details {
          margin-left: 1rem;
        }

        .temperature {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-color);
          margin-bottom: 0.25rem;
        }

        .weather-description {
          color: var(--label-color);
          text-transform: capitalize;
          margin-bottom: 0.25rem;
        }

        .feels-like {
          color: var(--label-color);
        }

        .weather-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .weather-stats {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .weather-stat {
          display: flex;
          align-items: center;
        }

        .stat-icon {
          margin-right: 0.5rem;
        }

        .stat-details {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--label-color);
        }

        .stat-value {
          font-weight: 600;
          color: var(--value-color);
        }

        .weather-icon {
          margin: 0 auto;
        }

        .sunny {
          color: var(--sunny-color);
        }

        .cloudy {
          color: var(--cloudy-color);
        }

        .rainy {
          color: var(--rainy-color);
        }

        .snowy {
          color: var(--snowy-color);
        }

        .thunder {
          color: var(--thunder-color);
        }

        .foggy {
          color: var(--foggy-color);
        }

        .humidity {
          color: var(--humidity-color);
        }

        .wind {
          color: var(--wind-color);
        }

        .sun {
          color: var(--sun-color);
        }

        .hourly-forecast {
          background-color: var(--card-bg);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--card-border);
          transition: all 0.2s ease;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-color);
        }

        .hourly-container {
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .hourly-scroll {
          display: flex;
          gap: 1rem;
          padding-bottom: 0.5rem;
        }

        .hourly-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 5rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          background-color: var(--hover-bg);
        }

        .hourly-time {
          font-size: 0.875rem;
          color: var(--label-color);
        }

        .hourly-temp {
          font-weight: 600;
          color: var(--value-color);
        }

        .daily-forecast {
          background-color: var(--card-bg);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--card-border);
          transition: all 0.2s ease;
        }

        .daily-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--table-border);
        }

        .daily-item:last-child {
          border-bottom: none;
        }

        .daily-day {
          width: 8rem;
        }

        .daily-weather {
          display: flex;
          align-items: center;
          flex-grow: 1;
        }

        .daily-description {
          margin-left: 0.5rem;
          color: var(--label-color);
          text-transform: capitalize;
        }

        .daily-temps {
          display: flex;
          gap: 1rem;
        }

        .daily-max {
          font-weight: 600;
          color: var(--value-color);
        }

        .daily-min {
          color: var(--label-color);
        }

        .weather-chart {
          background-color: var(--card-bg);
          border-radius: 1rem;
          padding: 1.5rem;
          border: 1px solid var(--card-border);
          transition: all 0.2s ease;
        }

        .chart-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        @media (min-width: 768px) {
          .chart-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-color);
        }

        .loading-text {
          font-size: 1.5rem;
          color: var(--text-color);
        }

        .error-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-color);
        }

        .error-text {
          font-size: 1.5rem;
          color: var(--error-text);
        }
      `}</style>
    </div>
  );
}