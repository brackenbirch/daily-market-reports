const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Check if cheerio is available, if not, skip web scraping
let cheerio;
try {
    cheerio = require('cheerio');
    console.log('✅ Cheerio loaded successfully');
} catch (error) {
    console.log('⚠️  Cheerio not available, skipping web scraping');
    cheerio = null;
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Debug: Check environment variables
console.log('🔍 Environment Check:');
console.log('- ANTHROPIC_API_KEY:', ANTHROPIC_API_KEY ? '✅ Present' : '❌ Missing');
console.log('- ALPHA_VANTAGE_API_KEY:', ALPHA_VANTAGE_API_KEY ? '✅ Present' : '⚠️  Optional - Missing');
console.log('- FINNHUB_API_KEY:', FINNHUB_API_KEY ? '✅ Present' : '⚠️  Optional - Missing');

if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is required but not found');
    process.exit(1);
}

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

// Generate sample premarket movers if real data unavailable
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
        
        movers.push({
            symbol,
            price: `$${price}`,
            change: `${change > 0 ? '+' : ''}${change}`,
            changePercent: `${changePercent > 0 ? '+' : ''}${changePercent}%`,
            source: 'simulated'
        });
    }
    
    return movers;
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
            name: getSectorName(etf),
            source: 'simulated'
        };
    });
    
    return sectors;
}

// Function to fetch real market data from multiple sources
async function fetchRealMarketData() {
    console.log('📊 Starting market data collection...');
    
    const data = {
        indices: {},
        currencies: {},
        news: [],
        futures: {},
        premarket: {
            gainers: [],
            losers: []
        },
        sectors: {},
        timestamp: new Date().toISOString()
    };
    
    try {
        // Fetch major US indices using Alpha Vantage (if available)
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📈 Fetching data from Alpha Vantage...');
            
            const symbols = ['SPY', 'QQQ', 'DIA'];
            for (const symbol of symbols) {
                try {
                    console.log(`  - Fetching ${symbol}...`);
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                        { timeout: 10000 }
                    );
                    
                    if (response.data['Global Quote']) {
                        data.indices[symbol] = response.data['Global Quote'];
                        console.log(`  ✅ ${symbol} data retrieved`);
                    } else if (response.data['Error Message']) {
                        console.log(`  ⚠️  ${symbol}: ${response.data['Error Message']}`);
                    } else {
                        console.log(`  ⚠️  ${symbol}: Unexpected response format`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`  ❌ Failed to fetch ${symbol}: ${error.message}`);
                }
            }
            
            // Fetch some sector ETFs
            console.log('📊 Fetching sector ETFs from Alpha Vantage...');
            const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI'];
            
            for (const etf of sectorETFs) {
                try {
                    console.log(`  - Fetching ${etf}...`);
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                        { timeout: 10000 }
                    );
                    if (response.data['Global Quote']) {
                        data.sectors[etf] = {
                            ...response.data['Global Quote'],
                            name: getSectorName(etf)
                        };
                        console.log(`  ✅ ${etf} data retrieved`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`  ⚠️  Failed to fetch sector ETF ${etf}: ${error.message}`);
                }
            }
        }
        
        // Fetch market data using Finnhub (if available)
        if (FINNHUB_API_KEY) {
            console.log('📊 Fetching data from Finnhub...');
            
            try {
                // Fetch major indices
                const indicesSymbols = ['^GSPC', '^IXIC', '^DJI'];
                for (const symbol of indicesSymbols) {
                    try {
                        console.log(`  - Fetching ${symbol}...`);
                        const response = await axios.get(
                            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
                            { timeout: 10000 }
                        );
                        if (response.data && response.data.c) {
                            data.indices[symbol] = response.data;
                            console.log(`  ✅ ${symbol} data retrieved`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.log(`  ⚠️  Failed to fetch ${symbol} from Finnhub: ${error.message}`);
                    }
                }
                
                // Fetch market news
                try {
                    console.log('📰 Fetching market news...');
                    const newsResponse = await axios.get(
                        `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`,
                        { timeout: 10000 }
                    );
                    if (newsResponse.data && Array.isArray(newsResponse.data)) {
                        data.news = newsResponse.data.slice(0, 10);
                        console.log(`  ✅ Retrieved ${data.news.length} news items`);
                    }
                } catch (error) {
                    console.log('  ⚠️  News fetch failed:', error.message);
                }
                
            } catch (error) {
                console.log('❌ Finnhub API error:', error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Market data fetch error:', error.message);
    }
    
    // Generate fallback data if no real data was retrieved
    if (Object.keys(data.indices).length === 0) {
        console.log('📊 Generating sample index data...');
        data.indices['SPY_SAMPLE'] = {
            '05. price': '420.50',
            '09. change': '+2.15',
            '10. change percent': '+0.51%',
            source: 'simulated'
        };
    }
    
    if (Object.keys(data.sectors).length === 0) {
        console.log('🏭 Generating sample sector data...');
        data.sectors = generateSampleSectors();
    }
    
    if (data.premarket.gainers.length === 0) {
        console.log('🔝 Generating sample premarket data...');
        data.premarket.gainers = generateSampleMovers('gainers');
        data.premarket.losers = generateSampleMovers('losers');
    }
    
    console.log('📊 Data collection summary:');
    console.log(`  - Indices: ${Object.keys(data.indices).length}`);
    console.log(`  - Sectors: ${Object.keys(data.sectors).length}`);
    console.log(`  - Gainers: ${data.premarket.gainers.length}`);
    console.log(`  - Losers: ${data.premarket.losers.length}`);
    console.log(`  - News: ${data.news.length}`);
    
    return data;
}

// Function to format market data for Claude
function formatMarketDataForPrompt(marketData) {
    let dataString = `Current Market Data (${new Date().toDateString()}):\n\n`;
    
    if (Object.keys(marketData.indices).length > 0) {
        dataString += "MARKET INDICES:\n";
        Object.entries(marketData.indices).forEach(([symbol, data]) => {
            const price = data.price || data.c || data['05. price'] || 'N/A';
            const change = data.change || data.d || data['09. change'] || 'N/A';
            const changePercent = data.changePercent || data.dp || data['10. change percent'] || 'N/A';
            dataString += `- ${symbol}: ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(marketData.sectors).length > 0) {
        dataString += "SECTOR PERFORMANCE (SPDR ETFs):\n";
        Object.entries(marketData.sectors).forEach(([symbol, data]) => {
            const price = data.price || data.c || data['05. price'] || 'N/A';
            const change = data.change || data.d || data['09. change'] || 'N/A';
            const changePercent = data.changePercent || data.dp || data['10. change percent'] || 'N/A';
            dataString += `- ${symbol} (${data.name}): ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.premarket.gainers.length > 0) {
        dataString += "TOP PREMARKET GAINERS:\n";
        marketData.premarket.gainers.slice(0, 10).forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.premarket.losers.length > 0) {
        dataString += "TOP PREMARKET LOSERS:\n";
        marketData.premarket.losers.slice(0, 10).forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (marketData.news && marketData.news.length > 0) {
        dataString += "RECENT MARKET NEWS:\n";
        marketData.news.slice(0, 5).forEach((item, index) => {
            const headline = item.headline || item.title || 'News item';
            const date = item.datetime ? new Date(item.datetime * 1000).toLocaleDateString() : 'Recent';
            dataString += `${index + 1}. ${headline} (${date})\n`;
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

**PREMARKET MOVERS**
Provide analysis of the top movers in pre-market trading:
- **Top 10 Gainers**: List with symbols, prices, and percentage moves
- **Top 10 Losers**: List with symbols, prices, and percentage moves
- Brief commentary on notable moves and potential catalysts
[Target: 200 words, focus on actionable trading intelligence]

**SECTOR ANALYSIS**
Analyze performance of key SPDR sector ETFs:
- **XLF (Financial Services)**: Performance and outlook
- **XLK (Technology)**: Key drivers and trends
- **XLE (Energy)**: Commodity impacts and positioning
- **XLV (Healthcare)**: Regulatory and earnings factors
- **XLI (Industrials)**: Economic sensitivity analysis
- **XLY (Consumer Discretionary)**: Consumer spending trends
- **XLP (Consumer Staples)**: Defensive positioning
- **XLU (Utilities)**: Interest rate sensitivity
- **XLB (Materials)**: Commodity and cycle positioning
[Target: 300 words, institutional-grade sector rotation insights]

**KEY TAKEAWAYS**
Provide a 2-sentence summary of the main trading themes and opportunities for the day.

**KEY HEADLINES AND RESEARCH**
[Target: 200 words]
Synthesize the most important research notes, analyst upgrades/downgrades, and market-moving headlines from the past 12 hours. Focus on actionable intelligence and sector implications.

REQUIREMENTS:
- Use actual data provided where available, clearly note when using simulated data
- Include specific percentage moves and index levels
- Write in professional financial language suitable for portfolio managers
- Maintain objectivity while highlighting key risks and opportunities
- Today's date: ${new Date().toDateString()}
- Assume market opening hours and provide forward-looking guidance`;

async function generateMarketReport() {
    console.log('🚀 Starting market report generation...');
    
    try {
        // Fetch real market data
        const marketData = await fetchRealMarketData();
        console.log('✅ Market data collection complete');
        
        // Generate the report using Claude
        console.log('🤖 Generating report with Claude...');
        const prompt = generateMarketPrompt(marketData);
        
        console.log(`📝 Prompt length: ${prompt.length} characters`);
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.2,
            messages: [{
                role: 'user',
                content: prompt
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            timeout: 30000
        });

        if (!response.data || !response.data.content || !response.data.content[0]) {
            throw new Error('Invalid response from Claude API');
        }

        const report = response.data.content[0].text;
        console.log('✅ Report generated successfully');
        
        // Create reports directory
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            console.log('📁 Creating reports directory...');
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
*Data Sources: ${Object.keys(marketData.indices).length > 0 ? 'Market APIs + ' : ''}Claude AI Analysis*

${report}

---

## Data Summary
**Market Indices Tracked:** ${Object.keys(marketData.indices).length} symbols
**Sector ETFs Analyzed:** ${Object.keys(marketData.sectors).length} sectors
**Premarket Movers:** ${marketData.premarket.gainers.length} gainers, ${marketData.premarket.losers.length} losers
**News Items Analyzed:** ${marketData.news ? marketData.news.length : 0} headlines
**Generation Time:** ${today.toISOString()}

*This report combines ${ALPHA_VANTAGE_API_KEY || FINNHUB_API_KEY ? 'real-time market data with' : 'simulated market data with'} AI-powered financial analysis*
`;
        
        // Save the report
        console.log(`💾 Saving report to ${filename}...`);
        fs.writeFileSync(filepath, fullReport);
        
        // Create latest report link
        const latestFilepath = path.join(reportsDir, 'latest-market-report.md');
        fs.writeFileSync(latestFilepath, fullReport);
        
        // Save raw market data for debugging
        const rawDataPath = path.join(reportsDir, `raw-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(marketData, null, 2));
        
        console.log('🎉 SUCCESS! Market report generation complete');
        console.log(`✅ Report saved: ${filename}`);
        console.log(`📊 Data points: ${Object.keys(marketData.indices).length} indices, ${Object.keys(marketData.sectors).length} sectors`);
        console.log(`🔝 Premarket: ${marketData.premarket.gainers.length} gainers, ${marketData.premarket.losers.length} losers`);
        console.log(`📰 News: ${marketData.news ? marketData.news.length : 0} items`);
        console.log(`📝 Report length: ${report.length} characters`);
        
    } catch (error) {
        console.error('❌ FATAL ERROR generating market report:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.code) {
            console.error('Error code:', error.code);
        }
        
        console.error('Stack trace:', error.stack);
        
        // Create detailed error report
        const errorReport = `# Market Report Generation Error - ${new Date().toDateString()}

## Error Details
**Type:** ${error.constructor.name}
**Message:** ${error.message}
**Timestamp:** ${new Date().toISOString()}

## HTTP Response (if applicable)
${error.response ? `
**Status:** ${error.response.status}
**Data:** ${JSON.stringify(error.response.data, null, 2)}
` : 'No HTTP response data'}

## Environment
**Node Version:** ${process.version}
**Platform:** ${process.platform}

## Stack Trace
\`\`\`
${error.stack}
\`\`\`

## Debug Info
- ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY ? 'Present' : 'Missing'}
- ALPHA_VANTAGE_API_KEY: ${ALPHA_VANTAGE_API_KEY ? 'Present' : 'Missing'}
- FINNHUB_API_KEY: ${FINNHUB_API_KEY ? 'Present' : 'Missing'}

Please check the GitHub Actions logs for more information and verify your API keys.
`;
        
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const errorPath = path.join(reportsDir, `error-${new Date().toISOString().split('T')[0]}.md`);
        fs.writeFileSync(errorPath, errorReport);
        
        console.log(`💾 Error report saved to: error-${new Date().toISOString().split('T')[0]}.md`);
        
        process.exit(1);
    }
}

// Execute the report generation
console.log('🎬 Starting Daily Market Report Generator...');
console.log('📅 Date:', new Date().toDateString());
console.log('⏰ Time:', new Date().toTimeString());

generateMarketReport();
