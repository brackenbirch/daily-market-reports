// Enhanced Market News System with Comprehensive Keyword Detection and AI-Powered Importance Scoring

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

// Comprehensive market-moving keywords organized by impact level and category
const MARKET_MOVING_KEYWORDS = {
    // TIER 1: EXTREME MARKET IMPACT (200+ priority points)
    marketShaking: [
        // Market Cap Milestones
        'trillion market cap', 'trillion valuation', '$4 trillion', '$3 trillion', '$5 trillion',
        'largest company', 'most valuable company', 'market cap record',
        
        // Fed & Monetary Policy
        'federal reserve emergency', 'fed emergency meeting', 'interest rate emergency',
        'jerome powell emergency', 'fed chair resignation', 'monetary policy shock',
        'quantitative easing', 'QE announcement', 'rate cut emergency', 'rate hike shock',
        
        // Market Structure Events
        'market crash', 'flash crash', 'circuit breaker', 'trading halt',
        'margin call crisis', 'liquidity crisis', 'bank run', 'credit crunch',
        'systematic risk', 'financial contagion', 'market meltdown',
        
        // Geopolitical Shocks
        'military conflict', 'war declaration', 'nuclear threat', 'terrorist attack',
        'assassination', 'coup attempt', 'regime change', 'border closure',
        'trade embargo', 'economic sanctions', 'currency war',
        
        // Corporate Mega Events
        'bankruptcy filing', 'chapter 11', 'insolvency', 'default announcement',
        'fraud charges', 'sec investigation', 'criminal charges ceo',
        'massive layoffs', 'plant closure', 'facility shutdown'
    ],
    
    // TIER 2: HIGH MARKET IMPACT (150-199 priority points)
    highImpact: [
        // Earnings Superlatives
        'record earnings', 'blowout earnings', 'massive beat', 'huge miss',
        'guidance shock', 'outlook cut', 'profit warning', 'earnings surprise',
        'revenue record', 'margin expansion', 'cost cutting', 'restructuring',
        
        // M&A and Corporate Actions
        'mega merger', 'acquisition announcement', 'takeover bid', 'hostile takeover',
        'spin-off announcement', 'divestiture', 'asset sale', 'ipo announcement',
        'stock split', 'reverse split', 'dividend increase', 'dividend cut',
        'share buyback', 'capital return', 'debt restructuring',
        
        // Trade and Tariffs
        'trump tariff', 'trade war escalation', 'tariff announcement', 'trade deal',
        'export ban', 'import restriction', 'wto ruling', 'trade dispute',
        'supply chain disruption', 'shipping crisis', 'port closure',
        
        // Central Bank Actions
        'ecb announcement', 'bank of japan', 'pboc policy', 'boe decision',
        'currency intervention', 'fx intervention', 'capital controls',
        'banking regulation', 'stress test results', 'basel requirements',
        
        // Energy and Commodities
        'opec decision', 'oil production cut', 'oil embargo', 'pipeline shutdown',
        'refinery explosion', 'mining disaster', 'commodity shortage',
        'rare earth restriction', 'strategic reserve release'
    ],
    
    // TIER 3: SIGNIFICANT MARKET IMPACT (100-149 priority points)
    significant: [
        // Tech and Innovation
        'artificial intelligence breakthrough', 'ai breakthrough', 'quantum computing',
        'autonomous vehicles', 'self-driving cars', 'electric vehicle',
        'battery technology', 'renewable energy', 'clean energy',
        'cybersecurity breach', 'data breach', 'ransomware attack',
        'patent approval', 'regulatory approval', 'fda approval',
        
        // Economic Data
        'inflation shock', 'cpi surprise', 'ppi data', 'gdp revision',
        'employment report', 'unemployment rate', 'jobs report',
        'consumer confidence', 'retail sales', 'housing data',
        'manufacturing pmi', 'services pmi', 'ism report',
        
        // Healthcare and Pharma
        'drug approval', 'clinical trial', 'vaccine development', 'pandemic',
        'health emergency', 'fda warning', 'drug recall', 'medical breakthrough',
        'biotech merger', 'pharma acquisition',
        
        // Financial Sector
        'bank stress test', 'credit rating', 'rating downgrade', 'rating upgrade',
        'loan loss provision', 'net interest margin', 'deposit flight',
        'regulatory fine', 'settlement agreement', 'compliance violation',
        
        // ESG and Sustainability
        'climate change', 'carbon emissions', 'esg rating', 'sustainability',
        'green bond', 'carbon tax', 'emissions regulation', 'renewable mandate'
    ],
    
    // TIER 4: MODERATE MARKET IMPACT (75-99 priority points)
    moderate: [
        // Regular Corporate News
        'ceo appointment', 'management change', 'board resignation',
        'product launch', 'new product', 'market expansion', 'facility opening',
        'partnership agreement', 'joint venture', 'licensing deal',
        'contract award', 'government contract', 'supply agreement',
        
        // Regional Economic Events
        'brexit update', 'eu regulation', 'china policy', 'india growth',
        'emerging markets', 'currency devaluation', 'sovereign debt',
        'imf warning', 'world bank forecast', 'oecd outlook',
        
        // Sector-Specific Events
        'auto sales', 'semiconductor shortage', 'chip demand', 'memory prices',
        'streaming subscribers', 'cloud revenue', 'advertising spend',
        'real estate prices', 'mortgage rates', 'construction spending',
        'airline capacity', 'hotel occupancy', 'retail traffic'
    ],
    
    // Company-Specific High-Impact Keywords
    megaCaps: [
        'microsoft', 'apple', 'google', 'alphabet', 'amazon', 'meta', 'facebook',
        'nvidia', 'tesla', 'berkshire hathaway', 'taiwan semiconductor', 'tsmc',
        'saudi aramco', 'johnson & johnson', 'exxon mobil', 'unitedhealth',
        'jpmorgan', 'visa', 'procter & gamble', 'mastercard', 'home depot',
        'pfizer', 'abbvie', 'coca-cola', 'pepsico', 'walmart', 'disney',
        'netflix', 'adobe', 'salesforce', 'oracle', 'intel', 'cisco',
        'broadcom', 'qualcomm', 'texas instruments', 'amd'
    ],
    
    // Market Sentiment Keywords
    sentiment: [
        'market volatility', 'vix spike', 'fear index', 'risk-off', 'risk-on',
        'flight to safety', 'safe haven', 'market rotation', 'sector rotation',
        'growth stocks', 'value stocks', 'momentum trading', 'algorithmic trading'
    ]
};

// AI-powered news importance analyzer
async function analyzeNewsImportanceWithAI(newsItem) {
    if (!ANTHROPIC_API_KEY) {
        return calculateBasicPriority(newsItem.headline, newsItem.summary, newsItem.source);
    }
    
    try {
        const prompt = `You are an expert financial analyst. Analyze this news headline and summary for market-moving potential.

Headline: "${newsItem.headline}"
Summary: "${newsItem.summary || 'No summary available'}"
Source: "${newsItem.source}"

Rate the market-moving importance on a scale of 0-250:
- 200-250: Market-shaking events (fed emergencies, major bankruptcies, geopolitical shocks)
- 150-199: High impact (major earnings surprises, mega M&A, significant policy changes)
- 100-149: Significant impact (regular earnings beats/misses, sector news, economic data)
- 50-99: Moderate impact (routine corporate news, minor policy updates)
- 0-49: Low impact (general news, minor announcements)

Consider:
1. Company size/market cap relevance
2. Timing sensitivity (earnings, fed meetings, etc.)
3. Broader market implications
4. Historical precedent for similar news
5. Potential for sector/market-wide impact

Respond with just the numerical score (0-250) and a brief 1-sentence justification.
Format: "SCORE: [number] - [justification]"`;

        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            temperature: 0.1,
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

        const aiResponse = response.data.content[0].text;
        const scoreMatch = aiResponse.match(/SCORE:\s*(\d+)/);
        const justification = aiResponse.split(' - ')[1] || 'AI analysis';
        
        if (scoreMatch) {
            const aiScore = parseInt(scoreMatch[1]);
            return {
                score: Math.min(Math.max(aiScore, 0), 250), // Clamp between 0-250
                justification: justification,
                method: 'AI-powered'
            };
        }
    } catch (error) {
        console.log(`  ⚠️ AI analysis failed for "${newsItem.headline.substring(0, 50)}...": ${error.message}`);
    }
    
    // Fallback to basic scoring
    const basicScore = calculateBasicPriority(newsItem.headline, newsItem.summary, newsItem.source);
    return {
        score: basicScore,
        justification: 'Keyword-based analysis (AI fallback)',
        method: 'Keyword-based'
    };
}

// Enhanced basic priority calculation with comprehensive keywords
function calculateBasicPriority(headline, summary, source) {
    let score = 0;
    const text = `${headline} ${summary}`.toLowerCase();
    
    // Tier 1: Market-shaking events (200+ points)
    MARKET_MOVING_KEYWORDS.marketShaking.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 200;
            console.log(`    🚨 TIER 1 keyword found: "${keyword}" (+200 points)`);
        }
    });
    
    // Tier 2: High impact events (150-199 points)
    MARKET_MOVING_KEYWORDS.highImpact.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 150;
            console.log(`    ⚠️ TIER 2 keyword found: "${keyword}" (+150 points)`);
        }
    });
    
    // Tier 3: Significant impact events (100-149 points)
    MARKET_MOVING_KEYWORDS.significant.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 100;
            console.log(`    📈 TIER 3 keyword found: "${keyword}" (+100 points)`);
        }
    });
    
    // Tier 4: Moderate impact events (75-99 points)
    MARKET_MOVING_KEYWORDS.moderate.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 75;
        }
    });
    
    // Mega-cap company boost (50-100 points based on market cap)
    const megaCapBoosts = {
        'microsoft': 100, 'apple': 100, 'google': 90, 'alphabet': 90,
        'amazon': 90, 'nvidia': 85, 'meta': 80, 'tesla': 80,
        'berkshire': 75, 'tsmc': 70, 'samsung': 65, 'asml': 60
    };
    
    Object.entries(megaCapBoosts).forEach(([company, boost]) => {
        if (text.includes(company)) {
            score += boost;
            console.log(`    🏢 Mega-cap boost: "${company}" (+${boost} points)`);
        }
    });
    
    // Sentiment and timing multipliers
    MARKET_MOVING_KEYWORDS.sentiment.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 50;
        }
    });
    
    // Source credibility boost
    const sourceCredibility = {
        'reuters': 30, 'bloomberg': 30, 'wsj': 25, 'wall street journal': 25,
        'financial times': 25, 'cnbc': 20, 'marketwatch': 15,
        'yahoo finance': 15, 'seeking alpha': 10, 'benzinga': 10
    };
    
    Object.entries(sourceCredibility).forEach(([srcName, boost]) => {
        if (source.toLowerCase().includes(srcName)) {
            score += boost;
        }
    });
    
    // Recency boost (would need timestamp analysis)
    // Time-sensitive keywords get extra boost
    const urgentKeywords = ['breaking', 'just in', 'urgent', 'alert', 'emergency'];
    urgentKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 25;
    });
    
    return Math.min(score, 250); // Cap at 250
}

// Enhanced timing calculation with multiple lookback periods
function getMarketTimingInfo() {
    const now = new Date();
    const lastClose = new Date();
    
    // Set last market close (4:00 PM ET previous trading day)
    lastClose.setHours(16, 0, 0, 0);
    if (now.getHours() < 16) {
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Skip weekends
    if (lastClose.getDay() === 0) { // Sunday
        lastClose.setDate(lastClose.getDate() - 2);
    } else if (lastClose.getDay() === 6) { // Saturday
        lastClose.setDate(lastClose.getDate() - 1);
    }
    
    // Multiple lookback periods for different search strategies
    const lookbacks = {
        standard: new Date(lastClose), // Since last close
        extended: new Date(lastClose.getTime() - 48 * 60 * 60 * 1000), // 48 hours
        critical: new Date(lastClose.getTime() - 72 * 60 * 60 * 1000), // 72 hours for critical events
        weekly: new Date(lastClose.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days for major ongoing stories
    };
    
    return {
        lastCloseTimestamp: Math.floor(lastClose.getTime() / 1000),
        extendedLookbackTimestamp: Math.floor(lookbacks.extended.getTime() / 1000),
        criticalLookbackTimestamp: Math.floor(lookbacks.critical.getTime() / 1000),
        weeklyLookbackTimestamp: Math.floor(lookbacks.weekly.getTime() / 1000),
        lastCloseString: lastClose.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        currentTime: now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        lookbacks
    };
}

// AI-powered comprehensive news fetching with intelligent filtering
async function fetchComprehensiveNewsWithAI() {
    const timing = getMarketTimingInfo();
    const headlines = {
        critical: [], // AI-scored 200+ priority
        high: [],     // AI-scored 150-199 priority  
        significant: [], // AI-scored 100-149 priority
        general: [],
        us: [],
        asian: [],
        european: [],
        geopolitical: [],
        currencies: [],
        commodities: [],
        earnings: [],
        research: [],
        premarketMovers: []
    };
    
    console.log('🧠 AI-POWERED MARKET NEWS INTELLIGENCE SYSTEM ACTIVATED');
    console.log(`📰 Enhanced news gathering since: ${timing.lastCloseString}`);
    console.log(`🔍 Critical event lookback: 72 hours for major events`);
    console.log(`🎯 Comprehensive keyword matrix: ${Object.values(MARKET_MOVING_KEYWORDS).flat().length} market-moving terms`);
    
    let processedCount = 0;
    let aiAnalyzedCount = 0;
    
    try {
        // 1. CRITICAL EVENT DETECTION - Multiple targeted searches
        if (NEWS_API_KEY) {
            console.log('🚨 PHASE 1: Critical Market Event Detection...');
            
            // Ultra-high priority searches with extensive keyword combinations
            const criticalSearchQueries = [
                // Fed and Monetary Policy
                '("Federal Reserve" OR "Jerome Powell" OR "FOMC") AND (emergency OR announcement OR "interest rate" OR decision OR policy)',
                '("rate cut" OR "rate hike" OR "QE" OR "quantitative easing") AND (emergency OR surprise OR announcement)',
                
                // Market Structure Events  
                '("market crash" OR "flash crash" OR "circuit breaker" OR "trading halt") AND (NYSE OR NASDAQ OR "S&P 500")',
                '("margin call" OR "liquidity crisis" OR "bank run" OR "credit crunch") AND market',
                
                // Mega Cap Events
                '("trillion market cap" OR "trillion valuation" OR "$4 trillion" OR "$5 trillion") AND (Microsoft OR Apple OR Google OR Amazon OR Nvidia)',
                '("record earnings" OR "blowout earnings" OR "massive beat" OR "huge miss") AND (Microsoft OR Apple OR Google OR Amazon OR Meta OR Tesla)',
                
                // Geopolitical Shocks
                '(Trump AND (tariff OR "trade war" OR "trade deal")) OR ("tariff announcement" OR "trade agreement" OR "trade embargo")',
                '("military conflict" OR "war declaration" OR "nuclear threat") AND (market OR economy OR impact)',
                '("sanctions" OR "economic warfare" OR "export ban") AND (Russia OR China OR Iran OR "North Korea")',
                
                // Corporate Mega Events
                '("bankruptcy" OR "chapter 11" OR "insolvency" OR "default") AND (filing OR announcement OR court)',
                '("merger" OR "acquisition" OR "takeover") AND ("mega deal" OR billion OR "largest deal")',
                '("fraud" OR "SEC investigation" OR "criminal charges") AND (CEO OR executive OR company)',
                
                // Sector-Wide Disruptions
                '("supply chain" OR "shipping crisis" OR "port closure" OR "factory shutdown") AND (global OR worldwide OR disruption)',
                '("cybersecurity breach" OR "ransomware" OR "data breach") AND (major OR massive OR widespread)',
                
                // Economic Shocks
                '("inflation shock" OR "CPI surprise" OR "GDP revision") AND (economy OR market OR federal)',
                '("employment" OR "jobs report" OR "unemployment") AND (shock OR surprise OR record)',
                
                // Energy and Commodities
                '("OPEC" OR "oil production" OR "energy crisis") AND (cut OR embargo OR shortage OR decision)',
                '("gold" OR "commodity" OR "rare earth") AND (shortage OR restriction OR crisis OR record)'
            ];
            
            const lookbackDate = new Date(timing.lookbacks.critical);
            const fromDate = lookbackDate.toISOString().split('T')[0];
            
            for (const query of criticalSearchQueries) {
                try {
                    console.log(`  🔍 Critical search: "${query.substring(0, 60)}..."`);
                    
                    const response = await axios.get('https://newsapi.org/v2/everything', {
                        params: {
                            q: query,
                            from: fromDate,
                            sortBy: 'publishedAt',
                            language: 'en',
                            pageSize: 30, // Increased for critical searches
                            apiKey: NEWS_API_KEY
                        }
                    });
                    
                    if (response.data && response.data.articles) {
                        for (const article of response.data.articles) {
                            const newsItem = {
                                headline: article.title,
                                summary: article.description,
                                source: `NewsAPI Critical - ${article.source.name}`,
                                datetime: new Date(article.publishedAt).toLocaleString(),
                                url: article.url,
                                publishedAt: new Date(article.publishedAt)
                            };
                            
                            // AI-powered importance analysis
                            const importance = await analyzeNewsImportanceWithAI(newsItem);
                            newsItem.priority = importance.score;
                            newsItem.justification = importance.justification;
                            newsItem.analysisMethod = importance.method;
                            
                            processedCount++;
                            if (importance.method === 'AI-powered') aiAnalyzedCount++;
                            
                            // Categorize by AI score
                            if (importance.score >= 200) {
                                headlines.critical.push(newsItem);
                                console.log(`    🚨 CRITICAL EVENT: ${newsItem.headline.substring(0, 80)}... (Score: ${importance.score})`);
                            } else if (importance.score >= 150) {
                                headlines.high.push(newsItem);
                                console.log(`    ⚠️ HIGH IMPACT: ${newsItem.headline.substring(0, 80)}... (Score: ${importance.score})`);
                            } else if (importance.score >= 100) {
                                headlines.significant.push(newsItem);
                            }
                            
                            // Small delay to avoid overwhelming the AI API
                            if (importance.method === 'AI-powered') {
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                        }
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000)); // NewsAPI rate limiting
                } catch (error) {
                    console.log(`    ❌ Critical search failed: ${error.message}`);
                }
            }
        }
        
        // 2. ENHANCED REGIONAL AND SECTORAL SEARCHES
        if (NEWS_API_KEY) {
            console.log('🌍 PHASE 2: Enhanced Regional Market Intelligence...');
            
            const enhancedRegionalSearches = [
                // US Markets - Expanded
                { 
                    query: '("S&P 500" OR "Dow Jones" OR "NASDAQ" OR "NYSE") AND (record OR high OR low OR volatility OR trading OR volume)',
                    category: 'us',
                    priority: 'high'
                },
                {
                    query: '("Federal Reserve" OR "Fed" OR "FOMC" OR "Jerome Powell") AND (meeting OR decision OR policy OR statement)',
                    category: 'us', 
                    priority: 'high'
                },
                {
                    query: '("earnings" OR "quarterly results" OR "guidance") AND ("beat" OR "miss" OR "surprise" OR "outlook")',
                    category: 'earnings',
                    priority: 'high'
                },
                
                // Asian Markets - Expanded
                {
                    query: '("China" OR "Chinese" OR "PBOC" OR "Shanghai" OR "Shenzhen") AND (policy OR economy OR market OR regulation OR growth)',
                    category: 'asian',
                    priority: 'high'
                },
                {
                    query: '("Japan" OR "Japanese" OR "BOJ" OR "Nikkei" OR "Tokyo") AND (policy OR economy OR yen OR intervention OR data)',
                    category: 'asian',
                    priority: 'high'
                },
                {
                    query: '("South Korea" OR "India" OR "Taiwan" OR "Singapore" OR "Hong Kong") AND (market OR economy OR policy OR trade)',
                    category: 'asian',
                    priority: 'medium'
                },
                
                // European Markets - Expanded
                {
                    query: '("ECB" OR "European Central Bank" OR "Christine Lagarde") AND (policy OR rate OR decision OR euro)',
                    category: 'european',
                    priority: 'high'
                },
                {
                    query: '("Brexit" OR "EU" OR "European Union" OR "eurozone") AND (trade OR regulation OR policy OR agreement)',
                    category: 'european',
                    priority: 'high'
                },
                {
                    query: '("Germany" OR "France" OR "UK" OR "Italy" OR "Spain") AND (GDP OR inflation OR unemployment OR manufacturing)',
                    category: 'european',
                    priority: 'medium'
                },
                
                // Geopolitical - Expanded
                {
                    query: '("Russia" OR "Ukraine" OR "Putin") AND (war OR conflict OR sanctions OR energy OR gas OR oil)',
                    category: 'geopolitical',
                    priority: 'critical'
                },
                {
                    query: '("China" OR "Taiwan" OR "South China Sea") AND (tension OR military OR security OR threat)',
                    category: 'geopolitical', 
                    priority: 'critical'
                },
                {
                    query: '("Middle East" OR "Iran" OR "Israel" OR "Saudi Arabia") AND (conflict OR oil OR energy OR security)',
                    category: 'geopolitical',
                    priority: 'high'
                },
                
                // Currencies and Commodities - Expanded
                {
                    query: '("dollar" OR "DXY" OR "USD" OR "currency") AND (strength OR weakness OR intervention OR policy)',
                    category: 'currencies',
                    priority: 'high'
                },
                {
                    query: '("oil" OR "crude" OR "Brent" OR "WTI" OR "energy") AND (price OR production OR OPEC OR inventory)',
                    category: 'commodities',
                    priority: 'high'
                },
                {
                    query: '("gold" OR "silver" OR "copper" OR "commodities") AND (price OR demand OR supply OR shortage)',
                    category: 'commodities',
                    priority: 'medium'
                }
            ];
            
            for (const search of enhancedRegionalSearches) {
                try {
                    const pageSize = search.priority === 'critical' ? 25 : (search.priority === 'high' ? 20 : 15);
                    console.log(`  🔍 ${search.category.toUpperCase()} search (${search.priority}): "${search.query.substring(0, 50)}..."`);
                    
                    const response = await axios.get('https://newsapi.org/v2/everything', {
                        params: {
                            q: search.query,
                            from: fromDate,
                            sortBy: 'publishedAt',
                            language: 'en',
                            pageSize: pageSize,
                            apiKey: NEWS_API_KEY
                        }
                    });
                    
                    if (response.data && response.data.articles) {
                        // Process only top articles with AI analysis for high-priority searches
                        const articlesToAnalyze = search.priority === 'critical' ? 
                            response.data.articles.slice(0, 10) : 
                            (search.priority === 'high' ? response.data.articles.slice(0, 5) : response.data.articles.slice(0, 3));
                        
                        for (const article of articlesToAnalyze) {
                            const newsItem = {
                                headline: article.title,
                                summary: article.description,
                                source: `NewsAPI ${search.category} - ${article.source.name}`,
                                datetime: new Date(article.publishedAt).toLocaleString(),
                                url: article.url,
                                publishedAt: new Date(article.publishedAt)
                            };
                            
                            // AI analysis for high-priority searches only
                            if (search.priority === 'critical' || search.priority === 'high') {
                                const importance = await analyzeNewsImportanceWithAI(newsItem);
                                newsItem.priority = importance.score;
                                newsItem.justification = importance.justification;
                                newsItem.analysisMethod = importance.method;
                                
                                if (importance.method === 'AI-powered') {
                                    aiAnalyzedCount++;
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }
                            } else {
                                // Basic keyword analysis for medium priority
                                const basicScore = calculateBasicPriority(newsItem.headline, newsItem.summary, newsItem.source);
                                newsItem.priority = basicScore;
                                newsItem.analysisMethod = 'Keyword-based';
                            }
                            
                            processedCount++;
                            
                            // Smart categorization based on AI score and category
                            if (newsItem.priority >= 200) {
                                headlines.critical.push(newsItem);
                            } else if (newsItem.priority >= 150) {
                                headlines.high.push(newsItem);
                            } else if (newsItem.priority >= 100) {
                                headlines.significant.push(newsItem);
                            } else {
                                headlines[search.category].push(newsItem);
                            }
                        }
                        
                        // Add remaining articles without AI analysis to category
                        const remainingArticles = response.data.articles.slice(articlesToAnalyze.length);
                        for (const article of remainingArticles) {
                            const newsItem = {
                                headline: article.title,
                                summary: article.description,
                                source: `NewsAPI ${search.category} - ${article.source.name}`,
                                datetime: new Date(article.publishedAt).toLocaleString(),
                                url: article.url,
                                priority: calculateBasicPriority(article.title, article.description, article.source.name),
                                analysisMethod: 'Keyword-basic'
                            };
                            
                            headlines[search.category].push(newsItem);
                            processedCount++;
                        }
                        
                        console.log(`    ✅ ${search.category}: ${response.data.articles.length} articles processed`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log(`    ❌ ${search.category} search failed: ${error.message}`);
                }
            }
        }
        
        // 3. ENHANCED MULTI-SOURCE INTELLIGENCE GATHERING
        console.log('📡 PHASE 3: Multi-Source Intelligence Aggregation...');
        
        // Alpha Vantage with AI-powered analysis for top stories
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📊 Alpha Vantage: Advanced sentiment and topic analysis...');
            
            const alphaSearches = [
                { topics: 'earnings', keywords: 'Microsoft,Google,Apple,Amazon,Meta,Tesla,Nvidia', category: 'critical' },
                { topics: 'financial_markets', keywords: 'trillion,Federal Reserve,interest rate,inflation', category: 'critical' },
                { topics: 'technology', keywords: 'AI,artificial intelligence,breakthrough,innovation', category: 'high' },
                { topics: 'economy', keywords: 'GDP,unemployment,recession,growth', category: 'high' },
                { topics: 'financial_markets', keywords: 'volatility,crash,rally,correction', category: 'high' }
            ];
            
            for (const search of alphaSearches) {
                try {
                    console.log(`  🎯 Alpha Vantage: ${search.topics} - ${search.keywords}`);
                    
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${search.topics}&keywords=${search.keywords}&limit=20&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    
                    if (response.data && response.data.feed) {
                        // AI analyze top 5 stories from each search for critical/high categories
                        const articlesToAnalyze = search.category === 'critical' ? 
                            response.data.feed.slice(0, 8) : response.data.feed.slice(0, 5);
                        
                        for (const news of articlesToAnalyze) {
                            const newsItem = {
                                headline: news.title,
                                summary: news.summary,
                                source: `Alpha Vantage ${search.category} - ${news.source}`,
                                datetime: new Date(news.time_published).toLocaleString(),
                                url: news.url,
                                sentiment: news.overall_sentiment_label,
                                sentimentScore: news.overall_sentiment_score
                            };
                            
                            // AI analysis for critical and high priority searches
                            const importance = await analyzeNewsImportanceWithAI(newsItem);
                            newsItem.priority = importance.score;
                            newsItem.justification = importance.justification;
                            newsItem.analysisMethod = importance.method;
                            
                            if (importance.method === 'AI-powered') {
                                aiAnalyzedCount++;
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                            
                            processedCount++;
                            
                            // Smart categorization
                            if (newsItem.priority >= 200) {
                                headlines.critical.push(newsItem);
                                console.log(`    🚨 Alpha Vantage CRITICAL: ${newsItem.headline.substring(0, 60)}... (${newsItem.priority})`);
                            } else if (newsItem.priority >= 150) {
                                headlines.high.push(newsItem);
                            } else if (newsItem.priority >= 100) {
                                headlines.significant.push(newsItem);
                            } else {
                                headlines.general.push(newsItem);
                            }
                        }
                        
                        console.log(`    ✅ Alpha Vantage ${search.category}: ${articlesToAnalyze.length} AI-analyzed`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Alpha Vantage rate limiting
                } catch (error) {
                    console.log(`    ❌ Alpha Vantage ${search.category} failed: ${error.message}`);
                }
            }
        }
        
        // Finnhub with enhanced filtering and AI analysis
        if (FINNHUB_API_KEY) {
            console.log('📈 Finnhub: Market news with AI priority filtering...');
            try {
                const response = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&minId=${timing.criticalLookbackTimestamp}&token=${FINNHUB_API_KEY}`
                );
                
                if (response.data && Array.isArray(response.data)) {
                    // Pre-filter for potentially important news using keywords
                    const potentiallyImportant = response.data
                        .filter(news => news.datetime > timing.lastCloseTimestamp)
                        .filter(news => {
                            const text = `${news.headline} ${news.summary}`.toLowerCase();
                            return Object.values(MARKET_MOVING_KEYWORDS).flat().some(keyword => 
                                text.includes(keyword.toLowerCase())
                            );
                        })
                        .sort((a, b) => b.datetime - a.datetime)
                        .slice(0, 15); // Top 15 potentially important stories
                    
                    console.log(`    🔍 Finnhub: ${potentiallyImportant.length} potentially important stories identified`);
                    
                    for (const news of potentiallyImportant) {
                        const newsItem = {
                            headline: news.headline,
                            summary: news.summary,
                            source: `Finnhub Priority - ${news.source}`,
                            datetime: new Date(news.datetime * 1000).toLocaleString(),
                            url: news.url,
                            timestamp: news.datetime
                        };
                        
                        // AI analysis for filtered important stories
                        const importance = await analyzeNewsImportanceWithAI(newsItem);
                        newsItem.priority = importance.score;
                        newsItem.justification = importance.justification;
                        newsItem.analysisMethod = importance.method;
                        
                        if (importance.method === 'AI-powered') {
                            aiAnalyzedCount++;
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                        
                        processedCount++;
                        
                        // Categorize by AI score
                        if (newsItem.priority >= 200) {
                            headlines.critical.push(newsItem);
                            console.log(`    🚨 Finnhub CRITICAL: ${newsItem.headline.substring(0, 60)}... (${newsItem.priority})`);
                        } else if (newsItem.priority >= 150) {
                            headlines.high.push(newsItem);
                        } else if (newsItem.priority >= 100) {
                            headlines.significant.push(newsItem);
                        } else {
                            headlines.general.push(newsItem);
                        }
                    }
                    
                    console.log(`    ✅ Finnhub: ${potentiallyImportant.length} priority stories AI-analyzed`);
                }
            } catch (error) {
                console.log('    ❌ Finnhub enhanced fetch failed:', error.message);
            }
        }
        
        // Continue with other enhanced API integrations...
        
        // Polygon with AI analysis for earnings and corporate events
        if (POLYGON_API_KEY) {
            console.log('💼 Polygon: Corporate events with AI analysis...');
            try {
                const response = await axios.get('https://api.polygon.io/v2/reference/news', {
                    params: {
                        'published_utc.gte': new Date(timing.criticalLookbackTimestamp * 1000).toISOString().split('T')[0],
                        limit: 20,
                        sort: 'published_utc',
                        order: 'desc',
                        apikey: POLYGON_API_KEY
                    }
                });
                
                if (response.data && response.data.results) {
                    // AI analyze top corporate stories
                    for (const news of response.data.results.slice(0, 10)) {
                        const newsItem = {
                            headline: news.title,
                            summary: news.description,
                            source: `Polygon Corporate - ${news.publisher.name}`,
                            datetime: new Date(news.published_utc).toLocaleString(),
                            url: news.article_url
                        };
                        
                        const importance = await analyzeNewsImportanceWithAI(newsItem);
                        newsItem.priority = importance.score;
                        newsItem.justification = importance.justification;
                        newsItem.analysisMethod = importance.method;
                        
                        if (importance.method === 'AI-powered') {
                            aiAnalyzedCount++;
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                        
                        processedCount++;
                        
                        if (newsItem.priority >= 200) {
                            headlines.critical.push(newsItem);
                        } else if (newsItem.priority >= 150) {
                            headlines.high.push(newsItem);
                        } else if (newsItem.priority >= 100) {
                            headlines.significant.push(newsItem);
                        } else {
                            headlines.earnings.push(newsItem);
                        }
                    }
                    
                    console.log(`    ✅ Polygon: ${response.data.results.length} corporate stories processed`);
                }
            } catch (error) {
                console.log('    ❌ Polygon enhanced fetch failed:', error.message);
            }
        }
        
        // Trading Economics with regional focus
        if (TRADING_ECONOMICS_API_KEY) {
            console.log('🌐 Trading Economics: Global economic intelligence...');
            try {
                const response = await axios.get('https://api.tradingeconomics.com/news', {
                    params: {
                        c: TRADING_ECONOMICS_API_KEY,
                        format: 'json',
                        limit: 30
                    }
                });
                
                if (response.data && Array.isArray(response.data)) {
                    // AI analyze top economic stories
                    for (const news of response.data.slice(0, 12)) {
                        const newsItem = {
                            headline: news.title,
                            summary: news.description,
                            source: `Trading Economics - ${news.country || 'Global'}`,
                            datetime: new Date(news.date).toLocaleString(),
                            url: news.url,
                            country: news.country
                        };
                        
                        const importance = await analyzeNewsImportanceWithAI(newsItem);
                        newsItem.priority = importance.score;
                        newsItem.justification = importance.justification;
                        newsItem.analysisMethod = importance.method;
                        
                        if (importance.method === 'AI-powered') {
                            aiAnalyzedCount++;
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                        
                        processedCount++;
                        
                        // Smart regional categorization
                        if (newsItem.priority >= 200) {
                            headlines.critical.push(newsItem);
                        } else if (newsItem.priority >= 150) {
                            headlines.high.push(newsItem);
                        } else if (newsItem.priority >= 100) {
                            headlines.significant.push(newsItem);
                        } else {
                            // Regional categorization
                            if (news.country && ['United States', 'USA', 'US'].includes(news.country)) {
                                headlines.us.push(newsItem);
                            } else if (news.country && ['China', 'Japan', 'South Korea', 'India', 'Singapore', 'Hong Kong', 'Taiwan'].includes(news.country)) {
                                headlines.asian.push(newsItem);
                            } else if (news.country && ['Germany', 'France', 'UK', 'Italy', 'Spain', 'Netherlands'].includes(news.country)) {
                                headlines.european.push(newsItem);
                            } else {
                                headlines.general.push(newsItem);
                            }
                        }
                    }
                    
                    console.log(`    ✅ Trading Economics: ${response.data.length} economic stories analyzed`);
                }
            } catch (error) {
                console.log('    ❌ Trading Economics enhanced fetch failed:', error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Error in AI-powered news fetch:', error.message);
    }
    
    // POST-PROCESSING: Sort and deduplicate
    console.log('🔄 PHASE 4: Post-processing and deduplication...');
    
    // Sort all priority categories by score and recency
    ['critical', 'high', 'significant'].forEach(category => {
        headlines[category].sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return new Date(b.datetime) - new Date(a.datetime);
        });
        
        // Remove duplicates based on headline similarity
        headlines[category] = headlines[category].filter((news, index, self) => {
            return index === self.findIndex(n => {
                const similarity = calculateStringSimilarity(n.headline, news.headline);
                return similarity > 0.8; // 80% similarity threshold
            });
        });
    });
    
    const totalHeadlines = Object.values(headlines).reduce((sum, arr) => sum + arr.length, 0);
    
    console.log('');
    console.log('🧠 AI-POWERED MARKET INTELLIGENCE SUMMARY:');
    console.log(`📰 Total articles processed: ${processedCount}`);
    console.log(`🤖 AI-analyzed articles: ${aiAnalyzedCount}`);
    console.log(`🚨 Critical events (200+ score): ${headlines.critical.length}`);
    console.log(`⚠️ High impact events (150-199 score): ${headlines.high.length}`);
    console.log(`📈 Significant events (100-149 score): ${headlines.significant.length}`);
    console.log(`📊 Total headlines collected: ${totalHeadlines}`);
    console.log('');
    
    // Log top critical events
    if (headlines.critical.length > 0) {
        console.log('🚨 TOP CRITICAL EVENTS DETECTED:');
        headlines.critical.slice(0, 5).forEach((news, i) => {
            console.log(`${i + 1}. [${news.priority}] ${news.headline.substring(0, 80)}...`);
            console.log(`   ${news.justification}`);
        });
        console.log('');
    }
    
    return headlines;
}

// String similarity function for deduplication
function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

// Enhanced AI-powered summary prompt
function createAIPoweredNewsSummaryPrompt(headlines, timing) {
    let prompt = `You are a senior financial analyst creating a comprehensive pre-market news briefing for institutional investors and portfolio managers using advanced AI-powered news intelligence.

Generate a detailed pre-market report analyzing the most significant news developments since yesterday's market close (${timing.lastCloseString}) through this morning.

🧠 AI INTELLIGENCE BRIEFING DATA:
Total articles processed: ${Object.values(headlines).reduce((sum, arr) => sum + arr.length, 0)}
AI-analyzed articles: ${headlines.critical.length + headlines.high.length + headlines.significant.length}
Advanced keyword matrix: ${Object.values(MARKET_MOVING_KEYWORDS).flat().length} market-moving terms monitored

**🚨 CRITICAL MARKET ALERTS (AI Score: 200-250)**
IMMEDIATE ATTENTION REQUIRED - These events have been identified by AI as potentially market-shaking:
`;

    if (headlines.critical && headlines.critical.length > 0) {
        headlines.critical.forEach((news, index) => {
            prompt += `${index + 1}. [AI SCORE: ${news.priority}] ${news.headline} (${news.source} - ${news.datetime})\n`;
            if (news.summary) prompt += `   Summary: ${news.summary}\n`;
            if (news.justification) prompt += `   AI Analysis: ${news.justification}\n`;
            if (news.url) prompt += `   URL: ${news.url}\n`;
            prompt += `   Analysis Method: ${news.analysisMethod}\n\n`;
        });
    } else {
        prompt += "No critical market-shaking events detected in current AI scan.\n\n";
    }

    prompt += `**⚠️ HIGH IMPACT EVENTS (AI Score: 150-199)**
Significant market-moving potential identified by AI:
`;

    if (headlines.high && headlines.high.length > 0) {
        headlines.high.slice(0, 10).forEach((news, index) => {
            prompt += `${index + 1}. [AI SCORE: ${news.priority}] ${news.headline} (${news.source})\n`;
            if (news.justification) prompt += `   AI Reasoning: ${news.justification}\n`;
            if (news.url) prompt += `   URL: ${news.url}\n`;
        });
    } else {
        prompt += "No high-impact events identified in current scan.\n";
    }

    prompt += `\n**📈 SIGNIFICANT EVENTS (AI Score: 100-149)**
Notable developments with market relevance:
`;

    if (headlines.significant && headlines.significant.length > 0) {
        headlines.significant.slice(0, 8).forEach((news, index) => {
            prompt += `${index + 1}. [AI SCORE: ${news.priority}] ${news.headline} (${news.source})\n`;
            if (news.url) prompt += `   URL: ${news.url}\n`;
        });
    }

    // Continue with regular category data...
    const sections = [
        { key: 'general', title: 'GENERAL MARKET HEADLINES' },
        { key: 'us', title: 'US MARKET HEADLINES' },
        { key: 'asian', title: 'ASIAN MARKET HEADLINES' },
        { key: 'european', title: 'EUROPEAN MARKET HEADLINES' },
        { key: 'geopolitical', title: 'GEOPOLITICAL HEADLINES' },
        { key: 'currencies', title: 'CURRENCY MARKET UPDATES' },
        { key: 'commodities', title: 'COMMODITY MARKET NEWS' },
        { key: 'earnings', title: 'EARNINGS & CORPORATE NEWS' },
        { key: 'research', title: 'RESEARCH REPORTS & ANALYST COVERAGE' },
        { key: 'premarketMovers', title: 'PRE-MARKET MOVERS & TRADING DATA' }
    ];

    sections.forEach(section => {
        if (headlines[section.key] && headlines[section.key].length > 0) {
            prompt += `\n\n${section.title}:\n`;
            headlines[section.key].forEach((news, index) => {
                prompt += `${index + 1}. ${news.headline} (${news.source} - ${news.datetime})\n`;
                if (news.summary) prompt += `   Summary: ${news.summary}\n`;
                if (news.url) prompt += `   URL: ${news.url}\n`;
                if (news.priority) prompt += `   Priority Score: ${news.priority}\n`;
                if (news.sentiment) prompt += `   Sentiment: ${news.sentiment}\n`;
            });
        }
    });

    prompt += `

Please create a comprehensive professional pre-market briefing with AI-enhanced analysis:

# 🧠 AI-POWERED PRE-MARKET INTELLIGENCE BRIEFING
## ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## 🚨 CRITICAL MARKET ALERTS
**AI PRIORITY ANALYSIS:** Lead with any critical events (AI score 200+) identified above. These represent potentially market-shaking developments requiring immediate investor attention. Provide detailed analysis of why the AI system flagged these as critical and their potential market impact.

## ⚠️ HIGH IMPACT DEVELOPMENTS  
**AI SIGNIFICANCE ANALYSIS:** Analyze high-impact events (AI score 150-199) that could drive significant market movements. Explain the AI reasoning behind their importance scores and potential sector/market implications.

## 📈 SIGNIFICANT MARKET MOVERS
**AI TREND ANALYSIS:** Cover significant events (AI score 100-149) that show notable market relevance according to AI analysis.

## AT A GLANCE
Provide a comprehensive executive overview synthesizing all AI-identified critical and high-impact events, plus other key overnight developments. Start with the highest AI-scored events and their implications.

**Critical AI-Identified Events:**
[List the top 5-7 highest AI-scored events with their scores and brief impact assessment]

## EXECUTIVE SUMMARY
Provide a 3-4 sentence overview emphasizing AI-identified critical events and their potential market impact.

[Continue with standard sections but emphasize AI-identified high-priority events throughout...]

## AI INTELLIGENCE METHODOLOGY
- **Total Sources Monitored:** Multiple premium APIs + targeted searches
- **Keywords Analyzed:** ${Object.values(MARKET_MOVING_KEYWORDS).flat().length} market-moving terms across 5 impact tiers
- **AI Analysis Coverage:** Critical and high-impact events analyzed by Claude Sonnet 4
- **Priority Scoring:** 0-250 scale with 200+ flagged as market-shaking
- **Deduplication:** Advanced similarity matching to prevent duplicate coverage

FORMATTING REQUIREMENTS:
- Lead prominently with 🚨 CRITICAL and ⚠️ HIGH IMPACT AI-identified events
- Include AI priority scores for major events: "[AI SCORE: XXX]"
- Use AI justifications when available
- Emphasize events scoring 150+ throughout the analysis
- Include standard regional and sectoral coverage
- Maintain institutional-grade language and actionable intelligence focus

Report generated: ${timing.currentTime} ET
Coverage period: Since market close ${timing.lastCloseString}
AI Intelligence: ACTIVE (Advanced keyword matrix + Claude Sonnet 4 analysis)
Critical event detection: 72-hour enhanced lookback enabled`;

    return prompt;
}

// Enhanced email function with AI insights
async function sendAIPoweredPreMarketReport(reportContent, dateStr, headlineCount, aiStats) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Preparing AI-powered pre-market intelligence briefing...');
        
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        // Enhanced HTML formatting with AI-specific styling
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #000000; border-bottom: 3px solid #FF6B35; padding-bottom: 12px; margin-bottom: 20px; font-size: 28px;">🧠 $1</h1>')
            .replace(/^## 🚨 (.*$)/gm, '<h2 style="color: #DC2626; background-color: #FEF2F2; padding: 15px; border-left: 5px solid #DC2626; margin-top: 30px; margin-bottom: 15px; font-size: 22px; border-radius: 5px;">🚨 $1</h2>')
            .replace(/^## ⚠️ (.*$)/gm, '<h2 style="color: #D97706; background-color: #FFFBEB; padding: 15px; border-left: 5px solid #D97706; margin-top: 30px; margin-bottom: 15px; font-size: 22px; border-radius: 5px;">⚠️ $1</h2>')
            .replace(/^## 📈 (.*$)/gm, '<h2 style="color: #059669; background-color: #ECFDF5; padding: 15px; border-left: 5px solid #059669; margin-top: 30px; margin-bottom: 15px; font-size: 22px; border-radius: 5px;">📈 $1</h2>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #000000; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #E6C068; padding-bottom: 8px; font-size: 22px;">$2</h2>')
            .replace(/^\[AI SCORE: (\d+)\]/gm, '<span style="background-color: #DC2626; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 8px;">[AI SCORE: $1]</span>')
            .replace(/^\*\*(Key.*Headlines:)\*\*/gm, '<h3 style="color: #4A4A4A; margin-top: 25px; margin-bottom: 12px; font-weight: 600; font-size: 18px; border-bottom: 1px solid #E6C068; padding-bottom: 5px;">$1</h3>')
            .replace(/^\*\*(.*?)\*\*/gm, '<strong style="color: #000000; font-weight: 600;">$1</strong>')
            .replace(/\[Read More\]\((https?:\/\/[^\)]+)\)/g, '<a href="$1" target="_blank" style="color: #E6C068; text-decoration: none; font-weight: 500; border-bottom: 1px solid #E6C068; padding-bottom: 1px;">Read More</a>')
            .replace(/^(\d+\.\s.*$)/gm, '<div style="margin: 8px 0; padding: 10px 15px; background-color: #FFFFFF; border-left: 3px solid #E6C068; border-radius: 4px; font-size: 14px; color: #000000; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">$1</div>')
            .replace(/^([^<\n#-\d].*$)/gm, '<p style="line-height: 1.7; margin-bottom: 14px; color: #000000; font-size: 15px;">$1</p>')
            .replace(/\n\n/g, '<br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 950px; margin: 0 auto; background-color: #FFFFFF; padding: 25px;">
            <div style="background-color: #FFFFFF; padding: 35px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #FF6B35;">
                ${emailHtml}
                
                <div style="margin-top: 35px; padding: 25px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); border-radius: 10px; color: white;">
                    <p style="margin: 0; font-weight: bold; font-size: 18px;">🧠 AI-POWERED MARKET INTELLIGENCE BRIEFING</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px;">Generated: ${new Date().toLocaleString()} ET</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Headlines Analyzed: ${headlineCount} from multiple premium sources</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">AI Analysis: ${aiStats.aiAnalyzed} articles analyzed by Claude Sonnet 4</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Critical Events: ${aiStats.critical} market-shaking events detected</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">High Impact: ${aiStats.high} significant developments identified</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Keywords Monitored: ${Object.values(MARKET_MOVING_KEYWORDS).flat().length} market-moving terms</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Classification: Institutional Grade AI Intelligence</p>
                </div>
            </div>
        </div>`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: `🧠 AI-Powered Market Intelligence Brief - ${dateStr} - ${aiStats.critical} Critical Events Detected`,
            html: emailContent,
            text: reportContent,
            priority: 'high'
        };
        
        console.log('📤 Sending AI-powered market intelligence briefing...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ AI briefing sent successfully:', info.messageId);
        console.log('📧 Recipients:', WORK_EMAIL_LIST);
        
    } catch (error) {
        console.error('❌ Failed to send AI briefing:', error.message);
    }
}

// Enhanced main function with AI capabilities
async function generateAIPoweredPreMarketReport() {
    try {
        const timing = getMarketTimingInfo();
        console.log('🧠 AI-POWERED MARKET INTELLIGENCE SYSTEM INITIATING...');
        console.log(`📅 Coverage Period: Since ${timing.lastCloseString}`);
        console.log(`🚨 Critical event detection: 72-hour enhanced lookback`);
        console.log(`🎯 AI Analysis: Claude Sonnet 4 importance scoring`);
        console.log(`📊 Keyword Matrix: ${Object.values(MARKET_MOVING_KEYWORDS).flat().length} market-moving terms`);
        
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
        if (ANTHROPIC_API_KEY) availableAPIs.push('Anthropic AI');
        
        console.log(`🔑 Active APIs: ${availableAPIs.join(', ')}`);
        console.log('');
        
        // Fetch comprehensive news with AI
        const headlines = await fetchComprehensiveNewsWithAI();
        const totalHeadlines = Object.values(headlines).reduce((sum, arr) => sum + arr.length, 0);
        const criticalCount = headlines.critical ? headlines.critical.length : 0;
        const highCount = headlines.high ? headlines.high.length : 0;
        const significantCount = headlines.significant ? headlines.significant.length : 0;
        const aiAnalyzedCount = criticalCount + highCount + significantCount;
        
        const aiStats = {
            total: totalHeadlines,
            aiAnalyzed: aiAnalyzedCount,
            critical: criticalCount,
            high: highCount,
            significant: significantCount
        };
        
        console.log('📊 FINAL AI INTELLIGENCE SUMMARY:');
        console.log(`📰 Total headlines: ${totalHeadlines}`);
        console.log(`🤖 AI-analyzed: ${aiAnalyzedCount}`);
        console.log(`🚨 Critical events: ${criticalCount}`);
        console.log(`⚠️ High impact: ${highCount}`);
        console.log(`📈 Significant: ${significantCount}`);
        
        if (totalHeadlines === 0) {
            console.log('⚠️  No headlines found, check API keys and connections');
            return;
        }
        
        // Generate AI-powered analysis
        console.log('');
        console.log('🤖 Generating AI-powered professional analysis with Claude Sonnet 4...');
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000, // Increased for comprehensive analysis
            temperature: 0.1,
            messages: [{
                role: 'user',
                content: createAIPoweredNewsSummaryPrompt(headlines, timing)
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
        const filename = `ai-powered-premarket-brief-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Add metadata header to report
        const reportWithMetadata = `# AI-POWERED MARKET INTELLIGENCE BRIEFING
Generated: ${timing.currentTime} ET
Coverage: Since ${timing.lastCloseString}
AI Analysis: Claude Sonnet 4 with ${Object.values(MARKET_MOVING_KEYWORDS).flat().length}-term keyword matrix
Headlines Processed: ${totalHeadlines}
AI-Analyzed Events: ${aiAnalyzedCount}
Critical Events Detected: ${criticalCount}
Classification: Institutional Grade

---

${report}

---

## AI INTELLIGENCE METHODOLOGY

### Keyword Matrix (${Object.values(MARKET_MOVING_KEYWORDS).flat().length} terms monitored)
- **Tier 1 - Market Shaking (200+ points):** ${MARKET_MOVING_KEYWORDS.marketShaking.length} terms
- **Tier 2 - High Impact (150+ points):** ${MARKET_MOVING_KEYWORDS.highImpact.length} terms  
- **Tier 3 - Significant Impact (100+ points):** ${MARKET_MOVING_KEYWORDS.significant.length} terms
- **Tier 4 - Moderate Impact (75+ points):** ${MARKET_MOVING_KEYWORDS.moderate.length} terms
- **Mega-Cap Companies:** ${MARKET_MOVING_KEYWORDS.megaCaps.length} tracked
- **Market Sentiment:** ${MARKET_MOVING_KEYWORDS.sentiment.length} indicators

### AI Analysis Process
1. **Multi-source aggregation** across ${availableAPIs.length} premium data APIs
2. **Intelligent pre-filtering** using comprehensive keyword matrix
3. **Claude Sonnet 4 analysis** for importance scoring (0-250 scale)
4. **Smart categorization** by AI-determined market impact
5. **Advanced deduplication** with similarity matching
6. **Priority-based presentation** emphasizing critical events

### Data Sources
${availableAPIs.map(api => `- ${api}`).join('\n')}

---
*Report Classification: Institutional Grade Market Intelligence*
*AI System: Claude Sonnet 4 | Keyword Matrix: ${Object.values(MARKET_MOVING_KEYWORDS).flat().length} terms | Multi-API Integration*`;
        
        fs.writeFileSync(filepath, reportWithMetadata);
        
        // Create latest report link
        const latestFilepath = path.join(reportsDir, 'latest-ai-premarket-brief.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save comprehensive raw data with AI insights
        const dataPath = path.join(reportsDir, `ai-premarket-data-${dateStr}.json`);
        const comprehensiveData = {
            headlines,
            timing,
            aiStats,
            keywordMatrix: {
                totalTerms: Object.values(MARKET_MOVING_KEYWORDS).flat().length,
                tiers: {
                    marketShaking: MARKET_MOVING_KEYWORDS.marketShaking.length,
                    highImpact: MARKET_MOVING_KEYWORDS.highImpact.length,
                    significant: MARKET_MOVING_KEYWORDS.significant.length,
                    moderate: MARKET_MOVING_KEYWORDS.moderate.length,
                    megaCaps: MARKET_MOVING_KEYWORDS.megaCaps.length,
                    sentiment: MARKET_MOVING_KEYWORDS.sentiment.length
                }
            },
            activeAPIs: availableAPIs,
            metadata: {
                generatedAt: new Date().toISOString(),
                reportType: 'ai-powered-premarket-brief',
                aiModel: 'claude-sonnet-4',
                classification: 'institutional-grade',
                lookbackHours: 72,
                aiAnalysisEnabled: true
            }
        };
        fs.writeFileSync(dataPath, JSON.stringify(comprehensiveData, null, 2));
        
        console.log('');
        console.log(`✅ AI-powered briefing generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`🧠 AI intelligence integration: ${aiAnalyzedCount}/${totalHeadlines} articles analyzed`);
        console.log(`🎯 Critical events flagged: ${criticalCount}`);
        console.log(`🔗 Data sources integrated: ${availableAPIs.length}`);
        
        // Send enhanced email with AI stats
        await sendAIPoweredPreMarketReport(reportWithMetadata, dateStr, totalHeadlines, aiStats);
        
        console.log('');
        console.log('🧠 AI-POWERED MARKET INTELLIGENCE BRIEFING COMPLETED!');
        console.log('🌅 Advanced AI analysis ready for market open preparation');
        console.log(`📈 Institutional-grade intelligence with ${Object.values(MARKET_MOVING_KEYWORDS).flat().length}-term keyword matrix`);
        console.log(`🚨 ${criticalCount} critical events detected and prioritized`);
        console.log(`🤖 ${aiAnalyzedCount} articles analyzed by Claude Sonnet 4`);
        
        // Display top critical events if any
        if (criticalCount > 0) {
            console.log('');
            console.log('🚨 TOP CRITICAL EVENTS FOR IMMEDIATE ATTENTION:');
            headlines.critical.slice(0, 3).forEach((news, i) => {
                console.log(`${i + 1}. [AI SCORE: ${news.priority}] ${news.headline}`);
                console.log(`   AI Analysis: ${news.justification}`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Error generating AI-powered pre-market report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Export the enhanced functions
module.exports = {
    generateAIPoweredPreMarketReport,
    fetchComprehensiveNewsWithAI,
    analyzeNewsImportanceWithAI,
    MARKET_MOVING_KEYWORDS
};

// Run the AI-powered pre-market news system
if (require.main === module) {
    generateAIPoweredPreMarketReport();
}
