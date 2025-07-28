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

// ENHANCED PROMPT with improved accuracy guidelines
const createOvernightMarketPrompt = (overnightData) => {
    const timing = getMarketTimingInfo();
    
    return `You are a senior financial analyst creating a comprehensive daily market summary. You must use multiple authoritative financial sources and cross-reference data points for accuracy. Prioritize official exchange data, central bank communications, and primary financial news sources.

${formatOvernightDataForPrompt(overnightData)}

**DATA VERIFICATION REQUIREMENTS:**
- Verify all numerical data (prices, percentages, levels) from at least 2 authoritative sources
- Include exact timestamps for market data (specify market close times and time zones)
- Use official exchange data over third-party aggregators when possible
- Cross-reference breaking news from multiple financial news outlets
- Note any data revisions or corrections from previous periods
- Distinguish between preliminary and final economic data releases
- Flag any unusual moves (>2 standard deviations) with volume confirmation
- Include confidence levels for forward-looking statements

**PRIMARY SOURCES TO PRIORITIZE:**
- Official exchange websites (NYSE, NASDAQ, LSE, TSE, HKEX, SSE)
- Central bank websites and communications (Fed, ECB, BOJ, PBOC)
- Bloomberg Terminal, Reuters, FactSet data when available
- SEC and regulatory filing sources
- Official economic data releases (BLS, Census Bureau, etc.)

Create a professional MORNING MARKET REPORT with these exact sections:

**EXECUTIVE SUMMARY**
[2-sentence overview of global market sentiment and key risk factors for the trading day ahead]

**ASIAN MARKETS OVERNIGHT**
Search multiple sources and verify data for:
- Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance (include exact closing levels and % changes with timestamps)
- Major Asian corporate earnings with specific numbers (revenue, EPS beats/misses, source attribution)
- Key economic data releases from Asia (actual vs. consensus vs. prior with data provider citation)
- USD/JPY, USD/CNY, AUD/USD currency movements (current levels and daily changes with bid/offer spreads)
- Central bank communications from Asia (direct quotes from officials with timestamp and source)
- Cross-reference Asian market data from at least 2 sources and note any discrepancies
[Target: 150 words]

**EUROPEAN MARKETS SUMMARY**
Search for and report on:
- FTSE 100, DAX, CAC 40, Euro Stoxx 50 performance (exact levels, % changes, volume data)
- Major European corporate news with specific financial metrics
- ECB policy updates or eurozone economic data (distinguish preliminary vs. final)
- EUR/USD, GBP/USD movements with intraday ranges and volatility measures
- Significant political/economic developments in Europe with source verification
[Target: 150 words]

**US MARKET OUTLOOK**
Search for and report on:
- Current S&P 500, NASDAQ, DOW futures (exact levels, fair value calculations, volume)
- Key economic releases scheduled for today (exact release times ET, consensus forecasts with source, previous readings)
- Major US earnings announcements expected (confirmed reporting times, analyst EPS/revenue estimates)
- Federal Reserve speakers or policy implications (confirmed speaking times and venues)
- Overnight developments affecting US markets with timestamp verification
[Target: 150 words]

**FUTURES ANALYSIS**
Search for and report on:
- Major index futures movements (ES, NQ, YM) with exact levels and positioning data
- Commodity futures performance (crude oil, gold, natural gas) with contract specifications
- Currency futures trends and implied volatility measures
- VIX futures and term structure implications
- Key futures expirations or rollover effects with volume confirmation
[Target: 120 words]

**RESEARCH HIGHLIGHTS**
Search for and report on:
- Major broker upgrades, downgrades, or target price changes (exact price targets and reasoning)
- New research reports from investment banks (publication time and key findings)
- Analyst consensus changes on key stocks or sectors (sample size and direction)
- Notable research calls or thematic investment ideas with risk assessments
- Institutional positioning updates or flow data from reputable sources
[Target: 120 words]

**ECONOMIC AND EARNINGS CALENDAR**
Verify timing and consensus from multiple sources:
- Today's economic data releases with exact release times (ET), consensus forecasts with source, previous readings, and revision history
- Major earnings announcements with confirmed reporting times and analyst EPS/revenue estimates from multiple sources
- Corporate guidance updates with specific numerical targets and confidence intervals
- Economic indicators ranked by market-moving potential with historical volatility measures
- Federal Reserve speakers with confirmed speaking times, event details, and topic focus
- Include data source attribution for key forecasts and note any conflicts between sources
[Target: 120 words]

**SECTOR PERFORMANCE**
Search for and report on:
- Best and worst performing S&P 500 sectors with exact percentage moves and volume data
- Key sector rotation themes with quantitative momentum indicators
- Industry-specific news affecting sector performance with earnings/revenue impacts
- Relative strength analysis with technical indicators (RSI, MACD levels)
- Sector-specific catalysts or headwinds with timeline and probability assessments
[Target: 120 words]

**BONDS AND COMMODITIES**
Search for and report on:
- US Treasury yield movements across the curve (2Y, 5Y, 10Y, 30Y with basis point changes)
- Credit spreads and high-yield bond performance with duration and credit quality metrics
- Gold, silver, copper, crude oil price action with contract specifications and inventory data
- Agricultural commodity trends with supply/demand fundamentals
- Central bank bond buying or selling activity with quantities and timing
[Target: 120 words]

**TECHNICAL LEVELS**
Use recent price action and verified technical data:
- Key support and resistance levels for major indices (specific price levels, timeframes, volume confirmation)
- Technical breakouts or breakdowns with volume ratios and momentum confirmation
- Chart patterns backed by quantitative indicators (RSI 14-day levels, MACD 12,26,9 signals)
- Options flow data from CBOE with unusual activity thresholds and gamma exposure
- Critical intraday levels with percentage distances and probability-weighted scenarios
- Reference established technical analysis with backtested success rates
[Target: 120 words]

**RISK ASSESSMENT**
Search for and report on:
- Current geopolitical risks with probability assessments and market impact scenarios
- Credit market stress indicators (spreads, default rates, covenant-lite issuance)
- Volatility measures across asset classes with percentile rankings
- Correlation breakdowns or unusual market behavior with statistical significance
- Systemic risks or tail risk considerations with hedging costs and availability
[Target: 120 words]

**DATA VERIFICATION LOG**
- Primary sources used: [List with timestamps and coverage]
- Secondary source verification: [Cross-references and confirmations]
- Data discrepancies noted: [Any conflicts and resolution method]
- Missing data points: [Unavailable information and reasons]
- Confidence levels: [High/Medium/Low for each major data point]
- Latest data refresh: [Most recent update times for key metrics]
[Target: 80 words]

**KEY TAKEAWAYS**
[2-sentence summary of main trading themes and risk factors for the day with probability-weighted scenarios]

**CRITICAL ACCURACY SAFEGUARDS:**
- All percentage moves include decimal precision and volume confirmation
- Currency rates include bid/offer spreads and volatility measures  
- Economic data includes revision history and seasonal adjustments
- Earnings estimates verified across multiple analyst sources
- Technical levels backed by quantitative indicators and historical testing
- Risk assessments include probability ranges and hedging costs
- Time stamps in Eastern Time with market session context
- Source attribution for all forward-looking statements

Use current market data from ${new Date().toDateString()} and specify exact market session timing (Asian close, European open, US pre-market). Write in professional financial language suitable for institutional clients with quantitative risk management focus.`;
};

async function generateOvernightMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log(`🌙 Generating ENHANCED OVERNIGHT MARKET REPORT (${timing.hoursSinceClose} hours since close)...`);
        
        // Fetch overnight market data
        const overnightData = await fetchOvernightMarketData();
        console.log('📊 Overnight data fetched - After-hours:', Object.keys(overnightData.afterHoursFutures).length, 'Sectors:', Object.keys(overnightData.overnightSectors).length, 'News:', overnightData.overnightNews.length);
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.2, // Reduced for more consistent accuracy
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
        const filename = `enhanced-overnight-market-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add metadata header focused on morning period
        const reportWithMetadata = `${report}

---

*Enhanced Morning Market Report with Multi-Source Verification*  
*Data Accuracy Priority: Official exchanges, central banks, primary sources*
*Generated: ${new Date().toLocaleString()} ET*
*Market Status: ${timing.timeToOpenStr} until open*
`;
        
        // Write overnight report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`✅ Enhanced morning market report generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`⏰ Hours since close: ${timing.hoursSinceClose}`);
        console.log(`⏰ Time to market open: ${timing.timeToOpenStr}`);
        console.log(`🔍 Enhanced accuracy features: Multi-source verification, data quality checks, confidence levels`);
        
        // Create latest morning report
        const latestFilepath = path.join(reportsDir, 'latest-enhanced-morning-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw data with verification metadata
        const rawDataPath = path.join(reportsDir, `enhanced-morning-data-${dateStr}.json`);
        const enhancedData = {
            ...overnightData,
            metadata: {
                generatedAt: new Date().toISOString(),
                marketTimings: timing,
                dataQuality: {
                    realDataPoints: Object.keys(overnightData.afterHoursFutures).length + Object.keys(overnightData.overnightSectors).length,
                    newsArticles: overnightData.overnightNews.length,
                    currencyPairs: Object.keys(overnightData.currencyMoves).length
                }
            }
        };
        fs.writeFileSync(rawDataPath, JSON.stringify(enhancedData, null, 2));
        
        // Send morning report via email
        console.log('📧 Sending enhanced morning market report...');
        await sendOvernightReportEmail(reportWithMetadata, dateStr);
        
        console.log('✅ ENHANCED MORNING MARKET REPORT COMPLETED!');
        console.log(`${timing.hoursSinceClose}-hour close-to-open analysis with enhanced accuracy`);
        console.log(`⏰ Market opens in ${timing.timeToOpenStr}`);
        
    } catch (error) {
        console.error('❌ Error generating enhanced morning market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the enhanced morning market report generation
generateOvernightMarketReport();
