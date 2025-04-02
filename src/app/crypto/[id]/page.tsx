'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiDollarSign, FiTrendingUp, FiBarChart2, FiAlertCircle, FiMoon, FiSun } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import axios from 'axios';

const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="animate-pulse h-[350px] bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl" />
});

type CryptoData = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: string;
  volumeUsd24Hr: string;
  marketCapUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
  supply: string;
};

type CryptoHistory = {
  priceUsd: string;
  time: number;
};

type ApiError = {
  message: string;
  status?: number;
  isNetworkError?: boolean;
};

export default function CryptoDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [historyData, setHistoryData] = useState<CryptoHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
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
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleApiError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
        isNetworkError: !error.response
      };
    }
    return {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      isNetworkError: false
    };
  };

  const validateCryptoData = (data: any): CryptoData => {
    const requiredFields = ['id', 'symbol', 'name', 'priceUsd', 'volumeUsd24Hr', 'marketCapUsd', 'changePercent24Hr'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return data as CryptoData;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingAsset(true);
      setLoadingHistory(true);

      const apiKey = process.env.NEXT_PUBLIC_KEY_CRYPTO;

      const [assetResponse, historyResponse] = await Promise.all([
        axios.get(`https://api.coincap.io/v2/assets/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept-Encoding': 'gzip'
          }
        }),
        axios.get(`https://api.coincap.io/v2/assets/${params.id}/history?interval=d1`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept-Encoding': 'gzip'
          }
        })
      ]);
      if (!assetResponse.data.data || !historyResponse.data.data) {
        throw new Error('Invalid data structure from API');
      }
      
      setCryptoData(validateCryptoData(assetResponse.data.data));
      setHistoryData(historyResponse.data.data.reverse());
    } catch (err) {
      const apiError = handleApiError(err);
      let errorMessage = 'Failed to load cryptocurrency data';
      
      if (apiError.status === 404) {
        errorMessage = 'Cryptocurrency not found';
      } else if (apiError.isNetworkError) {
        errorMessage = 'Network error - please check your connection';
      } else if (apiError.message.includes('Invalid data structure')) {
        errorMessage = 'Received unexpected data format';
      } else if (apiError.message.includes('Missing required fields')) {
        errorMessage = 'Data integrity error';
      }
      
      setError(errorMessage);
      console.error('API Error:', apiError);
    } finally {
      setLoading(false);
      setLoadingAsset(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  // Chart configuration
  const chartOptions = {
    chart: {
      id: 'price-chart',
      foreColor: darkMode ? '#E5E7EB' : '#374151',
      background: 'transparent',
      toolbar: {
        show: true,
        tools: { download: true, selection: true, zoom: true, reset: true }
      },
      zoom: { enabled: true }
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0,
      hover: {
        size: 5
      }
    },
    xaxis: {
      type: 'datetime',
      categories: historyData.map(h => h.time),
      labels: {
        style: { colors: darkMode ? '#9CA3AF' : '#6B7280' },
        datetimeUTC: false
      }
    },
    yaxis: {
      labels: {
        style: { colors: darkMode ? '#9CA3AF' : '#6B7280' },
        formatter: (value: number) => `$${value.toFixed(2)}`
      }
    },
    grid: {
      borderColor: darkMode ? '#374151' : '#E5E7EB',
      strokeDashArray: 4
    },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#3B82F6'],
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      x: { format: 'dd MMM yyyy' }
    }
  };

  const chartSeries = [{
    name: 'Price',
    data: historyData.map(h => parseFloat(h.priceUsd)),
    showSymbol: false 
  }];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center gap-4 text-red-500 dark:text-red-400">
            <FiAlertCircle className="w-12 h-12" />
            <div>
              <h2 className="text-xl font-semibold mb-2">{error}</h2>
              <div className="flex gap-3">
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Go Back
                </button>
              </div>
              {error.includes('Network error') && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  You appear to be offline. Please check your internet connection.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FiArrowLeft className="w-5 h-5" /> Back
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="animate-pulse h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                {cryptoData?.name} ({cryptoData?.symbol})
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-semibold text-gray-800 dark:text-white">
                  ${cryptoData ? parseFloat(cryptoData.priceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'}
                </span>
                {cryptoData?.changePercent24Hr && (
                  <span className={`px-3 py-1 rounded-full ${parseFloat(cryptoData.changePercent24Hr) >= 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {parseFloat(cryptoData.changePercent24Hr).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
              {loadingHistory ? (
                <div className="animate-pulse h-[400px] bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ) : (
                <Chart 
                  options={chartOptions} 
                  series={chartSeries} 
                  type="area" 
                  height={400} 
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  icon: <FiDollarSign className="w-8 h-8 text-blue-500" />,
                  label: 'Market Cap',
                  value: cryptoData ? `$${(parseFloat(cryptoData.marketCapUsd) / 1e9).toFixed(2)}B` : '--',
                  loading: loadingAsset
                },
                {
                  icon: <FiTrendingUp className="w-8 h-8 text-green-500" />,
                  label: '24h Volume',
                  value: cryptoData ? `$${(parseFloat(cryptoData.volumeUsd24Hr) / 1e6).toFixed(2)}M` : '--',
                  loading: loadingAsset
                },
                {
                  icon: <FiBarChart2 className="w-8 h-8 text-purple-500" />,
                  label: 'Circulating Supply',
                  value: cryptoData ? `${(parseFloat(cryptoData.supply) / 1e6).toFixed(2)}M` : '--',
                  loading: loadingAsset
                },
                {
                  icon: <FiDollarSign className="w-8 h-8 text-yellow-500" />,
                  label: 'VWAP (24h)',
                  value: cryptoData ? `$${parseFloat(cryptoData.vwap24Hr).toFixed(2)}` : '--',
                  loading: loadingAsset
                }
              ].map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    {item.icon}
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                      {item.loading ? (
                        <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                      ) : (
                        <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Price History</h2>
              {loadingHistory ? (
                <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Price</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">24h Change</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Market Cap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {historyData.slice(0, 7).map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                            {new Date(entry.time).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                            ${parseFloat(entry.priceUsd).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {cryptoData && (
                              <span className={`${parseFloat(cryptoData.changePercent24Hr) >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'}`}>
                                {parseFloat(cryptoData.changePercent24Hr).toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                            {cryptoData ? `$${(parseFloat(cryptoData.marketCapUsd) / 1e9).toFixed(2)}B` : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}