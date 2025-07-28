const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// FREE API Keys Only
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Free Data Sources
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY; // Free: 25 calls/day, 5 calls/minute
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY; // Free: 60 calls/minute
const FIXER_API_KEY = process.env.FIXER_API_KEY; // Free: 100 calls/month
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY; // Free: 800 calls/day
const MARKETSTACK_API_KEY = process.env.MARKETSTACK_API_KEY; // Free: 1000 calls/month
const CURRENCYLAYER_API_KEY = process.env.CURRENCYLAYER_API_KEY; // Free: 1000 calls/month
const NEWS_API_KEY = process.env.NEWS_API_KEY; // Free: 100 calls/day for dev
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY; // Free: 1500 calls/month

// Email configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const WORK_EMAIL_LIST = process.env.WORK_EMAIL_LIST;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Free API rate limiting
class FreeAPIRateLimit {
    constructor() {
        this.limits = {
            alphavantage: { calls: 0, resetTime: Date.now() + 60000, max: 5, dailyCalls: 0, dailyMax: 25 },
            finnhub: { calls: 0, resetTime: Date.now() + 60000, max: 50 }, // Conservative limit
            twelvedata: { calls: 0, resetTime: Date.now() + 86400000, max: 800 }, // Daily limit
            marketstack: { calls: 0, resetTime: Date.now() + 2592000000, max: 1000 }, // Monthly
            newsapi: { calls: 0, resetTime: Date.now() + 86400000, max: 100 } // Daily
        };
    }

    async checkLimit(api) {
        const limit = this.limits[api];
        if (!limit) return true;

        // Reset counters if time has passed
        if (Date.now() > limit.resetTime) {
            limit.calls = 0;
            if (api === 'alphavantage') {
                // Reset minute counter but track daily
                limit.resetTime = Date.now() + 60000;
                if (Date.now() > (limit.dailyResetTime || 0)) {
                    limit.dailyCalls = 0;
                    limit.dailyResetTime = Date.now() + 86400000;
                }
            } else if (api === 'twelvedata' || api === 'newsapi') {
                limit.resetTime = Date.now() + 86400000; // Daily reset
            } else if (api === 'marketstack') {
                limit.resetTime = Date.now() + 2592000000; // Monthly reset
            } else {
                limit.resetTime = Date.now() + 60000; // Minute reset
            }
        }

        // Check limits
        if (limit.calls >= limit.max) {
            const waitTime = limit.resetTime - Date.now();
            console.log(`⏳ Free API limit hit for ${api}, waiting ${Math.ceil(waitTime/1000)}s`);
            await new Promise(resolve => setTimeout(resolve, Math.min(waitTime + 1000, 5000)));
            limit.calls = 0;
            limit.resetTime = Date.now() + (api === 'alphavantage' ? 60000 : 86400000);
        }

        // Check Alpha Vantage daily limit
        if (api === 'alphavantage' && limit.dailyCalls >= limit.dailyMax) {
            console.log(`❌ Alpha Vantage daily limit (${limit.dailyMax}) reached`);
            return false;
        }

        limit.calls++;
        if (api === 'alphavantage') limit.dailyCalls++;
        return true;
    }
}

const rateLimiter = new FreeAPIRateLimit();

// Enhanced error handling for free APIs
async function makeAPICall(url, options = {}, apiName = 'unknown', retries = 2) {
    const canCall = await rateLimiter.checkLimit(apiName);
    if (!canCall) {
        throw new Error(`${apiName} rate limit exceeded`);
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, {
                timeout: 8000,
                ...options
            });
            
            if (response.data && response.status === 200) {
                return response.data;
            }
            throw new Error(`Invalid response: ${response.status}`);
        } catch (error) {
            console.log(`❌ Attempt ${attempt}/${retries} failed for ${apiName}: ${error.message}`);
            if (attempt === retries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// FREE: Alpha Vantage futures (using INDEX data as proxy)
async function fetchFreeRealTimeFutures() {
    const futures = {};
    
    if (!ALPHA_VANTAGE_API_KEY) {
        console.log('⚠️  Alpha Vantage API key not found, using sample futures');
        return generateSampleFutures();
    }
    
    try {
        console.log('📈 Fetching futures proxies from Alpha Vantage (FREE)...');
        
        // Use major ETFs as futures proxies since free APIs don't have real futures
        const futuresProxies = {
            'SPY': 'S&P 500 Futures (SPY Proxy)',
            'QQQ': 'Nasdaq Futures (QQQ Proxy)',
            'DIA': 'Dow Futures (DIA Proxy)'
        };
        
        for (const [symbol, name] of Object.entries(futuresProxies)) {
            try {
                const data = await makeAPICall(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                    {},
                    'alphavantage'
                );
                
                if (data && data['Global Quote']) {
                    const quote = data['Global Quote'];
                    futures[symbol] = {
                        name,
                        price: parseFloat(quote['05. price']).toFixed(2),
                        change: parseFloat(quote['09. change']).toFixed(2),
                        changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
                        session: 'Regular Hours (Proxy)',
                        volume: parseInt(quote['06. volume']),
                        timestamp: quote['07. latest trading day']
                    };
                }
                
                // Wait between calls for free tier
                await new Promise(resolve => setTimeout(resolve, 15000)); // 15s between calls
            } catch (error) {
                console.log(`Failed to fetch ${name}:`, error.message);
            }
        }
        
        console.log(`✅ Fetched ${Object.keys(futures).length} futures proxies from Alpha Vantage`);
        return futures;
        
    } catch (error) {
        console.log('Alpha Vantage futures error:', error.message);
        return generateSampleFutures();
    }
}

// FREE: Twelve Data for ETF data (free tier)
async function fetchFreeTwelveDataETFs() {
    const etfData = {};
    
    if (!TWELVE_DATA_API_KEY) {
        console.log('⚠️  Twelve Data API key not found, trying Alpha Vantage');
        return await fetchFreeAlphaVantageETFs();
    }
    
    try {
        console.log('📊 Fetching ETF data from Twelve Data (FREE)...');
        
        const etfs = ['SPY', 'QQQ', 'DIA', 'IWM', 'XLF', 'XLK', 'XLE', 'XLV']; // Reduced for free tier
        
        // Twelve Data allows batch requests in free tier
        const symbolString = etfs.join(',');
        const response = await makeAPICall(
            `https://api.twelvedata.com/quote?symbol=${symbolString}&apikey=${TWELVE_DATA_API_KEY}`,
            {},
            'twelvedata'
        );
        
        if (response) {
            // Handle both single and batch responses
            const quotes = Array.isArray(response) ? response : [response];
            
            quotes.forEach(quote => {
                if (quote && quote.symbol) {
                    etfData[quote.symbol] = {
                        name: getSectorName(quote.symbol),
                        price: parseFloat(quote.close).toFixed(2),
                        change: parseFloat(quote.change).toFixed(2),
                        changePercent: parseFloat(quote.percent_change).toFixed(2),
                        session: 'Real-Time (Free)',
                        volume: parseInt(quote.volume) || 0,
                        high: parseFloat(quote.high),
                        low: parseFloat(quote.low),
                        timestamp: quote.datetime
                    };
                }
            });
        }
        
        console.log(`✅ Fetched ${Object.keys(etfData).length} ETFs from Twelve Data`);
        return etfData;
        
    } catch (error) {
        console.log('Twelve Data failed, trying Alpha Vantage:', error.message);
        return await fetchFreeAlphaVantageETFs();
    }
}

// FREE: Alpha Vantage ETF fallback
async function fetchFreeAlphaVantageETFs() {
    const etfData = {};
    
    if (!ALPHA_VANTAGE_API_KEY) {
        return generateOvernightSectors();
    }
    
    try {
        console.log('📊 Fetching ETF data from Alpha Vantage (FREE fallback)...');
        
        // Limited ETFs due to free tier restrictions
        const etfs = ['SPY', 'QQQ', 'XLK', 'XLF']; // Only 4 to stay within limits
        
        for (const etf of etfs) {
            try {
                const response = await makeAPICall(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                    {},
                    'alphavantage'
                );
                
                if (response && response['Global Quote']) {
                    const quote = response['Global Quote'];
                    etfData[etf] = {
                        name: getSectorName(etf),
                        price: parseFloat(quote['05. price']).toFixed(2),
                        change: parseFloat(quote['09. change']).toFixed(2),
                        changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
                        session: 'Regular Hours',
                        volume: parseInt(quote['06. volume'])
                    };
                }
                
                await new Promise(resolve => setTimeout(resolve, 15000)); // 15s for free tier
            } catch (error) {
                console.log(`Failed to fetch ${etf}:`, error.message);
            }
        }
        
        console.log(`✅ Fetched ${Object.keys(etfData).length} ETFs from Alpha Vantage`);
        return etfData;
        
    } catch (error) {
        console.log('Alpha Vantage ETF error:', error.message);
        return generateOvernightSectors();
    }
}

// FREE: Marketstack for global markets (free tier)
async function fetchFreeGlobalMarkets() {
    const globalData = {};
    
    if (!MARKETSTACK_API_KEY) {
        console.log('⚠️  Marketstack API key not found, trying free alternatives');
        return await fetchFreeAsianAlternatives();
    }
    
    try {
        console.log('🌏 Fetching global markets from Marketstack (FREE)...');
        
        // Major global indices available in free tier
        const globalSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']; // Using US stocks as proxies
        
        for (const symbol of globalSymbols) {
            try {
                const response = await makeAPICall(
                    `http://api.marketstack.com/v1/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${symbol}`,
                    {},
                    'marketstack'
                );
                
                if (response && response.data && response.data[0]) {
                    const data = response.data[0];
                    globalData[symbol] = {
                        symbol,
                        price: data.close,
                        change: data.close - data.open,
                        changePercent: ((data.close - data.open) / data.open * 100).toFixed(2),
                        volume: data.volume,
                        high: data.high,
                        low: data.low,
                        date: data.date
                    };
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.log(`Failed to fetch ${symbol} from Marketstack:`, error.message);
            }
        }
        
        console.log(`✅ Fetched ${Object.keys(globalData).length} global instruments from Marketstack`);
        return globalData;
        
    } catch (error) {
        console.log('Marketstack failed:', error.message);
        return await fetchFreeAsianAlternatives();
    }
}

// FREE: Alternative Asian market data using Yahoo Finance (no API key needed)
async function fetchFreeAsianAlternatives() {
    const asianData = {};
    
    try {
        console.log('🌏 Fetching Asian market alternatives (FREE - No API Key)...');
        
        // Use free Yahoo Finance alternative endpoints
        const asianProxies = {
            'ASML': 'European Tech (ASML)',
            'TSM': 'Taiwan Semi (Asian Tech)',
            'SONY': 'Japanese Market (Sony)',
            'BABA': 'Chinese Market (Alibaba)'
        };
        
        // Using a free financial API that doesn't require keys
        for (const [symbol, name] of Object.entries(asianProxies)) {
            try {
                // Using Alpha Vantage if available, otherwise sample data
                if (ALPHA_VANTAGE_API_KEY) {
                    const response = await makeAPICall(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                        {},
                        'alphavantage'
                    );
                    
                    if (response && response['Global Quote']) {
                        const quote = response['Global Quote'];
                        asianData[name] = {
                            symbol,
                            price: parseFloat(quote['05. price']),
                            change: parseFloat(quote['09. change']),
                            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                            volume: parseInt(quote['06. volume'])
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 15000));
                }
            } catch (error) {
                console.log(`Failed to fetch ${name}:`, error.message);
            }
        }
        
        console.log(`✅ Fetched ${Object.keys(asianData).length} Asian market proxies`);
        return asianData;
        
    } catch (error) {
        console.log('Asian alternatives failed:', error.message);
        return generateSampleAsianMarkets();
    }
}

// FREE: Currency data using multiple free sources
async function fetchFreeCurrencyData() {
    const currencyData = {};
    
    // Try ExchangeRate-API first (generous free tier)
    if (EXCHANGERATE_API_KEY) {
        try {
            console.log('💱 Fetching currency data from ExchangeRate-API (FREE)...');
            
            const response = await makeAPICall(
                `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`,
                {},
                'exchangerate'
            );
            
            if (response && response.conversion_rates) {
                const rates = response.conversion_rates;
                
                currencyData['EURUSD'] = {
                    rate: (1 / rates.EUR).toFixed(4),
                    change: 'N/A',
                    session: 'Free Tier',
                    lastUpdate: response.time_last_update_utc
                };
                currencyData['GBPUSD'] = {
                    rate: (1 / rates.GBP).toFixed(4),
                    change: 'N/A', 
                    session: 'Free Tier',
                    lastUpdate: response.time_last_update_utc
                };
                currencyData['USDJPY'] = {
                    rate: rates.JPY.toFixed(2),
                    change: 'N/A',
                    session: 'Free Tier',
                    lastUpdate: response.time_last_update_utc
                };
                
                console.log(`✅ Fetched ${Object.keys(currencyData).length} currency pairs from ExchangeRate-API`);
                return currencyData;
            }
            
        } catch (error) {
            console.log('ExchangeRate-API failed, trying Fixer:', error.message);
        }
    }
    
    // Fallback to Fixer.io free tier
    if (FIXER_API_KEY && Object.keys(currencyData).length === 0) {
        try {
            console.log('💱 Fetching currency data from Fixer (FREE fallback)...');
            
            const response = await makeAPICall(
                `http://data.fixer.io/api/latest?access_key=${FIXER_API_KEY}&base=USD&symbols=EUR,GBP,JPY`,
                {},
                'fixer'
            );
            
            if (response && response.rates) {
                const rates = response.rates;
                
                currencyData['EURUSD'] = {
                    rate: (1 / rates.EUR).toFixed(4),
                    change: 'N/A',
                    session: 'Free Tier',
                    lastUpdate: response.date
                };
                currencyData['GBPUSD'] = {
                    rate: (1 / rates.GBP).toFixed(4),
                    change: 'N/A',
                    session: 'Free Tier', 
                    lastUpdate: response.date
                };
                currencyData['USDJPY'] = {
                    rate: rates.JPY.toFixed(2),
                    change: 'N/A',
                    session: 'Free Tier',
                    lastUpdate: response.date
                };
                
                console.log(`✅ Fetched ${Object.keys(currencyData).length} currency pairs from Fixer`);
                return currencyData;
            }
            
        } catch (error) {
            console.log('Fixer failed:', error.message);
        }
    }
    
    // If all free sources fail, use sample data
    return Object.keys(currencyData).length > 0 ? currencyData : generateSampleCurrencies();
}

// FREE: News data using free news sources
async function fetchFreeOvernightNews() {
    const newsData = [];
    const timing = getMarketTimingInfo();
    const searchFromTime = new Date(timing.lastClose);
    
    console.log(`📰 Fetching overnight news from free sources (from ${searchFromTime.toLocaleString()})...`);
    
    // Try News API free tier first
    if (NEWS_API_KEY) {
        try {
            // Limited searches for free tier
            const searchQueries = [
                'stock market',
                'federal reserve',
                'trade deal'
            ];
            
            for (const query of searchQueries) {
                try {
                    const response = await makeAPICall(
                        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&from=${searchFromTime.toISOString()}&apiKey=${NEWS_API_KEY}`,
                        {},
                        'newsapi'
                    );
                    
                    if (response && response.articles) {
                        const relevantArticles = response.articles
                            .filter(article => {
                                const publishTime = new Date(article.publishedAt);
                                return publishTime >= searchFromTime;
                            })
                            .slice(0, 2) // Limit for free tier
                            .map(article => ({
                                headline: article.title,
                                datetime: Math.floor(new Date(article.publishedAt).getTime() / 1000),
                                source: article.source.name,
                                url: article.url,
                                description: article.description,
                                category: query,
                                timeFromClose: Math.floor((new Date(article.publishedAt) - searchFromTime) / (1000 * 60 * 60))
                            }));
                        
                        newsData.push(...relevantArticles);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch news for "${query}":`, error.message);
                }
            }
            
            console.log(`✅ Fetched ${newsData.length} news articles from News API (FREE)`);
            
        } catch (error) {
            console.log('News API failed, trying Finnhub:', error.message);
        }
    }
    
    // Try Finnhub free tier as fallback
    if (FINNHUB_API_KEY && newsData.length < 5) {
        try {
            console.log('📰 Fetching news from Finnhub (FREE fallback)...');
            
            const response = await makeAPICall(
                `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`,
                {},
                'finnhub'
            );
            
            if (response && Array.isArray(response)) {
                const closeTimestamp = Math.floor(searchFromTime.getTime() / 1000);
                const filteredNews = response
                    .filter(news => news.datetime > closeTimestamp)
                    .slice(0, 8) // Limit for free tier
                    .map(news => ({
                        headline: news.headline,
                        datetime: news.datetime,
                        source: news.source,
                        url: news.url,
                        category: 'general',
                        timeFromClose: Math.floor((news.datetime - closeTimestamp) / 3600)
                    }));
                
                newsData.push(...filteredNews);
                console.log(`✅ Added ${filteredNews.length} news articles from Finnhub (FREE)`);
            }
            
        } catch (error) {
            console.log('Finnhub news failed:', error.message);
        }
    }
    
    // Remove duplicates and limit for free tier
    const uniqueNews = newsData.filter((article, index, self) => 
        index === self.findIndex(a => a.headline === article.headline)
    ).sort((a, b) => b.datetime - a.datetime).slice(0, 10);
    
    return uniqueNews;
}

// FREE: Simple options flow (mock data since real options data requires paid APIs)
function generateFreeOptionsFlow() {
    console.log('📈 Generating sample options flow (real options data requires paid APIs)');
    
    return [
        {
            symbol: 'SPY',
            strike: '638',
            type: 'CALL',
            volume: 15420,
            unusualActivity: true,
            impliedVolatility: 14.2,
            source: 'Sample Data'
        },
        {
            symbol: 'QQQ', 
            strike: '567',
            type: 'CALL',
            volume: 12850,
            unusualActivity: true,
            impliedVolatility: 16.8,
            source: 'Sample Data'
        },
        {
            symbol: 'AAPL',
            strike: '225',
            type: 'PUT',
            volume: 8940,
            unusualActivity: true,
            impliedVolatility: 22.5,
            source: 'Sample Data'
        }
    ];
}

// Helper functions
function getSectorName(etf) {
    const sectorMap = {
        'XLF': 'Financial Services',
        'XLK': 'Technology',
        'XLE': 'Energy',
        'XLV': 'Healthcare',
        'XLI': 'Industrials',
        'XLY': 'Consumer Discretionary',
        'XLP': 'Consumer Staples',
        'XLU': 'Utilities',
        'XLB': 'Materials',
        'SPY': 'S&P 500 ETF',
        'QQQ': 'Nasdaq 100 ETF',
        'DIA': 'Dow Jones ETF',
        'IWM': 'Russell 2000 ETF'
    };
    return sectorMap[etf] || etf;
}

function getCloseToOpenWindow() {
    const now = new Date();
    
    const lastClose = new Date();
    lastClose.setHours(16, 0, 0, 0);
    
    if (now.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    if (lastClose.getDay() === 6) {
        lastClose.setDate(lastClose.getDate() - 1);
    } else if (lastClose.getDay() === 0) {
        lastClose.setDate(lastClose.getDate() - 2);
    }
    
    const nextOpen = new Date();
    nextOpen.setHours(9, 30, 0, 0);
    
    if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 30)) {
        nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    if (nextOpen.getDay() === 6) {
        nextOpen.setDate(nextOpen.getDate() + 2);
    } else if (nextOpen.getDay() === 0) {
        nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    return {
        lastClose,
        nextOpen,
        isCloseToOpenPeriod: now >= lastClose && now < nextOpen,
        hoursInWindow: Math.abs(nextOpen - lastClose) / (1000 * 60 * 60)
    };
}

function getMarketTimingInfo() {
    const window = getCloseToOpenWindow();
    const now = new Date();
    
    const hoursSinceClose = Math.floor((now - window.lastClose) / (1000 * 60 * 60));
    
    const timeToOpen = window.nextOpen - now;
    const hoursToOpen = Math.floor(timeToOpen / (1000 * 60 * 60));
    const minutesToOpen = Math.floor((timeToOpen % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
        lastClose: window.lastClose.toLocaleString(),
        nextOpen: window.nextOpen.toLocaleString(),
        hoursSinceClose,
        timeToOpenStr: `${hoursToOpen}h ${minutesToOpen}m`,
        isCloseToOpenPeriod: window.isCloseToOpenPeriod,
        totalWindowHours: window.hoursInWindow
    };
}

// FREE: Comprehensive overnight market data collection
async function fetchFreeOvernightMarketData() {
    console.log('🔄 Fetching overnight market data using FREE APIs only...');
    
    const overnightData = {
        realFutures: {},
        extendedHoursETFs: {},
        globalMarkets: {},
        currencyData: {},
        optionsFlow: [],
        overnightNews: [],
        geopoliticalEvents: []
    };
    
    try {
        // Fetch all data using free sources with smart sequencing
        console.log('📊 Starting free API data collection...');
        
        // Sequence API calls to respect rate limits
        overnightData.realFutures = await fetchFreeRealTimeFutures();
        console.log('✅ Futures proxies completed');
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Pause between API groups
        
        overnightData.extendedHoursETFs = await fetchFreeTwelveDataETFs();
        console.log('✅ ETF data completed');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        overnightData.globalMarkets = await fetchFreeGlobalMarkets();
        console.log('✅ Global markets completed');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        overnightData.currencyData = await fetchFreeCurrencyData();
        console.log('✅ Currency data completed');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        overnightData.overnightNews = await fetchFreeOvernightNews();
        console.log('✅ News data completed');
        
        // Options flow is generated since real options data requires paid APIs
        overnightData.optionsFlow = generateFreeOptionsFlow();
        console.log('✅ Options flow (sample) completed');
        
        console.log('✅ Free overnight data collection completed');
        console.log(`📊 Data summary: Futures(${Object.keys(overnightData.realFutures).length}), ETFs(${Object.keys(overnightData.extendedHoursETFs).length}), Global(${Object.keys(overnightData.globalMarkets).length}), FX(${Object.keys(overnightData.currencyData).length}), News(${overnightData.overnightNews.length}), Options(${overnightData.optionsFlow.length})`);
        
        // Display free API usage summary
        console.log('\n🆓 FREE API Usage Summary:');
        console.log(`Alpha Vantage: ${Object.keys(overnightData.realFutures).length > 0 ? '✅ Active (Free Tier)' : '❌ No API key'}`);
        console.log(`Twelve Data: ${Object.keys(overnightData.extendedHoursETFs).length > 0 ? '✅ Active (Free Tier)' : '❌ No API key'}`);
        console.log(`Marketstack: ${Object.keys(overnightData.globalMarkets).length > 0 ? '✅ Active (Free Tier)' : '❌ No API key'}`);
        console.log(`ExchangeRate-API: ${Object.keys(overnightData.currencyData).length > 0 ? '✅ Active (Free Tier)' : '❌ No API key'}`);
        console.log(`News API: ${overnightData.overnightNews.length > 0 ? '✅ Active (Free Tier)' : '❌ No API key'}`);
        console.log(`Finnhub: ${FINNHUB_API_KEY ? '✅ Available (Free Tier)' : '❌ No API key'}`);
        
        // Free tier cost breakdown
        console.log('\n💰 FREE API Cost Breakdown:');
        console.log('• Alpha Vantage: FREE (25 calls/day, 5 calls/min)');
        console.log('• Twelve Data: FREE (800 calls/day)');
        console.log('• Marketstack: FREE (1000 calls/month)');
        console.log('• ExchangeRate-API: FREE (1500 calls/month)');
        console.log('• News API: FREE (100 requests/day for development)');
        console.log('• Finnhub: FREE (60 calls/minute)');
        console.log('📊 Total monthly cost: $0 (All free tiers!)');
        console.log('💡 Upgrade options available for higher limits');
        
    } catch (error) {
        console.error('❌ Error in free overnight data collection:', error.message);
    }
    
    return overnightData;
}

// Sample data generators for fallbacks
function generateSampleFutures() {
    return {
        'SPY': {
            name: 'S&P 500 Futures (SPY Proxy)',
            price: '547.25',
            change: '+2.80',
            changePercent: '+0.51',
            session: 'Sample Data'
        },
        'QQQ': {
            name: 'Nasdaq Futures (QQQ Proxy)',
            price: '484.50',
            change: '+3.25',
            changePercent: '+0.67',
            session: 'Sample Data'
        },
        'DIA': {
            name: 'Dow Futures (DIA Proxy)',
            price: '407.85',
            change: '+1.95',
            changePercent: '+0.48',
            session: 'Sample Data'
        }
    };
}

function generateSampleAsianMarkets() {
    return {
        'Asian Tech (TSM)': {
            symbol: 'TSM',
            price: 182.45,
            change: 2.34,
            changePercent: 1.30,
            volume: 12500000
        },
        'European Tech (ASML)': {
            symbol: 'ASML',
            price: 845.20,
            change: -8.75,
            changePercent: -1.02,
            volume: 890000
        },
        'Chinese Market (BABA)': {
            symbol: 'BABA',
            price: 78.90,
            change: 1.45,
            changePercent: 1.87,
            volume: 15600000
        }
    };
}

function generateSampleCurrencies() {
    return {
        'EURUSD': {
            rate: '1.0847',
            change: '+0.0012',
            session: 'Sample Data'
        },
        'GBPUSD': {
            rate: '1.2816',
            change: '+0.0089',
            session: 'Sample Data'
        },
        'USDJPY': {
            rate: '155.18',
            change: '-0.45',
            session: 'Sample Data'
        }
    };
}

function generateOvernightSectors() {
    const sectors = {};
    const sectorETFs = ['SPY', 'QQQ', 'XLK', 'XLF']; // Limited for free tier
    
    sectorETFs.forEach(etf => {
        const basePrice = 30 + Math.random() * 50;
        const changePercent = (Math.random() - 0.5) * 3;
        const change = (basePrice * changePercent / 100).toFixed(2);
        const price = (basePrice + parseFloat(change)).toFixed(2);
        
        sectors[etf] = {
            price: `${price}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            name: getSectorName(etf),
            session: 'Sample Data'
        };
    });
    
    return sectors;
}

// Enhanced email function for free tier
async function sendFreeReportEmail(reportContent, dateStr) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Setting up email transport for FREE tier morning report...');
        
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        const timing = getMarketTimingInfo();
        
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #2d3748; border-bottom: 3px solid #38a169; padding-bottom: 15px; font-size: 28px;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #2d3748; margin-top: 30px; font-size: 22px; border-left: 4px solid #38a169; padding-left: 15px;">$1</h2>')
            .replace(/^\*\*(.*?)\*\*/gm, '<h3 style="color: #2d3748; margin-top: 25px; margin-bottom: 15px; font-weight: bold; font-size: 18px; background: linear-gradient(90deg, #f0fff4, transparent); padding: 10px 15px; border-radius: 5px;">$1</h3>')
            .replace(/^\*(.*$)/gm, '<p style="font-style: italic; color: #4a5568; background-color: #f0fff4; padding: 10px; border-left: 3px solid #38a169; margin: 10px 0;">$1</p>')
            .replace(/^([^<\n].*$)/gm, '<p style="line-height: 1.8; margin-bottom: 12px; color: #2d3748; font-size: 16px;">$1</p>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 1000px; margin: 0 auto; background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); padding: 20px;">
            <div style="background-color: white; padding: 40px; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2d3748; font-size: 32px; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">🆓 FREE TIER MORNING MARKET REPORT</h1>
                    <p style="color: #4a5568; font-size: 18px; margin: 10px 0;">100% Free APIs • Zero Cost Analysis • ${dateStr}</p>
                </div>
                
                ${emailHtml}
                
                <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #38a169, #2f855a); color: white; border-radius: 10px; text-align: center;">
                    <p style="margin: 0; font-weight: bold; font-size: 18px;">🆓 FREE TIER DATA SOURCES</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                        Last Close: ${timing.lastClose} • Next Open: ${timing.nextOpen}<br>
                        Free APIs: Alpha Vantage • Twelve Data • Marketstack • ExchangeRate-API • News API • Finnhub
                    </p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #f0fff4; border-radius: 10px; text-align: center; border: 2px solid #38a169;">
                    <p style="margin: 0; font-weight: bold; color: #2f855a; font-size: 16px;">💡 UPGRADE AVAILABLE</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #4a5568;">
                        Want real-time futures, professional options flow, and unlimited API calls?<br>
                        Consider upgrading to paid tiers for institutional-grade data accuracy.
                    </p>
                </div>
                
                <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #718096;">
                    <p>This free report uses the best available no-cost financial data sources.<br>
                    All APIs used are within their free tier limits. Powered by Claude AI.</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `🆓 FREE Morning Market Report - ${dateStr} - Zero Cost Analysis`,
            html: emailContent,
            text: reportContent,
            priority: 'normal'
        };
        
        console.log('📤 Sending FREE tier morning market report...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ FREE morning report sent successfully:', info.messageId);
        console.log('📧 Recipients:', WORK_EMAIL_LIST);
        
    } catch (error) {
        console.error('❌ Failed to send free overnight report:', error.message);
        console.log('📝 Report was still saved to file successfully');
    }
}

// Format overnight data for the prompt (free tier version)
function formatFreeOvernightDataForPrompt(overnightData) {
    const timing = getMarketTimingInfo();
    
    let dataString = `FREE TIER OVERNIGHT MARKET DATA (Zero Cost Close-to-Open Analysis):\n`;
    dataString += `Last Market Close: ${timing.lastClose}\n`;
    dataString += `Next Market Open: ${timing.nextOpen}\n`;
    dataString += `Hours Since Close: ${timing.hoursSinceClose}\n`;
    dataString += `Time to Open: ${timing.timeToOpenStr}\n`;
    dataString += `Data Quality: FREE TIER (Best available no-cost sources)\n\n`;
    
    // Futures Proxies Data
    if (Object.keys(overnightData.realFutures).length > 0) {
        dataString += "FUTURES PROXIES DATA (Free Tier):\n";
        Object.entries(overnightData.realFutures).forEach(([symbol, data]) => {
            dataString += `- ${data.name || symbol}: ${data.price} (${data.change} / ${data.changePercent}%) [${data.session}]`;
            if (data.volume) dataString += ` Vol: ${data.volume.toLocaleString()}`;
            dataString += `\n`;
        });
        dataString += "\n";
    }
    
    // ETF Data
    if (Object.keys(overnightData.extendedHoursETFs).length > 0) {
        dataString += "ETF DATA (Free Tier):\n";
        Object.entries(overnightData.extendedHoursETFs).forEach(([symbol, data]) => {
            dataString += `- ${symbol} (${data.name}): ${data.price} (${data.changePercent}%) [${data.session}]`;
            if (data.volume) dataString += ` Vol: ${data.volume.toLocaleString()}`;
            if (data.high && data.low) dataString += ` Range: ${data.low}-${data.high}`;
            dataString += `\n`;
        });
        dataString += "\n";
    }
    
    // Global Markets
    if (Object.keys(overnightData.globalMarkets).length > 0) {
        dataString += "GLOBAL MARKET PROXIES (Free Tier):\n";
        Object.entries(overnightData.globalMarkets).forEach(([name, data]) => {
            dataString += `- ${name}: ${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%)`;
            if (data.volume) dataString += ` Vol: ${(data.volume / 1e6).toFixed(0)}M`;
            dataString += `\n`;
        });
        dataString += "\n";
    }
    
    // Currency Data
    if (Object.keys(overnightData.currencyData).length > 0) {
        dataString += "OVERNIGHT CURRENCY DATA (Free Tier):\n";
        Object.entries(overnightData.currencyData).forEach(([pair, data]) => {
            dataString += `- ${pair}: ${data.rate} [${data.session}]`;
            if (data.lastUpdate) dataString += ` Updated: ${data.lastUpdate}`;
            dataString += `\n`;
        });
        dataString += "\n";
    }
    
    // Options Flow (Sample)
    if (overnightData.optionsFlow && overnightData.optionsFlow.length > 0) {
        dataString += "OPTIONS FLOW (Sample Data - Real options require paid APIs):\n";
        overnightData.optionsFlow.forEach((option, index) => {
            dataString += `${index + 1}. ${option.symbol} ${option.strike} ${option.type}: ${option.volume.toLocaleString()} contracts`;
            if (option.impliedVolatility) dataString += ` IV: ${option.impliedVolatility}%`;
            dataString += ` [${option.source}]\n`;
        });
        dataString += "\n";
    }
    
    // Overnight News
    if (overnightData.overnightNews && overnightData.overnightNews.length > 0) {
        dataString += "OVERNIGHT NEWS (Free Tier Sources):\n";
        overnightData.overnightNews.forEach((news, index) => {
            const newsTime = new Date(news.datetime * 1000).toLocaleString();
            dataString += `${index + 1}. ${news.headline} [${news.source || 'Unknown'}] (${newsTime})\n`;
            if (news.description && news.description.length > 0) {
                dataString += `   ${news.description.substring(0, 150)}...\n`;
            }
        });
        dataString += "\n";
    }
    
    // Add free tier limitations and upgrade path
    dataString += "FREE TIER LIMITATIONS & UPGRADE PATH:\n";
    dataString += `- Real-time futures data: Not available (using ETF proxies)\n`;
    dataString += `- Professional options flow: Not available (sample data provided)\n`;
    dataString += `- Institutional-grade news sentiment: Not available\n`;
    dataString += `- Unlimited API calls: Rate limited to free tiers\n`;
    dataString += `- Asian market direct data: Limited (using proxy instruments)\n`;
    dataString += `- Upgrade benefits: Real-time data, professional accuracy, unlimited calls\n\n`;
    
    dataString += "FREE TIER DATA SOURCES:\n";
    dataString += `- Alpha Vantage: ${Object.keys(overnightData.realFutures).length > 0 ? 'Active (25 calls/day)' : 'No API key'}\n`;
    dataString += `- Twelve Data: ${Object.keys(overnightData.extendedHoursETFs).length > 0 ? 'Active (800 calls/day)' : 'No API key'}\n`;
    dataString += `- Marketstack: ${Object.keys(overnightData.globalMarkets).length > 0 ? 'Active (1000 calls/month)' : 'No API key'}\n`;
    dataString += `- ExchangeRate-API: ${Object.keys(overnightData.currencyData).length > 0 ? 'Active (1500 calls/month)' : 'No API key'}\n`;
    dataString += `- News API: ${overnightData.overnightNews.length > 0 ? 'Active (100 calls/day)' : 'No API key'}\n`;
    dataString += `- Total Cost: $0/month (All free tiers)\n`;
    dataString += `- Data Refresh: Best effort within free tier limits\n\n`;
    
    return dataString;
}

// Create free tier market prompt
function createFreeOvernightMarketPrompt(overnightData) {
    const timing = getMarketTimingInfo();
    
    return `You are a financial analyst creating a comprehensive daily market summary using FREE TIER APIs only. While the data sources are limited to free tiers, provide the most accurate analysis possible with available information. Create a professional report with these sections:

${formatFreeOvernightDataForPrompt(overnightData)}

**EXECUTIVE SUMMARY**
[2-sentence overview of global market sentiment and key risk factors based on available free data]

**MARKET PROXIES ANALYSIS (Free Tier)**
Analyze using available proxy data:
- ETF proxies for major indices (SPY for S&P 500, QQQ for Nasdaq, etc.)
- Global market proxies using available instruments
- Currency movements from free forex APIs
- Cross-reference available data points for consistency
- Note limitations of proxy data vs. real-time futures
[Target: 150 words]

**US MARKET OUTLOOK**
Based on free tier data:
- Current ETF proxy performance indicating futures direction
- Available economic calendar data
- News analysis from free sources
- Any available pre-market indicators
- Limitations: Real futures data requires paid APIs
[Target: 150 words]

**GLOBAL MARKETS SUMMARY**
Using free proxy data:
- Available global market indicators
- Currency movements affecting international markets
- News affecting global sentiment
- Cross-market correlations visible in available data
[Target: 120 words]

**NEWS ANALYSIS**
From free news sources:
- Major overnight developments affecting markets
- Economic policy announcements
- Corporate news with market impact
- Geopolitical developments
- Note: AI sentiment analysis requires paid APIs
[Target: 120 words]

**SECTOR INSIGHTS**
Based on available ETF data:
- Sector performance using available ETF proxies
- Relative strength between major sectors
- Any sector-specific news or catalysts
- Limitations due to free tier data constraints
[Target: 100 words]

**CURRENCY ANALYSIS**
From free forex APIs:
- Major currency pair movements
- Any significant FX developments
- Currency impact on international markets
- Central bank communications if available
[Target: 100 words]

**TECHNICAL OVERVIEW**
Based on available price data:
- Key levels for major ETF proxies
- Technical patterns visible in available data
- Support/resistance levels
- Volume analysis where available
- Note: Professional technical analysis requires real-time data
[Target: 100 words]

**LIMITATIONS & UPGRADE PATH**
[Transparent disclosure of free tier limitations and benefits of upgrading to paid APIs]

**KEY TAKEAWAYS**
[2-sentence summary of main themes based on available free data]

**IMPORTANT FREE TIER DISCLAIMERS:**
- This analysis uses the best available free APIs
- Real-time futures data requires paid subscriptions
- Professional options flow analysis not available in free tier
- Some data may be delayed or limited in scope
- Proxy instruments used where direct data unavailable
- Upgrade to paid APIs recommended for trading decisions

Use today's date: ${new Date().toDateString()}. Be transparent about data limitations while providing valuable insights from available free sources. Focus on what CAN be determined accurately rather than speculating beyond the data quality.

This is a FREE TIER report - valuable insights using zero-cost data sources with clear limitations disclosed.`;
}

// Main function for free tier report
async function generateFreeOvernightMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log(`🆓 Generating FREE TIER OVERNIGHT MARKET REPORT (${timing.hoursSinceClose} hours since close)...`);
        console.log('💰 Using 100% free APIs - zero monthly cost!');
        
        // Fetch free overnight market data
        const overnightData = await fetchFreeOvernightMarketData();
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 3500,
            temperature: 0.3,
            messages: [{
                role: 'user',
                content: createFreeOvernightMarketPrompt(overnightData)
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });

        const report = response.data.content[0].text;
        
        // Create reports directory
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Generate filename
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `free-overnight-market-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add metadata header for free tier
        const reportWithMetadata = `${report}

---

*🆓 FREE TIER MORNING MARKET INTELLIGENCE REPORT*  
*Zero Cost Data Sources: ${Object.keys(overnightData.realFutures).length > 0 ? 'Alpha Vantage (Free)' : 'No futures data'}, ${Object.keys(overnightData.extendedHoursETFs).length > 0 ? 'Twelve Data (Free)' : 'Limited ETF data'}, ${Object.keys(overnightData.globalMarkets).length > 0 ? 'Marketstack (Free)' : 'No global data'}, ${Object.keys(overnightData.currencyData).length > 0 ? 'ExchangeRate-API (Free)' : 'No FX data'}*  
*Total Monthly Cost: $0 (All free tier APIs)*  
*Data Quality: Best available from no-cost sources with disclosed limitations*  
*Generated: ${new Date().toISOString()} | Next Market Open: ${timing.nextOpen}*  
*Upgrade Path: Consider paid APIs for real-time futures, professional options flow, and unlimited calls*
`;
        
        // Write free report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`Free tier morning market report generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`⏰ Hours since close: ${timing.hoursSinceClose}`);
        console.log(`⏰ Time to market open: ${timing.timeToOpenStr}`);
        console.log(`💰 Total API cost: $0 (100% free!)`);
        
        // Create latest free morning report
        const latestFilepath = path.join(reportsDir, 'latest-free-morning-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw data
        const rawDataPath = path.join(reportsDir, `free-morning-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(overnightData, null, 2));
        
        // Send free morning report via email
        console.log('📧 Sending FREE tier morning market report...');
        await sendFreeReportEmail(reportWithMetadata, dateStr);
        
        console.log('✅ FREE TIER MORNING MARKET REPORT COMPLETED!');
        console.log(`🆓 Zero-cost ${timing.hoursSinceClose}-hour close-to-open analysis ready`);
        console.log(`⏰ Market opens in ${timing.timeToOpenStr}`);
        console.log('💡 Consider upgrading APIs for enhanced accuracy');
        
        return {
            success: true,
            reportPath: filepath,
            dataQuality: 'Free Tier',
            totalCost: 0,
            sources: Object.keys(overnightData).length,
            timing: timing
        };
        
    } catch (error) {
        console.error('❌ Error generating free morning market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Export functions
module.exports = {
    generateFreeOvernightMarketReport,
    fetchFreeOvernightMarketData,
    getMarketTimingInfo,
    FreeAPIRateLimit,
    makeAPICall
};

// Run the free morning market report generation if called directly
if (require.main === module) {
    generateFreeOvernightMarketReport();
}
