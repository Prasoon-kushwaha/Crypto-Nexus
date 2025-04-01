"use client";
import { useRouter } from 'next/navigation'; // Changed from next/router
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiDollarSign, FiTrendingUp, FiBarChart2, FiAlertCircle } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Dynamic import for ApexCharts
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="h-[350px] flex items-center justify-center">Loading chart...</div>
});

type CryptoHistory = {
  date: string;
  price: number;
  volume: number;
  marketCap: number;
};

type CryptoMetrics = {
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;
};

export default function CryptoDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoHistory[]>([]);
  const [metrics, setMetrics] = useState<CryptoMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate mock data
        const mockData = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          price: Math.round(30000 + Math.random() * 20000),
          volume: Math.round(Math.random() * 1000000000),
          marketCap: Math.round(500000000000 + Math.random() * 300000000000)
        }));

        setCryptoData(mockData);
        setMetrics({
          high24h: Math.round(50000 + Math.random() * 5000),
          low24h: Math.round(30000 - Math.random() * 5000),
          ath: Math.round(60000 + Math.random() * 10000),
          atl: Math.round(10000 + Math.random() * 5000)
        });
      } catch (err) {
        setError('Failed to load cryptocurrency data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]); // Use params.id instead of router.query

  const chartOptions = {
    chart: { 
      id: 'crypto-chart',
      toolbar: {
        show: true,
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
    xaxis: { 
      categories: cryptoData.map(d => d.date),
      type: 'datetime'
    },
    colors: ['#3B82F6'],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    tooltip: {
      enabled: true,
      x: {
        format: 'dd MMM yyyy'
      }
    }
  };

  const chartSeries = [
    { 
      name: 'Price (USD)', 
      data: cryptoData.map(d => d.price) 
    }
  ];

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start">
            <FiAlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" /> Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6 capitalize">{params.id} Historical Data</h1>
      
      {loading ? (
        <div className="space-y-6">
          <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg p-6 h-64"></div>
            ))}
          </div>
          <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-8">
            <Chart 
              options={chartOptions} 
              series={chartSeries} 
              type="area" 
              height={350} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiDollarSign className="mr-2 text-blue-500" /> Key Metrics
              </h2>
              <div className="space-y-4">
                {metrics && Object.entries(metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace(/([0-9]+)/, ' $1 ')}</span>
                    <span className="font-medium">${value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiTrendingUp className="mr-2 text-green-500" /> Performance
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">30-Day Change</span>
                  <span className="text-green-500 font-medium">+12.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume (24h)</span>
                  <span className="font-medium">${cryptoData[0]?.volume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Cap</span>
                  <span className="font-medium">${cryptoData[0]?.marketCap.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-semibold p-6 flex items-center">
              <FiBarChart2 className="mr-2 text-purple-500" /> Historical Data
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (USD)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cryptoData.slice().reverse().map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {day.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${day.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${day.volume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${day.marketCap.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}