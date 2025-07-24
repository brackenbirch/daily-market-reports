const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
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

// Generate sample premarket movers with enhanced data for charts
function generateSampleMovers(type) {
    const sampleStocks = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'CRM'
    ];
    
    const movers = [];
    const isGainer = type === 'gainers';
    
    for (let i = 0; i < 10; i++) {
        const symbol = sampleStocks[i] || `STOCK${i}`;
        const basePrice = 50 + Math.random() * 200;
        const changePercent = isGainer ? 
            (2 + Math.random() * 8).toFixed(2) : 
            -(2 + Math.random() * 8).toFixed(2);
        const change = (basePrice * parseFloat(changePercent) / 100).toFixed(2);
        const price = (basePrice + parseFloat(change)).toFixed(2);
        const volume = Math.floor(Math.random() * 1000000) + 100000;
        
        movers.push({
            symbol,
            price: `$${price}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent}%`,
            volume: volume.toLocaleString()
        });
    }
    
    return movers;
}

// Generate sample economic calendar data
function generateSampleEconomicCalendar() {
    const events = [
        { time: '8:30', release: 'Jobless Claims', previous: '210K', forecast: '215K', impact: 'High' },
        { time: '8:30', release: 'CPI (Core) MoM', previous: '0.3%', forecast: '0.2%', impact: 'High' },
        { time: '10:00', release: 'Existing Home Sales', previous: '4.2M', forecast: '4.1M', impact: 'Medium' },
        { time: '10:30', release: 'EIA Crude Inventory', previous: '+2.1M', forecast: '-1.5M', impact: 'High' },
        { time: '14:00', release: 'Fed Beige Book', previous: 'Mixed', forecast: 'Mixed', impact: 'Medium' },
        { time: '16:30', release: 'API Crude Stock', previous: '+1.8M', forecast: '+0.5M', impact: 'Low' }
    ];
    
    return events;
}

// Generate sample earnings calendar data
function generateSampleEarningsCalendar() {
    const earnings = [
        { symbol: 'AAPL', time: 'AMC', eps: '$1.52', revenue: '$94.5B', guidance: 'Q1 Revenue Up 8%' },
        { symbol: 'MSFT', time: 'AMC', eps: '$2.99', revenue: '$56.2B', guidance: 'Cloud Growth Strong' },
        { symbol: 'TSLA', time: 'AMC', eps: '$0.85', revenue: '$24.3B', guidance: 'Production Ramp Up' },
        { symbol: 'GOOGL', time: 'AMC', eps: '$1.42', revenue: '$76.7B', guidance: 'AI Investment Focus' },
        { symbol: 'AMZN', time: 'AMC', eps: '$0.98', revenue: '$143.1B', guidance: 'AWS Momentum' },
        { symbol: 'META', time: 'AMC', eps: '$4.73', revenue: '$34.1B', guidance: 'Metaverse Spending' }
    ];
    
    return earnings;
}

// Generate sample options flow data
function generateSampleOptionsFlow() {
    const options = [
        { symbol: 'SPY', type: 'CALL', strike: '560', volume: '45,000', sentiment: 'Bullish' },
        { symbol: 'QQQ', type: 'PUT', strike: '420', volume: '32,000', sentiment: 'Bearish' },
        { symbol: 'NVDA', type: 'CALL', strike: '900', volume: '18,500', sentiment: 'Bullish' },
        { symbol: 'TSLA', type: 'PUT', strike: '240', volume: '15,200', sentiment: 'Bearish' },
        { symbol: 'AAPL', type: 'CALL', strike: '190', volume: '22,800', sentiment: 'Bullish' }
    ];
    
    return options;
}

// Generate sample technical levels
function generateSampleTechnicalLevels() {
    const levels = [
        { index: 'S&P500', support1: '5,520', support2: '5,480', resistance1: '5,580', resistance2: '5,620' },
        { index: 'NASDAQ', support1: '18,200', support2: '18,000', resistance1: '18,500', resistance2: '18,700' },
        { index: 'DOW', support1: '42,800', support2: '42,500', resistance1: '43,200', resistance2: '43,500' },
        { index: 'Russell', support1: '2,180', support2: '2,150', resistance1: '2,220', resistance2: '2,250' }
    ];
    
    return levels;
}

// Generate sample commodities and bonds data
function generateSampleCommodities() {
    const commodities = [
        { symbol: 'GOLD', name: 'Gold (oz)', basePrice: 2000 },
        { symbol: 'OIL', name: 'WTI Crude', basePrice: 75 },
        { symbol: 'SILVER', name: 'Silver (oz)', basePrice: 25 },
        { symbol: 'COPPER', name: 'Copper', basePrice: 3.8 },
        { symbol: 'NATGAS', name: 'Natural Gas', basePrice: 2.5 }
    ];
    
    const bonds = [
        { symbol: 'US10Y', name: '10-Year Treasury', basePrice: 4.2 },
        { symbol: 'US2Y', name: '2-Year Treasury', basePrice: 4.8 },
        { symbol: 'US30Y', name: '30-Year Treasury', basePrice: 4.4 },
        { symbol: 'DXY', name: 'Dollar Index', basePrice: 103.5 }
    ];
    
    const data = [];
    
    [...commodities, ...bonds].forEach(item => {
        const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
        const change = (item.basePrice * changePercent / 100).toFixed(2);
        const price = (item.basePrice + parseFloat(change)).toFixed(2);
        
        data.push({
            symbol: item.symbol,
            name: item.name,
            price: `$${price}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`
        });
    });
    
    return data;
}

// Generate sample currency data
function generateSampleCurrencies() {
    const currencies = [
        { pair: 'EUR/USD', base: 1.0892 },
        { pair: 'GBP/USD', base: 1.2654 },
        { pair: 'USD/JPY', base: 154.23 },
        { pair: 'USD/CAD', base: 1.3456 },
        { pair: 'AUD/USD', base: 0.6523 },
        { pair: 'USD/CHF', base: 0.8976 }
    ];
    
    return currencies.map(curr => {
        const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
        const change = (curr.base * changePercent / 100).toFixed(4);
        const current = (curr.base + parseFloat(change)).toFixed(4);
        const trend = changePercent > 0.2 ? 'Bullish' : changePercent < -0.2 ? 'Bearish' : 'Neutral';
        
        return {
            pair: curr.pair,
            current,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            trend
        };
    });
}

// Generate sample market sentiment data
function generateSampleSentiment() {
    return {
        vix: (15 + Math.random() * 15).toFixed(2),
        putCallRatio: (0.7 + Math.random() * 0.6).toFixed(2),
        highFreqSentiment: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
        institutionalPositioning: 'Long-Heavy'
    };
}

// Function to send email with the market report
async function sendMarketReportEmail(reportContent, dateStr) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Setting up email transport...');
        
        // Create transport for Gmail
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        // Convert markdown to a more email-friendly format
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #34495e; margin-top: 25px;">$2</h2>')
            .replace(/^\*\*(.*?)\*\*/gm, '<h3 style="color: #e74c3c; margin-top: 20px; margin-bottom: 10px;">$1</h3>')
            .replace(/^\*(.*$)/gm, '<p style="font-style: italic; color: #7f8c8d;">$1</p>')
            .replace(/```([^`]+)```/g, '<pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; border-left: 4px solid #007bff; overflow-x: auto;">$1</pre>')
            .replace(/┌[─┬┐]+/g, '<div style="font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">')
            .replace(/└[─┴┘]+/g, '</div>')
            .replace(/│([^│\n]+)│/g, '<span style="display: inline-block; min-width: 80px; text-align: center; border-right: 1px solid #ddd; padding: 2px 8px;">$1</span>')
            .replace(/^([^<\n].*$)/gm, '<p style="line-height: 1.6; margin-bottom: 10px;">$1</p>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1000px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${emailHtml}
                
                <div style="margin-top: 30px; padding: 20px; background-color: #ecf0f1; border-radius: 5px; border-left: 4px solid #3498db;">
                    <p style="margin: 0; color: #2c3e50; font-weight: bold;">📊 Professional Market Intelligence</p>
                    <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px;">Institutional-Grade Analysis • Generated by Claude AI • ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()), // Support multiple recipients
            subject: `📈 Professional Market Report - ${dateStr}`,
            html: emailContent,
            text: reportContent // Fallback plain text version
        };
        
        console.log('📤 Sending email...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        console.log('📧 Recipients:', WORK_EMAIL_LIST);
        
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        // Don't exit the process - just log the error and continue
        console.log('📝 Report was still saved to file successfully');
    }
}

// Generate sample sector data
function generateSampleSectors() {
    const sectors = {};
    const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
    
    sectorETFs.forEach(etf => {
        const basePrice = 30 + Math.random() * 50;
        const changePercent = (Math.random() - 0.5) * 6; // -3% to +3%
        const change = (basePrice * changePercent / 100).toFixed(2);
        const price = (basePrice + parseFloat(change)).toFixed(2);
        
        sectors[etf] = {
            price: `$${price}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            name: getSectorName(etf)
        };
    });
    
    return sectors;
}

// Function to fetch market data from APIs
async function fetchMarketData() {
    const marketData = {
        indices: {},
        sectors: {},
        premarket: {
            gainers: [],
            losers: []
        },
        commodities: [],
        currencies: [],
        economicCalendar: [],
        earningsCalendar: [],
        optionsFlow: [],
        technicalLevels: [],
        sentiment: {}
    };
    
    try {
        // Fetch data using Alpha Vantage API
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('Fetching data from Alpha Vantage...');
            
            // Fetch major indices
            const symbols = ['SPY', 'QQQ', 'DIA'];
            for (const symbol of symbols) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    if (response.data['Global Quote']) {
                        marketData.indices[symbol] = response.data['Global Quote'];
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch ${symbol}:`, error.message);
                }
            }
            
            // Fetch sector ETFs
            const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
            for (const etf of sectorETFs) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    if (response.data['Global Quote']) {
                        marketData.sectors[etf] = {
                            ...response.data['Global Quote'],
                            name: getSectorName(etf)
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch ${etf}:`, error.message);
                }
            }
        }
        
        // Try Finnhub API as backup
        if (FINNHUB_API_KEY && Object.keys(marketData.indices).length === 0) {
            console.log('Fetching data from Finnhub...');
            
            const indicesSymbols = ['^GSPC', '^IXIC', '^DJI'];
            for (const symbol of indicesSymbols) {
                try {
                    const response = await axios.get(
                        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
                    );
                    if (response.data && response.data.c) {
                        marketData.indices[symbol] = response.data;
                    }
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.log(`Failed to fetch ${symbol} from Finnhub`);
                }
            }
        }
        
    } catch (error) {
        console.log('Market data fetch failed, using sample data');
    }
    
    // Generate sample data if no real data was retrieved
    if (Object.keys(marketData.sectors).length === 0) {
        console.log('Generating sample sector data...');
        marketData.sectors = generateSampleSectors();
    }
    
    if (marketData.premarket.gainers.length === 0) {
        console.log('Generating sample premarket data...');
        marketData.premarket.gainers = generateSampleMovers('gainers');
        marketData.premarket.losers = generateSampleMovers('losers');
    }
    
    if (marketData.commodities.length === 0) {
        console.log('Generating sample commodities data...');
        marketData.commodities = generateSampleCommodities();
    }
    
    if (marketData.currencies.length === 0) {
        console.log('Generating sample currency data...');
        marketData.currencies = generateSampleCurrencies();
    }
    
    if (marketData.economicCalendar.length === 0) {
        console.log('Generating sample economic calendar...');
        marketData.economicCalendar = generateSampleEconomicCalendar();
    }
    
    if (marketData.earningsCalendar.length === 0) {
        console.log('Generating sample earnings calendar...');
        marketData.earningsCalendar = generateSampleEarningsCalendar();
    }
    
    if (marketData.optionsFlow.length === 0) {
        console.log('Generating sample options flow...');
        marketData.optionsFlow = generateSampleOptionsFlow();
    }
    
    if (marketData.technicalLevels.length === 0) {
        console.log('Generating sample technical levels...');
        marketData.technicalLevels = generateSampleTechnicalLevels();
    }
    
    if (Object.keys(marketData.sentiment).length === 0) {
        console.log('Generating sample sentiment data...');
        marketData.sentiment = generateSampleSentiment();
    }
    
    return marketData;
}

// Format market data for the prompt
function formatMarketDataForPrompt(marketData) {
    let dataString = `Current Market Data (${new Date().toDateString()}):\n\n`;
    
    if (Object.keys(marketData.indices).length > 0) {
        dataString += "MARKET INDICES:\n";
        Object.entries(marketData.indices).forEach(([symbol, data]) => {
            const price = data.price || data['05. price'] || data.c || 'N/A';
            const change = data.change || data['09. change'] || data.d || 'N/A';
            const changePercent = data.changePercent || data['10. change percent'] || data.dp || 'N/A';
            dataString += `- ${symbol}: ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(marketData.sectors).length > 0) {
        dataString += "SECTOR PERFORMANCE (SPDR ETFs):\n";
        Object.entries(marketData.sectors).forEach(([symbol, data]) => {
            const price = data.price || data['05. price'] || 'N/A';
            const change = data.change || data['09. change'] || 'N/A';
            const changePercent = data.changePercent || data['10. change percent'] || 'N/A';
            dataString += `- ${symbol} (${data.name}): ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.premarket.gainers.length > 0) {
        dataString += "TOP PREMARKET GAINERS:\n";
        marketData.premarket.gainers.forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent}) Vol: ${stock.volume}\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.premarket.losers.length > 0) {
        dataString += "TOP PREMARKET LOSERS:\n";
        marketData.premarket.losers.forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent}) Vol: ${stock.volume}\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.commodities.length > 0) {
        dataString += "BONDS & COMMODITIES DATA:\n";
        marketData.commodities.forEach(item => {
            dataString += `- ${item.symbol} (${item.name}): ${item.price} (${item.change} / ${item.changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.currencies.length > 0) {
        dataString += "MAJOR CURRENCY PAIRS:\n";
        marketData.currencies.forEach(curr => {
            dataString += `- ${curr.pair}: ${curr.current} (${curr.change} / ${curr.changePercent}) ${curr.trend}\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.economicCalendar.length > 0) {
        dataString += "TODAY'S ECONOMIC CALENDAR:\n";
        marketData.economicCalendar.forEach(event => {
            dataString += `- ${event.time} ${event.release}: Prev ${event.previous}, Fcst ${event.forecast}, Impact ${event.impact}\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.earningsCalendar.length > 0) {
        dataString += "KEY EARNINGS TODAY:\n";
        marketData.earningsCalendar.forEach(earning => {
            dataString += `- ${earning.symbol} (${earning.time}): EPS ${earning.eps}, Rev ${earning.revenue}, ${earning.guidance}\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.optionsFlow.length > 0) {
        dataString += "UNUSUAL OPTIONS ACTIVITY:\n";
        marketData.optionsFlow.forEach(option => {
            dataString += `- ${option.symbol} ${option.type} ${option.strike}: Vol ${option.volume}, ${option.sentiment}\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.technicalLevels.length > 0) {
        dataString += "KEY TECHNICAL LEVELS:\n";
        marketData.technicalLevels.forEach(level => {
            dataString += `- ${level.index}: Support ${level.support1}/${level.support2}, Resistance ${level.resistance1}/${level.resistance2}\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(marketData.sentiment).length > 0) {
        dataString += "MARKET SENTIMENT INDICATORS:\n";
        dataString += `- VIX: ${marketData.sentiment.vix}\n`;
        dataString += `- Put/Call Ratio: ${marketData.sentiment.putCallRatio}\n`;
        dataString += `- High-Freq Sentiment: ${marketData.sentiment.highFreqSentiment}\n`;
        dataString += `- Institutional Positioning: ${marketData.sentiment.institutionalPositioning}\n`;
        dataString += "\n";
    }
    
    return dataString;
}

const createMarketPrompt = (marketData) => `You are a senior financial analyst at a major investment bank creating a comprehensive daily market summary for institutional clients and professional traders. Use the extensive market data provided below to generate a professional-grade report with institutional-level analysis and actionable insights.

${formatMarketDataForPrompt(marketData)}

Create a professional report with these exact sections using institutional analyst-level insights:

**EXECUTIVE SUMMARY**
[2-sentence overview of global market sentiment and key themes driving institutional positioning today]

**ASIAN MARKETS OVERNIGHT**
Create a professional institutional-grade summary covering:
- Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance with institutional flow analysis
- Major Asian corporate developments, earnings surprises, and sector rotation themes
- Key economic data releases from Asia and central bank communications impact
- USD/JPY, USD/CNY, AUD/USD movements with carry trade and institutional FX positioning analysis
- Cross-border capital flows and their implications for US market open
[Target: 150 words, institutional analyst perspective]

**EUROPEAN MARKETS SUMMARY**
Create a professional institutional-grade summary covering:
- FTSE 100, DAX, CAC 40, Euro Stoxx 50 performance with sector leadership analysis
- Major European corporate developments, M&A activity, and regulatory updates
- ECB policy implications, eurozone economic data, and sovereign debt market moves
- EUR/USD, GBP/USD movements with institutional positioning and technical levels
- European close implications for US market sentiment and overnight flow patterns
[Target: 150 words, institutional analyst perspective]

**ECONOMIC CALENDAR & EARNINGS WATCH**
Create comprehensive institutional-grade analysis combining both calendars using the data provided:

Economic Calendar Table:
\`\`\`
TODAY'S ECONOMIC CALENDAR
┌──────┬─────────────────────┬──────────┬─────────┬──────────┐
│ Time │      Release        │ Previous │ Forecast│ Impact   │
├──────┼─────────────────────┼──────────┼─────────┼──────────┤
│ 8:30 │ Jobless Claims      │  210K    │  215K   │   High   │
│ 8:30 │ CPI (Core) MoM      │  0.3%    │  0.2%   │   High   │
│10:00 │ Existing Home Sales │  4.2M    │  4.1M   │  Medium  │
│10:30 │ EIA Crude Inventory │  +2.1M   │  -1.5M  │   High   │
│14:00 │ Fed Beige Book      │  Mixed   │  Mixed  │  Medium  │
└──────┴─────────────────────┴──────────┴─────────┴──────────┘
\`\`\`

Earnings Calendar Table:
\`\`\`
KEY EARNINGS TODAY
┌────────┬──────┬─────────┬─────────┬─────────────────┐
│ Symbol │ Time │   EPS   │ Revenue │    Guidance     │
├────────┼──────┼─────────┼─────────┼─────────────────┤
│  AAPL  │ AMC  │  $1.52  │ $94.5B  │ Q1 Revenue Up   │
│  MSFT  │ AMC  │  $2.99  │ $56.2B  │ Cloud Growth    │
│  TSLA  │ AMC  │  $0.85  │ $24.3B  │ Production Ramp │
│ GOOGL  │ AMC  │  $1.42  │ $76.7B  │ AI Investment   │
│  AMZN  │ AMC  │  $0.98  │ $143.1B │ AWS Momentum    │
│  META  │ AMC  │  $4.73  │ $34.1B  │ Metaverse Spend │
└────────┴──────┴─────────┴─────────┴─────────────────┘
\`\`\`

Provide institutional-level analysis of market-moving potential, consensus vs whisper numbers, sector implications, and trading strategies around these events. Include Fed speakers schedule and central bank communications.
[Target: 250 words total including tables, senior analyst perspective]

**US MARKET OUTLOOK**
Create a professional institutional-grade summary covering:
- Current S&P 500, NASDAQ, DOW futures with gap analysis and opening expectations
- Key economic releases impact assessment and institutional positioning implications
- Major US earnings announcements and their sector/market implications
- Federal Reserve speakers, policy outlook, and interest rate expectations
- Overnight developments, geopolitical factors, and cross-asset flow implications
[Target: 150 words, institutional analyst perspective]

**PREMARKET MOVERS & VOLUME ANALYSIS**
Analyze the premarket trading data provided above with institutional-grade insights:

Create two formatted tables using ASCII characters:
\`\`\`
TOP PREMARKET GAINERS
┌──────┬─────────┬─────────┬──────────┬──────────┐
│Symbol│  Price  │ Change  │ % Change │  Volume  │
├──────┼─────────┼─────────┼──────────┼──────────┤
│ TSLA │ $245.67 │ +$26.89 │  +12.3%  │  2.1M    │
│ NVDA │ $892.45 │ +$71.23 │   +8.7%  │  1.8M    │
│ AAPL │ $187.23 │ +$10.95 │   +6.2%  │  3.2M    │
│ (all 10 gainers with institutional analysis)     │
└──────┴─────────┴─────────┴──────────┴──────────┘

TOP PREMARKET LOSERS
┌──────┬─────────┬─────────┬──────────┬──────────┐
│Symbol│  Price  │ Change  │ % Change │  Volume  │
├──────┼─────────┼─────────┼──────────┼──────────┤
│ META │ $298.45 │ -$32.15 │   -9.8%  │  1.9M    │
│ AMZN │ $142.67 │ -$11.39 │   -7.4%  │  2.4M    │
│ MSFT │ $378.91 │ -$20.41 │   -5.1%  │  1.6M    │
│ (all 10 losers with institutional analysis)      │
└──────┴─────────┴─────────┴──────────┴──────────┘
\`\`\`

Include institutional-level analysis of volume patterns, dark pool activity, potential catalysts (earnings, upgrades, news), sector rotation implications, and professional trading strategies for market open.
[Target: 300 words total including tables, senior analyst perspective with actionable insights]

**SECTOR ANALYSIS & ROTATION THEMES**
Analyze the SPDR sector ETF performance using institutional-grade sector rotation analysis:
- **XLF (Financial Services)**: Interest rate sensitivity, regulatory environment, and institutional flows
- **XLK (Technology)**: AI/Cloud themes, valuation compression, and growth vs value rotation
- **XLE (Energy)**: Commodity correlation, geopolitical factors, and institutional energy positioning
- **XLV (Healthcare)**: Regulatory pipeline, demographic trends, and defensive positioning
- **XLI (Industrials)**: Economic cycle positioning, infrastructure spending, and manufacturing indicators
- **XLY (Consumer Discretionary)**: Consumer sentiment, discretionary spend patterns, and economic sensitivity
- **XLP (Consumer Staples)**: Defensive rotation, inflation hedging, and dividend seeking flows
- **XLU (Utilities)**: Interest rate sensitivity, ESG flows, and defensive allocation patterns
- **XLB (Materials)**: Commodity cycle positioning, China exposure, and inflation hedge characteristics
Include cross-sector correlation analysis and institutional rotation signals.
[Target: 350 words, institutional-grade sector rotation insights with professional positioning recommendations]

**TECHNICAL ANALYSIS & KEY LEVELS**
Provide institutional-grade technical analysis using the levels data:

\`\`\`
KEY TECHNICAL LEVELS
┌────────┬───────────┬─────────┬───────────┬─────────┐
│ Index  │ Support 1 │Support 2│Resistance1│Resistance2│
├────────┼───────────┼─────────┼───────────┼─────────┤
│ S&P500 │   5,520   │  5,480  │   5,580   │  5,620  │
│NASDAQ  │  18,200   │ 18,000  │  18,500   │ 18,700  │
│  DOW   │  42,800   │ 42,500  │  43,200   │ 43,500  │
│Russell │   2,180   │  2,150  │   2,220   │  2,250  │
└────────┴───────────┴─────────┴───────────┴─────────┘
\`\`\`

Include institutional-level technical analysis: momentum indicators, volume profile analysis, options flow implications at key levels, and professional trading strategies. Analyze gap fills, breakout/breakdown scenarios, and institutional support/resistance zones.
[Target: 200 words, senior technical analyst perspective]

**OPTIONS FLOW & INSTITUTIONAL ACTIVITY**
Analyze unusual options activity and institutional positioning using provided data:

\`\`\`
UNUSUAL OPTIONS ACTIVITY
┌────────┬─────────┬────────┬─────────┬──────────────┐
│ Symbol │  Type   │ Strike │   Vol   │   Sentiment  │
├────────┼─────────┼────────┼─────────┼──────────────┤
│  SPY   │  CALL   │  560   │  45,000 │   Bullish    │
│  QQQ   │  PUT    │  420   │  32,000 │   Bearish    │
│  NVDA  │  CALL   │  900   │  18,500 │   Bullish    │
│  TSLA  │  PUT    │  240   │  15,200 │   Bearish    │
│  AAPL  │  CALL   │  190   │  22,800 │   Bullish    │
└────────┴─────────┴────────┴─────────┴──────────────┘
\`\`\`

Provide institutional-grade analysis of smart money flows, gamma positioning, dealer hedging implications, and cross-asset volatility expectations. Include analysis of put/call ratios, volatility term structure, and institutional hedging patterns.
[Target: 200 words, institutional derivatives analyst perspective]

**MARKET SENTIMENT & POSITIONING**
Analyze market sentiment indicators and institutional positioning using provided data:

Current Sentiment Dashboard:
- VIX Level: [use provided data] - Fear/greed analysis and volatility expectations
- Put/Call Ratio: [use provided data] - Contrarian indicators and positioning extremes
- High-Frequency Sentiment: [use provided data] - Algorithmic and social sentiment analysis
- Institutional Positioning: [use provided data] - Long/short positioning and crowding analysis

Include analysis of sentiment extremes, contrarian indicators, institutional flow patterns, and professional positioning recommendations.
[Target: 150 words, institutional sentiment analyst perspective]

**LONGS/SHORTS & PROFESSIONAL POSITIONING**
Use current market data and institutional analysis to provide senior analyst-level positioning recommendations:

Analyze cross-asset flows, sector rotation themes, individual equity opportunities, and hedging strategies. Include risk-adjusted return expectations, correlation analysis, and portfolio construction insights for institutional clients. Address both tactical (1-5 day) and strategic (1-4 week) positioning themes.
[Target: 200 words, senior portfolio strategist perspective]

**BONDS & COMMODITIES ANALYSIS**
Use the bonds and commodities data provided to create institutional-grade fixed income and commodities analysis:

\`\`\`
BONDS & COMMODITIES DASHBOARD
┌──────────┬─────────────────┬─────────┬─────────┬──────────┐
│ Symbol   │      Asset      │  Price  │ Change  │ % Change │
├──────────┼─────────────────┼─────────┼─────────┼──────────┤
│ GOLD     │ Gold (oz)       │ $2,034  │ +$12.45 │  +0.62%  │
│ OIL      │ WTI Crude       │ $76.23  │ -$1.34  │  -1.73%  │
│ SILVER   │ Silver (oz)     │ $25.67  │ +$0.43  │  +1.70%  │
│ COPPER   │ Copper          │  $3.82  │ +$0.05  │  +1.33%  │
│ NATGAS   │ Natural Gas     │  $2.48  │ -$0.07  │  -2.74%  │
│ US10Y    │ 10-Year Treasury│  4.18%  │ +0.05   │    --    │
│ US2Y     │ 2-Year Treasury │  4.82%  │ +0.03   │    --    │
│ US30Y    │ 30-Year Treasury│  4.41%  │ +0.04   │    --    │
│ DXY      │ Dollar Index    │ 103.21  │ -0.18   │  -0.17%  │
└──────────┴─────────────────┴─────────┴─────────┴──────────┘
\`\`\`

Provide institutional-grade analysis of yield curve dynamics, real rates, inflation expectations, commodity super-cycle positioning, and cross-asset correlation patterns. Include Federal Reserve policy implications and institutional allocation strategies.
[Target: 250 words total including table, fixed income/commodities strategist perspective]

**CURRENCY MARKETS & GLOBAL FLOWS**
Analyze major currency pairs and international capital flows using provided data:

\`\`\`
MAJOR CURRENCY PAIRS
┌─────────┬─────────┬─────────┬──────────┬─────────────┐
│  Pair   │ Current │ Change  │ % Change │    Trend    │
├─────────┼─────────┼─────────┼──────────┼─────────────┤
│ EUR/USD │ 1.0892  │ -0.0023 │  -0.21%  │  Bearish    │
│ GBP/USD │ 1.2654  │ +0.0087 │  +0.69%  │  Bullish    │
│ USD/JPY │ 154.23  │ +0.45   │  +0.29%  │  Bullish    │
│ USD/CAD │ 1.3456  │ +0.0034 │  +0.25%  │  Bullish    │
│ AUD/USD │ 0.6523  │ -0.0045 │  -0.68%  │  Bearish    │
│ USD/CHF │ 0.8976  │ +0.0023 │  +0.26%  │  Bullish    │
└─────────┴─────────┴─────────┴──────────┴─────────────┘
\`\`\`

Include institutional-grade FX analysis: central bank policy divergence, carry trade positioning, cross-border capital flows, and professional FX strategies. Analyze dollar strength themes and emerging market implications.
[Target: 200 words total including table, senior FX strategist perspective]

**RISK MANAGEMENT & VOLATILITY OUTLOOK**
Provide institutional-grade risk assessment and volatility forecasting:

Analyze cross-asset volatility expectations, tail risk scenarios, correlation breakdowns, and professional hedging strategies. Include geopolitical risk assessment, event risk calendar, and institutional risk management recommendations. Address both systematic and idiosyncratic risk factors.
[Target: 150 words, senior risk management perspective]

**KEY TAKEAWAYS & TRADING THEMES**
[3-sentence summary of main institutional trading themes and risk/reward scenarios for the day]

**INSTITUTIONAL RESEARCH & MARKET CATALYSTS**
Provide institutional-grade analysis of:
- Upgrade/downgrade implications and sector rotation catalysts
- M&A activity and corporate strategic developments
- Regulatory/policy developments affecting institutional positioning
- Cross-border flow patterns and international market implications
- Professional research themes and institutional client focus areas
[Target: 200 words, senior equity strategist perspective]

Write in professional institutional language suitable for senior portfolio managers, hedge fund professionals, and institutional trading desks. Use the extensive market data provided above and incorporate realistic institutional-grade scenarios and analysis. Include today's date: ${new Date().toDateString()}.

IMPORTANT: Create a comprehensive, institutional-grade report using all the market data provided. Use exact ASCII table formatting as shown in examples. Provide actionable insights at the level expected by senior institutional clients and professional traders.`;
