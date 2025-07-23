const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Function to fetch market data from APIs
async function fetchMarketData() {
    const marketData = {};
    
    try {
        // Example using Alpha Vantage API (you'll need to sign up for free API key)
        // Replace 'YOUR_ALPHA_VANTAGE_KEY' with your actual API key
        const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
        
        if (alphaVantageKey) {
            // Fetch major indices data
            const spyResponse = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${alphaVantageKey}`);
            marketData.spy = spyResponse.data['Global Quote'];
        }
        
        // You can add more API calls here for different data sources
        
    } catch (error) {
        console.log('Market data fetch failed, proceeding with manual template');
    }
    
    return marketData;
}

const MARKET_REPORT_PROMPT = `You are a financial analyst creating a daily market summary. Based on the market data provided and your knowledge, create a professional report with these exact sections:

**EXECUTIVE SUMMARY**
[2-sentence overview of global market sentiment based on available data]

**ASIAN MARKETS OVERNIGHT**
Create a professional summary covering:
- Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance (use typical ranges if specific data unavailable)
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

**KEY TAKEAWAYS**
[2-sentence summary of main trading themes for the day]

**KEY HEADLINES AND RESEARCH**
[Target: 200 words]
Summary of typical research themes and market headlines that would be relevant during market closure hours and their potential impacts.

Write in professional financial language suitable for institutional clients. Use realistic market scenarios and typical percentage moves for the current market environment. Include today's date: ${new Date().toDateString()}.

IMPORTANT: Create a realistic, professional report even without real-time data access. Use your knowledge of current market trends and typical market behavior patterns.`;

async function generateMarketReport() {
    try {
        console.log('Generating market report...');
        
        // Fetch available market data
        const marketData = await fetchMarketData();
        console.log('Market data fetched:', Object.keys(marketData));
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.3,
            messages: [{
                role: 'user',
                content: MARKET_REPORT_PROMPT
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

${report}

---
*This report was automatically generated using Claude AI via GitHub Actions*
`;
        
        // Write report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`Market report generated successfully: ${filename}`);
        console.log(`Report length: ${report.length} characters`);
        
        // Also create/update latest report for easy access
        const latestFilepath = path.join(reportsDir, 'latest-market-report.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
    } catch (error) {
        console.error('Error generating market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the report generation
generateMarketReport();
