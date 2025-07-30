const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// All environment variables from GitHub Secrets
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FIXER_API_KEY = process.env.FIXER_API_KEY;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const GMAIL_USER = process.env.GMAIL_USER;
const MARKETSTACK_API_KEY = process.env.MARKETSTACK_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const TRADING_ECONOMICS_API_KEY = process.env.TRADING_ECONOMICS_API_KEY;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const WORK_EMAIL_LIST = process.env.WORK_EMAIL_LIST;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Calculate market timing for news filtering
function getMarketTimingInfo() {
    const now = new Date();
    const lastClose = new Date();
    
    // Set last market close (4:00 PM ET previous trading day)
    lastClose.setHours(16, 0, 0, 0);
    if (now.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Skip weekends - if it's Monday, go back to Friday
    if (lastClose.getDay() === 0) { // Sunday
        lastClose.setDate(lastClose.getDate() - 2);
    } else if (lastClose.getDay() === 6) { // Saturday
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    return {
        lastCloseTimestamp: Math.floor(lastClose.getTime() / 1000),
        lastCloseString: lastClose.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        currentTime: now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    };
}

// Remove web search function since we're focusing on API data
// This function is no longer needed as we're using direct API calls

// Enhanced news fetching with all available APIs
async function fetchComprehensiveNews() {
    const timing = getMarketTimingInfo();
    const headlines = {
        general: [],
        us: [],
        asian: [],
        european: [],
        geopolitical: [],
        currencies: [],
        commodities: [],
        earnings: [],
        research: []
    };
    
    console.log(`📰 Comprehensive news gathering since: ${timing.lastCloseString}`);
    
    try {
        // 1. Finnhub News (Market News)
        if (FINNHUB_API_KEY) {
            console.log('📡 Fetching from Finnhub...');
            try {
                const response = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&minId=${timing.lastCloseTimestamp}&token=${FINNHUB_API_KEY}`
                );
                
                if (response.data && Array.isArray(response.data)) {
                    headlines.general = response.data
                        .filter(news => news.datetime > timing.lastCloseTimestamp)
                        .slice(0, 10)
                        .map(news => ({
                            headline: news.headline,
                            summary: news.summary,
                            source: `Finnhub - ${news.source}`,
                            datetime: new Date(news.datetime * 1000).toLocaleString(),
                            url: news.url
                        }));
                    console.log(`  ✅ Finnhub: ${headlines.general.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Finnhub fetch failed:', error.message);
            }
        }
        
        // 2. Alpha Vantage News
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📡 Fetching from Alpha Vantage...');
            try {
                const response = await axios.get(
                    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                
                if (response.data && response.data.feed) {
                    const alphaNews = response.data.feed
                        .slice(0, 8)
                        .map(news => ({
                            headline: news.title,
                            summary: news.summary,
                            source: `Alpha Vantage - ${news.source}`,
                            datetime: new Date(news.time_published).toLocaleString(),
                            url: news.url,
                            sentiment: news.overall_sentiment_label
                        }));
                    headlines.general.push(...alphaNews);
                    console.log(`  ✅ Alpha Vantage: ${alphaNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Alpha Vantage fetch failed:', error.message);
            }
        }
        
        // 3. NewsAPI with multiple categories
        if (NEWS_API_KEY) {
            console.log('📡 Fetching from NewsAPI...');
            const categories = [
                { query: '(stocks OR trading OR NYSE OR NASDAQ OR "S&P 500" OR Dow OR earnings OR "Federal Reserve" OR Fed OR "interest rates") AND market', category: 'us' },
                { query: '(China OR Japan OR "Hong Kong" OR "Asian markets" OR Nikkei OR Shanghai OR "Hang Seng" OR "South Korea" OR Singapore OR India OR Taiwan OR "Bank of Japan" OR PBOC) AND (market OR economy OR policy)', category: 'asian' },
                { query: '(Europe OR ECB OR Brexit OR DAX OR FTSE OR "European markets" OR eurozone OR Germany OR France OR "United Kingdom" OR Italy OR Spain OR "European Union" OR "Christine Lagarde") AND (market OR economy OR policy)', category: 'european' },
                { query: '(Russia OR Ukraine OR "Middle East" OR sanctions OR "trade war" OR geopolitical OR NATO OR China OR "South China Sea" OR Iran OR Israel OR "North Korea" OR Taiwan OR diplomacy) AND (market OR impact OR economy)', category: 'geopolitical' },
                { query: '(dollar OR euro OR yen OR "currency markets" OR forex OR "exchange rate" OR "central bank" OR DXY) AND (market OR rate)', category: 'currencies' },
                { query: '(oil OR gold OR "natural gas" OR commodities OR "crude oil" OR copper OR wheat OR silver OR platinum OR "Brent crude") AND (price OR market)', category: 'commodities' },
                { query: '(earnings OR "quarterly results" OR "earnings report" OR guidance OR revenue OR "after hours" OR "pre market") AND (stock OR company)', category: 'earnings' },
                { query: '("research report" OR "analyst report" OR "investment research" OR "equity research" OR "market outlook" OR "price target" OR upgrade OR downgrade OR initiation) AND (stock OR market)', category: 'research' }
            ];
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const fromDate = yesterday.toISOString().split('T')[0];
            
            for (const cat of categories) {
                try {
                    const response = await axios.get('https://newsapi.org/v2/everything', {
                        params: {
                            q: cat.query,
                            from: fromDate,
                            sortBy: 'publishedAt',
                            language: 'en',
                            pageSize: 15, // Increased for all categories to ensure 10+ headlines per section
                            apiKey: NEWS_API_KEY
                        }
                    });
                    
                    if (response.data && response.data.articles) {
                        const categoryNews = response.data.articles.map(article => ({
                            headline: article.title,
                            summary: article.description,
                            source: `NewsAPI - ${article.source.name}`,
                            datetime: new Date(article.publishedAt).toLocaleString(),
                            url: article.url
                        }));
                        headlines[cat.category].push(...categoryNews);
                        console.log(`  ✅ NewsAPI ${cat.category}: ${categoryNews.length} headlines`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`  ❌ NewsAPI ${cat.category} failed:`, error.message);
                }
            }
        }
        
        // 4. Marketstack for market-specific news
        if (MARKETSTACK_API_KEY) {
            console.log('📡 Fetching from Marketstack...');
            try {
                const response = await axios.get('http://api.marketstack.com/v1/news', {
                    params: {
                        access_key: MARKETSTACK_API_KEY,
                        limit: 12,
                        sort: 'published_on',
                        keywords: 'market,trading,stocks,earnings,Federal Reserve,interest rates'
                    }
                });
                
                if (response.data && response.data.data) {
                    const marketNews = response.data.data.map(news => ({
                        headline: news.title,
                        summary: news.description,
                        source: `Marketstack - ${news.source}`,
                        datetime: new Date(news.published_on).toLocaleString(),
                        url: news.url
                    }));
                    headlines.us.push(...marketNews);
                    console.log(`  ✅ Marketstack: ${marketNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Marketstack fetch failed:', error.message);
            }
        }
        
        // 5. Trading Economics news
        if (TRADING_ECONOMICS_API_KEY) {
            console.log('📡 Fetching from Trading Economics...');
            try {
                const response = await axios.get('https://api.tradingeconomics.com/news', {
                    params: {
                        c: TRADING_ECONOMICS_API_KEY,
                        format: 'json',
                        limit: 20 // Increased to ensure good distribution across categories
                    }
                });
                
                if (response.data && Array.isArray(response.data)) {
                    const economicNews = response.data.map(news => ({
                        headline: news.title,
                        summary: news.description,
                        source: `Trading Economics - ${news.country || 'Global'}`,
                        datetime: new Date(news.date).toLocaleString(),
                        url: news.url,
                        country: news.country
                    }));
                    
                    // Categorize by region with enhanced targeting
                    economicNews.forEach(news => {
                        if (news.country && ['United States', 'USA', 'US'].includes(news.country)) {
                            headlines.us.push(news);
                        } else if (news.country && ['China', 'Japan', 'South Korea', 'India', 'Singapore', 'Hong Kong', 'Taiwan', 'Thailand', 'Malaysia', 'Philippines', 'Indonesia', 'Vietnam'].includes(news.country)) {
                            headlines.asian.push(news);
                        } else if (news.country && ['Germany', 'France', 'UK', 'United Kingdom', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland'].includes(news.country)) {
                            headlines.european.push(news);
                        } else if (news.country && ['Russia', 'Ukraine', 'Iran', 'Israel', 'Turkey', 'Saudi Arabia', 'North Korea', 'Syria', 'Iraq', 'Afghanistan'].includes(news.country)) {
                            headlines.geopolitical.push(news);
                        } else {
                            headlines.general.push(news);
                        }
                    });
                    console.log(`  ✅ Trading Economics: ${economicNews.length} headlines categorized`);
                }
            } catch (error) {
                console.log('  ❌ Trading Economics fetch failed:', error.message);
            }
        }
        
        // 6. Polygon.io Market News
        if (POLYGON_API_KEY) {
            console.log('📡 Fetching from Polygon...');
            try {
                const response = await axios.get('https://api.polygon.io/v2/reference/news', {
                    params: {
                        'published_utc.gte': new Date(timing.lastCloseTimestamp * 1000).toISOString().split('T')[0],
                        limit: 12,
                        sort: 'published_utc',
                        order: 'desc',
                        apikey: POLYGON_API_KEY
                    }
                });
                
                if (response.data && response.data.results) {
                    const polygonNews = response.data.results.map(news => ({
                        headline: news.title,
                        summary: news.description,
                        source: `Polygon - ${news.publisher.name}`,
                        datetime: new Date(news.published_utc).toLocaleString(),
                        url: news.article_url
                    }));
                    headlines.us.push(...polygonNews);
                    console.log(`  ✅ Polygon: ${polygonNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Polygon fetch failed:', error.message);
            }
        }
        
        // 7. Twelve Data Market News
        if (TWELVE_DATA_API_KEY) {
            console.log('📡 Fetching from Twelve Data...');
            try {
                const response = await axios.get('https://api.twelvedata.com/news', {
                    params: {
                        source: 'all',
                        language: 'en',
                        apikey: TWELVE_DATA_API_KEY
                    }
                });
                
                if (response.data && response.data.data) {
                    const twelveNews = response.data.data
                        .slice(0, 10)
                        .map(news => ({
                            headline: news.title,
                            summary: news.description,
                            source: `Twelve Data - ${news.source}`,
                            datetime: new Date(news.datetime).toLocaleString(),
                            url: news.url
                        }));
                    headlines.general.push(...twelveNews);
                    console.log(`  ✅ Twelve Data: ${twelveNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Twelve Data fetch failed:', error.message);
            }
        }
        
        // 9. Additional Asian Market News Sources
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📡 Fetching additional Asian market news...');
            try {
                const asianResponse = await axios.get(
                    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=technology,manufacturing&keywords=China,Japan,Asia&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                
                if (asianResponse.data && asianResponse.data.feed) {
                    const additionalAsianNews = asianResponse.data.feed
                        .slice(0, 8)
                        .map(news => ({
                            headline: news.title,
                            summary: news.summary,
                            source: `Alpha Vantage Asia - ${news.source}`,
                            datetime: new Date(news.time_published).toLocaleString(),
                            url: news.url,
                            sentiment: news.overall_sentiment_label
                        }));
                    headlines.asian.push(...additionalAsianNews);
                    console.log(`  ✅ Additional Asian news: ${additionalAsianNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Additional Asian news fetch failed:', error.message);
            }
        }
        
        // 10. Additional European Market News Sources
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📡 Fetching additional European market news...');
            try {
                const europeanResponse = await axios.get(
                    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=economy,financial_markets&keywords=Europe,ECB,Brexit&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                
                if (europeanResponse.data && europeanResponse.data.feed) {
                    const additionalEuropeanNews = europeanResponse.data.feed
                        .slice(0, 8)
                        .map(news => ({
                            headline: news.title,
                            summary: news.summary,
                            source: `Alpha Vantage Europe - ${news.source}`,
                            datetime: new Date(news.time_published).toLocaleString(),
                            url: news.url,
                            sentiment: news.overall_sentiment_label
                        }));
                    headlines.european.push(...additionalEuropeanNews);
                    console.log(`  ✅ Additional European news: ${additionalEuropeanNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Additional European news fetch failed:', error.message);
            }
        }
        
        // 13. Additional US Market News to ensure 10+ headlines
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📡 Fetching additional US market news...');
            try {
                const usResponse = await axios.get(
                    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets,economy&keywords=Federal Reserve,NYSE,NASDAQ,earnings&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                
                if (usResponse.data && usResponse.data.feed) {
                    const additionalUSNews = usResponse.data.feed
                        .slice(0, 8)
                        .map(news => ({
                            headline: news.title,
                            summary: news.summary,
                            source: `Alpha Vantage US - ${news.source}`,
                            datetime: new Date(news.time_published).toLocaleString(),
                            url: news.url,
                            sentiment: news.overall_sentiment_label
                        }));
                    headlines.us.push(...additionalUSNews);
                    console.log(`  ✅ Additional US news: ${additionalUSNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Additional US news fetch failed:', error.message);
            }
        }
        
        // 14. Additional Currency & Commodity News
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📡 Fetching additional currency & commodity news...');
            try {
                const currencyResponse = await axios.get(
                    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=economy,financial_markets&keywords=dollar,gold,oil,commodity&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                
                if (currencyResponse.data && currencyResponse.data.feed) {
                    const currencyNews = currencyResponse.data.feed
                        .slice(0, 6)
                        .map(news => ({
                            headline: news.title,
                            summary: news.summary,
                            source: `Alpha Vantage FX - ${news.source}`,
                            datetime: new Date(news.time_published).toLocaleString(),
                            url: news.url,
                            sentiment: news.overall_sentiment_label
                        }));
                    
                    // Split between currencies and commodities based on keywords
                    currencyNews.forEach(news => {
                        const headline = news.headline.toLowerCase();
                        if (headline.includes('oil') || headline.includes('gold') || headline.includes('commodity') || headline.includes('copper') || headline.includes('wheat')) {
                            headlines.commodities.push(news);
                        } else {
                            headlines.currencies.push(news);
                        }
                    });
                    console.log(`  ✅ Additional currency/commodity news: ${currencyNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Additional currency/commodity news fetch failed:', error.message);
            }
        }
        
        // 15. Additional Earnings News to ensure coverage
        if (POLYGON_API_KEY) {
            console.log('📡 Fetching additional earnings news...');
            try {
                const earningsResponse = await axios.get('https://api.polygon.io/v2/reference/news', {
                    params: {
                        'published_utc.gte': new Date(timing.lastCloseTimestamp * 1000).toISOString().split('T')[0],
                        limit: 10,
                        sort: 'published_utc',
                        order: 'desc',
                        'ticker.any_of': 'AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX', // Major stocks for earnings
                        apikey: POLYGON_API_KEY
                    }
                });
                
                if (earningsResponse.data && earningsResponse.data.results) {
                    const additionalEarningsNews = earningsResponse.data.results.map(news => ({
                        headline: news.title,
                        summary: news.description,
                        source: `Polygon Earnings - ${news.publisher.name}`,
                        datetime: new Date(news.published_utc).toLocaleString(),
                        url: news.article_url
                    }));
                    headlines.earnings.push(...additionalEarningsNews);
                    console.log(`  ✅ Additional earnings news: ${additionalEarningsNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Additional earnings news fetch failed:', error.message);
            }
        }
        if (FINNHUB_API_KEY) {
            console.log('📡 Fetching additional geopolitical news...');
            try {
                const geoResponse = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&minId=${timing.lastCloseTimestamp}&token=${FINNHUB_API_KEY}`
                );
                
                if (geoResponse.data && Array.isArray(geoResponse.data)) {
                    const geopoliticalKeywords = ['russia', 'ukraine', 'china', 'trade war', 'sanctions', 'nato', 'middle east', 'iran', 'israel', 'north korea', 'taiwan', 'diplomatic'];
                    const additionalGeoNews = geoResponse.data
                        .filter(news => {
                            const headline = news.headline.toLowerCase();
                            return geopoliticalKeywords.some(keyword => headline.includes(keyword)) && news.datetime > timing.lastCloseTimestamp;
                        })
                        .slice(0, 10)
                        .map(news => ({
                            headline: news.headline,
                            summary: news.summary,
                            source: `Finnhub Geo - ${news.source}`,
                            datetime: new Date(news.datetime * 1000).toLocaleString(),
                            url: news.url
                        }));
                    headlines.geopolitical.push(...additionalGeoNews);
                    console.log(`  ✅ Additional geopolitical news: ${additionalGeoNews.length} headlines`);
                }
            } catch (error) {
                console.log('  ❌ Additional geopolitical news fetch failed:', error.message);
            }
        }
        if (EXCHANGERATE_API_KEY || FIXER_API_KEY) {
            console.log('💱 Fetching currency data for context...');
            try {
                let currencyData = null;
                
                if (EXCHANGERATE_API_KEY) {
                    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`);
                    currencyData = response.data;
                } else if (FIXER_API_KEY) {
                    const response = await axios.get(`http://data.fixer.io/api/latest?access_key=${FIXER_API_KEY}&base=USD`);
                    currencyData = response.data;
                }
                
                if (currencyData && currencyData.rates) {
                    const majorPairs = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY'];
                    majorPairs.forEach(currency => {
                        if (currencyData.rates[currency]) {
                            headlines.currencies.push({
                                headline: `USD/${currency} Current Exchange Rate`,
                                summary: `Trading at ${currencyData.rates[currency].toFixed(4)} as of latest update`,
                                source: EXCHANGERATE_API_KEY ? 'ExchangeRate-API' : 'Fixer.io',
                                datetime: new Date().toLocaleString(),
                                rate: currencyData.rates[currency]
                            });
                        }
                    });
                    console.log(`  ✅ Currency data: ${majorPairs.length} exchange rates`);
                }
            } catch (error) {
                console.log('  ❌ Currency data fetch failed:', error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Error in comprehensive news fetch:', error.message);
    }
    
    return headlines;
}

// Enhanced news summary prompt with all data sources
function createComprehensiveNewsSummaryPrompt(headlines, timing) {
    let prompt = `You are a senior financial analyst creating a comprehensive pre-market news briefing for institutional investors and portfolio managers. 

Generate a detailed pre-market report analyzing the most significant news developments since yesterday's market close (${timing.lastCloseString}) through this morning, incorporating data from multiple premium financial news sources and web search results.

COMPREHENSIVE HEADLINES DATA FROM MULTIPLE SOURCES:
`;

    const sections = [
        { key: 'general', title: 'GENERAL MARKET HEADLINES' },
        { key: 'us', title: 'US MARKET HEADLINES' },
        { key: 'asian', title: 'ASIAN MARKET HEADLINES' },
        { key: 'european', title: 'EUROPEAN MARKET HEADLINES' },
        { key: 'geopolitical', title: 'GEOPOLITICAL HEADLINES' },
        { key: 'currencies', title: 'CURRENCY MARKET UPDATES' },
        { key: 'commodities', title: 'COMMODITY MARKET NEWS' },
        { key: 'earnings', title: 'EARNINGS & CORPORATE NEWS' },
        { key: 'research', title: 'RESEARCH REPORTS & ANALYST COVERAGE' }
    ];

    sections.forEach(section => {
        if (headlines[section.key] && headlines[section.key].length > 0) {
            prompt += `\n${section.title}:\n`;
            headlines[section.key].forEach((news, index) => {
                prompt += `${index + 1}. ${news.headline} (${news.source} - ${news.datetime})\n`;
                if (news.summary) prompt += `   Summary: ${news.summary}\n`;
                if (news.country) prompt += `   Country: ${news.country}\n`;
                if (news.rate) prompt += `   Rate: ${news.rate}\n`;
            });
        }
    });

    prompt += `

Please create a comprehensive professional pre-market briefing with the following enhanced structure. IMPORTANT: For each section, provide a narrative summary paragraph followed by the actual headlines in a clean list format (not bullet points).

# COMPREHENSIVE PRE-MARKET NEWS BRIEFING
## ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## AT A GLANCE
Provide a comprehensive executive overview that synthesizes all overnight developments into key themes and market-moving events. Highlight the single most important story, identify 3-4 critical developments across regions, and note any potential market catalysts for today's trading session. This should serve as a complete summary that a busy executive could read to understand all major overnight developments in 60 seconds.

**Critical Overnight Events:**
[List the top 5-7 most market-moving headlines from across all categories - these should be the absolute biggest stories that could impact trading today]

## EXECUTIVE SUMMARY
Provide a 3-4 sentence overview of the most market-moving developments overnight and their potential impact on today's trading session, incorporating insights from multiple data sources.

## US MARKET DEVELOPMENTS
Write a comprehensive narrative summary of US corporate earnings, regulatory announcements, Federal Reserve communications, domestic policy developments, and key economic data releases that occurred overnight.

**Key US Headlines:**
[List at least 10 of the most relevant US market headlines here in clean format - no bullet points, just numbered headlines with source attribution]

## ASIAN MARKET NEWS
Provide detailed narrative coverage of major developments from Asian markets including China policy announcements, Japanese economic data, Hong Kong market developments, and other regional news affecting global markets.

**Key Asian Headlines:**
[List at least 10 of the most relevant Asian market headlines here in clean format - no bullet points, just numbered headlines with source attribution]

## EUROPEAN MARKET NEWS
Write an in-depth narrative analysis of European Central Bank communications, Brexit developments, EU policy announcements, major European corporate news, and eurozone economic indicators.

**Key European Headlines:**
[List at least 10 of the most relevant European market headlines here in clean format - no bullet points, just numbered headlines with source attribution]

## GEOPOLITICAL DEVELOPMENTS
Provide thorough narrative analysis of ongoing geopolitical tensions, trade developments, sanctions news, international conflicts, and diplomatic developments that could impact global market risk sentiment.

**Key Geopolitical Headlines:**
[List at least 10 of the most relevant geopolitical headlines here in clean format - no bullet points, just numbered headlines with source attribution]

## CURRENCY & COMMODITY MARKETS
Write a narrative analysis of major currency movements, central bank interventions, commodity price developments, and their implications for various market sectors.

**Key Currency & Commodity Headlines:**
[List at least 10 of the most relevant currency and commodity headlines here in clean format - no bullet points, just numbered headlines with source attribution]

## EARNINGS & CORPORATE DEVELOPMENTS
Write a comprehensive narrative analysis of overnight earnings reports, corporate announcements, management guidance updates, merger and acquisition news, and other significant corporate developments.

**Key Earnings & Corporate Headlines:**
[List at least 10 of the most relevant earnings and corporate headlines here in clean format - no bullet points, just numbered headlines with source attribution]

## RESEARCH REPORTS & ANALYST COVERAGE
Write a comprehensive analysis of overnight research publications, analyst upgrades and downgrades, price target changes, initiation of coverage, and investment banking research that could influence individual stock movements and sector sentiment.

**Key Research & Analyst Headlines:**
[List at least 10 of the most relevant research reports and analyst coverage headlines here in clean format - no bullet points, just numbered headlines with source attribution]

## CROSS-MARKET IMPACT ANALYSIS
Identify potential spillover effects between regions and asset classes based on overnight developments.

## MARKET OUTLOOK FOR TODAY
Provide a detailed assessment of how these overnight developments might influence today's market open, key levels to watch, and potential trading themes.

## RISK FACTORS TO MONITOR
Highlight key risks and uncertainties that could develop during today's trading session.

FORMATTING REQUIREMENTS:
- Use narrative paragraphs for analysis sections
- Follow each analysis with "**Key [Section] Headlines:**" 
- List headlines in clean numbered format (1. 2. 3.) with source attribution
- NO bullet points or dashes for headlines
- Maintain professional institutional investment language throughout
- Focus on actionable intelligence with clear headline attribution

Report generated: ${timing.currentTime} ET
Coverage period: Since market close ${timing.lastCloseString}
Data sources integration: Multi-API aggregation with web search enhancement`;

    return prompt;
}

// Enhanced email function
async function sendComprehensivePreMarketReport(reportContent, dateStr, headlineCount) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Preparing comprehensive pre-market briefing email...');
        
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        // Enhanced HTML formatting with white background, black text, soft gold accents, and dark grey text
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #000000; border-bottom: 3px solid #E6C068; padding-bottom: 12px; margin-bottom: 20px; font-size: 28px;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #000000; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #E6C068; padding-bottom: 8px; font-size: 22px;">$1</h2>')
            .replace(/^\*\*(Key.*Headlines:)\*\*/gm, '<h3 style="color: #4A4A4A; margin-top: 25px; margin-bottom: 12px; font-weight: 600; font-size: 18px; border-bottom: 1px solid #E6C068; padding-bottom: 5px;">$1</h3>')
            .replace(/^\*\*(.*?)\*\*/gm, '<strong style="color: #000000; font-weight: 600;">$1</strong>')
            .replace(/^(\d+\.\s.*$)/gm, '<div style="margin: 8px 0; padding: 10px 15px; background-color: #FFFFFF; border-left: 3px solid #E6C068; border-radius: 4px; font-size: 14px; color: #000000; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">$1</div>')
            .replace(/^([^<\n#-\d].*$)/gm, '<p style="line-height: 1.7; margin-bottom: 14px; color: #000000; font-size: 15px;">$1</p>')
            .replace(/\n\n/g, '<br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; background-color: #FFFFFF; padding: 25px;">
            <div style="background-color: #FFFFFF; padding: 35px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #E6C068;">
                ${emailHtml}
                
                <div style="margin-top: 35px; padding: 25px; background-color: #FFFFFF; border-radius: 10px; border-left: 5px solid #E6C068; border: 1px solid #E6C068;">
                    <p style="margin: 0; font-weight: bold; color: #000000; font-size: 16px;">COMPREHENSIVE PRE-MARKET INTELLIGENCE BRIEFING</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #000000;">Generated: ${new Date().toLocaleString()} ET</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #000000;">Headlines Analyzed: ${headlineCount} from multiple premium sources</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #000000;">Data Sources: Finnhub, NewsAPI, Marketstack, Trading Economics, Exchange Rates + Web Search</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #4A4A4A;">AI Analysis: Claude Sonnet 4 | Classification: Institutional Grade</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `Comprehensive Pre-Market Brief - ${dateStr} - Multi-Source Intelligence Report`,
            html: emailContent,
            text: reportContent,
            priority: 'high'
        };
        
        console.log('📤 Sending comprehensive pre-market briefing...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Comprehensive briefing sent successfully:', info.messageId);
        console.log('📧 Recipients:', WORK_EMAIL_LIST);
        
    } catch (error) {
        console.error('❌ Failed to send comprehensive briefing:', error.message);
    }
}

// Main function with enhanced capabilities
async function generateComprehensivePreMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log('🌅 Generating Comprehensive Pre-Market News Briefing...');
        console.log(`📅 Coverage Period: Since ${timing.lastCloseString}`);
        console.log('🔧 Using all available API keys and web search integration');
        
        // Display available APIs
        const availableAPIs = [];
        if (ALPHA_VANTAGE_API_KEY) availableAPIs.push('Alpha Vantage');
        if (FINNHUB_API_KEY) availableAPIs.push('Finnhub');
        if (NEWS_API_KEY) availableAPIs.push('NewsAPI');
        if (MARKETSTACK_API_KEY) availableAPIs.push('Marketstack');
        if (TRADING_ECONOMICS_API_KEY) availableAPIs.push('Trading Economics');
        if (EXCHANGERATE_API_KEY) availableAPIs.push('Exchange Rate API');
        if (FIXER_API_KEY) availableAPIs.push('Fixer');
        if (POLYGON_API_KEY) availableAPIs.push('Polygon');
        if (TWELVE_DATA_API_KEY) availableAPIs.push('Twelve Data');
        
        console.log(`🔑 Active APIs: ${availableAPIs.join(', ')}`);
        
        // Fetch comprehensive news
        const headlines = await fetchComprehensiveNews();
        const totalHeadlines = Object.values(headlines).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📰 Total headlines collected: ${totalHeadlines}`);
        
        // Log breakdown by category
        Object.entries(headlines).forEach(([category, items]) => {
            if (items.length > 0) {
                console.log(`  ${category}: ${items.length} headlines`);
            }
        });
        
        if (totalHeadlines === 0) {
            console.log('⚠️  No headlines found, check API keys and connections');
            return;
        }
        
        // Generate comprehensive AI analysis
        console.log('🤖 Generating comprehensive professional analysis...');
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 6000,
            temperature: 0.1,
            messages: [{
                role: 'user',
                content: createComprehensiveNewsSummaryPrompt(headlines, timing)
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });

        const report = response.data.content[0].text;
        
        // Save comprehensive report
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `comprehensive-premarket-brief-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        const reportWithMetadata = report;
        
        fs.writeFileSync(filepath, reportWithMetadata);
        
        // Create latest report link
        const latestFilepath = path.join(reportsDir, 'latest-comprehensive-premarket-brief.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save comprehensive raw data
        const dataPath = path.join(reportsDir, `comprehensive-premarket-data-${dateStr}.json`);
        const comprehensiveData = {
            headlines,
            timing,
            totalHeadlines,
            activeAPIs: availableAPIs,
            categoryBreakdown: Object.fromEntries(
                Object.entries(headlines).map(([cat, items]) => [cat, items.length])
            ),
            metadata: {
                generatedAt: new Date().toISOString(),
                reportType: 'comprehensive-premarket-brief',
                aiModel: 'claude-sonnet-4',
                classification: 'institutional-grade'
            }
        };
        fs.writeFileSync(dataPath, JSON.stringify(comprehensiveData, null, 2));
        
        console.log(`✅ Comprehensive briefing generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`📰 Headlines processed: ${totalHeadlines}`);
        console.log(`🔗 Data sources integrated: ${availableAPIs.length}`);
        
        // Send enhanced email
        await sendComprehensivePreMarketReport(reportWithMetadata, dateStr, totalHeadlines);
        
        console.log('✅ COMPREHENSIVE PRE-MARKET BRIEFING COMPLETED!');
        console.log('🌅 Multi-source intelligence ready for market open preparation');
        console.log(`📈 Professional-grade analysis with ${availableAPIs.length} data source integration`);
        
    } catch (error) {
        console.error('❌ Error generating comprehensive pre-market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the comprehensive pre-market news system
generateComprehensivePreMarketReport();
