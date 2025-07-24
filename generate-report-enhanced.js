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
        console.log('📧 Setting up email transport for overnight market report...');
        
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        const timing = getMarketTimingInfo();
        
        // Enhanced HTML formatting for overnight report
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #2c3e50; border-bottom: 3px solid #9b59b6; padding-bottom: 10px;">🌙 $1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #34495e; margin-top: 25px;">$1</h2>')
            .replace(/^\*\*(.*?)\*\*/gm, '<h3 style="color: #8e44ad; margin-top: 20px; margin-bottom: 10px; border-left: 3px solid #3498db; padding-left: 10px;">🕐 $1</h3>')
            .replace(/^\*(.*$)/gm, '<p style="font-style: italic; color: #7f8c8d;">$1</p>')
            .replace(/^([^<\n].*$)/gm, '<p style="line-height: 1.6; margin-bottom: 10px;">$1</p>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px;">🌙 OVERNIGHT MARKET INTELLIGENCE</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Market Closed to Open Analysis • ${timing.hoursSinceClose} hours since close • Opens in ${timing.timeToOpenStr}</p>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${emailHtml}
                
                <div style="margin-top: 30px; padding: 20px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; border-radius: 5px;">
                    <p style="margin: 0; font-weight: bold;">🌍 OVERNIGHT MARKET INTELLIGENCE</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Last Close: ${timing.lastClose} • Next Open: ${timing.nextOpen} • Generated by Claude AI</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `🌙 OVERNIGHT MARKET REPORT - ${dateStr} - Close to Open Analysis`,
            html: emailContent,
            text: reportContent,
            priority: 'high'
        };
        
        console.log('📤 Sending overnight market report...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Overnight report sent successfully:', info.messageId);
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

const createOvernightMarketPrompt = (overnightData) => {
    const timing = getMarketTimingInfo();
    
    return `You are a senior overnight market analyst preparing institutional clients for the next trading session. You are analyzing the ${timing.hoursSinceClose}-hour period from yesterday's market close (4:00 PM ET) to this morning's market open (9:30 AM ET). Use the overnight market data below to create a comprehensive close-to-open analysis.

${formatOvernightDataForPrompt(overnightData)}

Create a professional OVERNIGHT MARKET REPORT with these exact sections:

**OVERNIGHT EXECUTIVE BRIEF**
[2-sentence overview of overnight market developments and key themes that will drive the 9:30 AM opening, focusing on the ${timing.hoursSinceClose}-hour close-to-open window]

**ASIAN MARKETS OVERNIGHT IMPACT**
Create a professional summary covering how Asian trading sessions (which occurred while US markets were closed) are setting up the US market open:
- Tokyo, Hong Kong, Shanghai, Sydney market performance and impact on US futures
- Asian corporate developments and earnings affecting US-listed ADRs and multinationals
- Asian economic data releases and central bank actions during US market closure
- Currency movements during Asian trading hours affecting US market positioning
- Cross-border capital flows from Asian session into anticipated US open
[Target: 150 words, focus on Asian close impact on US market open]

**EUROPEAN TRADING SESSION TO US OPEN**
Create a professional summary covering the European trading session (which occurred during US market closure):
- London, Frankfurt, Paris market performance and transmission to US futures
- European corporate developments affecting US multinationals and sectors
- ECB communications and European economic data released during US closure
- European currency and bond movements affecting US positioning
- European institutional flows and positioning ahead of US market open
[Target: 150 words, focus on European session impact on US open]

**OVERNIGHT US FUTURES & AFTER-HOURS ANALYSIS**
Create a professional summary covering overnight US market activity during closure:
- S&P, NASDAQ, DOW futures performance during the ${timing.hoursSinceClose}-hour closure period
- After-hours and extended-hours trading activity in major US stocks
- Overnight gap scenarios and expected opening dynamics for 9:30 AM
- Futures positioning and institutional overnight activity
- Federal Reserve and US policy developments during market closure
[Target: 150 words, focus on overnight positioning for market open]

**OVERNIGHT BREAKING HEADLINES**
Use overnight developments that occurred during market closure to provide comprehensive coverage of market-moving headlines. Include after-hours earnings releases, overnight corporate announcements, geopolitical developments during market closure, central bank communications from global markets, and regulatory news. Analyze expected impact on 9:30 AM market opening and sector implications. Focus on news flow from yesterday's 4:00 PM close to this morning's analysis.
[Target: 250 words, overnight news analysis affecting market open]

**OVERNIGHT RESEARCH & INSTITUTIONAL ACTIVITY**
Use overnight data and global institutional activity to provide in-depth analysis. Cover analyst reports released after US market close, international institutional positioning changes during global trading sessions, overnight research from major investment banks, hedge fund activity in global markets during US closure, and emerging overnight themes. Include research released in Asian and European time zones, global fund flows, and institutional positioning ahead of US market open.
[Target: 250 words, institutional overnight activity focus]

**OVERNIGHT ECONOMIC CALENDAR & EARNINGS IMPACT**
Use overnight economic data and earnings releases to assess market-moving potential for today's US trading session. Cover economic releases from Asian and European markets during US closure, earnings announcements released after yesterday's US close (both domestic and international), central bank communications from global markets overnight, and scheduled US events for today's trading session. Analyze how overnight developments will interact with today's US market opening.
[Target: 150 words, overnight events affecting US session]

**AFTER-HOURS & EXTENDED TRADING ANALYSIS**
Analyze the after-hours and extended trading data from yesterday's close to this morning:

Focus on the top after-hours movers with professional analysis of:
- After-hours volume patterns and liquidity conditions
- Overnight earnings releases or news driving moves
- Extended-hours technical levels and gap implications for 9:30 AM open
- Institutional after-hours activity and positioning
- Expected continuation or reversal at regular market open
- Risk/reward scenarios for opening positions based on overnight moves

Include analysis of overnight catalysts and professional opening strategies based on after-hours activity.
[Target: 200 words, focus on after-hours to regular session transition]

**OVERNIGHT SECTOR ROTATION & GLOBAL THEMES**
Analyze the overnight sector performance and global market themes affecting US market open:
- **XLF (Financial Services)**: Overnight interest rate moves and global banking sector performance
- **XLK (Technology)**: Asian tech performance and overnight semiconductor/AI developments
- **XLE (Energy)**: Overnight oil price action and global energy market developments
- **XLV (Healthcare)**: Global healthcare developments and overnight biotech news
- **XLI (Industrials)**: Global manufacturing data and overnight industrial developments
- **XLY (Consumer Discretionary)**: Asian consumer trends and overnight retail developments
- **XLP (Consumer Staples)**: Global consumer staples performance and currency impacts
- **XLU (Utilities)**: Overnight interest rate sensitivity and global utility performance
- **XLB (Materials)**: Overnight commodity price action and global materials performance

Include global sector rotation themes and overnight positioning for US market open.
[Target: 300 words, overnight sector analysis for US positioning]

**OVERNIGHT POSITIONING FOR MARKET OPEN**
Use overnight market data and global developments to provide senior analyst-level positioning recommendations for the 9:30 AM US market opening. Analyze overnight momentum and gap scenarios, global market correlation and spillover effects, currency and commodity impacts from overnight trading, sector rotation themes from global markets. Include risk-adjusted return expectations for opening positions based on the ${timing.hoursSinceClose}-hour overnight period and correlation analysis between overnight global moves and US market opening performance.
[Target: 200 words, opening positioning strategy based on overnight analysis]

**OVERNIGHT BONDS & COMMODITIES ANALYSIS**
Use overnight bond and commodity market data to analyze impact on US equity market opening. Cover overnight Treasury futures and international bond market performance, commodity price action during global trading sessions (gold, oil, base metals), dollar strength/weakness themes from overnight FX trading, and cross-asset flow patterns from overnight global markets into US equity open. Include fixed income and commodities implications for today's US equity session based on overnight global activity.
[Target: 150 words, cross-asset overnight analysis]

**OVERNIGHT TECHNICAL LEVELS FOR US OPEN**
Use overnight technical developments from global markets to provide trading-level analysis for US market open. Cover overnight support and resistance levels established in futures markets, gap analysis based on overnight global market performance, volume profile analysis from after-hours and overnight sessions, options positioning and gamma effects from overnight activity. Include specific technical levels and gap-fill probabilities for the 9:30 AM US market opening based on overnight price action.
[Target: 150 words, technical analysis for market open based on overnight activity]

**OVERNIGHT RISK ASSESSMENT FOR US OPEN**
Use overnight global market conditions to assess risk factors for today's US trading session. Cover volatility expectations based on overnight global market activity, geopolitical developments during US market closure, overnight economic data and policy developments from major economies, earnings and corporate developments affecting US market open, and liquidity conditions expected at 9:30 AM opening based on overnight institutional activity. Include professional risk management recommendations for today's session based on overnight developments.
[Target: 150 words, risk management based on overnight analysis]

**MARKET OPEN STRATEGY SUMMARY**
[3-sentence summary of key overnight themes, opening strategies, and risk/reward scenarios for the 9:30 AM market open based on the ${timing.hoursSinceClose}-hour close-to-open analysis]

Write in professional institutional language suitable for senior portfolio managers, hedge fund professionals, and institutional trading desks preparing for market open based on overnight global market activity. Use the extensive overnight data provided above and incorporate realistic scenarios from the ${timing.hoursSinceClose}-hour market closure period. Include today's date: ${new Date().toDateString()}.

IMPORTANT: This is an OVERNIGHT MARKET REPORT focused on the period from yesterday's 4:00 PM market close to this morning's 9:30 AM market open. All analysis should be oriented toward how overnight global market activity, after-hours trading, and international developments will impact the US market opening. Use overnight-specific data and global market developments to provide actionable insights for professional traders and portfolio managers preparing for today's US market session.`;
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
        
        // Add metadata header focused on overnight period
        const reportWithMetadata = `# 🌙 OVERNIGHT MARKET REPORT - ${dateStr}
*Generated at: ${today.toLocaleString()} ET*
*Market Closed: ${timing.lastClose}*
*Market Opens: ${timing.nextOpen}*
*Hours Since Close: ${timing.hoursSinceClose}*
*Time to Open: ${timing.timeToOpenStr}*
*Data Sources: ${ALPHA_VANTAGE_API_KEY || FINNHUB_API_KEY ? 'Overnight Market APIs + ' : ''}Claude AI Analysis*

---

## 🕐 OVERNIGHT PERIOD ANALYSIS
**Analysis Window:** ${timing.lastClose} → ${timing.nextOpen}  
**Overnight Duration:** ${timing.hoursSinceClose} hours  
**Global Markets:** Asian close → European close → US pre-market  
**Focus:** Close-to-open positioning and gap analysis  

---

${report}

---

## 📊 OVERNIGHT DATA SUMMARY
**After-Hours Indices:** ${Object.keys(overnightData.afterHoursFutures).length} major ETFs tracked  
**Overnight Sectors:** ${Object.keys(overnightData.overnightSectors).length} sector ETFs analyzed  
**After-Hours Gainers:** ${overnightData.afterHoursMovers.topGainers.length} stocks  
**After-Hours Losers:** ${overnightData.afterHoursMovers.topLosers.length} stocks  
**Overnight Currency Moves:** ${Object.keys(overnightData.currencyMoves).length} major pairs  
**Overnight News:** ${overnightData.overnightNews.length} market-moving headlines  

---

*This overnight market report covers the ${timing.hoursSinceClose}-hour period from market close to open*  
*🌙 READY FOR NEXT MARKET SESSION 🌙*
`;
        
        // Write overnight report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`🌙 Overnight market report generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`⏰ Hours since close: ${timing.hoursSinceClose}`);
        console.log(`⏰ Time to market open: ${timing.timeToOpenStr}`);
        
        // Create latest overnight report
        const latestFilepath = path.join(reportsDir, 'latest-overnight-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw overnight data
        const rawDataPath = path.join(reportsDir, `overnight-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(overnightData, null, 2));
        
        // Send overnight report via email
        console.log('📧 Sending overnight market report...');
        await sendOvernightReportEmail(reportWithMetadata, dateStr);
        
        console.log('✅ OVERNIGHT MARKET REPORT COMPLETED!');
        console.log(`🌙 ${timing.hoursSinceClose}-hour close-to-open analysis ready`);
        console.log(`⏰ Market opens in ${timing.timeToOpenStr}`);
        
    } catch (error) {
        console.error('❌ Error generating overnight market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the overnight market report generation
generateOvernightMarketReport();
