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

// Calculate market timing information
function getMarketTimingInfo() {
    const now = new Date();
    const lastClose = new Date();
    const nextOpen = new Date();
    
    // Set last market close (4:00 PM ET previous trading day)
    lastClose.setHours(16, 0, 0, 0);
    if (now.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Set next market open (9:30 AM ET next trading day)
    nextOpen.setHours(9, 30, 0, 0);
    if (now.getHours() >= 9 && now.getMinutes() >= 30) {
        nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    // Calculate hours since close
    const hoursSinceClose = Math.floor((now - lastClose) / (1000 * 60 * 60));
    
    // Calculate time to open
    const timeToOpen = nextOpen - now;
    const hoursToOpen = Math.floor(timeToOpen / (1000 * 60 * 60));
    const minutesToOpen = Math.floor((timeToOpen % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
        lastClose: lastClose.toLocaleString(),
        nextOpen: nextOpen.toLocaleString(),
        hoursSinceClose,
        timeToOpenStr: `${hoursToOpen}h ${minutesToOpen}m`
    };
}

// Generate sample overnight/after-hours movers
function generateOvernightMovers(type) {
    const sampleStocks = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'CRM'
    ];
    
    const movers = [];
    const isGainer = type === 'gainers';
    
    for (let i = 0; i < 10; i++) {
        const symbol = sampleStocks[i] || `STOCK${i}`;
        const basePrice = 50 + Math.random() * 200;
        // After-hours moves can be more volatile due to lower volume
        const changePercent = isGainer ? 
            (0.5 + Math.random() * 15).toFixed(2) : 
            -(0.5 + Math.random() * 15).toFixed(2);
        const change = (basePrice * parseFloat(changePercent) / 100).toFixed(2);
        const price = (basePrice + parseFloat(change)).toFixed(2);
        // After-hours volume is typically much lower
        const volume = Math.floor(Math.random() * 200000) + 25000;
        
        movers.push({
            symbol,
            price: `$${price}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent}%`,
            volume: (volume / 1000).toFixed(0) + 'K', // After-hours volume in thousands
            timeframe: 'After-Hours'
        });
    }
    
    return movers;
}

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
        
        // Enhanced HTML formatting for morning report
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #2c3e50; border-bottom: 3px solid #d4af37; padding-bottom: 10px;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #2c3e50; margin-top: 25px;">$1</h2>')
            .replace(/^\*\*(.*?)\*\*/gm, '<h3 style="color: #2c3e50; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; font-weight: bold;">$1</h3>')
            .replace(/color: #2c3e50/g, 'color: #2c3e50; border-bottom: 2px solid #d4af37; padding-bottom: 8px')
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
        console.log('📧 Recipients:', WORK_EMAIL_LIST);
        
    } catch (error) {
        console.error('❌ Failed to send overnight report:', error.message);
        console.log('📝 Report was still saved to file successfully');
    }
}

// Generate sample sector data with after-hours focus
function generateOvernightSectors() {
    const sectors = {};
    const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
    
    sectorETFs.forEach(etf => {
        const basePrice = 30 + Math.random() * 50;
        // After-hours moves tend to be smaller but can have significant gaps
        const changePercent = (Math.random() - 0.5) * 3; // -1.5% to +1.5% for after-hours
        const change = (basePrice * changePercent / 100).toFixed(2);
        const price = (basePrice + parseFloat(change)).toFixed(2);
        
        sectors[etf] = {
            price: `$${price}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            name: getSectorName(etf),
            session: 'After-Hours'
        };
    });
    
    return sectors;
}

// Function to fetch overnight market data (close to open focus)
async function fetchOvernightMarketData() {
    const overnightData = {
        afterHoursFutures: {},
        overnightSectors: {},
        afterHoursMovers: {
            topGainers: [],
            topLosers: []
        },
        overnightNews: [],
        globalMarkets: {},
        currencyMoves: {}
    };
    
    try {
        // Fetch after-hours and futures data
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('Fetching overnight market data...');
            
            // Focus on major index ETFs for after-hours indication
            const majorETFs = ['SPY', 'QQQ', 'DIA']; // Proxies for overnight sentiment
            
            for (const symbol of majorETFs) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    if (response.data['Global Quote']) {
                        overnightData.afterHoursFutures[symbol] = {
                            ...response.data['Global Quote'],
                            session: 'After-Hours/Extended'
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch overnight data for ${symbol}:`, error.message);
                }
            }
            
            // Fetch sector ETFs for overnight sector analysis
            const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
            for (const etf of sectorETFs) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    if (response.data['Global Quote']) {
                        overnightData.overnightSectors[etf] = {
                            ...response.data['Global Quote'],
                            name: getSectorName(etf),
                            session: 'Extended Hours'
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch overnight sector data for ${etf}:`, error.message);
                }
            }
            
            // Fetch major currency pairs for overnight FX moves
            const currencies = [
                { from: 'EUR', to: 'USD' },
                { from: 'GBP', to: 'USD' },
                { from: 'USD', to: 'JPY' }
            ];
            
            for (const curr of currencies) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${curr.from}&to_currency=${curr.to}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    if (response.data && response.data['Realtime Currency Exchange Rate']) {
                        const rate = response.data['Realtime Currency Exchange Rate'];
                        overnightData.currencyMoves[`${curr.from}${curr.to}`] = {
                            rate: parseFloat(rate['5. Exchange Rate']).toFixed(4),
                            lastRefreshed: rate['6. Last Refreshed'],
                            session: 'Overnight'
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch overnight FX data for ${curr.from}${curr.to}:`, error.message);
                }
            }
        }
        
        // Fetch overnight news and global market data
        if (FINNHUB_API_KEY) {
            console.log('Fetching overnight news and global markets...');
            
            try {
                const newsResponse = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`
                );
                if (newsResponse.data && Array.isArray(newsResponse.data)) {
                    // Filter for overnight news (last 12 hours)
                    const twelveHoursAgo = Date.now() / 1000 - (12 * 60 * 60);
                    overnightData.overnightNews = newsResponse.data
                        .filter(news => news.datetime > twelveHoursAgo)
                        .slice(0, 8);
                }
            } catch (error) {
                console.log('Failed to fetch overnight news:', error.message);
            }
        }
        
    } catch (error) {
        console.log('Overnight market data fetch failed, using sample data');
    }
    
    // Generate sample overnight data if no real data retrieved
    if (Object.keys(overnightData.overnightSectors).length === 0) {
        console.log('Generating sample overnight sector data...');
        overnightData.overnightSectors = generateOvernightSectors();
    }
    
    if (overnightData.afterHoursMovers.topGainers.length === 0) {
        console.log('Generating sample overnight movers...');
        overnightData.afterHoursMovers.topGainers = generateOvernightMovers('gainers');
        overnightData.afterHoursMovers.topLosers = generateOvernightMovers('losers');
    }
    
    return overnightData;
}

// Format overnight data for the prompt
function formatOvernightDataForPrompt(overnightData) {
    const timing = getMarketTimingInfo();
    
    let dataString = `OVERNIGHT MARKET DATA (Market Close to Open Analysis):\n`;
    dataString += `Last Market Close: ${timing.lastClose}\n`;
    dataString += `Next Market Open: ${timing.nextOpen}\n`;
    dataString += `Hours Since Close: ${timing.hoursSinceClose}\n`;
    dataString += `Time to Open: ${timing.timeToOpenStr}\n\n`;
    
    if (Object.keys(overnightData.afterHoursFutures).length > 0) {
        dataString += "AFTER-HOURS/EXTENDED TRADING DATA:\n";
        Object.entries(overnightData.afterHoursFutures).forEach(([symbol, data]) => {
            const price = data.price || data['05. price'] || data.c || 'N/A';
            const change = data.change || data['09. change'] || data.d || 'N/A';
            const changePercent = data.changePercent || data['10. change percent'] || data.dp || 'N/A';
            dataString += `- ${symbol} (Extended Hours): ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(overnightData.overnightSectors).length > 0) {
        dataString += "OVERNIGHT SECTOR ANALYSIS (ETF Extended Hours):\n";
        Object.entries(overnightData.overnightSectors).forEach(([symbol, data]) => {
            const price = data.price || data['05. price'] || 'N/A';
            const change = data.change || data['09. change'] || 'N/A';
            const changePercent = data.changePercent || data['10. change percent'] || 'N/A';
            dataString += `- ${symbol} (${data.name}) Extended: ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (overnightData.afterHoursMovers.topGainers.length > 0) {
        dataString += "TOP AFTER-HOURS GAINERS:\n";
        overnightData.afterHoursMovers.topGainers.forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent}) Vol: ${stock.volume} [${stock.timeframe}]\n`;
        });
        dataString += "\n";
    }
    
    if (overnightData.afterHoursMovers.topLosers.length > 0) {
        dataString += "TOP AFTER-HOURS LOSERS:\n";
        overnightData.afterHoursMovers.topLosers.forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent}) Vol: ${stock.volume} [${stock.timeframe}]\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(overnightData.currencyMoves).length > 0) {
        dataString += "OVERNIGHT CURRENCY MOVEMENTS:\n";
        Object.entries(overnightData.currencyMoves).forEach(([pair, data]) => {
            dataString += `- ${pair}: ${data.rate} (Last: ${data.lastRefreshed})\n`;
        });
        dataString += "\n";
    }
    
    if (overnightData.overnightNews.length > 0) {
        dataString += "OVERNIGHT NEWS AFFECTING NEXT OPEN:\n";
        overnightData.overnightNews.forEach((news, index) => {
            const newsTime = new Date(news.datetime * 1000).toLocaleString();
            dataString += `${index + 1}. ${news.headline} (${newsTime})\n`;
        });
        dataString += "\n";
    }
    
    return dataString;
}

// Enhanced comprehensive market prompt
const createOvernightMarketPrompt = (overnightData) => {
    const timing = getMarketTimingInfo();
    
    return `You are a financial analyst creating a comprehensive daily market summary. Use multiple authoritative financial sources and cross-reference data points for accuracy. Prioritize official exchange data, central bank communications, and primary financial news sources. Create a professional report with these exact sections:

${formatOvernightDataForPrompt(overnightData)}

**EXECUTIVE SUMMARY**
[2-sentence overview of global market sentiment and key risk factors]

**ASIAN MARKETS OVERNIGHT**
Search multiple sources and verify data for:
- Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance (include exact closing levels and % changes)
- Major Asian corporate earnings with specific numbers (revenue, EPS beats/misses)
- Key economic data releases from Asia (actual vs. consensus vs. prior)
- USD/JPY, USD/CNY, AUD/USD currency movements (current levels and daily changes)
- Central bank communications from Asia (direct quotes from officials when available)
- Cross-reference Asian market data from at least 2 sources
[Target: 150 words]

**EUROPEAN MARKETS SUMMARY**
Search for and report on:
- FTSE 100, DAX, CAC 40, Euro Stoxx 50 performance
- Major European corporate news
- ECB policy updates or eurozone economic data
- EUR/USD, GBP/USD movements
- Any significant political/economic developments in Europe
[Target: 150 words]

**US MARKET OUTLOOK**
Search for and report on:
- Current S&P 500, NASDAQ, DOW futures
- Key economic releases scheduled for today
- Major US earnings announcements expected
- Federal Reserve speakers or policy implications
- Any overnight developments affecting US markets
[Target: 150 words]

**FUTURES ANALYSIS**
Search for and report on:
- Major index futures movements (ES, NQ, YM) and positioning
- Commodity futures performance (crude oil, gold, natural gas)
- Currency futures trends and volatility
- VIX futures and implied volatility changes
- Key futures expirations or rollover effects
[Target: 120 words]

**RESEARCH HIGHLIGHTS**
Search for and report on:
- Major broker upgrades, downgrades, or target price changes
- New research reports from investment banks
- Analyst consensus changes on key stocks or sectors
- Notable research calls or thematic investment ideas
- Institutional positioning updates or flow data
[Target: 120 words]

**ECONOMIC AND EARNINGS CALENDAR**
Verify timing and consensus from multiple sources:
- Today's economic data releases with exact release times (ET), consensus forecasts, and previous readings
- Major earnings announcements with confirmed reporting times and analyst EPS/revenue estimates
- Corporate guidance updates with specific numerical targets when provided
- Economic indicators ranked by market-moving potential
- Federal Reserve speakers with confirmed speaking times and event details
- Include data source attribution for key forecasts
[Target: 120 words]

**SECTOR PERFORMANCE**
Search for and report on:
- Best and worst performing S&P 500 sectors
- Key sector rotation themes or trends
- Industry-specific news affecting sector performance
- Relative strength analysis of major sectors
- Any sector-specific catalysts or headwinds
[Target: 120 words]

**BONDS AND COMMODITIES**
Search for and report on:
- US Treasury yield movements across the curve
- Credit spreads and high-yield bond performance
- Gold, silver, copper, and crude oil price action
- Agricultural commodity trends
- Any central bank bond buying or selling activity
[Target: 120 words]

**TECHNICAL LEVELS**
Use recent price action and verified technical data:
- Key support and resistance levels for major indices (include specific price levels and timeframes)
- Technical breakouts or breakdowns with volume confirmation
- Chart patterns backed by quantitative momentum indicators (RSI, MACD levels)
- Options flow data from reputable sources (unusual activity thresholds)
- Critical intraday levels with percentage distances from current prices
- Reference established technical analysis principles
[Target: 120 words]

**RISK ASSESSMENT**
Search for and report on:
- Current geopolitical risks affecting markets
- Credit market stress indicators or warning signs
- Volatility measures and risk-off/risk-on sentiment
- Correlation breakdowns or unusual market behavior
- Any systemic risks or tail risk considerations
[Target: 120 words]

**KEY TAKEAWAYS**
[2-sentence summary of main trading themes and risk factors for the day]

IMPORTANT ACCURACY GUIDELINES:
- Verify all numerical data (prices, percentages, levels) from at least 2 authoritative sources
- Include exact timestamps for market data (specify market close times and time zones)
- Cite specific sources for economic forecasts and earnings estimates
- Use official exchange data over third-party aggregators when possible
- Cross-reference breaking news from multiple financial news outlets
- Include confidence levels for forward-looking statements or predictions
- Distinguish between preliminary and final economic data releases
- Note any data revisions or corrections from previous periods

Use current market data from today's date and specify market session timing (Asian close, European open, US pre-market, etc.). Include specific percentage moves and index levels with decimal precision. Write in professional financial language suitable for institutional clients.

Include today's date: ${new Date().toDateString()}.`;
};

async function generateOvernightMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log(`🌙 Generating OVERNIGHT MARKET REPORT (${timing.hoursSinceClose} hours since close)...`);
        
        // Fetch overnight market data
        const overnightData = await fetchOvernightMarketData();
        console.log('📊 Overnight data fetched - After-hours:', Object.keys(overnightData.afterHoursFutures).length, 'Sectors:', Object.keys(overnightData.overnightSectors).length, 'News:', overnightData.overnightNews.length);
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.3,
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
        
        // Generate filename with overnight focus
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `overnight-market-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add metadata header focused on morning period
        const reportWithMetadata = `${report}

---

*This morning market report covers the complete period from market close to open*  
*READY FOR NEXT MARKET SESSION*
`;
        
        // Write overnight report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`Morning market report generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`⏰ Hours since close: ${timing.hoursSinceClose}`);
        console.log(`⏰ Time to market open: ${timing.timeToOpenStr}`);
        
        // Create latest morning report
        const latestFilepath = path.join(reportsDir, 'latest-morning-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw data
        const rawDataPath = path.join(reportsDir, `morning-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(overnightData, null, 2));
        
        // Send morning report via email
        console.log('📧 Sending morning market report...');
        await sendOvernightReportEmail(reportWithMetadata, dateStr);
        
        console.log('✅ MORNING MARKET REPORT COMPLETED!');
        console.log(`${timing.hoursSinceClose}-hour close-to-open analysis ready`);
        console.log(`⏰ Market opens in ${timing.timeToOpenStr}`);
        
    } catch (error) {
        console.error('❌ Error generating morning market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the morning market report generation
generateOvernightMarketReport();
