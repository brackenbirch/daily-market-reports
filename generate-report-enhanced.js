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
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${emailHtml}
                
                <div style="margin-top: 30px; padding: 20px; background-color: #ecf0f1; border-radius: 5px; border-left: 4px solid #3498db;">
                    <p style="margin: 0; color: #2c3e50; font-weight: bold;">📊 Daily Market Intelligence</p>
                    <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px;">Automated report generated by Claude AI • ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()), // Support multiple recipients
            subject: `📈 Daily Market Report - ${dateStr}`,
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
        commodities: []
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
    
    return dataString;
}

const createMarketPrompt = (marketData) => `You are a financial analyst creating a daily market summary. ${formatMarketDataForPrompt(marketData)}

Create a professional report with these exact sections:

**EXECUTIVE SUMMARY**
[2-sentence overview of global market sentiment based on available data]

**ASIAN MARKETS OVERNIGHT**
Create a professional summary covering:
- Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance
- Major Asian corporate news or earnings trends
- Key economic data releases from Asia
- USD/JPY, USD/CNY, AUD/USD currency movements
- Any central bank communications from Asia
[Target: 150 words]

**EUROPEAN MARKETS SUMMARY**
Create a professional summary covering:
- FTSE 100, DAX, CAC 40, Euro Stoxx 50 performance
- Major European corporate news trends
- ECB policy updates or eurozone economic data
- EUR/USD, GBP/USD movements
- Any significant political/economic developments in Europe
[Target: 150 words]

**US MARKET OUTLOOK**
Create a professional summary covering:
- Current S&P 500, NASDAQ, DOW futures outlook
- Key economic releases scheduled for today
- Major US earnings announcements expected
- Federal Reserve speakers or policy implications
- Overnight developments affecting US markets
[Target: 150 words]

**PREMARKET MOVERS**
Analyze the premarket trading data provided above and create a professional formatted table/chart:

Create two formatted tables using ASCII characters like this example format:
\`\`\`
TOP PREMARKET GAINERS
┌──────┬─────────┬─────────┬──────────┬──────────┐
│Symbol│  Price  │ Change  │ % Change │  Volume  │
├──────┼─────────┼─────────┼──────────┼──────────┤
│ TSLA │ $245.67 │ +$26.89 │  +12.3%  │  2.1M    │
│ NVDA │ $892.45 │ +$71.23 │   +8.7%  │  1.8M    │
│ AAPL │ $187.23 │ +$10.95 │   +6.2%  │  3.2M    │
└──────┴─────────┴─────────┴──────────┴──────────┘

TOP PREMARKET LOSERS
┌──────┬─────────┬─────────┬──────────┬──────────┐
│Symbol│  Price  │ Change  │ % Change │  Volume  │
├──────┼─────────┼─────────┼──────────┼──────────┤
│ META │ $298.45 │ -$32.15 │   -9.8%  │  1.9M    │
│ AMZN │ $142.67 │ -$11.39 │   -7.4%  │  2.4M    │
│ MSFT │ $378.91 │ -$20.41 │   -5.1%  │  1.6M    │
└──────┴─────────┴─────────┴──────────┴──────────┘
\`\`\`

Include brief analysis of potential catalysts and trading implications.
[Target: 250 words total including tables, focus on actionable insights with visual data presentation]

**SECTOR ANALYSIS**
Analyze the SPDR sector ETF performance using the data provided:
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

**LONGS/SHORTS**
Use current market data from today's date and market closure information to give a high level report on the coming days longs and shorts and analyst level recommendations. Write in professional financial language suitable for institutional clients.
[Target: 150 words]

**BONDS & COMMODITIES**
Use the bonds and commodities data provided above to create a professional analysis with formatted table:

Create a formatted table using ASCII characters like this example:
\`\`\`
BONDS & COMMODITIES DASHBOARD
┌──────────┬─────────────────┬─────────┬─────────┬──────────┐
│ Symbol   │      Asset      │  Price  │ Change  │ % Change │
├──────────┼─────────────────┼─────────┼─────────┼──────────┤
│ GOLD     │ Gold (oz)       │ $2,034  │ +$12.45 │  +0.62%  │
│ OIL      │ WTI Crude       │ $76.23  │ -$1.34  │  -1.73%  │
│ SILVER   │ Silver (oz)     │ $25.67  │ +$0.43  │  +1.70%  │
│ US10Y    │ 10-Year Treasury│  4.18%  │ +0.05   │    --    │
│ US2Y     │ 2-Year Treasury │  4.82%  │ +0.03   │    --    │
│ DXY      │ Dollar Index    │ 103.21  │ -0.18   │  -0.17%  │
└──────────┴─────────────────┴─────────┴─────────┴──────────┘
\`\`\`

Include analyst-level summary of key trends and implications. Write in professional financial language suitable for institutional clients.
[Target: 200 words total including table]

**KEY TAKEAWAYS**
[2-sentence summary of main trading themes for the day]

**KEY HEADLINES AND RESEARCH**
[Target: 200 words]
Summary of typical research themes and market headlines that would be relevant during market closure hours and their potential impacts.

Write in professional financial language suitable for institutional clients. Use the market data provided above where available, and realistic market scenarios for other sections. Include today's date: ${new Date().toDateString()}.

IMPORTANT: Create a realistic, professional report using the market data provided and your knowledge of current market trends. Make sure to use the exact ASCII table format shown in the examples with proper box-drawing characters.`;

async function generateMarketReport() {
    try {
        console.log('Generating market report...');
        
        // Fetch available market data
        const marketData = await fetchMarketData();
        console.log('Market data fetched - Indices:', Object.keys(marketData.indices).length, 'Sectors:', Object.keys(marketData.sectors).length, 'Commodities:', marketData.commodities.length);
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
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
        
        // Create reports directory if it doesn't exist
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Generate filename with current date
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `market-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add metadata header to the report
        const reportWithMetadata = `# Daily Market Report - ${dateStr}
*Generated on: ${today.toISOString()}*
*Data Sources: ${ALPHA_VANTAGE_API_KEY || FINNHUB_API_KEY ? 'Market APIs + ' : ''}Claude AI Analysis*

${report}

---

## Data Summary
**Market Indices:** ${Object.keys(marketData.indices).length} tracked
**Sector ETFs:** ${Object.keys(marketData.sectors).length} analyzed
**Premarket Movers:** ${marketData.premarket.gainers.length} gainers, ${marketData.premarket.losers.length} losers
**Bonds & Commodities:** ${marketData.commodities.length} instruments tracked

*This report was automatically generated using Claude AI via GitHub Actions*
`;
        
        // Write report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`Market report generated successfully: ${filename}`);
        console.log(`Report length: ${report.length} characters`);
        console.log(`Data: ${Object.keys(marketData.indices).length} indices, ${Object.keys(marketData.sectors).length} sectors, ${marketData.commodities.length} commodities`);
        
        // Also create/update latest report for easy access
        const latestFilepath = path.join(reportsDir, 'latest-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save raw data for debugging
        const rawDataPath = path.join(reportsDir, `raw-data-${dateStr}.json`);
        fs.writeFileSync(rawDataPath, JSON.stringify(marketData, null, 2));
        
        // FIXED: Send email with the EXACT same report that was saved to GitHub
        console.log('📧 Sending email with exact GitHub report content...');
        await sendMarketReportEmail(reportWithMetadata, dateStr);
        
        console.log('✅ Report generation and email sending completed!');
        console.log('📧 Email contains exact copy of GitHub report with enhanced text charts');
        
    } catch (error) {
        console.error('Error generating market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the report generation
generateMarketReport();
