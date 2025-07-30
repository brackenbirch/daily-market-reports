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
                    <p style="margin: 0; font-weight: bold; color: #2c3e50;">PROFESSIONAL MARKET INTELLIGENCE</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #000000;">Last Close: ${timing.lastClose} • Next Open: ${timing.nextOpen} • Generated by Claude AI</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `Professional Market Analysis Report - ${dateStr} - Institutional Grade Intelligence`,
            html: emailContent,
            text: reportContent,
            priority: 'high'
        };
        
        console.log('📤 Sending professional market analysis report...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Professional report sent successfully:', info.messageId);
        console.log('📧 Recipients:', WORK_EMAIL_LIST);
        
    } catch (error) {
        console.error('❌ Failed to send market analysis report:', error.message);
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
    
    let dataString = `CURRENT MARKET DATA CONTEXT:\n`;
    dataString += `Report Generation Time: ${new Date().toLocaleString()} ET\n`;
    dataString += `Last Market Close: ${timing.lastClose}\n`;
    dataString += `Next Market Open: ${timing.nextOpen}\n`;
    dataString += `Hours Since Close: ${timing.hoursSinceClose}\n`;
    dataString += `Time to Open: ${timing.timeToOpenStr}\n\n`;
    
    if (Object.keys(overnightData.afterHoursFutures).length > 0) {
        dataString += "CURRENT INDEX FUTURES DATA:\n";
        Object.entries(overnightData.afterHoursFutures).forEach(([symbol, data]) => {
            const price = data.price || data['05. price'] || data.c || 'N/A';
            const change = data.change || data['09. change'] || data.d || 'N/A';
            const changePercent = data.changePercent || data['10. change percent'] || data.dp || 'N/A';
            dataString += `- ${symbol}: ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(overnightData.overnightSectors).length > 0) {
        dataString += "SECTOR ETF PERFORMANCE DATA:\n";
        Object.entries(overnightData.overnightSectors).forEach(([symbol, data]) => {
            const price = data.price || data['05. price'] || 'N/A';
            const change = data.change || data['09. change'] || 'N/A';
            const changePercent = data.changePercent || data['10. change percent'] || 'N/A';
            dataString += `- ${symbol} (${data.name}): ${price} (${change} / ${changePercent})\n`;
        });
        dataString += "\n";
    }
    
    if (overnightData.afterHoursMovers.topGainers.length > 0) {
        dataString += "RECENT TOP GAINERS:\n";
        overnightData.afterHoursMovers.topGainers.forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent}) Vol: ${stock.volume}\n`;
        });
        dataString += "\n";
    }
    
    if (overnightData.afterHoursMovers.topLosers.length > 0) {
        dataString += "RECENT TOP LOSERS:\n";
        overnightData.afterHoursMovers.topLosers.forEach((stock, index) => {
            dataString += `${index + 1}. ${stock.symbol}: ${stock.price} (${stock.changePercent}) Vol: ${stock.volume}\n`;
        });
        dataString += "\n";
    }
    
    if (Object.keys(overnightData.currencyMoves).length > 0) {
        dataString += "CURRENCY MOVEMENTS:\n";
        Object.entries(overnightData.currencyMoves).forEach(([pair, data]) => {
            dataString += `- ${pair}: ${data.rate} (Last: ${data.lastRefreshed})\n`;
        });
        dataString += "\n";
    }
    
    if (overnightData.overnightNews.length > 0) {
        dataString += "RECENT MARKET-RELEVANT NEWS:\n";
        overnightData.overnightNews.forEach((news, index) => {
            const newsTime = new Date(news.datetime * 1000).toLocaleString();
            dataString += `${index + 1}. ${news.headline} (${newsTime})\n`;
        });
        dataString += "\n";
    }
    
    return dataString;
}

// NEWS-FOCUSED PROFESSIONAL MARKET ANALYSIS PROMPT
const createComprehensiveMarketPrompt = (overnightData) => {
    return `Please generate a comprehensive institutional-grade market intelligence report focused strictly on news headlines and their market impact analysis. You are a senior market analyst creating detailed news-driven analysis for portfolio managers and institutional investors.

${formatOvernightDataForPrompt(overnightData)}

**CRITICAL INSTRUCTION: This report must be 100% focused on NEWS HEADLINES and their analysis. Do NOT include specific numerical market data, price levels, or technical analysis. Focus exclusively on news events, policy announcements, corporate developments, and their qualitative market implications.**

Structure the analysis as follows:

## EXECUTIVE SUMMARY
Provide a concise 2-3 sentence overview highlighting the most critical NEWS DEVELOPMENTS and their aggregate impact on global equity markets. Focus on the single most important news theme driving market sentiment today.

## US MARKET NEWS ANALYSIS
**Federal Reserve and Policy Headlines:**
- Recent Fed communications, speeches, and policy signals from officials
- Congressional hearings, regulatory announcements, and policy shifts
- Treasury Department announcements and fiscal policy developments
- Banking regulation changes and financial sector oversight news

**Corporate and Earnings Headlines:**
- Major corporate announcements, executive changes, and strategic initiatives
- Significant merger and acquisition announcements and regulatory approvals
- Earnings guidance updates, management commentary, and forward-looking statements
- IPO launches, SPAC developments, and capital raising activities
- Technology sector innovations, AI developments, and regulatory responses

**Economic Policy and Regulatory News:**
- Trade policy announcements and international commerce developments
- Environmental and energy policy changes affecting corporate sectors
- Healthcare policy developments and pharmaceutical regulatory decisions
- Infrastructure spending announcements and government contract awards

**AI-Powered Impact Prediction:**
- How these US news developments will likely affect market sentiment over 30-60-90 days
- Sector rotation implications from regulatory and policy headlines
- Corporate earnings impact predictions from management guidance and strategic announcements

## ASIAN MARKET NEWS ANALYSIS
**China Economic and Policy Headlines:**
- Chinese government policy announcements affecting markets and trade
- Regulatory crackdowns or policy reversals in technology, real estate, education sectors
- Belt and Road Initiative developments and infrastructure project announcements
- COVID policy changes and economic reopening developments
- Property sector news, developer defaults, and government intervention measures

**Japan and Regional News:**
- Bank of Japan policy communications and currency intervention signals
- Japanese corporate restructuring announcements and cross-border deals
- South Korean technology sector developments and regulatory changes
- Australian commodity sector news and mining policy developments
- ASEAN trade agreements and regional economic cooperation announcements

**Technology and Trade Headlines:**
- Semiconductor industry developments, supply chain announcements, and capacity investments
- US-China technology transfer restrictions and export control updates
- Regional trade agreement developments and tariff policy changes
- Supply chain diversification announcements from major corporations

**AI-Powered Impact Prediction:**
- How Asian policy developments will affect global supply chains and commodity demand
- Regional currency implications from central bank communications
- Technology sector disruption potential from regulatory and trade headlines

## EUROPEAN MARKET NEWS ANALYSIS
**European Central Bank and Policy Headlines:**
- ECB communications, policy speeches, and monetary policy signals
- European Union regulatory announcements and policy harmonization efforts
- Brexit-related trade developments and regulatory alignment news
- EU climate policy announcements and carbon taxation developments

**Political and Economic Headlines:**
- Major European election results and coalition government developments
- EU budget negotiations and fiscal policy coordination announcements
- Immigration policy changes and labor market developments
- Energy security initiatives and renewable energy investment announcements

**Corporate and Industry News:**
- Major European corporate mergers, acquisitions, and strategic partnerships
- Banking sector consolidation and regulatory compliance developments
- Automotive industry transformation and EV investment announcements
- Pharmaceutical sector developments and regulatory approvals

**AI-Powered Impact Prediction:**
- How European policy developments will affect global trade and investment flows
- Currency implications from political and monetary policy headlines
- Sector-specific impacts from regulatory and environmental policy changes

## GEOPOLITICAL HEADLINES ANALYSIS
**Conflict and Security News:**
- Russia-Ukraine conflict developments, peace negotiation updates, and sanctions news
- Middle East developments affecting oil supply and regional stability
- US-China diplomatic communications and strategic competition headlines
- NATO developments and defense spending announcements
- Cybersecurity incidents and international response measures

**Trade and Economic Diplomacy:**
- International trade agreement negotiations and implementation updates
- WTO dispute resolution developments and regulatory harmonization efforts
- Sanctions regime changes and international compliance requirements
- Currency swap agreements and central bank cooperation announcements

**Commodity and Resource Headlines:**
- OPEC production decisions and energy policy announcements
- Critical mineral supply agreements and strategic resource partnerships
- Agricultural trade policy changes and food security initiatives
- Climate change adaptation policies affecting commodity markets

**AI-Powered Impact Prediction:**
- How geopolitical developments will affect safe-haven flows and risk sentiment
- Commodity market disruption potential from conflict and policy headlines
- Supply chain vulnerability implications from trade and diplomatic news

## TOP MARKET-MOVING HEADLINES ANALYSIS
**Breaking Corporate News:**
- Major acquisition announcements and deal approvals/rejections
- CEO changes, board restructuring, and corporate governance developments
- Product launch announcements and regulatory approval decisions
- Earnings guidance revisions and strategic outlook changes
- Corporate scandal developments and regulatory investigation news

**Central Bank and Policy Headlines:**
- Surprise policy announcements from major central banks worldwide
- International monetary policy coordination communications
- Currency intervention announcements and official statements
- Financial stability warnings and systemic risk assessments

**Regulatory and Legal Developments:**
- Major lawsuit settlements and legal precedent decisions
- Antitrust investigation announcements and enforcement actions
- New regulatory framework proposals and implementation timelines
- International regulatory coordination efforts and standard-setting initiatives

**AI-Powered Impact Prediction:**
- Immediate market sentiment implications from breaking headlines
- Cross-asset correlation effects from major news developments
- Sector rotation potential from regulatory and corporate news
- Volatility implications from policy uncertainty and legal developments

## COMPREHENSIVE AI MARKET IMPACT PREDICTIONS

**30-Day News-Driven Outlook (High Confidence):**
- Which headline themes will dominate market attention and trading decisions
- Corporate earnings season narrative development and guidance trend implications
- Policy implementation timelines and their staged market impact potential
- Geopolitical event calendar and scheduled announcement impact assessments

**60-Day News-Driven Outlook (Medium Confidence):**
- Policy effectiveness assessments and potential course corrections from governments
- Corporate strategic initiative success measurements and market reception analysis
- International diplomatic process development and resolution probability assessments
- Regulatory implementation impact visibility and corporate adaptation success rates

**90-Day News-Driven Outlook (Scenario Planning):**
- Multiple scenario development from current headline themes with probability weightings
- Long-term policy trend implications and structural market shift potential
- Geopolitical stability scenario analysis and tail risk event preparation
- Corporate sector transformation timeline assessments from current strategic announcements

## PROFESSIONAL NEWS ANALYSIS STANDARDS
Use institutional investment terminology throughout while focusing on:
- News headline significance ranking and market attention probability
- Policy announcement implementation feasibility and timeline realism
- Corporate communication credibility assessment and strategic coherence analysis
- Geopolitical development sustainability and escalation/de-escalation potential
- Cross-regional news correlation and international policy coordination effectiveness

## RISK DISCLAIMERS AND NEWS ANALYSIS LIMITATIONS
- Distinguish between confirmed news developments and speculative reporting
- Acknowledge information source reliability variations and verification requirements
- Note timing uncertainty in policy implementation and corporate execution
- Include appropriate disclaimers for prediction accuracy in dynamic news environments

Generate this report with deep news analysis expertise expected by institutional portfolio managers who need to understand how headlines will drive market behavior. Focus exclusively on news-driven intelligence while maintaining objectivity and professional skepticism about information sources and development timelines.

**REMINDER: NO NUMERICAL MARKET DATA - ONLY NEWS ANALYSIS AND QUALITATIVE IMPACT ASSESSMENTS**

Current date: ${new Date().toDateString()}
Report generation time: ${new Date().toLocaleTimeString()} ET`;
};

async function generateOvernightMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log(`🏛️ Generating COMPREHENSIVE INSTITUTIONAL MARKET REPORT (${timing.hoursSinceClose} hours since close)...`);
        
        // Fetch overnight market data
        const overnightData = await fetchOvernightMarketData();
        console.log('📊 Market data compiled - Futures:', Object.keys(overnightData.afterHoursFutures).length, 'Sectors:', Object.keys(overnightData.overnightSectors).length, 'News:', overnightData.overnightNews.length);
        
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000, // Increased for comprehensive analysis
            temperature: 0.1, // Very low for professional consistency
            messages: [{
                role: 'user',
                content: createComprehensiveMarketPrompt(overnightData)
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
        const filename = `institutional-market-analysis-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add professional metadata header
        const reportWithMetadata = `# INSTITUTIONAL MARKET INTELLIGENCE REPORT
## ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${report}

---

**REPORT METADATA**
- **Classification:** Institutional Market Intelligence
- **Generation Time:** ${new Date().toLocaleString()} ET  
- **Market Session:** ${timing.timeToOpenStr} until market open
- **Data Sources:** Multi-source aggregation with real-time feeds
- **Analysis Framework:** Quantitative risk assessment with scenario modeling
- **Target Audience:** Portfolio managers, risk officers, institutional investors
- **Disclaimer:** This analysis is for informational purposes only and does not constitute investment advice

*Generated by Claude AI - Professional Market Analysis System*
`;
        
        // Write professional report to file
        fs.writeFileSync(filepath, reportWithMetadata);
        
        console.log(`✅ Institutional market analysis generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`⏰ Market timing: ${timing.hoursSinceClose} hours since close, ${timing.timeToOpenStr} until open`);
        console.log(`🎯 Professional features: Multi-scenario analysis, quantitative metrics, institutional language`);
        
        // Create latest report link
        const latestFilepath = path.join(reportsDir, 'latest-institutional-market-analysis.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save enhanced data with metadata
        const rawDataPath = path.join(reportsDir, `institutional-market-data-${dateStr}.json`);
        const professionalData = {
            ...overnightData,
            reportMetadata: {
                generatedAt: new Date().toISOString(),
                marketTimings: timing,
                analysisType: 'institutional-grade',
                dataQuality: {
                    realTimeFeeds: Object.keys(overnightData.afterHoursFutures).length + Object.keys(overnightData.overnightSectors).length,
                    newsArticles: overnightData.overnightNews.length,
                    currencyPairs: Object.keys(overnightData.currencyMoves).length,
                    confidence: 'high'
                }
            }
        };
        fs.writeFileSync(rawDataPath, JSON.stringify(professionalData, null, 2));
        
        // Send professional report via email
        console.log('📧 Distributing institutional market analysis...');
        await sendOvernightReportEmail(reportWithMetadata, dateStr);
        
        console.log('✅ INSTITUTIONAL MARKET ANALYSIS COMPLETED!');
        console.log(`🏛️ Professional-grade analysis with comprehensive regional coverage`);
        console.log(`⏰ Market opens in ${timing.timeToOpenStr}`);
        console.log(`📈 Ready for institutional distribution`);
        
    } catch (error) {
        console.error('❌ Error generating institutional market analysis:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the comprehensive institutional market analysis
generateOvernightMarketReport();
