const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Function to fetch real market data from multiple sources
async function fetchRealMarketData() {
    const data = {
        indices: {},
        currencies: {},
        news: [],
        futures: {},
        timestamp: new Date().toISOString()
    };
    
    try {
        // Fetch major US indices using Alpha Vantage (free tier: 25 requests/day)
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('Fetching market data from Alpha Vantage...');
            
            const symbols = ['SPY', 'QQQ', 'DIA']; // ETFs for S&P 500, NASDAQ, DOW
            for (const symbol of symbols) {
                try {
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    if (response.data['Global Quote']) {
                        data.indices[symbol] = response.data['Global Quote'];
                    }
                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`Failed to fetch ${symbol}:`, error.message);
                }
            }
        }
        
        // Fetch market data using Finnhub (free tier: 60 calls/minute)
        if (FINNHUB_API_KEY) {
            console.log('Fetching additional data from Finnhub...');
            
            try {
                // Fetch major indices
                const indicesSymbols = ['^GSPC', '^IXIC', '^DJI', '^N225', '^HSI'];
                for (const symbol of indicesSymbols) {
                    try {
                        const response = await axios.get(
                            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
                        );
                        data.indices[symbol] = response.data;
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.log(`Failed to fetch ${symbol} from Finnhub`);
                    }
                }
                
                // Fetch market news
                const newsResponse = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`
                );
                data.news = newsResponse.data.slice(0, 10); // Top 10 news items
                
            } catch (error) {
                console.log('Finnhub API error:', error.message);
            }
        }
        
        // Scrape some free market data as fallback
        try {
            console.log('Fetching fallback market data...');
            // This is a simplified example - you might need to adjust based on website structure
            const marketWatchResponse = await axios.get('https://www.marketwatch.com/investing/index/spx', {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketBot/1.0)' }
            });
            
            const $ = cheerio.load(marketWatchResponse.data);
            const spxPrice = $('.intraday__price .value').first().text();
            const spxChange = $('.change--point--q .value').first().text();
            
            if (spxPrice) {
                data.indices['SPX_SCRAPED'] = {
                    price: spxPrice,
                    change: spxChange,
                    source: 'MarketWatch'
                };
            }
        } catch (error) {
            console.log('Web scraping failed:', error.message);
        }
        
    } catch (error) {
        console.log('Market data fetch error:', error.message);
    }
    
    return data;
}

// Function to format market data for Claude
function formatMarketDataForPrompt(marketData) {
    let dataString = `Current Market Data (${new Date().toDateString()}):\n\n`;
    
    if (Object.keys(marketData.indices).length > 0) {
        dataString += "MARKET INDICES:\n";
        Object.entries(marketData.indices).forEach(([symbol, data]) => {
            if (data.price || data['05. price']) {
                const price = data.price || data['05. price'];
                const change = data.change || data['09. change'];
                const changePercent = data.changePercent || data['10. change percent'];
                dataString += `- ${symbol}: ${price} (${change} / ${changePercent})\n`;
            }
        });
        dataString += "\n";
    }
    
    if (marketData.news && marketData.news.length > 0) {
        dataString += "RECENT MARKET NEWS:\n";
        marketData.news.slice(0, 5).forEach((item, index) => {
            dataString += `${index + 1}. ${item.headline} (${new Date(item.datetime * 1000).toLocaleDateString()})\n`;
        });
        dataString += "\n";
    }
    
    return dataString;
}

const generateMarketPrompt = (marketData) => `You are a senior financial analyst at a major investment bank creating a daily market summary for institutional clients. 

${formatMarketDataForPrompt(marketData)}

Using the market data provided above and your financial expertise, create a comprehensive professional report with these exact sections:

**EXECUTIVE SUMMARY**
Provide a 2-sentence overview of global market sentiment based on the data and current market conditions.

**ASIAN MARKETS OVERNIGHT**
Create a detailed analysis covering:
- Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance
- Major Asian corporate developments and earnings
- Key economic data releases from Asia
- Currency movements: USD/JPY, USD/CNY, AUD/USD
- Central bank communications from Asian markets
[Target: 150 words, professional tone]

**EUROPEAN MARKETS SUMMARY**
Provide comprehensive coverage of:
- FTSE 100, DAX, CAC 40, Euro Stoxx 50 performance
- Significant European corporate news and earnings
- ECB policy updates and eurozone economic indicators
- EUR/USD, GBP/USD currency movements
- Key political/economic developments in Europe
[Target: 150 words, institutional quality]

**US MARKET OUTLOOK**
Analyze and report on:
- S&P 500, NASDAQ, DOW futures and pre-market activity
- Key economic releases scheduled for today
- Major US earnings announcements expected
- Federal Reserve speakers and policy implications
- Overnight developments impacting US markets
[Target: 150 words, actionable insights]

**KEY TAKEAWAYS**
Provide a 2-sentence summary of the main trading themes and opportunities for the day.

**KEY HEADLINES AND RESEARCH**
[Target: 200 words]
Synthesize the most important research notes, analyst upgrades/downgrades, and market-moving headlines from the past 12 hours. Focus on actionable intelligence and sector implications.

REQUIREMENTS:
- Use actual data provided where available
- Include specific percentage moves and index levels
- Write in professional financial language suitable for portfolio managers
- Maintain objectivity while highlighting key risks and opportunities
- Today's date: ${new Date().toDateString()}
- Assume market opening hours and provide forward-looking guidance`;

async function generateMarketReport() {
    try {
        console.log('Starting market report generation...');
        
        // Fetch real market data
        const marketData = await fetchRealMarketData();
        console.log('Market data collection complete');
        
        // Generate the report using Claude
        const prompt = generateMarketPrompt(marketData);
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.2, // Lower temperature for more consistent financial analysis
            messages: [{
                role: 'user',
                content: prompt
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
        const filename = `market-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Create comprehensive report with metadata
        const fullReport = `# Daily Market Report - ${dateStr}
*Generated: ${today.toISOString()}*
*Data Sources: ${Object.keys(marketData.indices).length > 0 ? 'Live Market APIs' : 'Analysis-Based'}, Claude AI Analysis*

${report}

---

## Data Summary
**Market Indices Tracked:** ${Object.keys(marketData.indices).length} symbols
**News Items Analyzed:** ${marketData.news ? marketData.news.length : 0} headlines
**Generation Time:** ${today.toISOString()}

*This report combines real-time market data with AI-powered financial analysis*
`;
        
        // Save the report
        fs.writeFileSync(filepath, fullReport);
        
        // Create latest report link
        const latestFilepath = path.join(reportsDir, 'latest-market-report.md');
        fs.writeFileSync(latestFilepath, fullReport);
        
        // Save raw market data for debugging
        const rawDataPath = path.join(reportsDir, `raw-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(marketData, null, 2));
        
        console.log(`✅ Market report generated successfully: ${filename}`);
        console.log(`📊 Data points collected: ${Object.keys(marketData.indices).length} indices, ${marketData.news ? marketData.news.length : 0} news items`);
        console.log(`📝 Report length: ${report.length} characters`);
        
    } catch (error) {
        console.error('❌ Error generating market report:', error.response?.data || error.message);
        
        // Create error report for debugging
        const errorReport = `# Market Report Generation Error - ${new Date().toDateString()}

An error occurred while generating the market report:

**Error:** ${error.message}

**Timestamp:** ${new Date().toISOString()}

**Details:** ${JSON.stringify(error.response?.data || 'No additional details', null, 2)}

Please check the GitHub Actions logs for more information.
`;
        
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const errorPath = path.join(reportsDir, `error-${new Date().toISOString().split('T')[0]}.md`);
        fs.writeFileSync(errorPath, errorReport);
        
        process.exit(1);
    }
}

// Execute the report generation
generateMarketReport();
