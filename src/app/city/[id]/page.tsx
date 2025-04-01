'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WiHumidity, WiRain, WiStrongWind } from 'react-icons/wi';
import { FiArrowLeft } from 'react-icons/fi';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type WeatherHistory = {
  date: string;
  temp: number;
  humidity: number;
  precipitation: number;
};

export default function CityDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [historyData, setHistoryData] = useState<WeatherHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-gray-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-gray-900');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        temp: Math.round(15 + Math.random() * 15),
        humidity: Math.round(50 + Math.random() * 40),
        precipitation: Math.round(Math.random() * 20)
      }));
      
      setHistoryData(mockData);
      setLoading(false);
    };

    fetchData();
  }, [params.id]);

  const chartOptions = {
    chart: { 
      id: 'weather-chart',
      foreColor: darkMode ? '#E5E7EB' : '#374151',
      background: darkMode ? '#1F2937' : '#FFFFFF',
      toolbar: {
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    theme: {
      mode: darkMode ? 'dark' : 'light'
    },
    xaxis: { 
      categories: historyData.map(d => d.date),
      labels: {
        style: {
          colors: darkMode ? '#E5E7EB' : '#374151'
        }
      },
      axisBorder: {
        color: darkMode ? '#4B5563' : '#E5E7EB'
      },
      axisTicks: {
        color: darkMode ? '#4B5563' : '#E5E7EB'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: darkMode ? '#E5E7EB' : '#374151'
        }
      }
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    grid: {
      borderColor: darkMode ? '#4B5563' : '#E5E7EB',
      row: {
        colors: [darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)']
      },
      column: {
        colors: [darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)']
      }
    },
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      fillSeriesColor: false
    },
    legend: {
      labels: {
        colors: darkMode ? '#E5E7EB' : '#374151'
      }
    },
    stroke: {
      width: 2
    }
  };

  const chartSeries = [
    { name: 'Temperature (°C)', data: historyData.map(d => d.temp) },
    { name: 'Humidity (%)', data: historyData.map(d => d.humidity) },
    { name: 'Precipitation (mm)', data: historyData.map(d => d.precipitation) }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white capitalize">{params.id} Weather History</h1>
        
        {loading ? (
          <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-8 border border-gray-200 dark:border-gray-700">
            <Chart 
              options={chartOptions} 
              series={chartSeries} 
              type="line" 
              height={350} 
            />
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <WiHumidity className="mr-1 text-xl text-blue-500" /> Temp
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <WiRain className="mr-1 text-xl text-blue-500" /> Humidity
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <WiStrongWind className="mr-1 text-xl text-blue-500" /> Precipitation
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {historyData.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {day.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {day.temp}°C
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {day.humidity}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {day.precipitation}mm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}