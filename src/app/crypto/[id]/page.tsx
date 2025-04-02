'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiDollarSign, FiTrendingUp, FiBarChart2, FiAlertCircle, FiMoon, FiSun } from 'react-icons/fi';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="chart-loading">Loading chart...</div>
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
  
  // Dark mode state with localStorage persistence
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
  }, [params.id]);

  // Rest of your data fetching code remains the same...

  const chartOptions = {
    chart: { 
      id: 'crypto-chart',
      foreColor: darkMode ? '#E5E7EB' : '#374151',
      background: 'transparent',
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
      },
      dropShadow: {
        enabled: true,
        top: 2,
        left: 2,
        blur: 4,
        opacity: 0.1
      }
    },
    theme: {
      mode: darkMode ? 'dark' : 'light'
    },
    xaxis: { 
      categories: cryptoData.map(d => d.date),
      type: 'datetime',
      labels: {
        style: {
          colors: darkMode ? '#9CA3AF' : '#6B7280'
        }
      },
      axisBorder: {
        show: true,
        color: darkMode ? '#374151' : '#E5E7EB'
      },
      axisTicks: {
        show: true,
        color: darkMode ? '#374151' : '#E5E7EB'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: darkMode ? '#9CA3AF' : '#6B7280'
        }
      }
    },
    colors: ['#3B82F6'],
    grid: {
      borderColor: darkMode ? '#374151' : '#E5E7EB',
      strokeDashArray: 4,
      row: {
        colors: [darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)']
      },
      column: {
        colors: [darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)']
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
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
      <div className={`error-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className={`error-alert ${darkMode ? 'dark-mode' : ''}`}>
          <div className="error-content">
            <FiAlertCircle className="error-icon" />
            <div className="error-text">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="error-button"
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
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="main-container">
        <div className="header-controls">
          <button 
            onClick={() => router.back()}
            className={`back-button ${darkMode ? 'dark-mode' : ''}`}
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`dark-mode-toggle ${darkMode ? 'dark-mode' : ''}`}
          >
            {darkMode ? <FiSun className="sun-icon" /> : <FiMoon />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <h1 className={`page-title ${darkMode ? 'dark-mode' : ''}`}>{params.id} Historical Data</h1>
        
        {loading ? (
          <div className="loading-skeleton">
            <div className="chart-skeleton"></div>
            <div className="metrics-skeleton">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="metric-skeleton"></div>
              ))}
            </div>
            <div className="table-skeleton"></div>
          </div>
        ) : (
          <>
            <div className={`chart-container ${darkMode ? 'dark-mode' : ''}`}>
              <Chart 
                options={chartOptions} 
                series={chartSeries} 
                type="area" 
                height={350} 
              />
            </div>

            <div className="metrics-grid">
              <div className={`metric-card ${darkMode ? 'dark-mode' : ''}`}>
                <h2 className={`metric-title ${darkMode ? 'dark-mode' : ''}`}>
                  <FiDollarSign className="dollar-icon" /> Key Metrics
                </h2>
                <div className="metric-content">
                  {metrics && Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="metric-row">
                      <span className={`metric-label ${darkMode ? 'dark-mode' : ''}`}>{key.replace(/([0-9]+)/, ' $1 ')}</span>
                      <span className={`metric-value ${darkMode ? 'dark-mode' : ''}`}>${value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`metric-card ${darkMode ? 'dark-mode' : ''}`}>
                <h2 className={`metric-title ${darkMode ? 'dark-mode' : ''}`}>
                  <FiTrendingUp className="trend-icon" /> Performance
                </h2>
                <div className="metric-content">
                  <div className="metric-row">
                    <span className={`metric-label ${darkMode ? 'dark-mode' : ''}`}>30-Day Change</span>
                    <span className="positive-change">+12.5%</span>
                  </div>
                  <div className="metric-row">
                    <span className={`metric-label ${darkMode ? 'dark-mode' : ''}`}>Volume (24h)</span>
                    <span className={`metric-value ${darkMode ? 'dark-mode' : ''}`}>${cryptoData[0]?.volume.toLocaleString()}</span>
                  </div>
                  <div className="metric-row">
                    <span className={`metric-label ${darkMode ? 'dark-mode' : ''}`}>Market Cap</span>
                    <span className={`metric-value ${darkMode ? 'dark-mode' : ''}`}>${cryptoData[0]?.marketCap.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`data-table-container ${darkMode ? 'dark-mode' : ''}`}>
              <h2 className={`table-title ${darkMode ? 'dark-mode' : ''}`}>
                <FiBarChart2 className="chart-icon" /> Historical Data
              </h2>
              <div className="table-wrapper">
                <table className={`data-table ${darkMode ? 'dark-mode' : ''}`}>
                  <thead className={`table-header ${darkMode ? 'dark-mode' : ''}`}>
                    <tr>
                      <th>Date</th>
                      <th>Price (USD)</th>
                      <th>Volume</th>
                      <th>Market Cap</th>
                    </tr>
                  </thead>
                  <tbody className={`table-body ${darkMode ? 'dark-mode' : ''}`}>
                    {cryptoData.slice().reverse().map((day, index) => (
                      <tr key={index} className={`table-row ${darkMode ? 'dark-mode' : ''}`}>
                        <td>{day.date}</td>
                        <td>${day.price.toLocaleString()}</td>
                        <td>${day.volume.toLocaleString()}</td>
                        <td>${day.marketCap.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        :root {
          --bg-color: #f9fafb;
          --text-color: #111827;
          --card-bg: #ffffff;
          --card-border: #e5e7eb;
          --hover-bg: #f3f4f6;
          --error-bg: #fef2f2;
          --error-border: #fca5a5;
          --error-text: #b91c1c;
          --button-bg: #ffffff;
          --button-text: #374151;
          --button-border: #e5e7eb;
          --metric-label: #4b5563;
          --metric-value: #111827;
          --positive-change: #10b981;
          --table-header-bg: #f9fafb;
          --table-row-hover: #f3f4f6;
          --table-border: #e5e7eb;
        }

        .dark-mode {
          --bg-color: #111827;
          --text-color: #f3f4f6;
          --card-bg: #1f2937;
          --card-border: #374151;
          --hover-bg: #1f2937;
          --error-bg: rgba(127, 29, 29, 0.1);
          --error-border: #7f1d1d;
          --error-text: #fca5a5;
          --button-bg: #1f2937;
          --button-text: #f3f4f6;
          --button-border: #374151;
          --metric-label: #9ca3af;
          --metric-value: #f3f4f6;
          --positive-change: #34d399;
          --table-header-bg: rgba(31, 41, 55, 0.5);
          --table-row-hover: rgba(31, 41, 55, 0.5);
          --table-border: #374151;
        }

        body {
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .app-container {
          min-height: 100vh;
          background-color: var(--bg-color);
        }

        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .header-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .back-button, .dark-mode-toggle {
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

        .back-button:hover, .dark-mode-toggle:hover {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          background-color: var(--hover-bg);
        }

        .sun-icon {
          color: #f59e0b;
        }

        .page-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--text-color);
        }

        .error-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .error-alert {
          background-color: var(--error-bg);
          border-left: 4px solid var(--error-border);
          padding: 1rem;
          border-radius: 0.375rem;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
        }

        .error-icon {
          height: 1.25rem;
          width: 1.25rem;
          color: #ef4444;
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .error-text {
          margin-left: 0.75rem;
        }

        .error-text p {
          font-size: 0.875rem;
          color: var(--error-text);
        }

        .error-button {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--error-text);
          cursor: pointer;
        }

        .error-button:hover {
          text-decoration: underline;
        }

        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .chart-skeleton, .metric-skeleton, .table-skeleton {
          background-color: var(--card-bg);
          border-radius: 0.5rem;
          border: 1px solid var(--card-border);
          animation: pulse 2s infinite;
        }

        .chart-skeleton {
          height: 350px;
        }

        .metrics-skeleton {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .metric-skeleton {
          height: 250px;
          padding: 1.5rem;
        }

        .table-skeleton {
          height: 400px;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
        }

        .chart-container {
          background-color: var(--card-bg);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 2rem;
          border: 1px solid var(--card-border);
          transition: all 0.2s ease;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .metric-card {
          background-color: var(--card-bg);
          border-radius: 0.5rem;
          padding: 1.5rem;
          border: 1px solid var(--card-border);
          transition: all 0.2s ease;
        }

        .metric-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-color);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dollar-icon {
          color: #3b82f6;
        }

        .trend-icon {
          color: #10b981;
        }

        .chart-icon {
          color: #8b5cf6;
        }

        .metric-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
        }

        .metric-label {
          color: var(--metric-label);
          text-transform: capitalize;
        }

        .metric-value {
          font-weight: 500;
          color: var(--metric-value);
        }

        .positive-change {
          color: var(--positive-change);
          font-weight: 500;
        }

        .data-table-container {
          background-color: var(--card-bg);
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid var(--card-border);
          transition: all 0.2s ease;
        }

        .table-title {
          font-size: 1.25rem;
          font-weight: 600;
          padding: 1.5rem;
          color: var(--text-color);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          min-width: 600px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .table-header {
          background-color: var(--table-header-bg);
        }

        .table-header th {
          padding: 0.75rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--metric-label);
        }

        .table-body tr {
          transition: background-color 0.2s ease;
        }

        .table-body tr:hover {
          background-color: var(--table-row-hover);
        }

        .table-body td {
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
          color: var(--metric-label);
          border-top: 1px solid var(--table-border);
        }

        .table-body td:first-child {
          font-weight: 500;
          color: var(--metric-value);
        }
      `}</style>
    </div>
  );
}