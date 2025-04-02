'use client';
import { useEffect, useState } from 'react';
import { FiSun, FiCloudRain, FiAlertCircle, FiStar, FiRefreshCw } from 'react-icons/fi';
import { BsGraphUp } from 'react-icons/bs';
import { GrBitcoin } from 'react-icons/gr';
import { WiHumidity } from 'react-icons/wi';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic imports for charts
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="h-[350px] flex items-center justify-center">Loading chart...</div>
});

// Type definitions
type WeatherData = {
  city: string;
  temperature: number;
  humidity: number;
  condition: string;
  isFavorite?: boolean;
};

type CryptoData = {
  name: string;
  price: number;
  change: number;
  isFavorite?: boolean;
};

type NewsData = {
  link: string,
  id: number;
  title: string;
  source: string;
  time: string;
};

type CryptoMetrics = {
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

const popIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
};

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode ? JSON.parse(savedMode) : false;
    }
    return false;
  });
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Optional: Update the HTML class for better theming support
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [newsData, setNewsData] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState({
    weather: true,
    crypto: true,
    news: true
  });
  const [errors, setErrors] = useState({
    weather: false,
    crypto: false,
    news: false
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load favorites from localStorage
  const loadFavorites = () => {
    const favorites = JSON.parse(
      localStorage.getItem('favorites') || '{"cities": [], "cryptos": []}'
    );
    return favorites;
  };
  

  // Save favorites to localStorage
  const saveFavorites = (favorites: { cities: string[]; cryptos: string[] }) => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  // Toggle favorite status with animation
  const toggleFavorite = (type: 'city' | 'crypto', name: string) => {
    const favorites = loadFavorites();
    const key = type === 'city' ? 'cities' : 'cryptos';
    const index = favorites[key].indexOf(name);

    if (index === -1) {
      favorites[key].push(name);
    } else {
      favorites[key].splice(index, 1);
    }

    saveFavorites(favorites);
    updateDataWithFavorites();
  };

  // Update data with favorite status
  const updateDataWithFavorites = () => {
    const favorites = loadFavorites();
    
    setWeatherData(prev => prev.map(item => ({
      ...item,
      isFavorite: favorites.cities.includes(item.city)
    })));
    
    setCryptoData(prev => prev.map(item => ({
      ...item,
      isFavorite: favorites.cryptos.includes(item.name)
    })));
  };

  // Fetch data with error handling
  const fetchData = async () => {
    try {
      setLoading({ weather: true, crypto: true, news: true });
      setErrors({ weather: false, crypto: false, news: false });
      
      // Simulate parallel API calls
      await Promise.allSettled([
        fetchWeatherData(),
        fetchCryptoData(),
        fetchNewsData()
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchWeatherData = async () => {
    const cities = ['London', 'New York', 'Varanasi', 'New Delhi'];
    const apiKey = process.env.NEXT_PUBLIC_KEY_WEATHER;
    console.log("API ",apiKey)
    
    try {
      const weatherPromises = cities.map(city => 
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch weather for ${city}`);
            return response.json();
          })
      );

      const results = await Promise.all(weatherPromises);
      const favorites = loadFavorites();

      const formattedWeatherData = results.map(data => ({
        city: data.name,
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        isFavorite: favorites.cities.includes(data.name)
      }));

      setWeatherData(formattedWeatherData);
      setLoading(prev => ({ ...prev, weather: false }));
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setErrors(prev => ({ ...prev, weather: true }));
      setLoading(prev => ({ ...prev, weather: false }));
    }
  };
  
  // Call the function to fetch weather data
  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  const fetchCryptoData = () => {
    try {
      setLoading(prev => ({ ...prev, crypto: true }));
  
      // Close existing connection if any
      if (socket) {
        socket.close();
      }
  
      // Initialize WebSocket connection
      const pricesWs = new WebSocket('wss://ws.coincap.io/prices?assets=bitcoin,ethereum,solana');
      setSocket(pricesWs);
  
      pricesWs.onopen = () => {
        console.log('WebSocket connected');
        // Set initial static data while waiting for first update
        if (!initialDataLoaded) {
          setCryptoData([
            { name: 'Bitcoin', price: 45678, change: 2.5 },
            { name: 'Ethereum', price: 2345, change: -1.2 },
            { name: 'Solana', price: 98, change: 5.7 }
          ]);
        }
      };
  
      pricesWs.onmessage = (msg) => {
        const livePrices = JSON.parse(msg.data);
        
        setCryptoData(prev => {
          const updatedData = prev.map(crypto => {
            const lowerName = crypto.name.toLowerCase();
            if (livePrices.hasOwnProperty(lowerName)) {
              const newPrice = parseFloat(livePrices[lowerName]);
              const change = ((newPrice - crypto.price) / crypto.price) * 100;
              
              return {
                ...crypto,
                price: newPrice,
                change: parseFloat(change.toFixed(2))
              };
            }
            return crypto;
          });
  
          return updatedData;
        });
        
        setInitialDataLoaded(true);
        setLoading(prev => ({ ...prev, crypto: false }));
      };
  
      pricesWs.onerror = (error) => {
        console.error('WebSocket error:', error);
        setErrors(prev => ({ ...prev, crypto: true }));
        setLoading(prev => ({ ...prev, crypto: false }));
      };
  
      pricesWs.onclose = () => {
        console.log('WebSocket disconnected');
      };
  
    } catch (error) {
      setCryptoData([
        { name: 'Bitcoin', price: 45678, change: 2.5 },
        { name: 'Ethereum', price: 2345, change: -1.2 },
        { name: 'Solana', price: 98, change: 5.7 }
      ]);
      console.error('Error setting up WebSocket:', error);
      setErrors(prev => ({ ...prev, crypto: true }));
      setLoading(prev => ({ ...prev, crypto: false }));
    }
  
  };
  
  // Initialize on mount
  useEffect(() => {
    fetchCryptoData();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Reconnect logic if needed
  useEffect(() => {
    if (errors.crypto) {
      const timer = setTimeout(() => {
        fetchCryptoData();
      }, 5000); // Reconnect after 5 seconds on error
      
      return () => clearTimeout(timer);
    }
  }, [errors.crypto]);
  // Use in useEffect
  useEffect(() => {
    const cleanup = fetchCryptoData();
    return cleanup; // This will close the WebSocket when component unmounts
  }, []);

  // news data
const fetchNewsData = async () => {
   const tags=["India","Bitcoin"]
  // const tags = ["India", "Bitcoin", "Crypto", "Market", "Economy"];
  const apiKey = process.env.NEXT_PUBLIC_KEY_NEWS;
  // const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${tags[0]}&size=1`
  // const data = await fetch(url)
  // console.log(data)
  try {
    setLoading(prev => ({ ...prev, news: true }));
    
    // Fetch news for each tag in parallel
    const newsPromises = tags.map(tag => 
      fetch(`https://newsdata.io/api/1/news?apikey=${apiKey}&q=${tag}&size=1`)
        .then(response => response.json())
    );
    
    const newsResponses = await Promise.all(newsPromises);
    
    // Process responses to get top article for each tag
    const formattedNews = newsResponses
      .filter(response => response.status === "success" && response.results?.length > 0)
      .map((response, index) => {
        const article = response.results[0]; // Get top article
        return {
          id: index + 1,
          title: article.title,
          source: article.source_name,
          time: formatTimeAgo(article.pubDate),
          tag: tags[index],
          link: article.link,
          image: article.image_url
        };
      });
      // console.log(formattedNews)
    
    setNewsData(formattedNews);
    setLoading(prev => ({ ...prev, news: false }));
  } catch (error) {
    console.error("Error fetching news:", error);
    setErrors(prev => ({ ...prev, news: true }));
    setLoading(prev => ({ ...prev, news: false }));
  }
};

// Helper function to format time as "Xh ago" or "Xd ago"
const formatTimeAgo = (pubDate: string) => {
  const now = new Date();
  const pub = new Date(pubDate);
  const diffHours = Math.floor((now.getTime() - pub.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
};

  // Initial data load
  useEffect(() => {
    fetchData();
    
    // Set up periodic refresh (every 60 seconds)
    const refreshInterval = setInterval(fetchData, 60000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Simulate real-time crypto updates
  useEffect(() => {
    const cryptoUpdateInterval = setInterval(() => {
      setCryptoData(prev => prev.map(crypto => ({
        ...crypto,
        price: crypto.price * (1 + (Math.random() * 0.02 - 0.01)),
        change: crypto.change + (Math.random() * 0.4 - 0.2)
      })));
    }, 30000);

    return () => clearInterval(cryptoUpdateInterval);
  }, []);

  const hasErrors = Object.values(errors).some(error => error);

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with animation */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold">CryptoWeather Nexus</h1>
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition`}
              title="Refresh Data"
            >
              <FiRefreshCw className={`${loading.weather || loading.crypto || loading.news ? 'animate-spin' : ''}`} />
              {lastUpdated && (
                <span className="text-sm">
                  {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {darkMode ? '🌞' : '🌙'}
            </motion.button>
          </div>
        </motion.div>

        {/* Error Alert with animation */}
        <AnimatePresence>
          {hasErrors && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-100'} border-l-4 border-red-500`}
            >
              <div className="flex items-center">
                <FiAlertCircle className="mr-2" />
                <p>Some data failed to load. Try refreshing or check back later.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Favorites Section with staggered animations */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className={`mb-8 p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
        >
          <h2 className="text-xl font-semibold mb-4">⭐ Favorites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Favorite Cities</h3>
              {weatherData.filter(city => city.isFavorite).length > 0 ? (
                <div className="space-y-2">
                  <AnimatePresence>
                    {weatherData.filter(city => city.isFavorite).map((city, index) => (
                      <motion.div
                        key={city.city}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: index * 0.1, type: 'spring' }}
                        className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
                      >
                        <span>{city.city}</span>
                        <span>{city.temperature}°C</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  No favorite cities yet
                </motion.p>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Favorite Cryptos</h3>
              {cryptoData.filter(crypto => crypto.isFavorite).length > 0 ? (
                <div className="space-y-2">
                  <AnimatePresence>
                    {cryptoData.filter(crypto => crypto.isFavorite).map((crypto, index) => (
                      <motion.div
                        key={crypto.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: index * 0.1, type: 'spring' }}
                        className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
                      >
                        <span>{crypto.name}</span>
                        <span>${crypto.price.toLocaleString()}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  No favorite cryptos yet
                </motion.p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Dashboard Grid with staggered animations */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {/* Weather Section */}
          <motion.section
            variants={slideUp}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiSun className="mr-2 text-2xl text-yellow-500" />
                <h2 className="text-xl font-semibold">Weather</h2>
              </div>
              {errors.weather ? (
                <span className="text-red-500 text-sm">Failed to load</span>
              ) : loading.weather ? (
                <span className="text-sm">Loading...</span>
              ) : null}
            </div>
            
            <div className="space-y-4">
              {errors.weather ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-50'} text-red-700`}
                >
                  Weather data unavailable. <button onClick={fetchWeatherData} className="text-blue-600">Retry</button>
                </motion.div>
              ) : loading.weather ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                      className={`h-20 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                    ></motion.div>
                  ))}
                </div>
              ) : (
                <AnimatePresence>
                  {weatherData.map((weather, index) => (
                    <Link 
                    href={`/city/${encodeURIComponent(weather.city.toLowerCase())}`}
                    passHref
                    legacyBehavior
                  >
                    
                    
                    <motion.div
                      key={weather.city}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.1, type: 'spring' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-50'} ${weather.isFavorite ? 'border-2 border-yellow-400' : ''} transition-all`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{weather.city}</h3>
                        <motion.button 
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite('city', weather.city);
                          }}
                          className={`${darkMode ? 'text-gray-300 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'} transition-colors`}
                        >
                          <FiStar className={weather.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
                        </motion.button>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center">
                          <WiHumidity className="mr-2 text-blue-400" />
                          <span>{weather.humidity}%</span>
                        </div>
                        <span className="text-2xl font-bold">{weather.temperature}°C</span>
                      </div>
                      <div className="mt-1 text-sm">{weather.condition}</div>
                    </motion.div>
                  
                  </Link> 
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.section>

          {/* Crypto Section */}
          <motion.section
            variants={slideUp}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <GrBitcoin className="mr-2 text-2xl text-orange-500" />
                <h2 className="text-xl font-semibold">Cryptocurrency</h2>
              </div>
              {errors.crypto ? (
                <span className="text-red-500 text-sm">Failed to load</span>
              ) : loading.crypto ? (
                <span className="text-sm">Loading...</span>
              ) : null}
            </div>
            
            <div className="space-y-4">
              {errors.crypto ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-red-200' : 'bg-red-50' } text-red-700` }
                >
                  
                  Crypto data unavailable, the CoinCap api is having problem keep refreshing</motion.div>
              ) : loading.crypto ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                      className={`h-16 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                    ></motion.div>
                  ))}
                </div>
              ) : (
                <AnimatePresence>
                  {cryptoData.map((crypto, index) => (
                    <motion.div
                      key={crypto.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.1, type: 'spring' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link 
                        href={`/crypto/${encodeURIComponent(crypto.name.toLowerCase())}`}
                        passHref
                        legacyBehavior
                      >
                        <div className={`p-4 m-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-50'} ${crypto.isFavorite ? 'border-2 border-yellow-400' : ''} transition-all cursor-pointer`}>
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{crypto.name}</h3>
                            <motion.button 
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ 
                                scale: 0.8,
                                transition: { type: 'spring', stiffness: 500 }
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleFavorite('crypto', crypto.name);
                              }}
                              className={`${darkMode ? 'text-gray-300 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'} transition-colors`}
                            >
                              <FiStar className={crypto.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
                            </motion.button>
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              ${crypto.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-sm ${crypto.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.section>

          {/* News Section */}
          <motion.section
            variants={slideUp}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg lg:col-span-2 xl:col-span-1`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiCloudRain className="mr-2 text-2xl text-blue-500" />
                <h2 className="text-xl font-semibold">Latest News</h2>
              </div>
              {errors.news ? (
                <span className="text-red-500 text-sm">Failed to load</span>
              ) : loading.news ? (
                <span className="text-sm">Loading...</span>
              ) : null}
            </div>
            
            <div className="space-y-4">
              {errors.news ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-50'} text-red-700`}
                >
                  News data unavailable. <button onClick={fetchNewsData} className="text-blue-600">Retry</button>
                </motion.div>
              ) : loading.news ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                      className={`h-16 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                    ></motion.div>
                  ))}
                </div>
              ) : (
                <AnimatePresence>
                  {newsData.map((news, index) => (
                    <motion.div
                      key={news.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.05, type: 'spring' }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      >
                      <Link 
                        href={news.link}
                        passHref
                        legacyBehavior
                      >
                      <div
                      className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-50'} transition-all cursor-pointer`}
                      >
                      
                      <h3 className="font-medium mb-2">{news.title}</h3>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{news.source}</span>
                        <span>{news.time}</span>
                      </div>
                      </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.section>
        </motion.div>

        {/* Stats Footer with animation */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Market Cap', value: loading.crypto || errors.crypto ? '...' : `$${(cryptoData.reduce((sum, crypto) => sum + crypto.price, 0) * 1000)}` },
            { label: 'Active Cities', value: loading.weather || errors.weather ? '...' : weatherData.length },
            { label: 'Favorites', value: loadFavorites().cities.length + loadFavorites().cryptos.length },
            { label: 'Last Updated', value: lastUpdated ? lastUpdated.toLocaleTimeString() : '...' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={popIn}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -3 }}
              className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow text-center transition-all`}
            >
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;