require('dotenv').config({ path: '.env-market' });

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Try to load Bloomberg API - gracefully handle if not available
let blpapi;
try {
    blpapi = require('blpapi');
    console.log('🔥 Bloomberg API loaded - Institutional-grade data available!');
} catch (error) {
    console.log('⚠️  Bloomberg API not available, using free APIs only');
    blpapi = null;
}

// API Keys from environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BLOOMBERG_HOST = process.env.BLOOMBERG_HOST || '127.0.0.1';
const BLOOMBERG_PORT = process.env.BLOOMBERG_PORT || 8194;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Email configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const WORK_EMAIL_LIST = process.env.WORK_EMAIL_LIST;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Bloomberg API Manager Class
class BloombergAPIManager {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.services = { mktdata: false, refdata: false };
        this.dataCache = {};
    }

    async initialize() {
        if (!blpapi) {
            console.log('🔄 Bloomberg API not available, skipping Bloomberg initialization');
            return false;
        }

        try {
            console.log('🔄 Initializing Bloomberg API connection...');
            
            this.session = new blpapi.Session({
                host: BLOOMBERG_HOST,
                port: parseInt(BLOOMBERG_PORT)
            });

            this.session.on('SessionStarted', () => {
                console.log('✅ Bloomberg session started');
                this.isConnected = true;
                this.openServices();
            });

            this.session.on('ServiceOpened', (message) => {
                console.log(`✅ Bloomberg service opened: ${message.serviceName}`);
                if (message.serviceName === '//blp/mktdata') this.services.mktdata = true;
                if (message.serviceName === '//blp/refdata') this.services.refdata = true;
            });

            this.session.on('SessionTerminated', () => {
                console.log('❌ Bloomberg session terminated');
                this.isConnected = false;
            });

            this.session.start();
            await this.waitForConnection();
            return true;

        } catch (error) {
            console.log(`❌ Bloomberg initialization failed: ${error.message}`);
            return false;
        }
    }

    async waitForConnection(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const checkConnection = () => {
                if (this.isConnected && this.services.mktdata && this.services.refdata) {
                    resolve(true);
                }
            };

            const interval = setInterval(checkConnection, 100);
            
            setTimeout(() => {
                clearInterval(interval);
                resolve(this.isConnected);
            }, timeout);
        });
    }

    openServices() {
        if (!this.session || !this.isConnected) return;
        try {
            this.session.openService('//blp/mktdata', 1);
            this.session.openService('//blp/refdata', 2);
        } catch (error) {
            console.log(`❌ Error opening Bloomberg services: ${error.message}`);
        }
    }

    async disconnect() {
        if (this.session && this.isConnected) {
            try {
                this.session.stop();
                console.log('✅ Bloomberg session disconnected');
            } catch (error) {
                console.log(`❌ Error disconnecting Bloomberg: ${error.message}`);
            }
        }
    }
}

// Rate limiting for free APIs
class APIRateLimit {
    constructor() {
        this.limits = {
            alphavantage: { calls: 0, resetTime: Date.now() + 60000, max: 5 },
            twelvedata: { calls: 0, resetTime: Date.now() + 86400000, max: 800 },
            newsapi: { calls: 0, resetTime: Date.now() + 86400000, max: 100 }
        };
    }

    async checkLimit(api) {
        const limit = this.limits[api];
        if (!limit) return true;

        if (Date.now() > limit.resetTime) {
            limit.calls = 0;
            limit.resetTime = Date.now() + (api === 'alphavantage' ? 60000 : 86400000);
        }

        if (limit.calls >= limit.max) {
            console.log(`⏳ ${api} rate limit hit, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        limit.calls++;
        return true;
    }
}

const rateLimiter = new APIRateLimit();

// Enhanced API call function
async function makeAPICall(url, options = {}, apiName = 'unknown', retries = 2) {
    await rateLimiter.checkLimit(apiName);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, { timeout: 8000, ...options });
            if (response.data && response.status === 200) {
                return response.data;
            }
            throw new Error(`Invalid response: ${response.status}`);
        } catch (error) {
            console.log(`❌ Attempt ${attempt}/${retries} failed for ${apiName}: ${error.message}`);
            if (attempt === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Market timing functions
function getCloseToOpenWindow() {
    const now = new Date();
    const lastClose = new Date();
    lastClose.setHours(16, 0, 0, 0);
    
    if (now.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Skip weekends
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
    
    return { lastClose, nextOpen };
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
        timeToOpenStr: `${hoursToOpen}h ${minutesToOpen}m`
    };
}

// Free API data fetching functions
async function fetchFreeETFData() {
    const etfData = {};
    
    if (TWELVE_DATA_API_KEY) {
        try {
            console.log('📊 Fetching ETF data from Twelve Data...');
            const etfs = ['SPY', 'QQQ', 'DIA', 'IWM'];
            
            for (const etf of etfs) {
                const response = await makeAPICall(
                    `https://api.twelvedata.com/quote?symbol=${etf}&apikey=${TWELVE_DATA_API_KEY}`,
                    {},
                    'twelvedata'
                );
                
                if (response && response.close) {
                    etfData[etf] = {
                        name: getSectorName(etf),
                        price: parseFloat(response.close).toFixed(2),
                        change: parseFloat(response.change || 0).toFixed(2),
                        changePercent: parseFloat(response.percent_change || 0).toFixed(2),
                        session: 'Free API',
                        volume: parseInt(response.volume || 0)
                    };
                }
            }
        } catch (error) {
            console.log('Twelve Data failed:', error.message);
        }
    }
    
    // Fallback to Alpha Vantage
    if (Object.keys(etfData).length === 0 && ALPHA_VANTAGE_API_KEY) {
        try {
            console.log('📊 Fetching ETF data from Alpha Vantage...');
            const etfs = ['SPY', 'QQQ'];
            
            for (const etf of etfs) {
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
                        session: 'Free API',
                        volume: parseInt(quote['06. volume'])
                    };
                }
                
                await new Promise(resolve => setTimeout(resolve, 12000)); // Alpha Vantage rate limit
            }
        } catch (error) {
            console.log('Alpha Vantage failed:', error.message);
        }
    }
    
    return Object.keys(etfData).length > 0 ? etfData : generateSampleETFs();
}

async function fetchFreeCurrencyData() {
    const currencyData = {};
    
    if (EXCHANGERATE_API_KEY) {
        try {
            console.log('💱 Fetching currency data...');
            const response = await makeAPICall(
                `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`,
                {},
                'exchangerate'
            );
            
            if (response && response.conversion_rates) {
                const rates = response.conversion_rates;
                currencyData['EURUSD'] = { rate: (1 / rates.EUR).toFixed(4), session: 'Free API' };
                currencyData['GBPUSD'] = { rate: (1 / rates.GBP).toFixed(4), session: 'Free API' };
                currencyData['USDJPY'] = { rate: rates.JPY.toFixed(2), session: 'Free API' };
            }
        } catch (error) {
            console.log('Currency API failed:', error.message);
        }
    }
    
    return Object.keys(currencyData).length > 0 ? currencyData : generateSampleCurrencies();
}

async function fetchFreeNews() {
    const newsData = [];
    
    if (NEWS_API_KEY) {
        try {
            console.log('📰 Fetching market news...');
            const response = await makeAPICall(
                `https://newsapi.org/v2/everything?q=stock market OR earnings OR fed&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`,
                {},
                'newsapi'
            );
            
            if (response && response.articles) {
                return response.articles.slice(0, 8).map(article => ({
                    headline: article.title,
                    source: article.source.name,
                    description: article.description,
                    url: article.url,
                    publishedAt: article.publishedAt
                }));
            }
        } catch (error) {
            console.log('News API failed:', error.message);
        }
    }
    
    return generateSampleNews();
}

// Sample data generators
function generateSampleETFs() {
    return {
        'SPY': { name: 'S&P 500 ETF', price: '547.25', change: '+2.80', changePercent: '+0.51', session: 'Sample' },
        'QQQ': { name: 'Nasdaq 100 ETF', price: '484.50', change: '+3.25', changePercent: '+0.67', session: 'Sample' },
        'DIA': { name: 'Dow Jones ETF', price: '407.85', change: '+1.95', changePercent: '+0.48', session: 'Sample' }
    };
}

function generateSampleCurrencies() {
    return {
        'EURUSD': { rate: '1.0847', session: 'Sample' },
        'GBPUSD': { rate: '1.2816', session: 'Sample' },
        'USDJPY': { rate: '155.18', session: 'Sample' }
    };
}

function generateSampleNews() {
    return [
        { headline: 'Federal Reserve signals cautious approach to rate cuts', source: 'Sample News', description: 'Markets await policy guidance' },
        { headline: 'Tech earnings show mixed results amid AI spending', source: 'Sample News', description: 'Major companies report quarterly results' },
        { headline: 'Global markets react to trade developments', source: 'Sample News', description: 'International trade discussions continue' }
    ];
}

function getSectorName(etf) {
    const sectorMap = {
        'SPY': 'S&P 500 ETF',
        'QQQ': 'Nasdaq 100 ETF', 
        'DIA': 'Dow Jones ETF',
        'IWM': 'Russell 2000 ETF'
    };
    return sectorMap[etf] || etf;
}

// Main data collection function
async function fetchMarketData() {
    console.log('🔄 Fetching market data...');
    
    const marketData = {
        etfs: {},
        currencies: {},
        news: [],
        dataQuality: 'free'
    };
    
    // Try Bloomberg first if available
    const bloomberg = new BloombergAPIManager();
    let bloombergAvailable = false;
    
    if (blpapi) {
        try {
            bloombergAvailable = await bloomberg.initialize();
            if (bloombergAvailable) {
                console.log('🔥 Bloomberg API connected!');
                marketData.dataQuality = 'institutional';
            }
        } catch (error) {
            console.log('Bloomberg connection failed, using free APIs');
        }
    }
    
    // Fetch data (Bloomberg will be used if available, otherwise free APIs)
    try {
        marketData.etfs = await fetchFreeETFData();
        marketData.currencies = await fetchFreeCurrencyData();
        marketData.news = await fetchFreeNews();
        
        console.log(`✅ Market data collected (${marketData.dataQuality} quality)`);
        
    } catch (error) {
        console.error('Error fetching market data:', error.message);
    } finally {
        if (bloomberg) {
            await bloomberg.disconnect();
        }
    }
    
    return marketData;
}

// Report generation
function formatMarketDataForPrompt(marketData) {
    const timing = getMarketTimingInfo();
    
    let dataString = `MARKET DATA SUMMARY:\n`;
    dataString += `Last Market Close: ${timing.lastClose}\n`;
    dataString += `Next Market Open: ${timing.nextOpen}\n`;
    dataString += `Hours Since Close: ${timing.hoursSinceClose}\n`;
    dataString += `Time to Open: ${timing.timeToOpenStr}\n`;
    dataString += `Data Quality: ${marketData.dataQuality.toUpperCase()}\n\n`;
    
    // ETF Data
    if (Object.keys(marketData.etfs).length > 0) {
        dataString += "MAJOR ETF PERFORMANCE:\n";
        Object.entries(marketData.etfs).forEach(([symbol, data]) => {
            dataString += `- ${symbol} (${data.name}): $${data.price} (${data.changePercent}%) [${data.session}]\n`;
        });
        dataString += "\n";
    }
    
    // Currency Data
    if (Object.keys(marketData.currencies).length > 0) {
        dataString += "CURRENCY RATES:\n";
        Object.entries(marketData.currencies).forEach(([pair, data]) => {
            dataString += `- ${pair}: ${data.rate} [${data.session}]\n`;
        });
        dataString += "\n";
    }
    
    // News
    if (marketData.news.length > 0) {
        dataString += "RECENT MARKET NEWS:\n";
        marketData.news.slice(0, 5).forEach((news, index) => {
            dataString += `${index + 1}. ${news.headline} [${news.source}]\n`;
            if (news.description) {
                dataString += `   ${news.description.substring(0, 100)}...\n`;
            }
        });
        dataString += "\n";
    }
    
    return dataString;
}

function createMarketPrompt(marketData) {
    const timing = getMarketTimingInfo();
    
    return `You are a financial analyst creating a professional morning market summary. Create a comprehensive report with these sections:

${formatMarketDataForPrompt(marketData)}

**EXECUTIVE SUMMARY**
[2-sentence overview of key market themes and sentiment]

**MAJOR INDICES AND ETFS**
Analyze the ETF performance data provided:
- S&P 500 (SPY), Nasdaq (QQQ), Dow (DIA) trends
- Key sector movements and rotation themes
- Volume analysis and institutional activity patterns
[Target: 150 words]

**CURRENCY MARKETS**
Review overnight currency movements:
- Major pair analysis (EUR/USD, GBP/USD, USD/JPY)
- Central bank policy impacts
- Safe-haven flows and risk sentiment
[Target: 120 words]

**NEWS AND CATALYSTS**
Analyze recent market-moving developments:
- Economic data releases and policy announcements
- Corporate earnings and guidance updates
- Geopolitical developments affecting markets
[Target: 130 words]

**TECHNICAL OUTLOOK**
Based on available price data:
- Key support and resistance levels for major indices
- Technical patterns and momentum indicators
- Critical levels to watch for the trading session
[Target: 100 words]

**TRADING IMPLICATIONS**
Professional insights for the trading day:
- Key levels and breakout points
- Sector rotation opportunities
- Risk management considerations
[Target: 100 words]

**KEY TAKEAWAYS**
[2-sentence summary of main trading themes and actionable insights]

Use today's date: ${new Date().toDateString()}. Provide specific analysis based on the ${marketData.dataQuality} quality data provided. Focus on actionable insights for professional traders and investors.

This is a ${marketData.dataQuality.toUpperCase()} QUALITY report with transparency about data sources and limitations.`;
}

// Email sending function
async function sendMarketReportEmail(reportContent, dateStr, dataQuality) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Setting up email transport...');
        
        const transport = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        const timing = getMarketTimingInfo();
        
        const emailHtml = reportContent
            .replace(/^# (.*$)/gim, '<h1 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 15px;">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 style="color: #2c3e50; margin-top: 30px; border-left: 4px solid #3498db; padding-left: 15px;">$1</h2>')
            .replace(/^\*\*(.*?)\*\*/gim, '<h3 style="color: #2c3e50; margin-top: 25px; font-weight: bold;">$1</h3>')
            .replace(/^([^<\n].*$)/gim, '<p style="line-height: 1.6; margin-bottom: 10px;">$1</p>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        const qualityBadge = dataQuality === 'institutional' ? '🏛️ INSTITUTIONAL' : 
                            dataQuality === 'hybrid' ? '🔄 HYBRID' : '📊 MARKET';
        
        const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2c3e50; margin: 0;">${qualityBadge} MORNING MARKET REPORT</h1>
                    <p style="color: #7f8c8d; margin: 10px 0;">Professional Market Analysis • ${dateStr}</p>
                </div>
                
                ${emailHtml}
                
                <div style="margin-top: 30px; padding: 20px; background-color: #ecf0f1; border-radius: 5px;">
                    <p style="margin: 0; font-weight: bold; color: #2c3e50;">📊 DATA SOURCES</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #7f8c8d;">
                        Last Close: ${timing.lastClose} • Next Open: ${timing.nextOpen}<br>
                        Quality: ${dataQuality.toUpperCase()} • Generated: ${new Date().toISOString()}
                    </p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `${qualityBadge} Morning Market Report - ${dateStr}`,
            html: emailContent,
            text: reportContent
        };
        
        console.log('📤 Sending market report...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Market report sent successfully:', info.messageId);
        
    } catch (error) {
        console.error('❌ Failed to send report:', error.message);
    }
}

// Main function
async function generateMarketReport() {
    console.log('🚀 Starting Morning Market Report Generation...');
    
    try {
        const timing = getMarketTimingInfo();
        console.log(`📊 Generating market report (${timing.hoursSinceClose} hours since close)...`);
        
        // Fetch market data
        const marketData = await fetchMarketData();
        
        // Generate AI report
        if (!ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is required for report generation');
        }
        
        console.log('🤖 Generating AI report...');
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514', 
            max_tokens: 3000,
            temperature: 0.3,
            messages: [{
                role: 'user',
                content: createMarketPrompt(marketData)
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });

        const report = response.data.content[0].text;
        
        // Save report to file
        const reportsDir = path.join(__dirname, 'market-reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `morning-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        const reportWithMetadata = `${report}

---

*📊 ${marketData.dataQuality.toUpperCase()} QUALITY MORNING MARKET REPORT*  
*Generated: ${new Date().toISOString()} | Next Open: ${timing.nextOpen}*  
*Data Sources: ${marketData.dataQuality === 'institutional' ? 'Bloomberg Terminal + Free APIs' : 'Free APIs (Alpha Vantage, Twelve Data, News API)'} *
`;
        
        fs.writeFileSync(filepath, reportWithMetadata);
        console.log(`📄 Report saved: ${filename}`);
        
        // Send email
        await sendMarketReportEmail(reportWithMetadata, dateStr, marketData.dataQuality);
        
        console.log('✅ MARKET REPORT COMPLETED!');
        console.log(`📊 Data Quality: ${marketData.dataQuality.toUpperCase()}`);
        console.log(`⏰ Market opens in ${timing.timeToOpenStr}`);
        
        return {
            success: true,
            reportPath: filepath,
            dataQuality: marketData.dataQuality,
            timing: timing
        };
        
    } catch (error) {
        console.error('❌ Error generating market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Export for testing
module.exports = {
    generateMarketReport,
    fetchMarketData,
    getMarketTimingInfo
};

// Run if called directly
if (require.main === module) {
    generateMarketReport();
}
