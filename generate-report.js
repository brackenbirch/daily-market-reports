const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const MARKET_REPORT_PROMPT = `You are a financial analyst creating a daily market summary. Please search the web for current information and create a professional report with these exact sections:

**EXECUTIVE SUMMARY**
[2-sentence overview of global market sentiment]

**ASIAN MARKETS OVERNIGHT**
Search for and report on:
- Nikkei 225, Hang Seng, Shanghai Composite, ASX 200 performance
- Major Asian corporate news or earnings
- Key economic data releases from Asia
- USD/JPY, USD/CNY, AUD/USD currency movements
- Any central bank communications from Asia
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

**KEY TAKEAWAYS**
[2-sentence summary of main trading themes for the day]

**KEY HEADLINES AND RESEARCH**
[Target: 200 words]
Summary of research published and headlines published during market closure the previous hours and any potential impacts they might have.

Use current market data from today's date. Include specific percentage moves and index levels. Write in professional financial language suitable for institutional clients.`;

async function generateMarketReport() {
    try {
        console.log('Generating market report...');
        
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
