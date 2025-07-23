const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Only require the essential API key
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

console.log('🚀 Starting Minimal Market Report Generator...');
console.log('📅 Date:', new Date().toDateString());

// Check for required API key
if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is required but not found');
    console.error('Please add your Claude API key to GitHub Secrets');
    process.exit(1);
}

console.log('✅ Claude API key found');

// Simple market data generation (no external APIs needed)
function generateMarketData() {
    console.log('📊 Generating sample market data...');
    
    const data = {
        date: new Date().toDateString(),
        indices: {
            'S&P 500': { price: '4,235.45', change: '+12.35', changePercent: '+0.29%' },
            'NASDAQ': { price: '13,245.67', change: '+45.23', changePercent: '+0.34%' },
            'DOW': { price: '33,456.78', change: '+89.12', changePercent: '+0.27%' }
        },
        sectors: {
            'XLF': { name: 'Financial Services', price: '$38.45', change: '+0.23', changePercent: '+0.6%' },
            'XLK': { name: 'Technology', price: '$152.34', change: '+1.45', changePercent: '+0.96%' },
            'XLE': { name: 'Energy', price: '$89.67', change: '-0.45', changePercent: '-0.5%' },
            'XLV': { name: 'Healthcare', price: '$127.89', change: '+0.67', changePercent: '+0.53%' },
            'XLI': { name: 'Industrials', price: '$98.23', change: '+0.34', changePercent: '+0.35%' },
            'XLY': { name: 'Consumer Discretionary', price: '$156.78', change: '+1.23', changePercent: '+0.79%' },
            'XLP': { name: 'Consumer Staples', price: '$78.45', change: '-0.12', changePercent: '-0.15%' },
            'XLU': { name: 'Utilities', price: '$67.89', change: '+0.45', changePercent: '+0.67%' },
            'XLB': { name: 'Materials', price: '$82.34', change: '+0.56', changePercent: '+0.68%' }
        },
        premarket: {
            gainers: [
                { symbol: 'NVDA', price: '$875.23', changePercent: '+4.5%' },
                { symbol: 'TSLA', price: '$245.67', changePercent: '+3.2%' },
                { symbol: 'AAPL', price: '$189.45', changePercent: '+2.8%' },
                { symbol: 'MSFT', price: '$378.90', changePercent: '+2.1%' },
                { symbol: 'GOOGL', price: '$142.56', changePercent: '+1.9%' },
                { symbol: 'META', price: '$456.78', changePercent: '+1.7%' },
                { symbol: 'AMD', price: '$156.34', changePercent: '+1.5%' },
                { symbol: 'CRM', price: '$234.56', changePercent: '+1.3%' },
                { symbol: 'NFLX', price: '$567.89', changePercent: '+1.1%' },
                { symbol: 'ADBE', price: '$543.21', changePercent: '+0.9%' }
            ],
            losers: [
                { symbol: 'XOM', price: '$67.89', changePercent: '-2.3%' },
                { symbol: 'CVX', price: '$145.67', changePercent: '-1.9%' },
                { symbol: 'WMT', price: '$156.78', changePercent: '-1.5%' },
                { symbol: 'PG', price: '$145.23', changePercent: '-1.2%' },
                { symbol: 'JNJ', price: '$167.45', changePercent: '-1.0%' },
                { symbol: 'KO', price: '$58.90', changePercent: '-0.8%' },
                { symbol: 'PEP', price: '$167.34', changePercent: '-0.7%' },
                { symbol: 'MCD', price: '$289.45', changePercent: '-0.6%' },
                { symbol: 'HD', price: '$345.67', changePercent: '-0.5%' },
                { symbol: 'UNH', price: '$512.34', changePercent: '-0.4%' }
            ]
        }
    };
    
    console.log('✅ Market data generated');
    return data;
}

// Create the market report prompt
function createMarketPrompt(data) {
    return `You are a senior financial analyst creating a daily market summary for institutional clients.

Current Market Data (${data.date}):

MARKET INDICES:
- S&P 500: ${data.indices['S&P 500'].price} (${data.indices['S&P 500'].change} / ${data.indices['S&P 500'].changePercent})
- NASDAQ: ${data.indices['NASDAQ'].price} (${data.indices['NASDAQ'].change} / ${data.indices['NASDAQ'].changePercent})  
- DOW: ${data.indices['DOW'].price} (${data.indices['DOW'].change} / ${data.indices['DOW'].changePercent})

SECTOR PERFORMANCE (SPDR ETFs):
${Object.entries(data.sectors).map(([symbol, info]) => 
    `- ${symbol} (${info.name}): ${info.price} (${info.change} / ${info.changePercent})`
).join('\n')}

TOP PREMARKET GAINERS:
${data.premarket.gainers.map((stock, i) => 
    `${i+1}. ${stock.symbol}: ${stock.price} (${stock.changePercent})`
).join('\n')}

TOP PREMARKET LOSERS:
${data.premarket.losers.map((stock, i) => 
    `${i+1}. ${stock.symbol}: ${stock.price} (${stock.changePercent})`
).join('\n')}

Create a comprehensive professional report with these exact sections:

**EXECUTIVE SUMMARY**
Provide a 2-sentence overview of global market sentiment based on the data above.

**ASIAN MARKETS OVERNIGHT**
Create analysis covering Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance, major Asian corporate developments, key economic data, USD/JPY, USD/CNY, AUD/USD movements, and central bank communications. [Target: 150 words]

**EUROPEAN MARKETS SUMMARY**  
Cover FTSE 100, DAX, CAC 40, Euro Stoxx 50 performance, European corporate news, ECB policy updates, EUR/USD, GBP/USD movements, and key political/economic developments. [Target: 150 words]

**US MARKET OUTLOOK**
Analyze S&P 500, NASDAQ, DOW futures, key economic releases today, major US earnings expected, Federal Reserve speakers, and overnight developments. [Target: 150 words]

**PREMARKET MOVERS**
Analyze the top gainers and losers listed above, with commentary on notable moves and potential catalysts. [Target: 200 words]

**SECTOR ANALYSIS**
Analyze each SPDR sector ETF performance using the data above:
- XLF (Financial Services), XLK (Technology), XLE (Energy), XLV (Healthcare), XLI (Industrials)
- XLY (Consumer Discretionary), XLP (Consumer Staples), XLU (Utilities), XLB (Materials)
Provide institutional-grade sector rotation insights. [Target: 300 words]

**KEY TAKEAWAYS**
2-sentence summary of main trading themes for the day.

**KEY HEADLINES AND RESEARCH**
Synthesize important research themes and market-moving insights relevant to current market conditions. [Target: 200 words]

Write in professional financial language suitable for portfolio managers. Today's date: ${data.date}`;
}

// Main function to generate the report
async function generateReport() {
    try {
        console.log('📊 Preparing market data...');
        const marketData = generateMarketData();
        
        console.log('🤖 Creating Claude API request...');
        const prompt = createMarketPrompt(marketData);
        
        console.log('📡 Calling Claude API...');
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
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

        console.log('✅ Claude API response received');
        
        if (!response.data || !response.data.content || !response.data.content[0]) {
            throw new Error('Invalid response format from Claude API');
        }

        const report = response.data.content[0].text;
        
        console.log('📁 Creating reports directory...');
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        console.log('💾 Saving report...');
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `market-report-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        const fullReport = `# Daily Market Report - ${dateStr}
*Generated: ${today.toISOString()}*
*Data: Simulated market data with Claude AI analysis*

${report}

---

## Report Details
**Generation Time:** ${today.toISOString()}
**Data Source:** Simulated market scenarios
**Analysis:** Claude AI powered insights

*This report uses representative market data combined with professional financial analysis*
`;
        
        fs.writeFileSync(filepath, fullReport);
        
        // Also create latest report
        const latestPath = path.join(reportsDir, 'latest-market-report.md');
        fs.writeFileSync(latestPath, fullReport);
        
        console.log('🎉 SUCCESS! Report generated successfully');
        console.log(`📄 File: ${filename}`);
        console.log(`📝 Length: ${report.length} characters`);
        console.log('✅ Process completed with exit code 0');
        
    } catch (error) {
        console.error('❌ ERROR occurred:');
        console.error('Type:', error.constructor.name);
        console.error('Message:', error.message);
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.code === 'ECONNABORTED') {
            console.error('This appears to be a timeout error');
        }
        
        // Create error report
        const errorReport = `# Market Report Error - ${new Date().toDateString()}

**Error Type:** ${error.constructor.name}
**Message:** ${error.message}
**Time:** ${new Date().toISOString()}

${error.response ? `**HTTP Status:** ${error.response.status}
**Response Data:** 
\`\`\`
${JSON.stringify(error.response.data, null, 2)}
\`\`\`
` : ''}

**Stack Trace:**
\`\`\`
${error.stack}
\`\`\`
`;
        
        try {
            const reportsDir = path.join(__dirname, 'reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            fs.writeFileSync(path.join(reportsDir, `error-${new Date().toISOString().split('T')[0]}.md`), errorReport);
            console.log('💾 Error report saved');
        } catch (writeError) {
            console.error('Could not save error report:', writeError.message);
        }
        
        console.error('❌ Process completed with exit code 1');
        process.exit(1);
    }
}

// Run the report generator
generateReport();
