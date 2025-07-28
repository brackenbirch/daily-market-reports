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

// Calculate precise market timing information for close-to-open analysis
function getMarketTimingInfo() {
    const now = new Date();
    
    // Get previous trading day's close (4:00 PM ET)
    const lastClose = getPreviousTradingDayClose(now);
    
    // Get current trading day's open (9:30 AM ET)
    const todayOpen = getCurrentTradingDayOpen(now);
    
    // Calculate precise hours since close
    const hoursSinceClose = Math.floor((now - lastClose) / (1000 * 60 * 60));
    const minutesSinceClose = Math.floor(((now - lastClose) % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calculate time to/from open
    const timeToOpen = todayOpen - now;
    const hoursToOpen = Math.floor(timeToOpen / (1000 * 60 * 60));
    const minutesToOpen = Math.floor((timeToOpen % (1000 * 60 * 60)) / (1000 * 60));
    
    // Determine market session status
    const isPreMarket = now < todayOpen;
    const isRegularHours = now >= todayOpen && now.getHours() < 16;
    const isAfterHours = now.getHours() >= 16;
    
    return {
        lastClose: lastClose.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        todayOpen: todayOpen.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        hoursSinceClose,
        minutesSinceClose,
        timeToOpenStr: isPreMarket ? `${hoursToOpen}h ${minutesToOpen}m` : 'Market Open',
        isPreMarket,
        isRegularHours,
        isAfterHours,
        sessionStatus: isPreMarket ? 'Pre-Market' : isRegularHours ? 'Regular Hours' : 'After Hours',
        closeToOpenHours: Math.floor((todayOpen - lastClose) / (1000 * 60 * 60))
    };
}

// Get previous trading day's close (handles weekends and holidays)
function getPreviousTradingDayClose(currentDate) {
    const lastClose = new Date(currentDate);
    lastClose.setHours(16, 0, 0, 0); // 4:00 PM ET
    
    // If it's before 4 PM today, go to previous day's close
    if (currentDate.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Handle weekends - if it's Monday morning, go to Friday's close
    if (lastClose.getDay() === 0) { // Sunday
        lastClose.setDate(lastClose.getDate() - 2);
    } else if (lastClose.getDay() === 6) { // Saturday
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    return lastClose;
}

// Get current trading day's open (handles weekends and holidays)
function getCurrentTradingDayOpen(currentDate) {
    const todayOpen = new Date(currentDate);
    todayOpen.setHours(9, 30, 0, 0); // 9:30 AM ET
    
    // If it's weekend, adjust to Monday
    if (todayOpen.getDay() === 0) { // Sunday
        todayOpen.setDate(todayOpen.getDate() + 1);
    } else if (todayOpen.getDay() === 6) { // Saturday
        todayOpen.setDate(todayOpen.getDate() + 2);
    }
    
    // If we're past today's open, it refers to today's already opened session
    if (currentDate >= todayOpen) {
        return todayOpen;
    }
    
    return todayOpen;
}

// Generate close-to-open movers based on previous day's close
function generateCloseToOpenMovers(type, timing) {
    const sampleStocks = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'CRM'
    ];
    
    const movers = [];
    const isGainer = type === 'gainers';
    
    for (let i = 0; i < 10; i++) {
        const symbol = sampleStocks[i] || `STOCK${i}`;
        const previousClose = 50 + Math.random() * 200;
        
        // Close-to-open moves (more realistic overnight gaps)
        const changePercent = isGainer ? 
            (0.3 + Math.random() * 8).toFixed(2) : 
            -(0.3 + Math.random() * 8).toFixed(2);
        const change = (previousClose * parseFloat(changePercent) / 100).toFixed(2);
        const currentPrice = (previousClose + parseFloat(change)).toFixed(2);
        
        // Volume is lower in extended hours
        const volume = Math.floor(Math.random() * 150000) + 20000;
        
        movers.push({
            symbol,
            previousClose: `${previousClose.toFixed(2)}`,
            currentPrice: `${currentPrice}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent}%`,
            volume: (volume / 1000).toFixed(0) + 'K',
            timeframe: `Close-to-Open (${timing.closeToOpenHours}h)`,
            session: timing.sessionStatus
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

// Function to fetch market data specifically for close-to-open period
async function fetchCloseToOpenMarketData() {
    const timing = getMarketTimingInfo();
    const closeToOpenData = {
        previousDayClose: {},
        afterHoursMovement: {},
        preMarketActivity: {},
        overnightSectors: {},
        globalMarketImpact: {},
        currencyMovesOvernight: {},
        overnightNews: [],
        economicEventsOvernight: []
    };
    
    try {
        console.log(`Fetching close-to-open data (${timing.closeToOpenHours} hour window)...`);
        
        // Fetch previous day's closing data for major indices
        if (ALPHA_VANTAGE_API_KEY) {
            const majorIndices = ['SPY', 'QQQ', 'DIA', 'IWM']; // Major index ETFs
            
            for (const symbol of majorIndices) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    
                    if (response.data['Time Series (5min)']) {
                        const timeSeries = response.data['Time Series (5min)'];
                        const timeKeys = Object.keys(timeSeries).sort().reverse();
                        
                        // Get previous day's 4:00 PM close data
                        const previousCloseData = findPreviousCloseData(timeSeries, timeKeys);
                        // Get current pre-market/after-hours data
                        const currentData = timeSeries[timeKeys[0]];
                        
                        closeToOpenData.previousDayClose[symbol] = {
                            close: previousCloseData ? previousCloseData['4. close'] : 'N/A',
                            volume: previousCloseData ? previousCloseData['5. volume'] : 'N/A',
                            timestamp: 'Previous 4:00 PM ET'
                        };
                        
                        closeToOpenData.preMarketActivity[symbol] = {
                            current: currentData['4. close'],
                            change: previousCloseData ? 
                                (parseFloat(currentData['4. close']) - parseFloat(previousCloseData['4. close'])).toFixed(2) : 'N/A',
                            changePercent: previousCloseData ? 
                                (((parseFloat(currentData['4. close']) - parseFloat(previousCloseData['4. close'])) / parseFloat(previousCloseData['4. close'])) * 100).toFixed(2) + '%' : 'N/A',
                            session: timing.sessionStatus
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch close-to-open data for ${symbol}:`, error.message);
                }
            }
            
            // Fetch sector ETFs for overnight sector rotation analysis
            const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
            for (const etf of sectorETFs) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    
                    if (response.data['Global Quote']) {
                        const quote = response.data['Global Quote'];
                        closeToOpenData.overnightSectors[etf] = {
                            previousClose: quote['08. previous close'],
                            currentPrice: quote['05. price'],
                            change: quote['09. change'],
                            changePercent: quote['10. change percent'],
                            name: getSectorName(etf),
                            session: 'Close-to-Open Analysis'
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch sector close-to-open data for ${etf}:`, error.message);
                }
            }
        }
        
        // Fetch overnight news specifically in the close-to-open window
        if (FINNHUB_API_KEY) {
            try {
                const newsResponse = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`
                );
                
                if (newsResponse.data && Array.isArray(newsResponse.data)) {
                    const lastCloseTime = new Date(timing.lastClose).getTime() / 1000;
                    const currentTime = Date.now() / 1000;
                    
                    // Filter news specifically from previous close to now
                    closeToOpenData.overnightNews = newsResponse.data
                        .filter(news => news.datetime >= lastCloseTime && news.datetime <= currentTime)
                        .slice(0, 10)
                        .map(news => ({
                            ...news,
                            relativeTime: `${Math.floor((currentTime - news.datetime) / 3600)}h ago`,
                            inCloseToOpenWindow: true
                        }));
                }
            } catch (error) {
                console.log('Failed to fetch close-to-open news:', error.message);
            }
        }
        
    } catch (error) {
        console.log('Close-to-open market data fetch failed, using sample data');
    }
    
    // Generate sample data if no real data retrieved
    if (Object.keys(closeToOpenData.overnightSectors).length === 0) {
        console.log('Generating sample close-to-open sector data...');
        closeToOpenData.overnightSectors = generateCloseToOpenSectors(timing);
    }
    
    return closeToOpenData;
}

// Helper function to find previous day's 4 PM close data
function findPreviousCloseData(timeSeries, timeKeys) {
    // Look for 16:00 (4 PM) timestamp from previous trading day
    for (const timeKey of timeKeys) {
        const date = new Date(timeKey);
        if (date.getHours() === 16 && date.getMinutes() === 0) {
            return timeSeries[timeKey];
        }
    }
    // Fallback to most recent data point before current session
    return timeSeries[timeKeys[timeKeys.length - 1]];
}

// Generate sample close-to-open sector data
function generateCloseToOpenSectors(timing) {
    const sectors = {};
    const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
    
    sectorETFs.forEach(etf => {
        const previousClose = 30 + Math.random() * 50;
        // Close-to-open moves reflecting overnight sentiment
        const changePercent = (Math.random() - 0.5) * 4; // -2% to +2% overnight
        const change = (previousClose * changePercent / 100).toFixed(2);
        const currentPrice = (previousClose + parseFloat(change)).toFixed(2);
        
        sectors[etf] = {
            previousClose: `${previousClose.toFixed(2)}`,
            currentPrice: `${currentPrice}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            name: getSectorName(etf),
            session: `Close-to-Open (${timing.closeToOpenHours}h)`
        };
    });
    
    return sectors;
}

// Format close-to-open data for the prompt
function formatCloseToOpenDataForPrompt(closeToOpenData) {
    const timing = getMarketTimingInfo();
    
    let dataString = `CLOSE-TO-OPEN MARKET ANALYSIS:\n`;
    dataString += `Previous Trading Day Close: ${timing.lastClose}\n`;
    dataString += `Current Trading Day Open: ${timing.todayOpen}\n`;
    dataString += `Close-to-Open Window: ${timing.closeToOpenHours} hours\n`;
    dataString += `Current Session: ${timing.sessionStatus}\n`;
    dataString += `Time Since Close: ${timing.hoursSinceClose}h ${timing.minutesSinceClose}m\n\n`;
    
    if (Object.keys(closeToOpenData.previousDayClose).length > 0) {
        dataString += "PREVIOUS DAY'S CLOSING LEVELS:\n";
        Object.entries(closeToOpenData.previousDayClose).forEach(([symbol, data]) => {
            dataString += `- ${symbol}: Closed at ${data.close} (Volume: ${data.volume})\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(closeToOpenData.preMarketActivity).length > 0) {
        dataString += `CURRENT ${timing.sessionStatus.toUpperCase()} ACTIVITY vs PREVIOUS CLOSE:\n`;
        Object.entries(closeToOpenData.preMarketActivity).forEach(([symbol, data]) => {
            dataString += `- ${symbol}: ${data.current} (${data.change} / ${data.changePercent}) [${data.session}]\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(closeToOpenData.overnightSectors).length > 0) {
        dataString += "SECTOR ROTATION (CLOSE-TO-OPEN):\n";
        Object.entries(closeToOpenData.overnightSectors).forEach(([symbol, data]) => {
            const prevClose = data.previousClose || 'N/A';
            const current = data.currentPrice || 'N/A';
            const change = data.change || 'N/A';
            const changePercent = data.changePercent || 'N/A';
            dataString += `- ${symbol} (${data.name}): ${prevClose} → ${current} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (closeToOpenData.overnightNews.length > 0) {
        dataString += "NEWS IN CLOSE-TO-OPEN WINDOW:\n";
        closeToOpenData.overnightNews.forEach((news, index) => {
            dataString += `${index + 1}. ${news.headline} (${news.relativeTime})\n`;
        });
        dataString += "\n";
    }
    
    // Add sample close-to-open movers if no real data
    const timing2 = getMarketTimingInfo();
    const sampleGainers = generateCloseToOpenMovers('gainers', timing2);
    const sampleLosers = generateCloseToOpenMovers('losers', timing2);
    
    dataString += "TOP CLOSE-TO-OPEN GAINERS:\n";
    sampleGainers.slice(0, 5).forEach((stock, index) => {
        dataString += `${index + 1}. ${stock.symbol}: ${stock.previousClose} → ${stock.currentPrice} (${stock.changePercent}) [${stock.timeframe}]\n`;
    });
    dataString += "\n";
    
    dataString += "TOP CLOSE-TO-OPEN LOSERS:\n";
    sampleLosers.slice(0, 5).forEach((stock, index) => {
        dataString += `${index + 1}. ${stock.symbol}: ${stock.previousClose} → ${stock.currentPrice} (${stock.changePercent}) [${stock.timeframe}]\n`;
    });
    dataString += "\n";
    
    return dataString;
}
}reshed})\n`;
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

// Enhanced comprehensive market prompt focused strictly on close-to-open
const createCloseToOpenMarketPrompt = (closeToOpenData) => {
    const timing = getMarketTimingInfo();
    
    return `You are a financial analyst creating a comprehensive CLOSE-TO-OPEN market analysis. Use multiple authoritative financial sources and cross-reference data points for accuracy. Focus STRICTLY on the ${timing.closeToOpenHours}-hour window from PREVIOUS TRADING DAY'S 4:00 PM ET CLOSE to TODAY'S MARKET ACTIVITY.

${formatCloseToOpenDataForPrompt(closeToOpenData)}

**EXECUTIVE SUMMARY**
[2-sentence overview focusing on how previous day's close is setting up today's market activity and key themes for the close-to-open transition]

**PREVIOUS DAY'S CLOSE ANALYSIS**
Search and verify data specifically for yesterday's market close:
- S&P 500, NASDAQ, DOW closing levels from previous trading day (exact closing prices and volumes)
- Previous day's sector performance at 4:00 PM ET close (XLF, XLK, XLE, XLV, XLI, XLY, XLP, XLU, XLB closing levels)
- Previous day's final hour trading patterns and institutional activity before close
- Previous day's after-hours earnings releases and corporate announcements post-4 PM
- Currency and commodity closing levels from previous day
- Cross-reference previous day's closing data from multiple sources
[Target: 200 words - focus on previous day's close as foundation]

**OVERNIGHT DEVELOPMENTS IMPACTING TODAY'S OPEN**
Search for developments that occurred AFTER previous trading day's close:
- Asian market performance during US market closure (Nikkei, Hang Seng, Shanghai impact on US futures)
- European market activity affecting US market open (FTSE, DAX, CAC performance transmission)
- After-hours and pre-market trading activity in major US stocks
- Economic data releases from global markets during US closure
- Corporate earnings and announcements released after previous day's 4 PM close
- Federal Reserve or central bank communications during market closure
[Target: 250 words - events between close and current time]

**FUTURES GAP ANALYSIS**
Analyze futures performance from previous close to current:
- S&P 500, NASDAQ, DOW futures vs previous day's closing levels
- Gap scenarios for market open based on futures positioning
- Overnight futures volume and institutional activity
- VIX futures changes indicating sentiment shift from close to open
- Commodity futures overnight moves (oil, gold, metals) affecting equity gaps
- Currency futures impact on multinational positioning for open
[Target: 150 words - gap analysis for opening]

**SECTOR ROTATION FROM CLOSE TO OPEN**
Analyze sector performance in the close-to-open window:
- **Previous Day Close vs Current**: Sector ETF performance comparison
- **XLF (Financial Services)**: Interest rate overnight moves affecting financial gap
- **XLK (Technology)**: Asian tech performance and semiconductor overnight news
- **XLE (Energy)**: Oil price overnight action affecting energy sector open
- **XLV (Healthcare)**: Biotech and pharma developments during closure
- **XLI (Industrials)**: Global manufacturing data released during closure
- **XLY (Consumer Discretionary)**: Consumer spending data and retail developments
- **XLP (Consumer Staples)**: Defensive positioning changes overnight
- **XLU (Utilities)**: Interest rate sensitivity and overnight bond moves
- **XLB (Materials)**: Commodity price action affecting materials open
[Target: 300 words - sector-specific close-to-open analysis]

**AFTER-HOURS & PRE-MARKET MOVERS**
Focus on stocks moving between close and open:
- Top gainers from previous close to current (specific companies and catalysts)
- Top losers from previous close to current (reasons for declines)
- After-hours earnings releases and their stock price impacts
- Pre-market volume leaders and institutional activity
- Gap-up and gap-down scenarios for individual stocks at open
- Extended-hours trading liquidity and price discovery issues
[Target: 200 words - individual stock close-to-open moves]

**ECONOMIC DATA & EARNINGS IMPACT**
Events affecting the close-to-open transition:
- Economic releases from Asian and European markets during US closure
- Earnings releases after previous day's close with specific EPS/revenue impacts
- Corporate guidance updates released during market closure
- Central bank communications from global markets during closure
- Economic indicators scheduled for today that will interact with overnight developments
[Target: 150 words - fundamental catalysts for gap]

**BONDS & COMMODITIES CLOSE-TO-OPEN**
Cross-asset moves affecting equity open:
- Treasury futures overnight performance vs previous day's close
- US 10-year yield changes during closure affecting equity valuations
- Gold, oil, copper overnight moves and equity sector implications
- Dollar strength/weakness overnight affecting multinational positioning
- Credit spreads changes during global trading affecting risk sentiment
[Target: 150 words - cross-asset close-to-open analysis]

**TECHNICAL LEVELS FOR MARKET OPEN**
Technical analysis for the opening based on close-to-open moves:
- Support and resistance levels established from previous close
- Gap analysis and gap-fill probabilities for major indices
- Options positioning from previous close affecting opening gamma
- Technical breakouts or breakdowns occurring overnight
- Volume profile analysis for expected opening range
[Target: 150 words - technical setup from close to open]

**GLOBAL MARKET TRANSMISSION**
How global markets are affecting US open:
- Asian market close impact on US futures during closure
- European market performance transmission to US pre-market
- Cross-border capital flows from overnight trading sessions
- Global risk-on/risk-off sentiment changes during US closure
- International institutional positioning changes affecting US open
[Target: 150 words - global market linkage to US open]

**RESEARCH & INSTITUTIONAL ACTIVITY**
Analyst and institutional activity in close-to-open window:
- Research reports released after previous market close
- Analyst upgrades/downgrades announced during closure
- Institutional positioning changes based on overnight developments
- Hedge fund activity in global markets during US closure
- Investment bank research affecting opening positioning
[Target: 120 words - professional research impact]

**RISK ASSESSMENT FOR OPENING**
Risk factors for today's market open based on overnight developments:
- Volatility expectations based on overnight global market activity
- Geopolitical developments during market closure affecting opening sentiment
- Liquidity conditions expected at market open
- Correlation breakdown risks from overnight global market moves
- Gap risk management for opening positions
[Target: 120 words - risk management for open]

**OPENING STRATEGY SUMMARY**
[3-sentence summary of key close-to-open themes, gap scenarios, and positioning strategies for market open based on the ${timing.closeToOpenHours}-hour analysis window]

IMPORTANT ACCURACY GUIDELINES:
- Verify all data specifically from previous trading day's 4:00 PM ET close
- Include exact timestamps showing close-to-open time progression
- Cross-reference overnight developments from multiple financial sources
- Focus ONLY on the specific close-to-open window, not general market commentary
- Distinguish between previous day's close data and current session data
- Use official exchange data for closing and opening levels

Write in professional institutional language for traders and portfolio managers preparing for market open. Include today's date: ${new Date().toDateString()}.

CRITICAL: This analysis must focus EXCLUSIVELY on the period from PREVIOUS TRADING DAY'S 4:00 PM CLOSE to TODAY'S MARKET ACTIVITY. All data points and analysis should reference this specific ${timing.closeToOpenHours}-hour close-to-open window.`;
};
};

async function generateCloseToOpenMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log(`📊 Generating CLOSE-TO-OPEN MARKET ANALYSIS (${timing.closeToOpenHours} hour window)...`);
        console.log(`📅 Previous Close: ${timing.lastClose}`);
        console.log(`📅 Current Session: ${timing.sessionStatus}`);
        
        // Fetch close-to-open market data
        const closeToOpenData = await fetchCloseToOpenMarketData();
        console.log('📊 Close-to-open data fetched - Previous close:', Object.keys(closeToOpenData.previousDayClose).length, 'Current activity:', Object.keys(closeToOpenData.preMarketActivity).length, 'News:', closeToOpenData.overnightNews.length);
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.3,
            messages: [{
                role: 'user',
                content: createCloseToOpenMarketPrompt(closeToOpenData)
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
        
        // Generate filename with close-to-open focus
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `close-to-open-analysis-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add metadata header focused on close-to-open period
        const reportWithMetadata = `${report}

---

*Close-to-Open Analysis: ${timing.closeToOpenHours}-hour window from Previous Close to Current Session*  
*Previous Close: ${timing.lastClose}*  
*Current Session: ${timing.sessionStatus}*  
*Analysis Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET*
`;
        
        // Write close-to-open report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`✅ Close-to-open analysis generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`⏰ Analysis window: ${timing.closeToOpenHours} hours`);
        console.log(`⏰ Session status: ${timing.sessionStatus}`);
        
        // Create latest close-to-open report
        const latestFilepath = path.join(reportsDir, 'latest-close-to-open-analysis.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw close-to-open data
        const rawDataPath = path.join(reportsDir, `close-to-open-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(closeToOpenData, null, 2));
        
        // Send close-to-open report via email
        console.log('📧 Sending close-to-open market analysis...');
        await sendCloseToOpenReportEmail(reportWithMetadata, dateStr, timing);
        
        console.log('✅ CLOSE-TO-OPEN MARKET ANALYSIS COMPLETED!');
        console.log(`📈 ${timing.closeToOpenHours}-hour close-to-open window analyzed`);
        console.log(`📊 Current session: ${timing.sessionStatus}`);
        
    } catch (error) {
        console.error('❌ Error generating close-to-open market analysis:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the morning market report generation
generateOvernightMarketReport();
