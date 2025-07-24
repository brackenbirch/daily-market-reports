const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class MarketReportGenerator {
    constructor() {
        this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
        this.finnhubKey = process.env.FINNHUB_API_KEY;
        this.gmailUser = process.env.GMAIL_USER;
        this.gmailPassword = process.env.GMAIL_PASSWORD;
        this.workEmails = process.env.WORK_EMAIL_LIST ? 
            process.env.WORK_EMAIL_LIST.split(',').map(email => email.trim()) : [];
        
        // Setup email transport
        this.transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.gmailUser,
                pass: this.gmailPassword
            }
        });
    }

    async getMarketData() {
        console.log('📊 Fetching market data...');
        const marketData = {};

        try {
            // Get major US indices via ETFs
            const symbols = ['SPY', 'QQQ', 'DIA', 'IWM'];
            for (const symbol of symbols) {
                try {
                    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`;
                    const response = await axios.get(url, { timeout: 10000 });
                    
                    if (response.data && response.data['Global Quote']) {
                        const quote = response.data['Global Quote'];
                        marketData[symbol] = {
                            price: parseFloat(quote['05. price']).toFixed(2),
                            change: parseFloat(quote['09. change']).toFixed(2),
                            changePercent: quote['10. change percent'].replace('%', ''),
                            volume: quote['06. volume']
                        };
                    }
                    // Rate limit - wait 12 seconds between API calls
                    await this.sleep(12000);
                } catch (error) {
                    console.log(`⚠️ Error fetching ${symbol}: ${error.message}`);
                }
            }

            // Get major currency pairs
            const currencies = [
                { from: 'EUR', to: 'USD' },
                { from: 'GBP', to: 'USD' },
                { from: 'USD', to: 'JPY' }
            ];

            for (const curr of currencies) {
                try {
                    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${curr.from}&to_currency=${curr.to}&apikey=${this.alphaVantageKey}`;
                    const response = await axios.get(url, { timeout: 10000 });
                    
                    if (response.data && response.data['Realtime Currency Exchange Rate']) {
                        const rate = response.data['Realtime Currency Exchange Rate'];
                        marketData[`${curr.from}${curr.to}`] = {
                            rate: parseFloat(rate['5. Exchange Rate']).toFixed(4),
                            lastRefreshed: rate['6. Last Refreshed']
                        };
                    }
                    await this.sleep(12000);
                } catch (error) {
                    console.log(`⚠️ Error fetching ${curr.from}${curr.to}: ${error.message}`);
                }
            }

        } catch (error) {
            console.log(`❌ Error in getMarketData: ${error.message}`);
        }

        return marketData;
    }

    async getNewsHeadlines() {
        console.log('📰 Fetching news headlines...');
        try {
            // Using Finnhub for financial news
            const url = `https://finnhub.io/api/v1/news?category=general&token=${this.finnhubKey}`;
            const response = await axios.get(url, { timeout: 10000 });
            
            if (response.data && Array.isArray(response.data)) {
                return response.data.slice(0, 10).map(article => ({
                    headline: article.headline,
                    summary: article.summary || '',
                    url: article.url,
                    datetime: new Date(article.datetime * 1000).toISOString()
                }));
            }
        } catch (error) {
            console.log(`⚠️ Error fetching news: ${error.message}`);
        }
        return [];
    }

    async generateAIAnalysis(marketData, newsData) {
        console.log('🤖 Generating AI analysis...');
        
        const currentTime = new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        // Prepare market data summary
        let marketSummary = "Current Market Data:\n";
        Object.entries(marketData).forEach(([symbol, data]) => {
            if (data.price) {
                const changeColor = parseFloat(data.change) >= 0 ? '📈' : '📉';
                marketSummary += `${changeColor} ${symbol}: $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%)\n`;
            } else if (data.rate) {
                marketSummary += `💱 ${symbol}: ${data.rate}\n`;
            }
        });

        // Prepare news summary  
        let newsSummary = "Latest Financial Headlines:\n";
        newsData.slice(0, 5).forEach((article, index) => {
            newsSummary += `${index + 1}. ${article.headline}\n`;
        });

        const prompt = `Generate a professional financial market summary report.

${marketSummary}

${newsSummary}

Please create a comprehensive report with these sections:

**📊 EXECUTIVE SUMMARY**
2-3 sentences capturing overall market sentiment and key themes for the day.

**📈 MARKET PERFORMANCE**  
Analysis of the major index movements (SPY=S&P 500, QQQ=NASDAQ, DIA=Dow, IWM=Russell 2000) and what's driving the performance.

**💱 CURRENCY MARKETS**
Brief overview of major currency pair movements and implications.

**📰 KEY DEVELOPMENTS**
Most important news items affecting markets today.

**🔮 OUTLOOK & TRADING FOCUS**
What traders and portfolio managers should watch for in today's session.

**⚡ KEY TAKEAWAYS**
3 bullet points with the most important information for quick decision-making.

Keep the tone professional but accessible. Focus on actionable insights for financial professionals.

Report generated: ${currentTime}`;

        try {
            // Using Anthropic Claude API
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1500,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.anthropicApiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 30000
            });

            if (response.data && response.data.content && response.data.content[0]) {
                return response.data.content[0].text;
            }
        } catch (error) {
            console.log(`⚠️ AI analysis failed: ${error.message}`);
            // Fallback to basic summary
            return this.generateBasicSummary(marketData, newsData, currentTime);
        }

        return this.generateBasicSummary(marketData, newsData, currentTime);
    }

    generateBasicSummary(marketData, newsData, currentTime) {
        let summary = `📊 DAILY MARKET SUMMARY\nGenerated: ${currentTime}\n\n`;
        
        summary += "📈 MARKET PERFORMANCE\n";
        Object.entries(marketData).forEach(([symbol, data]) => {
            if (data.price) {
                const trend = parseFloat(data.change) >= 0 ? '🟢' : '🔴';
                summary += `${trend} ${symbol}: $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%)\n`;
            }
        });

        summary += "\n💱 CURRENCY MARKETS\n";
        Object.entries(marketData).forEach(([symbol, data]) => {
            if (data.rate) {
                summary += `${symbol}: ${data.rate}\n`;
            }
        });

        if (newsData.length > 0) {
            summary += "\n📰 TOP HEADLINES\n";
            newsData.slice(0, 5).forEach((article, index) => {
                summary += `${index + 1}. ${article.headline}\n`;
            });
        }

        summary += "\n⚡ This is an automated report generated via GitHub Actions";
        return summary;
    }

    async sendEmailReport(report) {
        console.log('📧 Sending email report...');
        
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const htmlReport = this.convertToHTML(report);

        const mailOptions = {
            from: this.gmailUser,
            to: this.gmailUser, // Always send to your Gmail first
            subject: `🔔 Daily Market Summary - ${currentDate}`,
            text: report,
            html: htmlReport
        };

        try {
            // Send to your Gmail
            await this.transport.sendMail(mailOptions);
            console.log(`✅ Report sent to ${this.gmailUser}`);

            // Send to work emails if configured
            if (this.workEmails.length > 0) {
                for (const workEmail of this.workEmails) {
                    if (workEmail) {
                        mailOptions.to = workEmail;
                        await this.transport.sendMail(mailOptions);
                        console.log(`✅ Report sent to ${workEmail}`);
                        // Small delay between emails
                        await this.sleep(1000);
                    }
                }
            }

            return true;
        } catch (error) {
            console.log(`❌ Error sending email: ${error.message}`);
            return false;
        }
    }

    convertToHTML(report) {
        // Convert plain text report to HTML for better email formatting
        let html = report
            .replace(/\*\*(.*?)\*\*/g, '<h2 style="color: #2c3e50; border-bottom: 2px solid #3498db;">$1</h2>')
            .replace(/📊|📈|📉|💱|📰|🔮|⚡/g, '<span style="font-size: 1.2em;">$&</span>')
            .replace(/🟢/g, '<span style="color: #27ae60;">●</span>')
            .replace(/🔴/g, '<span style="color: #e74c3c;">●</span>')
            .replace(/\n/g, '<br>');

        return `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
                h2 { margin-top: 25px; margin-bottom: 15px; }
                .timestamp { font-size: 0.9em; color: #7f8c8d; font-style: italic; }
            </style>
        </head>
        <body>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 20px;">
                <h1>📊 Daily Market Summary</h1>
                <p class="timestamp">Automated Report via GitHub Actions</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                ${html}
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #ecf0f1; border-radius: 5px; font-size: 0.8em; color: #7f8c8d;">
                This report was automatically generated using real-time market data and AI analysis.<br>
                Data sources: Alpha Vantage, Finnhub, Anthropic Claude
            </div>
        </body>
        </html>`;
    }

    async saveReportToFile(report) {
        console.log('💾 Saving report to file...');
        try {
            const reportsDir = path.join(process.cwd(), 'reports');
            
            // Create reports directory if it doesn't exist
            try {
                await fs.access(reportsDir);
            } catch {
                await fs.mkdir(reportsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `market-report-${timestamp}.md`;
            const filepath = path.join(reportsDir, filename);
            
            const fileContent = `# Daily Market Report - ${timestamp}\n\n${report}\n\n---\n*Generated automatically via GitHub Actions*`;
            
            await fs.writeFile(filepath, fileContent, 'utf8');
            console.log(`✅ Report saved to ${filepath}`);
            return true;
        } catch (error) {
            console.log(`❌ Error saving report: ${error.message}`);
            return false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateCompleteReport() {
        console.log('🚀 Starting market report generation...');
        
        try {
            // Get market data
            const marketData = await this.getMarketData();
            console.log(`📊 Retrieved data for ${Object.keys(marketData).length} instruments`);

            // Get news data
            const newsData = await this.getNewsHeadlines();
            console.log(`📰 Retrieved ${newsData.length} news articles`);

            // Generate AI analysis
            const report = await this.generateAIAnalysis(marketData, newsData);
            console.log('🤖 AI analysis completed');

            // Send email report
            const emailSent = await this.sendEmailReport(report);
            
            // Save to file for GitHub commit
            const fileSaved = await this.saveReportToFile(report);

            if (emailSent && fileSaved) {
                console.log('✅ Market report generation completed successfully!');
                return true;
            } else {
                console.log('⚠️ Market report completed with some issues');
                return false;
            }

        } catch (error) {
            console.log(`❌ Fatal error in report generation: ${error.message}`);
            console.error(error.stack);
            return false;
        }
    }
}

// Execute the report generation
async function main() {
    const generator = new MarketReportGenerator();
    const success = await generator.generateCompleteReport();
    process.exit(success ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
});
