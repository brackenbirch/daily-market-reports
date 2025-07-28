const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// API Keys - Using your existing setup
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const FIXER_API_KEY = process.env.FIXER_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const TRADING_ECONOMICS_API_KEY = process.env.TRADING_ECONOMICS_API_KEY;

// Email configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const WORK_EMAIL_LIST = process.env.WORK_EMAIL_LIST;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Helper function to get sector names
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
        'XLB': 'Materials'
    };
    return sectorMap[etf] || etf;
}

// Calculate proper close-to-open timing window
function getCloseToOpenWindow() {
    const now = new Date();
    
    // Find last market close (4:00 PM ET on last trading day)
    const lastClose = new Date();
    lastClose.setHours(16, 0, 0, 0); // 4:00 PM ET
    
    // If it's before 4 PM today, use yesterday's close
    if (now.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Skip weekends - if last close was on Friday, and it's now Monday morning
    if (lastClose.getDay() === 6) { // Saturday
        lastClose.setDate(lastClose.getDate() - 1); // Move to Friday
    } else if (lastClose.getDay() === 0) { // Sunday
        lastClose.setDate(lastClose.getDate() - 2); // Move to Friday
    }
    
    // Find next market open (9:30 AM ET)
    const nextOpen = new Date();
    nextOpen.setHours(9, 30, 0, 0);
    
    // If it's after 9:30 AM today, next open is tomorrow
    if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 30)) {
        nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    // Skip weekends for next open
    if (nextOpen.getDay() === 6) { // Saturday
        nextOpen.setDate(nextOpen.getDate() + 2); // Move to Monday
    } else if (nextOpen.getDay() === 0) { // Sunday
        nextOpen.setDate(nextOpen.getDate() + 1); // Move to Monday
    }
    
    return {
        lastClose,
        nextOpen,
        isCloseToOpenPeriod: now >= lastClose && now < nextOpen,
        hoursInWindow: Math.abs(nextOpen - lastClose) / (1000 * 60 * 60)
    };
}

// Calculate market timing information with proper close-to-open focus
function getMarketTimingInfo() {
    const window = getCloseToOpenWindow();
    const now = new Date();
    
    // Calculate hours since close
    const hoursSinceClose = Math.floor((now - window.lastClose) / (1000 * 60 * 60));
    
    // Calculate time to open
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

// FIXED: Fetch real futures data using CORRECT symbols and endpoints
async function fetchRealFuturesData() {
    const futures = {};
    
    if (!POLYGON_API_KEY) {
        console.log('❌ Polygon API key not found - CANNOT generate accurate futures data');
        return {}; // Return empty instead of fake data
    }
    
    // CORRECTED: Using proper futures symbols
    const futuresSymbols = {
        'ES': 'E-mini S&P 500 Futures',
        'NQ': 'E-mini NASDAQ Futures',
        'YM': 'E-mini Dow Futures',
        'CL': 'WTI Crude Oil Futures',
        'GC': 'Gold Futures'
    };
    
    try {
        console.log('📈 Fetching REAL futures data from Polygon...');
        
        for (const [symbol, name] of Object.entries(futuresSymbols)) {
            try {
                // FIXED: Use real-time quotes endpoint, not previous day
                const response = await axios.get(
                    `https://api.polygon.io/v2/last/trade/${symbol}1!?apikey=${POLYGON_API_KEY}`
                );
                
                if (response.data && response.data.results) {
                    const data = response.data.results;
                    
                    // Also get previous close for change calculation
                    const prevResponse = await axios.get(
                        `https://api.polygon.io/v2/aggs/ticker/${symbol}1!/prev?adjusted=true&apikey=${POLYGON_API_KEY}`
                    );
                    
                    if (prevResponse.data && prevResponse.data.results && prevResponse.data.results[0]) {
                        const prevClose = prevResponse.data.results[0].c;
                        const currentPrice = data.p;
                        const change = currentPrice - prevClose;
                        const changePercent = (change / prevClose) * 100;
                        
                        futures[symbol] = {
                            name,
                            price: currentPrice.toFixed(2),
                            change: change.toFixed(2),
                            changePercent: changePercent.toFixed(2),
                            session: 'Extended Hours',
                            volume: data.s || 'N/A',
                            timestamp: new Date(data.t).toLocaleString()
                        };
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
            } catch (error) {
                console.log(`❌ Failed to fetch ${name}: ${error.message}`);
            }
        }
        
        console.log(`✅ Fetched ${Object.keys(futures).length} real futures contracts`);
    } catch (error) {
        console.log('❌ Error fetching futures data:', error.message);
    }
    
    return futures;
}

// FIXED: Better error handling for ETFs with real-time focus
async function fetchExtendedHoursETFs() {
    const extendedData = {};
    
    if (!ALPHA_VANTAGE_API_KEY) {
        console.log('❌ Alpha Vantage API key not found - CANNOT generate accurate ETF data');
        return {};
    }
    
    const etfs = ['SPY', 'QQQ', 'DIA', 'XLF', 'XLK', 'XLE', 'XLV', 'XLI'];
    
    try {
        console.log('📊 Fetching real ETF data from Alpha Vantage...');
        for (const etf of etfs) {
            try {
                // Use intraday data for more current prices
                const response = await axios.get(
                    `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${etf}&interval=1min&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                
                if (response.data['Time Series (1min)']) {
                    const timeSeries = response.data['Time Series (1min)'];
                    const latestTime = Object.keys(timeSeries)[0];
                    const latestData = timeSeries[latestTime];
                    
                    // Get previous day close for comparison
                    const dailyResponse = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    
                    if (dailyResponse.data['Global Quote']) {
                        const quote = dailyResponse.data['Global Quote'];
                        
                        extendedData[etf] = {
                            name: getSectorName(etf),
                            price: parseFloat(latestData['4. close']).toFixed(2),
                            change: parseFloat(quote['09. change']).toFixed(2),
                            changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2),
                            session: 'Real-time',
                            volume: parseInt(latestData['5. volume']) || 0,
                            lastUpdate: latestTime
                        };
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 12000)); // Alpha Vantage rate limit (5 calls/min)
            } catch (error) {
                console.log(`❌ Failed to fetch ${etf}: ${error.message}`);
            }
        }
        
        console.log(`✅ Fetched ${Object.keys(extendedData).length} real ETFs`);
    } catch (error) {
        console.log('❌ Error fetching ETF data:', error.message);
    }
    
    return extendedData;
}

// FIXED: Asian markets with proper error handling
async function fetchAsianMarkets() {
    const asianData = {};
    
    // Try Finnhub first for international markets
    if (FINNHUB_API_KEY) {
        const asianSymbols = {
            '^N225': 'Nikkei 225',
            '^HSI': 'Hang Seng',
            '000001.SS': 'Shanghai Composite',
            '^AXJO': 'ASX 200'
        };
        
        try {
            console.log('🌏 Fetching Asian markets from Finnhub...');
            for (const [symbol, name] of Object.entries(asianSymbols)) {
                try {
                    const response = await axios.get(
                        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
                    );
                    
                    if (response.data && response.data.c) {
                        const data = response.data;
                        asianData[name] = {
                            symbol,
                            price: data.c.toFixed(2),
                            change: (data.c - data.pc).toFixed(2),
                            changePercent: (((data.c - data.pc) / data.pc) * 100).toFixed(2),
                            dayHigh: data.h.toFixed(2),
                            dayLow: data.l.toFixed(2),
                            previousClose: data.pc.toFixed(2)
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`❌ Failed to fetch ${name}: ${error.message}`);
                }
            }
            
            console.log(`✅ Fetched ${Object.keys(asianData).length} Asian markets`);
        } catch (error) {
            console.log('❌ Error fetching Asian markets:', error.message);
        }
    }
    
    return asianData;
}

// FIXED: Currency data with proper error handling
async function fetchRealCurrencyData() {
    const currencyData = {};
    
    if (!FIXER_API_KEY && !ALPHA_VANTAGE_API_KEY) {
        console.log('❌ No currency API keys found - CANNOT generate accurate FX data');
        return {};
    }
    
    // Try Fixer first
    if (FIXER_API_KEY) {
        try {
            console.log('💱 Fetching FX data from Fixer...');
            const response = await axios.get(
                `http://data.fixer.io/api/latest?access_key=${FIXER_API_KEY}&base=USD&symbols=EUR,GBP,JPY,CNY,AUD,CAD`
            );
            
            if (response.data && response.data.rates) {
                const rates = response.data.rates;
                
                currencyData['EUR/USD'] = {
                    rate: (1 / rates.EUR).toFixed(4),
                    session: 'Live',
                    lastUpdate: response.data.date
                };
                currencyData['GBP/USD'] = {
                    rate: (1 / rates.GBP).toFixed(4),
                    session: 'Live',
                    lastUpdate: response.data.date
                };
                currencyData['USD/JPY'] = {
                    rate: rates.JPY.toFixed(2),
                    session: 'Live',
                    lastUpdate: response.data.date
                };
                currencyData['USD/CNY'] = {
                    rate: rates.CNY.toFixed(4),
                    session: 'Live',
                    lastUpdate: response.data.date
                };
                
                console.log(`✅ Fetched ${Object.keys(currencyData).length} currency pairs from Fixer`);
            }
        } catch (error) {
            console.log('❌ Fixer API failed:', error.message);
        }
    }
    
    // Fallback to Alpha Vantage if Fixer fails
    if (Object.keys(currencyData).length === 0 && ALPHA_VANTAGE_API_KEY) {
        try {
            console.log('💱 Falling back to Alpha Vantage for FX...');
            const currencies = [
                { from: 'EUR', to: 'USD' },
                { from: 'GBP', to: 'USD' },
                { from: 'USD', to: 'JPY' }
            ];
            
            for (const curr of currencies) {
                const response = await axios.get(
                    `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${curr.from}&to_currency=${curr.to}&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                
                if (response.data && response.data['Realtime Currency Exchange Rate']) {
                    const rate = response.data['Realtime Currency Exchange Rate'];
                    currencyData[`${curr.from}/${curr.to}`] = {
                        rate: parseFloat(rate['5. Exchange Rate']).toFixed(4),
                        lastRefreshed: rate['6. Last Refreshed'],
                        session: 'Live'
                    };
                }
                
                await new Promise(resolve => setTimeout(resolve, 12000)); // Rate limiting
            }
            
            console.log(`✅ Fetched ${Object.keys(currencyData).length} currency pairs via Alpha Vantage`);
        } catch (error) {
            console.log('❌ Alpha Vantage FX fallback failed:', error.message);
        }
    }
    
    return currencyData;
}

// FIXED: Enhanced news with better filtering and verification
async function fetchOvernightNews() {
    const newsData = [];
    const timing = getMarketTimingInfo();
    const searchFromTime = new Date(timing.lastClose);
    
    console.log(`📰 Fetching close-to-open news (from ${searchFromTime.toLocaleString()})...`);
    
    if (!NEWS_API_KEY && !FINNHUB_API_KEY) {
        console.log('❌ No news API keys found - CANNOT generate accurate news data');
        return [];
    }
    
    // Try News API first with focused market queries
    if (NEWS_API_KEY) {
        try {
            const searchQueries = [
                'stock market OR futures OR trading',
                'Federal Reserve OR Fed OR interest rates',
                'earnings OR quarterly results',
                'trade deal OR tariff OR China trade OR EU trade',
                'breaking news market OR economic data'
            ];
            
            for (let i = 0; i < Math.min(searchQueries.length, 3); i++) { // Limit to avoid rate limits
                const query = searchQueries[i];
                try {
                    const response = await axios.get(
                        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&from=${searchFromTime.toISOString()}&apiKey=${NEWS_API_KEY}`
                    );
                    
                    if (response.data && response.data.articles) {
                        const relevantArticles = response.data.articles
                            .filter(article => {
                                const publishTime = new Date(article.publishedAt);
                                return publishTime >= searchFromTime;
                            })
                            .filter(article => {
                                const title = article.title.toLowerCase();
                                return title.includes('market') || title.includes('stock') || 
                                       title.includes('trade') || title.includes('economic') ||
                                       title.includes('fed') || title.includes('earnings');
                            })
                            .slice(0, 2)
                            .map(article => ({
                                headline: article.title,
                                datetime: Math.floor(new Date(article.publishedAt).getTime() / 1000),
                                source: article.source.name,
                                url: article.url,
                                description: article.description,
                                category: query.split(' ')[0]
                            }));
                        
                        newsData.push(...relevantArticles);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`❌ Failed to fetch news for "${query}": ${error.message}`);
                }
            }
            
            console.log(`✅ Fetched ${newsData.length} news articles from News API`);
        } catch (error) {
            console.log('❌ News API failed:', error.message);
        }
    }
    
    // Fallback to Finnhub
    if (newsData.length === 0 && FINNHUB_API_KEY) {
        try {
            console.log('📰 Falling back to Finnhub for news...');
            const response = await axios.get(
                `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`
            );
            
            if (response.data && Array.isArray(response.data)) {
                const closeTimestamp = Math.floor(searchFromTime.getTime() / 1000);
                const filteredNews = response.data
                    .filter(news => news.datetime > closeTimestamp)
                    .slice(0, 5);
                
                console.log(`✅ Fetched ${filteredNews.length} articles from Finnhub`);
                return filteredNews;
            }
        } catch (error) {
            console.log('❌ Finnhub news failed:', error.message);
        }
    }
    
    return newsData.slice(0, 8);
}

// REMOVED: All sample data generation functions - if APIs fail, return empty data

// Function to send email with the overnight report
async function sendOvernightReportEmail(reportContent, dateStr) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Setting up email transport for morning market report...');
        
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        const timing = getMarketTimingInfo();
        
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #2c3e50; border-bottom: 3px solid #d4af37; padding-bottom: 10px;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #2c3e50; margin-top: 25px;">$1</h2>')
            .replace(/^\*\*(.*?)\*\*/gm, '<h3 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; font-weight: bold;">$1</h3>')
            .replace(/^\*(.*$)/gm, '<p style="font-style: italic; color: #7f8c8d;">$1</p>')
            .replace(/^([^<\n].*$)/gm, '<p style="line-height: 1.6; margin-bottom: 10px; color: #000000;">$1</p>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${emailHtml}
                
                <div style="margin-top: 30px; padding: 20px; background-color: white; color: #2c3e50; border-radius: 5px; border: 2px solid #d4af37;">
                    <p style="margin: 0; font-weight: bold; color: #2c3e50;">MORNING MARKET INTELLIGENCE</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #000000;">Last Close: ${timing.lastClose} • Next Open: ${timing.nextOpen} • Generated by Claude AI</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `Morning Market Report - ${dateStr} - Close to Open Analysis`,
            html: emailContent,
            text: reportContent,
            priority: 'high'
        };
        
        console.log('📤 Sending morning market report...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Morning report sent successfully:', info.messageId);
        
    } catch (error) {
        console.error('❌ Failed to send overnight report:', error.message);
    }
}

// Function to fetch overnight market data with STRICT real-data requirements
async function fetchOvernightMarketData() {
    console.log('🔄 Fetching REAL overnight market data (no fake fallbacks)...');
    
    const overnightData = {
        realFutures: {},
        extendedHoursETFs: {},
        asianMarkets: {},
        currencyData: {},
        overnightNews: [],
        dataQuality: {
            futuresDataAvailable: false,
            etfDataAvailable: false,
            asianDataAvailable: false,
            currencyDataAvailable: false,
            newsDataAvailable: false
        }
    };
    
    try {
        // Fetch all data sources with proper error handling
        console.log('📊 Starting data collection from real APIs...');
        
        const futures = await fetchRealFuturesData();
        const etfs = await fetchExtendedHoursETFs();
        const asianMarkets = await fetchAsianMarkets();
        const currencies = await fetchRealCurrencyData();
        const overnightNews = await fetchOvernightNews();
        
        overnightData.realFutures = futures;
        overnightData.extendedHoursETFs = etfs;
        overnightData.asianMarkets = asianMarkets;
        overnightData.currencyData = currencies;
        overnightData.overnightNews = overnightNews;
        
        // Update data quality flags
        overnightData.dataQuality.futuresDataAvailable = Object.keys(futures).length > 0;
        overnightData.dataQuality.etfDataAvailable = Object.keys(etfs).length > 0;
        overnightData.dataQuality.asianDataAvailable = Object.keys(asianMarkets).length > 0;
        overnightData.dataQuality.currencyDataAvailable = Object.keys(currencies).length > 0;
        overnightData.dataQuality.newsDataAvailable = overnightNews.length > 0;
        
        console.log('✅ Data collection completed');
        
        // Log data quality
        const qualityScore = Object.values(overnightData.dataQuality).filter(Boolean).length;
        console.log(`📊 Data Quality Score: ${qualityScore}/5`);
        console.log(`Futures: ${overnightData.dataQuality.futuresDataAvailable ? '✅' : '❌'}`);
        console.log(`ETFs: ${overnightData.dataQuality.etfDataAvailable ? '✅' : '❌'}`);
        console.log(`Asian Markets: ${overnightData.dataQuality.asianDataAvailable ? '✅' : '❌'}`);
        console.log(`Currencies: ${overnightData.dataQuality.currencyDataAvailable ? '✅' : '❌'}`);
        console.log(`News: ${overnightData.dataQuality.newsDataAvailable ? '✅' : '❌'}`);
        
        if (qualityScore < 3) {
            console.log('⚠️  WARNING: Low data quality - report may be incomplete');
        }
        
    } catch (error) {
        console.error('❌ Error in overnight data collection:', error.message);
    }
    
    return overnightData;
}

// Format overnight data for the prompt with data quality indicators
function formatOvernightDataForPrompt(overnightData) {
    const timing = getMarketTimingInfo();
    
    let dataString = `OVERNIGHT MARKET DATA (Real-time sources only):\n`;
    dataString += `Last Market Close: ${timing.lastClose}\n`;
    dataString += `Next Market Open: ${timing.nextOpen}\n`;
    dataString += `Hours Since Close: ${timing.hoursSinceClose}\n`;
    dataString += `Time to Open: ${timing.timeToOpenStr}\n\n`;
    
    // Data quality summary
    const qualityScore = Object.values(overnightData.dataQuality).filter(Boolean).length;
    dataString += `DATA QUALITY SCORE: ${qualityScore}/5\n`;
    dataString += `Real Futures Data: ${overnightData.dataQuality.futuresDataAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}\n`;
    dataString += `Real ETF Data: ${overnightData.dataQuality.etfDataAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}\n`;
    dataString += `Asian Markets Data: ${overnightData.dataQuality.asianDataAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}\n`;
    dataString += `Currency Data: ${overnightData.dataQuality.currencyDataAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}\n`;
    dataString += `News Data: ${overnightData.dataQuality.newsDataAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}\n\n`;
    
    // Only include sections with real data
    if (Object.keys(overnightData.realFutures).length > 0) {
        dataString += "REAL-TIME FUTURES DATA:\n";
        Object.entries(overnightData.realFutures).forEach(([symbol, data]) => {
            dataString += `- ${data.name}: ${data.price} (${data.change > 0 ? '+' : ''}${data.change} / ${data.changePercent > 0 ? '+' : ''}${data.changePercent}%) [${data.session}] Updated: ${data.timestamp}\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(overnightData.extendedHoursETFs).length > 0) {
        dataString += "REAL-TIME ETF DATA:\n";
        Object.entries(overnightData.extendedHoursETFs).forEach(([symbol, data]) => {
            dataString += `- ${symbol} (${data.name}): $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%) [${data.session}] Vol: ${data.volume}\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(overnightData.asianMarkets).length > 0) {
        dataString += "ASIAN MARKETS (REAL DATA):\n";
        Object.entries(overnightData.asianMarkets).forEach(([name, data]) => {
            dataString += `- ${name}: ${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%) High: ${data.dayHigh} Low: ${data.dayLow}\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(overnightData.currencyData).length > 0) {
        dataString += "REAL-TIME CURRENCY DATA:\n";
        Object.entries(overnightData.currencyData).forEach(([pair, data]) => {
            dataString += `- ${pair}: ${data.rate} [${data.session}] Updated: ${data.lastUpdate || data.lastRefreshed}\n`;
        });
        dataString += "\n";
    }
    
    if (overnightData.overnightNews.length > 0) {
        dataString += "VERIFIED OVERNIGHT NEWS:\n";
        overnightData.overnightNews.slice(0, 5).forEach((news, index) => {
            const newsTime = new Date(news.datetime * 1000).toLocaleString();
            dataString += `${index + 1}. ${news.headline} [${news.source || 'Finnhub'}] (${newsTime})\n`;
            if (news.description && news.description.length > 0) {
                dataString += `   ${news.description.substring(0, 100)}...\n`;
            }
        });
        dataString += "\n";
    }
    
    // Warning if data is incomplete
    if (qualityScore < 3) {
        dataString += "⚠️  WARNING: Limited real-time data available. Some sections may be incomplete.\n";
        dataString += "Consider this when generating the report and indicate data limitations where appropriate.\n\n";
    }
    
    return dataString;
}

// UPDATED: Enhanced prompt with better data handling instructions
const createOvernightMarketPrompt = (overnightData) => {
    const timing = getMarketTimingInfo();
    const qualityScore = Object.values(overnightData.dataQuality).filter(Boolean).length;
    
    return `You are a financial analyst creating a comprehensive daily market summary. 

CRITICAL DATA QUALITY NOTICE:
- Data Quality Score: ${qualityScore}/5
- Only use the REAL data provided below - do NOT fabricate or estimate missing data
- If a data section is missing, clearly state "Data not available" or "Limited data"
- Focus your analysis on sections where real data is available
- Be transparent about data limitations

${formatOvernightDataForPrompt(overnightData)}

Create a professional report with these sections (ONLY include analysis for sections where you have real data):

**EXECUTIVE SUMMARY**
[2-sentence overview based on available real data - if limited data, mention this limitation]

**ASIAN MARKETS OVERNIGHT** ${overnightData.dataQuality.asianDataAvailable ? '' : '(DATA NOT AVAILABLE)'}
${overnightData.dataQuality.asianDataAvailable ? 
'Report on the real Asian market data provided above with specific closing levels and percentage changes.' : 
'Real-time Asian market data is not available. Unable to provide current Asian market analysis.'}

**EUROPEAN MARKETS SUMMARY**
Note: Real-time European market data not available in current data sources. 
European market analysis would require additional data feeds.

**US MARKET OUTLOOK** ${overnightData.dataQuality.futuresDataAvailable ? '' : '(LIMITED FUTURES DATA)'}
${overnightData.dataQuality.futuresDataAvailable ? 
'Use the real futures data provided above. Report exact futures levels and changes.' : 
'Real-time futures data not available. US market outlook limited without current futures prices.'}

**FUTURES ANALYSIS** ${overnightData.dataQuality.futuresDataAvailable ? '' : '(DATA NOT AVAILABLE)'}
${overnightData.dataQuality.futuresDataAvailable ? 
'Analyze the specific futures data provided above - ES, NQ, YM contracts with exact prices and changes.' : 
'Real-time futures data not available. Cannot provide current futures analysis.'}

**CURRENCY MARKETS** ${overnightData.dataQuality.currencyDataAvailable ? '' : '(DATA NOT AVAILABLE)'}
${overnightData.dataQuality.currencyDataAvailable ? 
'Report on the real currency data provided above with current exchange rates.' : 
'Real-time currency data not available. Cannot provide current FX analysis.'}

**OVERNIGHT NEWS ANALYSIS** ${overnightData.dataQuality.newsDataAvailable ? '' : '(LIMITED NEWS DATA)'}
${overnightData.dataQuality.newsDataAvailable ? 
'Analyze the verified news items provided above, focusing on market-moving developments.' : 
'Limited overnight news data available. News analysis may be incomplete.'}

**SECTOR PERFORMANCE** ${overnightData.dataQuality.etfDataAvailable ? '' : '(DATA NOT AVAILABLE)'}
${overnightData.dataQuality.etfDataAvailable ? 
'Use the real ETF data provided above to analyze sector performance.' : 
'Real-time ETF/sector data not available. Cannot provide current sector analysis.'}

**DATA QUALITY DISCLAIMER**
This report is based on available real-time data sources. Data quality score: ${qualityScore}/5.
${qualityScore < 3 ? 'WARNING: Limited data availability may affect report completeness.' : 'Good data coverage available for analysis.'}

**KEY TAKEAWAYS**
[Base takeaways only on sections where real data was available - be honest about limitations]

CRITICAL INSTRUCTIONS:
- Use ONLY the real data provided above
- Do NOT invent or estimate missing market prices, percentages, or news
- If a section lacks data, clearly state this limitation
- Focus analysis on areas where real data is strong
- Maintain professional tone while being transparent about data gaps
- Include specific numbers, timestamps, and percentages from the real data provided

Include today's date: ${new Date().toDateString()}.
Report generation time: ${timing.lastClose} to ${timing.nextOpen} window.`;
};

async function generateOvernightMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log(`🌙 Generating ACCURATE OVERNIGHT MARKET REPORT (${timing.hoursSinceClose} hours since close)...`);
        
        // Fetch real overnight market data (no fake fallbacks)
        const overnightData = await fetchOvernightMarketData();
        
        // Check data quality before proceeding
        const qualityScore = Object.values(overnightData.dataQuality).filter(Boolean).length;
        
        if (qualityScore === 0) {
            console.log('❌ CRITICAL ERROR: No real market data available from any source');
            console.log('Cannot generate accurate report without real data. Please check API keys and connections.');
            return;
        }
        
        if (qualityScore < 2) {
            console.log('⚠️  WARNING: Very limited real data available. Report will have significant gaps.');
        }
        
        console.log('🤖 Generating report with Claude (using real data only)...');
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.1, // Lower temperature for more factual reporting
            messages: [{
                role: 'user',
                content: createOvernightMarketPrompt(overnightData)
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
        const filename = `accurate-market-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add metadata header with data quality info
        const reportWithMetadata = `# Accurate Market Report - ${dateStr}

**Data Quality Score: ${qualityScore}/5**
**Available Data Sources:**
- Futures: ${overnightData.dataQuality.futuresDataAvailable ? '✅ Real-time' : '❌ Not available'}
- ETFs: ${overnightData.dataQuality.etfDataAvailable ? '✅ Real-time' : '❌ Not available'}
- Asian Markets: ${overnightData.dataQuality.asianDataAvailable ? '✅ Real-time' : '❌ Not available'}
- Currencies: ${overnightData.dataQuality.currencyDataAvailable ? '✅ Real-time' : '❌ Not available'}
- News: ${overnightData.dataQuality.newsDataAvailable ? '✅ Available' : '❌ Not available'}

---

${report}

---

*Report generated: ${new Date().toLocaleString()}*  
*Hours since market close: ${timing.hoursSinceClose}*  
*Time to market open: ${timing.timeToOpenStr}*  
*API Sources: Polygon, Alpha Vantage, Finnhub, Fixer, News API*  
*No synthetic or sample data used - real sources only*
`;
        
        // Write report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`✅ Accurate market report generated: ${filename}`);
        console.log(`📊 Report quality: ${qualityScore}/5 data sources`);
        console.log(`📄 Report length: ${report.length} characters`);
        
        // Create latest report symlink
        const latestFilepath = path.join(reportsDir, 'latest-accurate-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw data for verification
        const rawDataPath = path.join(reportsDir, `raw-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(overnightData, null, 2));
        
        // Send email only if we have decent data quality
        if (qualityScore >= 2) {
            console.log('📧 Sending accurate market report...');
            await sendOvernightReportEmail(reportWithMetadata, dateStr);
        } else {
            console.log('⚠️  Skipping email due to low data quality');
        }
        
        console.log('\n✅ ACCURATE MARKET REPORT COMPLETED!');
        console.log(`Data Quality: ${qualityScore}/5`);
        console.log(`Hours since close: ${timing.hoursSinceClose}`);
        console.log(`Market opens in: ${timing.timeToOpenStr}`);
        
        // API Status Summary
        console.log('\n🔑 API STATUS VERIFICATION:');
        console.log(`Polygon (Futures): ${overnightData.dataQuality.futuresDataAvailable ? '✅ Working' : '❌ Failed/Missing'}`);
        console.log(`Alpha Vantage (ETFs): ${overnightData.dataQuality.etfDataAvailable ? '✅ Working' : '❌ Failed/Missing'}`);
        console.log(`Finnhub (Asian Markets): ${overnightData.dataQuality.asianDataAvailable ? '✅ Working' : '❌ Failed/Missing'}`);
        console.log(`Fixer/Alpha Vantage (FX): ${overnightData.dataQuality.currencyDataAvailable ? '✅ Working' : '❌ Failed/Missing'}`);
        console.log(`News APIs: ${overnightData.dataQuality.newsDataAvailable ? '✅ Working' : '❌ Failed/Missing'}`);
        
        // Recommendations for improvement
        console.log('\n💡 RECOMMENDATIONS:');
        if (!overnightData.dataQuality.futuresDataAvailable) {
            console.log('- Check Polygon API key and ensure futures data subscription');
        }
        if (!overnightData.dataQuality.etfDataAvailable) {
            console.log('- Verify Alpha Vantage API key and rate limits');
        }
        if (!overnightData.dataQuality.asianDataAvailable) {
            console.log('- Check Finnhub API key for international market access');
        }
        if (!overnightData.dataQuality.currencyDataAvailable) {
            console.log('- Verify Fixer API key or Alpha Vantage currency access');
        }
        if (!overnightData.dataQuality.newsDataAvailable) {
            console.log('- Check News API or Finnhub API keys and rate limits');
        }
        
        if (qualityScore === 5) {
            console.log('🎉 Excellent! All data sources working perfectly.');
        }
        
    } catch (error) {
        console.error('❌ Error generating accurate market report:', error.response?.data || error.message);
        
        // Log specific API errors for debugging
        if (error.response?.status === 401) {
            console.log('🔑 Authentication Error - Check your API keys');
        } else if (error.response?.status === 429) {
            console.log('⏰ Rate Limit Error - Too many API requests');
        } else if (error.response?.status === 403) {
            console.log('🚫 Access Forbidden - Check API subscription/permissions');
        }
        
        process.exit(1);
    }
}

// Verification function to test all APIs before running main report
async function verifyAPIConnections() {
    console.log('🔍 Verifying API connections...\n');
    
    const results = {
        anthropic: false,
        polygon: false,
        alphaVantage: false,
        finnhub: false,
        fixer: false,
        newsAPI: false
    };
    
    // Test Anthropic
    if (ANTHROPIC_API_KEY) {
        try {
            await axios.post(ANTHROPIC_API_URL, {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 10,
                messages: [{role: 'user', content: 'Hello'}]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                }
            });
            results.anthropic = true;
            console.log('✅ Anthropic API: Working');
        } catch (error) {
            console.log('❌ Anthropic API: Failed -', error.response?.status || error.message);
        }
    } else {
        console.log('❌ Anthropic API: No API key');
    }
    
    // Test Polygon
    if (POLYGON_API_KEY) {
        try {
            await axios.get(`https://api.polygon.io/v2/last/trade/ES1!?apikey=${POLYGON_API_KEY}`);
            results.polygon = true;
            console.log('✅ Polygon API: Working');
        } catch (error) {
            console.log('❌ Polygon API: Failed -', error.response?.status || error.message);
        }
    } else {
        console.log('❌ Polygon API: No API key');
    }
    
    // Test Alpha Vantage
    if (ALPHA_VANTAGE_API_KEY) {
        try {
            const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${ALPHA_VANTAGE_API_KEY}`);
            if (response.data['Global Quote']) {
                results.alphaVantage = true;
                console.log('✅ Alpha Vantage API: Working');
            } else {
                console.log('❌ Alpha Vantage API: Invalid response');
            }
        } catch (error) {
            console.log('❌ Alpha Vantage API: Failed -', error.response?.status || error.message);
        }
    } else {
        console.log('❌ Alpha Vantage API: No API key');
    }
    
    // Test Finnhub
    if (FINNHUB_API_KEY) {
        try {
            await axios.get(`https://finnhub.io/api/v1/quote?symbol=^N225&token=${FINNHUB_API_KEY}`);
            results.finnhub = true;
            console.log('✅ Finnhub API: Working');
        } catch (error) {
            console.log('❌ Finnhub API: Failed -', error.response?.status || error.message);
        }
    } else {
        console.log('❌ Finnhub API: No API key');
    }
    
    // Test Fixer
    if (FIXER_API_KEY) {
        try {
            const response = await axios.get(`http://data.fixer.io/api/latest?access_key=${FIXER_API_KEY}&base=USD&symbols=EUR`);
            if (response.data && response.data.rates) {
                results.fixer = true;
                console.log('✅ Fixer API: Working');
            } else {
                console.log('❌ Fixer API: Invalid response');
            }
        } catch (error) {
            console.log('❌ Fixer API: Failed -', error.response?.status || error.message);
        }
    } else {
        console.log('❌ Fixer API: No API key');
    }
    
    // Test News API
    if (NEWS_API_KEY) {
        try {
            const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&category=business&pageSize=1&apiKey=${NEWS_API_KEY}`);
            if (response.data && response.data.articles) {
                results.newsAPI = true;
                console.log('✅ News API: Working');
            } else {
                console.log('❌ News API: Invalid response');
            }
        } catch (error) {
            console.log('❌ News API: Failed -', error.response?.status || error.message);
        }
    } else {
        console.log('❌ News API: No API key');
    }
    
    const workingAPIs = Object.values(results).filter(Boolean).length;
    console.log(`\n📊 API Summary: ${workingAPIs}/6 APIs working`);
    
    if (!results.anthropic) {
        console.log('⚠️  CRITICAL: Anthropic API required for report generation');
        return false;
    }
    
    if (workingAPIs < 3) {
        console.log('⚠️  WARNING: Limited API access may result in incomplete reports');
    }
    
    return workingAPIs >= 2; // Minimum: Anthropic + 1 data source
}

// Run the morning market report generation with verification
if (require.main === module) {
    console.log('🚀 Starting Accurate Market Report Generator\n');
    
    verifyAPIConnections().then(canProceed => {
        if (canProceed) {
            console.log('\n✅ Proceeding with report generation...\n');
            generateOvernightMarketReport();
        } else {
            console.log('\n❌ Cannot proceed - insufficient API access');
            console.log('Please check your API keys and try again');
            process.exit(1);
        }
    });
}

module.exports = {
    generateOvernightMarketReport,
    fetchOvernightMarketData,
    getMarketTimingInfo,
    verifyAPIConnections
};
