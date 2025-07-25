const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY; // More reliable for real-time data
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

// Calculate market timing information with proper market hours
function getMarketTimingInfo() {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Market hours: 9:30 AM - 4:00 PM ET
    const lastClose = new Date(easternTime);
    const nextOpen = new Date(easternTime);
    
    // Determine last market close
    if (easternTime.getDay() === 0) { // Sunday
        lastClose.setDate(lastClose.getDate() - 2); // Friday
    } else if (easternTime.getDay() === 6) { // Saturday
        lastClose.setDate(lastClose.getDate() - 1); // Friday
    } else if (easternTime.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1); // Previous day
    }
    lastClose.setHours(16, 0, 0, 0);
    
    // Determine next market open
    if (easternTime.getDay() === 0) { // Sunday
        nextOpen.setDate(nextOpen.getDate() + 1); // Monday
    } else if (easternTime.getDay() === 6) { // Saturday
        nextOpen.setDate(nextOpen.getDate() + 2); // Monday
    } else if (easternTime.getHours() >= 16) {
        nextOpen.setDate(nextOpen.getDate() + 1); // Next day
    }
    nextOpen.setHours(9, 30, 0, 0);
    
    // Skip weekends for next open
    if (nextOpen.getDay() === 0) nextOpen.setDate(nextOpen.getDate() + 1); // Skip Sunday
    if (nextOpen.getDay() === 6) nextOpen.setDate(nextOpen.getDate() + 2); // Skip Saturday
    
    const hoursSinceClose = Math.floor((easternTime - lastClose) / (1000 * 60 * 60));
    const timeToOpen = nextOpen - easternTime;
    const hoursToOpen = Math.floor(timeToOpen / (1000 * 60 * 60));
    const minutesToOpen = Math.floor((timeToOpen % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
        lastClose: lastClose.toLocaleString("en-US", {timeZone: "America/New_York"}),
        nextOpen: nextOpen.toLocaleString("en-US", {timeZone: "America/New_York"}),
        hoursSinceClose: Math.max(0, hoursSinceClose),
        timeToOpenStr: `${hoursToOpen}h ${minutesToOpen}m`,
        isMarketHours: easternTime.getHours() >= 9.5 && easternTime.getHours() < 16 && easternTime.getDay() >= 1 && easternTime.getDay() <= 5
    };
}

// Fetch real market data with error handling and validation
async function fetchRealMarketData() {
    const marketData = {
        futures: {},
        sectors: {},
        currencies: {},
        news: [],
        dataSourceUsed: 'live',
        timestamp: new Date().toISOString(),
        errors: []
    };
    
    try {
        console.log('🔄 Fetching real market data...');
        
        // Primary: Try Polygon API first (more reliable)
        if (POLYGON_API_KEY) {
            console.log('📊 Using Polygon API for market data...');
            
            const majorIndices = ['SPY', 'QQQ', 'DIA'];
            const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
            const allSymbols = [...majorIndices, ...sectorETFs];
            
            // Get previous trading day for comparison
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            // Fetch data for all symbols
            for (const symbol of allSymbols) {
                try {
                    // Get current quote
                    const quoteResponse = await axios.get(
                        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${POLYGON_API_KEY}`,
                        { timeout: 10000 }
                    );
                    
                    if (quoteResponse.data && quoteResponse.data.results && quoteResponse.data.results.length > 0) {
                        const result = quoteResponse.data.results[0];
                        const price = result.c; // close price
                        const open = result.o; // open price
                        const change = price - open;
                        const changePercent = ((change / open) * 100);
                        
                        const stockData = {
                            price: price.toFixed(2),
                            change: change.toFixed(2),
                            changePercent: changePercent.toFixed(2),
                            volume: result.v?.toLocaleString() || 'N/A',
                            high: result.h?.toFixed(2) || 'N/A',
                            low: result.l?.toFixed(2) || 'N/A',
                            lastUpdated: new Date(result.t).toISOString(),
                            source: 'Polygon'
                        };
                        
                        if (majorIndices.includes(symbol)) {
                            marketData.futures[symbol] = stockData;
                        } else {
                            marketData.sectors[symbol] = {
                                ...stockData,
                                name: getSectorName(symbol)
                            };
                        }
                    } else {
                        marketData.errors.push(`No data returned from Polygon for ${symbol}`);
                    }
                    
                    // Rate limiting for Polygon (free tier: 5 requests per minute)
                    await new Promise(resolve => setTimeout(resolve, 13000));
                    
                } catch (error) {
                    marketData.errors.push(`Polygon API error for ${symbol}: ${error.message}`);
                }
            }
            
            // Fetch forex data from Polygon
            const currencies = ['C:EURUSD', 'C:GBPUSD', 'C:USDJPY'];
            for (const currency of currencies) {
                try {
                    const forexResponse = await axios.get(
                        `https://api.polygon.io/v1/last/currencies/${currency}?apikey=${POLYGON_API_KEY}`,
                        { timeout: 10000 }
                    );
                    
                    if (forexResponse.data && forexResponse.data.last) {
                        const pair = currency.replace('C:', '');
                        marketData.currencies[pair] = {
                            rate: forexResponse.data.last.bid?.toFixed(4) || forexResponse.data.last.exchange_rate?.toFixed(4) || 'N/A',
                            lastRefreshed: new Date(forexResponse.data.last.timestamp || Date.now()).toISOString(),
                            source: 'Polygon'
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 13000));
                    
                } catch (error) {
                    marketData.errors.push(`Polygon forex error for ${currency}: ${error.message}`);
                }
            }
        }
        
        // Fallback: Alpha Vantage if Polygon fails or has limited data
        else if (ALPHA_VANTAGE_API_KEY) {
            console.log('📊 Using Alpha Vantage API as fallback...');
            
            const majorIndices = ['SPY', 'QQQ', 'DIA'];
            
            for (const symbol of majorIndices) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                        { timeout: 10000 }
                    );
                    
                    if (response.data['Global Quote'] && response.data['Global Quote']['05. price']) {
                        const quote = response.data['Global Quote'];
                        marketData.futures[symbol] = {
                            price: parseFloat(quote['05. price']).toFixed(2),
                            change: parseFloat(quote['09. change']).toFixed(2),
                            changePercent: quote['10. change percent'].replace('%', ''),
                            volume: quote['06. volume'],
                            lastUpdated: quote['07. latest trading day'],
                            source: 'Alpha Vantage'
                        };
                    } else {
                        marketData.errors.push(`Invalid data format for ${symbol}`);
                    }
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 12000)); // Alpha Vantage free tier: 5 calls/min
                    
                } catch (error) {
                    marketData.errors.push(`Failed to fetch ${symbol}: ${error.message}`);
                }
            }
            
            // Fetch sector ETFs with validation
            const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI'];
            for (const etf of sectorETFs) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                        { timeout: 10000 }
                    );
                    
                    if (response.data['Global Quote'] && response.data['Global Quote']['05. price']) {
                        const quote = response.data['Global Quote'];
                        marketData.sectors[etf] = {
                            price: parseFloat(quote['05. price']).toFixed(2),
                            change: parseFloat(quote['09. change']).toFixed(2),
                            changePercent: quote['10. change percent'].replace('%', ''),
                            name: getSectorName(etf),
                            source: 'Alpha Vantage'
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 12000));
                    
                } catch (error) {
                    marketData.errors.push(`Failed to fetch sector ${etf}: ${error.message}`);
                }
            }
            
            // Fetch currency data with validation
            const currencies = [
                { from: 'EUR', to: 'USD' },
                { from: 'GBP', to: 'USD' },
                { from: 'USD', to: 'JPY' }
            ];
            
            for (const curr of currencies) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${curr.from}&to_currency=${curr.to}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                        { timeout: 10000 }
                    );
                    
                    if (response.data && response.data['Realtime Currency Exchange Rate']) {
                        const rate = response.data['Realtime Currency Exchange Rate'];
                        marketData.currencies[`${curr.from}${curr.to}`] = {
                            rate: parseFloat(rate['5. Exchange Rate']).toFixed(4),
                            lastRefreshed: rate['6. Last Refreshed'],
                            source: 'Alpha Vantage'
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 12000));
                    
                } catch (error) {
                    marketData.errors.push(`Failed to fetch ${curr.from}${curr.to}: ${error.message}`);
                }
            }
        }
        
        // Fetch news with validation
        if (FINNHUB_API_KEY) {
            try {
                const newsResponse = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`,
                    { timeout: 10000 }
                );
                
                if (newsResponse.data && Array.isArray(newsResponse.data)) {
                    const twentyFourHoursAgo = Date.now() / 1000 - (24 * 60 * 60);
                    marketData.news = newsResponse.data
                        .filter(news => news.datetime > twentyFourHoursAgo && news.headline && news.headline.length > 10)
                        .slice(0, 10)
                        .map(news => ({
                            headline: news.headline,
                            summary: news.summary || '',
                            source: news.source || 'Unknown',
                            datetime: new Date(news.datetime * 1000).toISOString(),
                            url: news.url || ''
                        }));
                }
            } catch (error) {
                marketData.errors.push(`Failed to fetch news: ${error.message}`);
            }
        }
        
    } catch (error) {
        marketData.errors.push(`General error: ${error.message}`);
    }
    
    // Validate data quality
    if (Object.keys(marketData.futures).length === 0 && Object.keys(marketData.sectors).length === 0) {
        console.log('⚠️  No real data retrieved, using sample data for demonstration');
        marketData.dataSourceUsed = 'sample';
        return generateSampleMarketData();
    }
    
    const dataSource = POLYGON_API_KEY ? 'Polygon' : (ALPHA_VANTAGE_API_KEY ? 'Alpha Vantage' : 'Sample');
    console.log(`✅ Real market data fetched from ${dataSource}: ${Object.keys(marketData.futures).length} indices, ${Object.keys(marketData.sectors).length} sectors, ${marketData.news.length} news items`);
    if (marketData.errors.length > 0) {
        console.log(`⚠️  Errors encountered: ${marketData.errors.length}`);
    }
    
    return marketData;
}

// Generate sample data only when real data is unavailable
function generateSampleMarketData() {
    console.log('🔄 Generating sample market data...');
    
    const sampleData = {
        futures: {
            'SPY': { price: '458.32', change: '2.45', changePercent: '0.54', source: 'Sample' },
            'QQQ': { price: '389.67', change: '1.23', changePercent: '0.32', source: 'Sample' },
            'DIA': { price: '348.91', change: '-0.87', changePercent: '-0.25', source: 'Sample' }
        },
        sectors: {},
        currencies: {
            'EURUSD': { rate: '1.0845', source: 'Sample' },
            'GBPUSD': { rate: '1.2734', source: 'Sample' },
            'USDJPY': { rate: '149.23', source: 'Sample' }
        },
        news: [
            {
                headline: "Sample Market News - Federal Reserve Officials Comment on Economic Outlook",
                summary: "Sample news content for demonstration purposes",
                source: "Sample Source",
                datetime: new Date().toISOString()
            }
        ],
        dataSourceUsed: 'sample',
        timestamp: new Date().toISOString(),
        errors: ['Using sample data - real API data unavailable']
    };
    
    // Generate sample sector data
    const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI'];
    sectorETFs.forEach(etf => {
        const basePrice = 45 + Math.random() * 20;
        const changePercent = (Math.random() - 0.5) * 2;
        const change = (basePrice * changePercent / 100);
        
        sampleData.sectors[etf] = {
            price: basePrice.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            name: getSectorName(etf),
            source: 'Sample'
        };
    });
    
    return sampleData;
}

// Format market data for prompt with data source attribution
function formatMarketDataForPrompt(marketData) {
    const timing = getMarketTimingInfo();
    
    let dataString = `MARKET DATA ANALYSIS (${marketData.dataSourceUsed.toUpperCase()} DATA):\n`;
    dataString += `Data Timestamp: ${marketData.timestamp}\n`;
    dataString += `Market Status: ${timing.isMarketHours ? 'OPEN' : 'CLOSED'}\n`;
    dataString += `Last Market Close: ${timing.lastClose}\n`;
    dataString += `Next Market Open: ${timing.nextOpen}\n`;
    dataString += `Hours Since Close: ${timing.hoursSinceClose}\n\n`;
    
    if (marketData.errors.length > 0) {
        dataString += `DATA QUALITY NOTES:\n`;
        marketData.errors.forEach(error => {
            dataString += `- ${error}\n`;
        });
        dataString += '\n';
    }
    
    if (Object.keys(marketData.futures).length > 0) {
        dataString += "MAJOR INDICES:\n";
        Object.entries(marketData.futures).forEach(([symbol, data]) => {
            dataString += `- ${symbol}: $${data.price} (${data.change >= 0 ? '+' : ''}${data.change} / ${data.changePercent >= 0 ? '+' : ''}${data.changePercent}%) [${data.source}]\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(marketData.sectors).length > 0) {
        dataString += "SECTOR PERFORMANCE:\n";
        Object.entries(marketData.sectors).forEach(([symbol, data]) => {
            dataString += `- ${symbol} (${data.name}): $${data.price} (${data.change >= 0 ? '+' : ''}${data.change} / ${data.changePercent >= 0 ? '+' : ''}${data.changePercent}%) [${data.source}]\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(marketData.currencies).length > 0) {
        dataString += "CURRENCY RATES:\n";
        Object.entries(marketData.currencies).forEach(([pair, data]) => {
            dataString += `- ${pair}: ${data.rate} [${data.source}]\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.news.length > 0) {
        dataString += "RECENT NEWS (Last 24 Hours):\n";
        marketData.news.slice(0, 5).forEach((news, index) => {
            const newsTime = new Date(news.datetime).toLocaleString();
            dataString += `${index + 1}. ${news.headline} (${news.source} - ${newsTime})\n`;
        });
        dataString += "\n";
    }
    
    return dataString;
}

// Improved prompt with data validation and source attribution
const createImprovedMarketPrompt = (marketData) => {
    const timing = getMarketTimingInfo();
    const dataQuality = marketData.dataSourceUsed === 'live' ? 'real-time market data' : 'sample data for demonstration';
    
    return `You are a senior market analyst creating a professional market report. 

IMPORTANT: This analysis is based on ${dataQuality}. ${marketData.dataSourceUsed === 'sample' ? 'This is a demonstration report with sample data, not actual market conditions.' : 'This uses current market data from verified sources.'}

${formatMarketDataForPrompt(marketData)}

Create a professional, factual market analysis with the following sections:

**EXECUTIVE SUMMARY**
Provide a 2-3 sentence overview of current market conditions based on the data above. Focus on factual observations about price movements and trends.

**MARKET OVERVIEW**
- Current index performance and key levels
- Notable sector movements and leadership
- Market breadth and participation

**SECTOR ANALYSIS**
Analyze the sector data provided, focusing on:
- Best and worst performing sectors
- Relative strength patterns
- Sector rotation themes

**CURRENCY & GLOBAL FACTORS**
- Major currency movements and implications
- International market influences
- Cross-asset relationships

**NEWS IMPACT ANALYSIS**
Analyze how recent news items may affect market sentiment and specific sectors.

**TECHNICAL PERSPECTIVE**
- Key support and resistance levels based on current prices
- Trend analysis and momentum indicators
- Volume characteristics

**RISK ASSESSMENT**
- Current market risks and uncertainties
- Volatility expectations
- Defensive positioning considerations

**OUTLOOK & STRATEGY**
- Near-term market expectations
- Sector allocation recommendations
- Risk management considerations

Write in professional, institutional language. Base all analysis strictly on the provided data. Avoid speculation beyond what the data supports. Include data source attribution where relevant.

Date: ${new Date().toDateString()}
Market Status: ${timing.isMarketHours ? 'Markets are currently open' : 'Markets are currently closed'}
Data Quality: ${marketData.dataSourceUsed.toUpperCase()} DATA with ${marketData.errors.length} noted limitations`;
};

// Improved email function with better formatting
async function sendMarketReportEmail(reportContent, dateStr, marketData) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Setting up email transport...');
        
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        const timing = getMarketTimingInfo();
        const dataQualityBadge = marketData.dataSourceUsed === 'live' ? 
            '<span style="background-color: #2ecc71; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">LIVE DATA</span>' :
            '<span style="background-color: #f39c12; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">SAMPLE DATA</span>';
        
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">$1</h1>')
            .replace(/^\*\*(.*?)\*\*/gm, '<h2 style="color: #2c3e50; margin-top: 20px; border-bottom: 1px solid #3498db; padding-bottom: 5px;">$1</h2>')
            .replace(/^- (.*$)/gm, '<li style="margin-bottom: 5px;">$1</li>')
            .replace(/^([^<\n-].*$)/gm, '<p style="line-height: 1.6; margin-bottom: 10px;">$1</p>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2c3e50; margin: 0;">Market Intelligence Report</h1>
                    <p style="margin: 5px 0; color: #7f8c8d;">${dateStr} • ${dataQualityBadge}</p>
                </div>
                
                ${emailHtml}
                
                <div style="margin-top: 30px; padding: 15px; background-color: #ecf0f1; border-radius: 5px; border-left: 4px solid #3498db;">
                    <p style="margin: 0; font-weight: bold; color: #2c3e50;">Report Details</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #7f8c8d;">
                        Market Status: ${timing.isMarketHours ? 'Open' : 'Closed'} • 
                        Data Source: ${marketData.dataSourceUsed.toUpperCase()} • 
                        Generated: ${new Date().toLocaleString()}
                    </p>
                    ${marketData.errors.length > 0 ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #e74c3c;">Note: ${marketData.errors.length} data limitations noted in report</p>` : ''}
                </div>
            </div>
        </div>`;
        
        const subjectPrefix = marketData.dataSourceUsed === 'live' ? '[LIVE]' : '[DEMO]';
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `${subjectPrefix} Market Intelligence Report - ${dateStr}`,
            html: emailContent,
            text: reportContent,
            priority: marketData.dataSourceUsed === 'live' ? 'high' : 'normal'
        };
        
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Report sent successfully:', info.messageId);
        
    } catch (error) {
        console.error('❌ Failed to send report:', error.message);
    }
}

// Main function with improved error handling and validation
async function generateMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log(`📊 Generating Market Intelligence Report...`);
        console.log(`⏰ Market Status: ${timing.isMarketHours ? 'OPEN' : 'CLOSED'}`);
        
        // Validate API keys
        const availableAPIs = [];
        if (ANTHROPIC_API_KEY) availableAPIs.push('Anthropic');
        if (POLYGON_API_KEY) availableAPIs.push('Polygon');
        if (ALPHA_VANTAGE_API_KEY) availableAPIs.push('Alpha Vantage');
        if (FINNHUB_API_KEY) availableAPIs.push('Finnhub');
        
        console.log(`🔑 Available APIs: ${availableAPIs.join(', ')}`);
        
        if (!ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is required');
        }
        
        // Fetch market data with validation
        const marketData = await fetchRealMarketData();
        
        // Generate report using Claude
        console.log('🤖 Generating analysis with Claude...');
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.1, // Lower temperature for more factual output
            messages: [{
                role: 'user',
                content: createImprovedMarketPrompt(marketData)
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            timeout: 30000
        });

        const report = response.data.content[0].text;
        
        // Create reports directory
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Generate filename with data source indicator
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '');
        const dataSource = marketData.dataSourceUsed === 'live' ? 'live' : 'demo';
        const filename = `market-report-${dateStr}-${timeStr}-${dataSource}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add comprehensive metadata
        const reportWithMetadata = `# Market Intelligence Report
**Date:** ${dateStr}  
**Time:** ${new Date().toLocaleString()}  
**Market Status:** ${timing.isMarketHours ? 'OPEN' : 'CLOSED'}  
**Data Source:** ${marketData.dataSourceUsed.toUpperCase()}  
**Data Quality:** ${marketData.errors.length} limitations noted  

${marketData.dataSourceUsed === 'sample' ? `
⚠️ **DEMONSTRATION REPORT** ⚠️  
*This report uses sample data for demonstration purposes only. Do not use for actual trading or investment decisions.*

` : ''}

---

${report}

---

## Technical Details
- **APIs Used:** ${availableAPIs.join(', ')}
- **Data Timestamp:** ${marketData.timestamp}
- **Report Generated:** ${new Date().toISOString()}
${marketData.errors.length > 0 ? `- **Data Limitations:** ${marketData.errors.length} noted\n${marketData.errors.map(e => `  - ${e}`).join('\n')}` : ''}

*Generated by Claude AI Market Intelligence System*
`;
        
        // Write report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        // Create latest report link
        const latestFilepath = path.join(reportsDir, 'latest-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw data for debugging
        const rawDataPath = path.join(reportsDir, `market-data-${dateStr}-${timeStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify({
            marketData,
            timing,
            availableAPIs,
            generatedAt: new Date().toISOString()
        }, null, 2));
        
        console.log(`📄 Report saved: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`📈 Data quality: ${marketData.dataSourceUsed} (${marketData.errors.length} limitations)`);
        
        // Send email report
        await sendMarketReportEmail(reportWithMetadata, dateStr, marketData);
        
        console.log('✅ MARKET REPORT COMPLETED SUCCESSFULLY!');
        
    } catch (error) {
        console.error('❌ Error generating market report:', error.response?.data || error.message);
        
        // Save error log
        const errorLog = {
            error: error.message,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };
        
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(reportsDir, `error-log-${new Date().toISOString().split('T')[0]}.json`),
            JSON.stringify(errorLog, null, 2)
        );
        
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    console.log('🚀 Starting Market Intelligence Report Generator...');
    generateMarketReport();
}

module.exports = {
    generateMarketReport,
    fetchRealMarketData,
    getMarketTimingInfo
};
