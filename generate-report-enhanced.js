prompt += `

Create a comprehensive professional pre-market briefing with ultra-comprehensive AI-enhanced analysis:

# 🌐 ULTRA-COMPREHENSIVE AI-POWERED MARKET INTELLIGENCE BRIEFING
## ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## 🚨 CATASTROPHIC MARKET ALERTS
**CRISIS-LEVEL ANALYSIS:** If any catastrophic events (AI score 250+) were detected, provide immediate comprehensive analysis of their potential to trigger market-wide disruption, trading halts, or systematic risks. Detail specific sectors, indices, and asset classes likely to be affected.

## ⚠️ EXTREME IMPACT DEVELOPMENTS  
**MAJOR MARKET MOVERS:** Analyze extreme impact events (AI score 200-249) that could drive significant movements in major indices, sectors, or individual mega-cap stocks. Quantify potential impact ranges and provide specific trading implications.

## 📈 VERY HIGH IMPACT EVENTS
**SIGNIFICANT MARKET CATALYSTS:** Cover very high impact events (AI score 150-199) with detailed analysis of their market implications, sector effects, and potential for creating trading opportunities or risks.

## AT A GLANCE - ULTRA-COMPREHENSIVE EXECUTIVE BRIEFING
Provide a comprehensive executive overview synthesizing ALL AI-identified critical, extreme, and very high impact events, plus other key overnight developments. Structure as follows:
1. **CRISIS ALERTS:** Any catastrophic events requiring immediate attention
2. **MAJOR CATALYSTS:** Top 3-5 extreme impact events likely to move markets today
3. **KEY THEMES:** Dominant market themes emerging from the comprehensive analysis
4. **SECTOR FOCUS:** Industries/sectors with highest concentration of significant news
5. **GLOBAL MACRO:** International developments affecting US markets
6. **TRADING IMPLICATIONS:** Specific implications for today's market open

**Top AI-Identified Market Movers:**
[List the top 7-10 highest AI-scored events across all categories with their scores and brief impact summaries]

## EXECUTIVE SUMMARY
Provide a 4-5 sentence overview emphasizing the highest AI-scored events and their collective potential market impact, including any systemic risks or major opportunities identified.

## US MARKET DEVELOPMENTS
Comprehensive narrative analysis of US corporate earnings, Federal Reserve communications, regulatory announcements, domestic policy developments, and economic data releases. Prioritize AI-identified high-impact events and provide detailed market implications.

**Key US Headlines:**
[List at least 12 of the most relevant US market headlines with AI scores where available]

## ASIAN MARKET INTELLIGENCE
Detailed coverage of Asian market developments including China policy announcements, Japanese economic data, regional trade developments, and technology sector news. Emphasize AI-flagged high-impact events.

**Key Asian Headlines:**
[List at least 12 of the most relevant Asian market headlines with priority scoring]

## EUROPEAN MARKET INTELLIGENCE
Comprehensive analysis of European Central Bank communications, Brexit developments, EU policy announcements, major European corporate news, and eurozone economic indicators.

**Key European Headlines:**
[List at least 12 of the most relevant European market headlines]

## GEOPOLITICAL INTELLIGENCE BRIEFING
Ultra-comprehensive analysis of geopolitical tensions, trade developments, sanctions news, international conflicts, and diplomatic developments. Prioritize AI-identified extreme and very high impact events.

**Key Geopolitical Headlines:**
[List at least 12 of the most relevant geopolitical headlines with impact analysis]

## CURRENCY & COMMODITY INTELLIGENCE
Detailed analysis of major currency movements, central bank interventions, commodity price developments, and their implications for various market sectors. Include energy, precious metals, and agricultural commodities.

**Key Currency & Commodity Headlines:**
[List at least 12 of the most relevant currency and commodity headlines]

## EARNINGS & CORPORATE INTELLIGENCE
Comprehensive analysis of overnight earnings reports, corporate announcements, management guidance updates, M&A news, and other significant corporate developments. Prioritize mega-cap companies and AI-flagged events.

**Key Earnings & Corporate Headlines:**
[List at least 12 of the most relevant earnings and corporate headlines with AI impact scores]

## SECTOR ROTATION & THEMATIC INTELLIGENCE
Analysis of sector-specific developments, thematic investment trends, technological breakthroughs, and industry rotation patterns. Focus on AI, healthcare, energy transition, and financial technology themes.

**Key Sector & Thematic Headlines:**
[List at least 10 sector rotation and thematic headlines]

## GLOBAL MACRO INTELLIGENCE
Comprehensive analysis of global economic trends, international monetary policy, cross-border capital flows, and worldwide economic indicators affecting global markets.

**Key Global Macro Headlines:**
[List at least 10 global macro headlines]

## RESEARCH INTELLIGENCE & ANALYST COVERAGE
Analysis of overnight research publications, analyst upgrades/downgrades, price target changes, initiation of coverage, and investment banking research that could influence trading.

**Key Research & Analyst Headlines:**
[List at least 10 research and analyst coverage headlines]

## BREAKING NEWS & REAL-TIME INTELLIGENCE
Coverage of breaking developments, urgent announcements, and real-time market-moving events that occurred during the overnight session.

**Key Breaking News Headlines:**
[List breaking news and real-time updates]

## AI MARKET IMPACT ANALYSIS
Provide detailed analysis of how AI-identified events are likely to interact and compound, creating potential systemic effects or cross-market impacts. Include:
- **Correlation Analysis:** How multiple high-impact events might amplify each other
- **Sector Contagion:** Potential for events to spread across related industries  
- **Global Spillovers:** International implications of US-focused events
- **Options/Derivatives Impact:** Likely effects on volatility and derivatives markets

## COMPREHENSIVE RISK ASSESSMENT
Ultra-detailed risk analysis covering:
- **Systemic Risks:** Any threats to market structure or financial system stability
- **Sector-Specific Risks:** Industry-level threats and opportunities
- **Geopolitical Risks:** International tensions affecting market sentiment
- **Technical Risks:** Chart levels, volatility expectations, and technical factors
- **Liquidity Risks:** Any potential for reduced market liquidity or unusual trading patterns

## STRATEGIC TRADING OUTLOOK
Provide comprehensive analysis of how overnight developments should influence today's trading:
- **Market Open Expectations:** Likely gap up/down scenarios for major indices
- **Key Levels to Watch:** Critical support/resistance levels based on news flow
- **Sector Plays:** Specific sectors likely to outperform/underperform
- **Options Activity:** Expected volatility and options flow implications
- **International Markets:** How global developments will affect US trading

## COMPREHENSIVE METHODOLOGY DISCLOSURE
- **Total Sources Monitored:** Multiple premium financial APIs plus targeted web searches
- **AI Analysis Coverage:** Claude Sonnet 4 analysis of high-priority events
- **Keyword Matrix:** ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} market-moving terms across 6 impact tiers
- **Priority Scoring:** 0-300 scale with 250+ flagged as catastrophic, 200+ as extreme impact
- **Lookback Strategy:** 10-day comprehensive coverage with 72-hour critical event focus
- **Deduplication:** Advanced similarity matching to prevent redundant coverage

FORMATTING REQUIREMENTS:
- Lead prominently with 🚨 CATASTROPHIC and ⚠️ EXTREME IMPACT AI-identified events
- Include AI priority scores for major events: "[AI SCORE: XXX]"
- Use comprehensive AI analysis and reasoning when available
- Emphasize events scoring 150+ throughout all analysis sections
- Include working URLs for all headlines when available
- Maintain institutional-grade language with actionable intelligence focus
- Provide quantitative impact estimates where possible

Report generated: ${timing.currentTime} ET
Coverage period: Since market close ${timing.lastCloseString}
AI Intelligence: ULTRA-COMPREHENSIVE (${Object.values(COMPREHENSIVE_KEYWORDS).flat().length}-term matrix + Claude Sonnet 4)
Critical event detection: 10-day lookback with real-time monitoring enabled
Classification: Institutional Grade Ultra-Comprehensive Intelligence`;

    return prompt;
}

// Enhanced email function with ultra-comprehensive features
async function sendUltraComprehensiveReport(reportContent, dateStr, headlineCount, aiStats) {
    if (!GMAIL_USER || !GMAIL_PASSWORD || !WORK_EMAIL_LIST) {
        console.log('⚠️  Email credentials not provided, skipping email send');
        return;
    }
    
    try {
        console.log('📧 Preparing ultra-comprehensive market intelligence briefing...');
        
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASSWORD
            }
        });
        
        // Ultra-enhanced HTML formatting with crisis-level styling
        const emailHtml = reportContent
            .replace(/^# (.*$)/gm, '<h1 style="color: #000000; border-bottom: 4px solid #DC2626; padding-bottom: 15px; margin-bottom: 25px; font-size: 32px; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🌐 $1</h1>')
            .replace(/^## 🚨 (.*$)/gm, '<h2 style="color: #FFFFFF; background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 20px; border-radius: 8px; margin-top: 35px; margin-bottom: 20px; font-size: 26px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); border: 2px solid #DC2626;">🚨 $1</h2>')
            .replace(/^## ⚠️ (.*$)/gm, '<h2 style="color: #FFFFFF; background: linear-gradient(135deg, #D97706 0%, #B45309 100%); padding: 18px; border-radius: 8px; margin-top: 35px; margin-bottom: 20px; font-size: 24px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); border: 2px solid #D97706;">⚠️ $1</h2>')
            .replace(/^## 📈 (.*$)/gm, '<h2 style="color: #FFFFFF; background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 16px; border-radius: 8px; margin-top: 35px; margin-bottom: 20px; font-size: 22px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); border: 2px solid #059669;">📈 $1</h2>')
            .replace(/^## 🌐 (.*$)/gm, '<h2 style="color: #FFFFFF; background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%); padding: 16px; border-radius: 8px; margin-top: 35px; margin-bottom: 20px; font-size: 22px; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3); border: 2px solid #1E40AF;">🌐 $1</h2>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #000000; margin-top: 30px; margin-bottom: 15px; border-bottom: 3px solid #E6C068; padding-bottom: 10px; font-size: 22px;">$1</h2>')
            .replace(/^\[CATASTROPHIC SCORE: (\d+)\]/gm, '<span style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 4px 12px; border-radius: 15px; font-size: 11px; font-weight: bold; margin-right: 10px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);">[CATASTROPHIC: $1]</span>')
            .replace(/^\[EXTREME SCORE: (\d+)\]/gm, '<span style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); color: white; padding: 4px 12px; border-radius: 15px; font-size: 11px; font-weight: bold; margin-right: 10px; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.4);">[EXTREME: $1]</span>')
            .replace(/^\[HIGH SCORE: (\d+)\]/gm, '<span style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 4px 12px; border-radius: 15px; font-size: 11px; font-weight: bold; margin-right: 10px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.4);">[HIGH: $1]</span>')
            .replace(/^\[AI SCORE: (\d+)\]/gm, '<span style="background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-right: 8px;">[AI: $1]</span>')
            .replace(/^\*\*(Key.*Headlines:)\*\*/gm, '<h3 style="color: #4A4A4A; margin-top: 25px; margin-bottom: 15px; font-weight: 600; font-size: 18px; border-bottom: 2px solid #E6C068; padding-bottom: 8px;">$1</h3>')
            .replace(/^\*\*(.*?)\*\*/gm, '<strong style="color: #000000; font-weight: 700;">$1</strong>')
            .replace(/\[Read More\]\((https?:\/\/[^\)]+)\)/g, '<a href="$1" target="_blank" style="color: #E6C068; text-decoration: none; font-weight: 500; border-bottom: 1px solid #E6C068; padding-bottom: 1px;">Read More</a>')
            .replace(/^(\d+\.\s.*$)/gm, '<div style="margin: 10px 0; padding: 12px 18px; background-color: #FFFFFF; border-left: 4px solid #E6C068; border-radius: 6px; font-size: 14px; color: #000000; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">$1</div>')
            .replace(/^([^<\n#-\d].*$)/gm, '<p style="line-height: 1.8; margin-bottom: 16px; color: #000000; font-size: 15px;">$1</p>')
            .replace(/\n\n/g, '<br>')
            .replace(/\n/g, '<br>');
        
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1000px; margin: 0 auto; background-color: #FFFFFF; padding: 30px;">
            <div style="background-color: #FFFFFF; padding: 40px; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); border: 2px solid #DC2626;">
                ${emailHtml}
                
                <div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); border-radius: 12px; color: white; box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);">
                    <p style="margin: 0; font-weight: bold; font-size: 20px;">🌐 ULTRA-COMPREHENSIVE MARKET INTELLIGENCE SYSTEM</p>
                    <p style="margin: 10px 0 0 0; font-size: 15px;">Generated: ${new Date().toLocaleString()} ET</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px;">Headlines Analyzed: ${headlineCount} from comprehensive multi-source intelligence</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px;">AI Analysis: ${aiStats.aiAnalyzed} articles analyzed by Claude Sonnet 4</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px;">Catastrophic Events: ${aiStats.catastrophic} market-shaking events detected</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px;">Extreme Impact: ${aiStats.extreme} major market-moving developments</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px;">Very High Impact: ${aiStats.veryHigh} significant market catalysts</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px;">Keywords Monitored: ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} market-moving terms across 6 tiers</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px;">Coverage Strategy: 10-day comprehensive + 72-hour critical event focus</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Classification: Institutional Grade Ultra-Comprehensive Intelligence</p>
                </div>
            </div>
        </div>`;
        
        const subjectLine = aiStats.catastrophic > 0 ? 
            `🚨 CATASTROPHIC EVENTS DETECTED - Ultra-Comprehensive Intelligence Brief - ${dateStr}` :
            aiStats.extreme > 0 ?
            `⚠️ EXTREME IMPACT EVENTS - Ultra-Comprehensive Intelligence Brief - ${dateStr}` :
            `🌐 Ultra-Comprehensive Market Intelligence Brief - ${dateStr} - ${aiStats.veryHigh + aiStats.critical} High-Impact Events`;
        
        const mailOptions = {
            from: GMAIL_USER,
            to: WORK_EMAIL_LIST.split(',').map(email => email.trim()),
            subject: subjectLine,
            html: emailContent,
            text: reportContent,
            priority: aiStats.catastrophic > 0 ? 'high' : 'normal'
        };
        
        console.log('📤 Sending ultra-comprehensive market intelligence briefing...');
        const info = await transport.sendMail(mailOptions);
        console.log('✅ Ultra-comprehensive briefing sent successfully:', info.messageId);
        console.log('📧 Recipients:', WORK_EMAIL_LIST);
        
    } catch (error) {
        console.error('❌ Failed to send ultra-comprehensive briefing:', error.message);
    }
}

// Main function with ultra-comprehensive capabilities
async function generateUltraComprehensiveReport() {
    try {
        const timing = getEnhancedMarketTimingInfo();
        console.log('🌐 ULTRA-COMPREHENSIVE MARKET INTELLIGENCE SYSTEM INITIATING...');
        console.log(`📅 Coverage Period: Since ${timing.lastCloseString}`);
        console.log(`🚨 Critical event detection: 10-day comprehensive lookback`);
        console.log(`🤖 AI Analysis: Claude Sonnet 4 with ultra-comprehensive scoring`);
        console.log(`📊 Keyword Matrix: ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} market-moving terms across 6 impact tiers`);
        console.log(`⏰ Market Status: ${timing.isMarketHours ? 'MARKET HOURS - REAL TIME' : timing.isAfterHours ? 'AFTER HOURS - EXTENDED' : 'MARKET CLOSED'}`);
        
        // Display comprehensive API availability
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
        
        console.log(`🔑 Active Intelligence Sources: ${availableAPIs.join(', ')}`);
        console.log('');
        
        // Execute ultra-comprehensive news gathering
        const headlines = await fetchUltraComprehensiveNews();
        const totalHeadlines = Object.values(headlines).reduce((sum, arr) => sum + arr.length, 0);
        const catastrophicCount = headlines.catastrophic ? headlines.catastrophic.length : 0;
        const extremeCount = headlines.extreme ? headlines.extreme.length : 0;
        const veryHighCount = headlines.veryHigh ? headlines.veryHigh.length : 0;
        const criticalCount = headlines.critical ? headlines.critical.length : 0;
        const aiAnalyzedCount = catastrophicCount + extremeCount + veryHighCount + (headlines.critical ? headlines.critical.filter(h => h.analysisMethod === 'AI-Enhanced').length : 0);
        
        const aiStats = {
            total: totalHeadlines,
            aiAnalyzed: aiAnalyzedCount,
            catastrophic: catastrophicCount,
            extreme: extremeCount,
            veryHigh: veryHighCount,
            critical: criticalCount
        };
        
        console.log('📊 ULTRA-COMPREHENSIVE INTELLIGENCE FINAL SUMMARY:');
        console.log(`📰 Total headlines: ${totalHeadlines}`);
        console.log(`🤖 AI-analyzed: ${aiAnalyzedCount}`);
        console.log(`🚨 CATASTROPHIC events: ${catastrophicCount}`);
        console.log(`⚠️ EXTREME impact: ${extremeCount}`);
        console.log(`📈 VERY HIGH impact: ${veryHighCount}`);
        console.log(`🔥 CRITICAL events: ${criticalCount}`);
        
        if (totalHeadlines === 0) {
            console.log('⚠️  No headlines found, check API keys and connections');
            return;
        }
        
        // Generate ultra-comprehensive AI analysis
        console.log('');
        console.log('🤖 Generating ultra-comprehensive professional analysis with Claude Sonnet 4...');
        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10000, // Maximum for comprehensive analysis
            temperature: 0.05, // Lower for more focused analysis
            messages: [{
                role: 'user',
                content: createUltraComprehensivePrompt(headlines, timing)
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });

        const report = response.data.content[0].text;
        
        // Save ultra-comprehensive report
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `ultra-comprehensive-intelligence-${dateStr}.md`;
        const filepath = path.join(reportsDir, filename);
        
        // Ultra-comprehensive metadata header
        const reportWithMetadata = `# 🌐 ULTRA-COMPREHENSIVE MARKET INTELLIGENCE BRIEFING
Generated: ${timing.currentTime} ET
Coverage: Since ${timing.lastCloseString} (10-day comprehensive lookback)
AI Analysis: Claude Sonnet 4 with ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length}-term ultra-comprehensive keyword matrix
Headlines Processed: ${totalHeadlines}
AI-Analyzed Events: ${aiAnalyzedCount}
Catastrophic Events: ${catastrophicCount} (250+ AI score)
Extreme Impact Events: ${extremeCount} (200-249 AI score)  
Very High Impact Events: ${veryHighCount} (150-199 AI score)
Critical Events: ${criticalCount} (100-149 AI score)
Market Status: ${timing.isMarketHours ? 'MARKET HOURS' : timing.isAfterHours ? 'AFTER HOURS' : 'CLOSED'}
Classification: Institutional Grade Ultra-Comprehensive Intelligence

---

${report}

---

## 🌐 ULTRA-COMPREHENSIVE INTELLIGENCE METHODOLOGY

### Advanced Keyword Matrix (${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} terms monitored)
- **TIER 1 - Market Catastrophic (250+ points):** ${COMPREHENSIVE_KEYWORDS.marketCatastrophic.length} crisis-level terms
- **TIER 2 - Extreme Impact (200+ points):** ${COMPREHENSIVE_KEYWORDS.extremeImpact.length} major market-moving terms  
- **TIER 3 - Very High Impact (150+ points):** ${COMPREHENSIVE_KEYWORDS.veryHighImpact.length} significant impact terms
- **TIER 4 - High Impact (100+ points):** ${COMPREHENSIVE_KEYWORDS.highImpact.length} notable impact terms
- **TIER 5 - Significant Impact (75+ points):** ${COMPREHENSIVE_KEYWORDS.significantImpact.length} sector-relevant terms
- **Mega-Cap Companies:** ${COMPREHENSIVE_KEYWORDS.megaCapCompanies.length} major corporations tracked
- **Sector Keywords:** ${COMPREHENSIVE_KEYWORDS.sectorKeywords.length} industry-specific terms
- **Market Sentiment:** ${COMPREHENSIVE_KEYWORDS.marketSentiment.length} sentiment indicators
- **Economic Indicators:** ${COMPREHENSIVE_KEYWORDS.economicIndicators.length} economic data terms
- **Geopolitical/Regulatory:** ${COMPREHENSIVE_KEYWORDS.geopoliticalRegulatory.length} policy/conflict terms

### Ultra-Comprehensive Analysis Process
1. **Multi-phase intelligence gathering** across ${availableAPIs.length} premium data sources
2. **50+ targeted critical event searches** with extended lookback periods
3. **AI-powered importance scoring** using Claude Sonnet 4 (0-300 scale)
4. **Advanced categorization** by market impact potential
5. **Intelligent deduplication** with 85% similarity threshold
6. **Crisis-level prioritization** for catastrophic and extreme events
7. **Cross-market impact analysis** for systemic risk assessment
8. **Real-time monitoring** during market hours

### Intelligence Sources & Coverage
${availableAPIs.map(api => `- ${api}: Advanced integration with priority filtering`).join('\n')}

### Coverage Strategy
- **Immediate:** Since last market close (${timing.lastCloseString})
- **Extended:** 48-hour lookback for major events  
- **Critical:** 72-hour lookback for crisis events
- **Comprehensive:** 10-day lookback for context and ongoing stories
- **Real-time:** Live monitoring during market hours

---
*Classification: INSTITUTIONAL GRADE ULTRA-COMPREHENSIVE INTELLIGENCE*
*AI System: Claude Sonnet 4 | Keyword Matrix: ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} terms | Crisis Detection: ACTIVE*
*Market Impact Scoring: 0-300 scale with crisis-level alerts for 250+ events*`;
        
        fs.writeFileSync(filepath, reportWithMetadata);
        
        // Create latest report link
        const latestFilepath = path.join(reportsDir, 'latest-ultra-comprehensive-intelligence.md');
        fs.writeFileSync(latestFilepath, reportWithMetadata);
        
        // Save ultra-comprehensive raw data
        const dataPath = path.join(reportsDir, `ultra-comprehensive-data-${dateStr}.json`);
        const ultraComprehensiveData = {
            headlines,
            timing,
            aiStats,
            keywordMatrix: {
                totalTerms: Object.values(COMPREHENSIVE_KEYWORDS).flat().length,
                tiers: {
                    catastrophic: COMPREHENSIVE_KEYWORDS.marketCatastrophic.length,
                    extreme: COMPREHENSIVE_KEYWORDS.extremeImpact.length,
                    veryHigh: COMPREHENSIVE_KEYWORDS.veryHighImpact.length,
                    high: COMPREHENSIVE_KEYWORDS.highImpact.length,
                    significant: COMPREHENSIVE_KEYWORDS.significantImpact.length,
                    megaCaps: COMPREHENSIVE_KEYWORDS.megaCapCompanies.length,
                    sectors: COMPREHENSIVE_KEYWORDS.sectorKeywords.length,
                    sentiment: COMPREHENSIVE_KEYWORDS.marketSentiment.length,
                    economic: COMPREHENSIVE_KEYWORDS.economicIndicators.length,
                    geopolitical: COMPREHENSIVE_KEYWORDS.geopoliticalRegulatory.length
                }
            },
            activeAPIs: availableAPIs,
            coverageStrategy: {
                immediate: timing.lastCloseString,
                extended: '48 hours',
                critical: '72 hours', 
                comprehensive: '10 days'
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                reportType: 'ultra-comprehensive-intelligence',
                aiModel: 'claude-sonnet-4',
                classification: 'institutional-grade-ultra-comprehensive',
                marketStatus: timing.isMarketHours ? 'market-hours' : timing.isAfterHours ? 'after-hours' : 'closed',
                crisisDetection: 'active',
                lookbackDays: 10
            }
        };
        fs.writeFileSync(dataPath, JSON.stringify(ultraComprehensiveData, null, 2));
        
        console.log('');
        console.log(`✅ Ultra-comprehensive intelligence briefing generated: ${filename}`);
        console.log(`📊 Report length: ${report.length} characters`);
        console.log(`🧠 Ultra-comprehensive AI integration: ${aiAnalyzedCount}/${totalHeadlines} articles analyzed`);
        console.log(`🚨 Crisis events flagged: ${catastrophicCount} catastrophic, ${extremeCount} extreme`);
        console.log(`🔗 Intelligence sources: ${availableAPIs.length} premium APIs integrated`);
        console.log(`🎯 Keyword coverage: ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} terms across 10 categories`);
        
        // Send ultra-comprehensive email
        await sendUltraComprehensiveReport(reportWithMetadata, dateStr, totalHeadlines, aiStats);
        
        console.log('');
        console.log('🌐 ULTRA-COMPREHENSIVE MARKET INTELLIGENCE BRIEFING COMPLETED!');
        console.log('🚀 Maximum-scope AI analysis ready for institutional decision-making');
        console.log(`📈 Ultra-comprehensive intelligence with ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length}-term crisis detection matrix`);
        console.log(`🚨 ${catastrophicCount} catastrophic + ${extremeCount} extreme impact events prioritized`);
        console.log(`🤖 ${aiAnalyzedCount} articles analyzed by Claude Sonnet 4 for market impact`);
        console.log(`⏰ Real-time monitoring: ${timing.isMarketHours ? 'ACTIVE' : 'STANDBY'}`);
        
        // Display crisis-level events if detected
        if (catastrophicCount > 0) {
            console.log('');
            console.log('🚨🚨🚨 CATASTROPHIC MARKET EVENTS REQUIRING IMMEDIATE ATTENTION 🚨🚨🚨');
            headlines.catastrophic.slice(0, 3).forEach((news, i) => {
                console.log(`${i + 1}. [CATASTROPHIC SCORE: ${news.priority}] ${news.headline}`);
                console.log(`   AI Analysis: ${news.reasoning}`);
                console.log(`   Source: ${news.source}`);
                console.log(`   Time: ${news.datetime}`);
                console.log('');
            });
        }
        
        if (extremeCount > 0) {
            console.log('⚠️⚠️ EXTREME IMPACT EVENTS FOR IMMEDIATE REVIEW ⚠️⚠️');
            headlines.extreme.slice(0, 3).forEach((news, i) => {
                console.log(`${i + 1}. [EXTREME SCORE: ${news.priority}] ${news.headline}`);
                console.log(`   AI Analysis: ${news.reasoning}`);
                console.log(`   Source: ${news.source}`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Error generating ultra-comprehensive intelligence report:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Export all enhanced functions
module.exports = {
    generateUltraComprehensiveReport,
    fetchUltraComprehensiveNews,
    analyzeNewsImportanceWithAI,
    calculateComprehensivePriority,
    getEnhancedMarketTimingInfo,
    COMPREHENSIVE_KEYWORDS,
    
    // Legacy compatibility exports
    generateEnhancedPreMarketReport: generateUltraComprehensiveReport,
    fetchComprehensiveNews: fetchUltraComprehensiveNews,
    calculateNewsPriority: calculateComprehensivePriority
};

// Run the ultra-comprehensive market intelligence system
if (require.main === module) {
    generateUltraComprehensiveReport()
        .then(() => {
            console.log('🌐 Ultra-comprehensive market intelligence system completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Ultra-comprehensive system failed:', error);
            process.exit(1);
        });
}                        // Add remaining articles with basic scoring
                        const remainingArticles = response.data.articles.slice(articlesToAnalyze.length);
                        for (const article of remainingArticles) {
                            const basicAnalysis = calculateComprehensivePriority(
                                article.title, 
                                article.description, 
                                article.source.name
                            );
                            
                            const newsItem = {
                                headline: article.title,
                                summary: article.description,
                                source: `NewsAPI ${search.category} - ${article.source.name}`,
                                datetime: new Date(article.publishedAt).toLocaleString(),
                                url: article.url,
                                priority: basicAnalysis.score,
                                reasoning: basicAnalysis.reasoning,
                                analysisMethod: basicAnalysis.method,
                                searchCategory: search.category
                            };
                            
                            headlines[search.category].push(newsItem);
                            processedCount++;
                        }
                        
                        console.log(`    ✅ ${search.category}: ${response.data.articles.length} articles (${articlesToAnalyze.length} AI-analyzed)`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 900)); // Rate limiting
                } catch (error) {
                    console.log(`    ❌ ${search.category} search failed: ${error.message}`);
                }
            }
        }
        
        // PHASE 3: MULTI-SOURCE INTELLIGENCE AGGREGATION
        console.log('📡 PHASE 3: Multi-API Intelligence Aggregation...');
        
        // Enhanced Finnhub with comprehensive filtering
        if (FINNHUB_API_KEY) {
            console.log('📈 Finnhub: Comprehensive market news analysis...');
            try {
                const response = await axios.get(
                    `https://finnhub.io/api/v1/news?category=general&minId=${timing.comprehensiveLookbackTimestamp}&token=${FINNHUB_API_KEY}`
                );
                
                if (response.data && Array.isArray(response.data)) {
                    // Advanced filtering for high-impact stories
                    const potentiallyImportant = response.data
                        .filter(news => news.datetime > timing.lastCloseTimestamp)
                        .filter(news => {
                            const text = `${news.headline} ${news.summary}`.toLowerCase();
                            // Check against our comprehensive keyword matrix
                            return Object.values(COMPREHENSIVE_KEYWORDS).flat().some(keyword => 
                                text.includes(keyword.toLowerCase())
                            ) || 
                            // Also include stories from premium sources
                            ['reuters', 'bloomberg', 'wsj', 'financial times'].some(src => 
                                news.source && news.source.toLowerCase().includes(src)
                            );
                        })
                        .sort((a, b) => b.datetime - a.datetime)
                        .slice(0, 25); // Top 25 potentially important stories
                    
                    console.log(`    🔍 Finnhub: ${potentiallyImportant.length} high-potential stories identified`);
                    
                    // AI analyze top stories
                    for (const news of potentiallyImportant.slice(0, 12)) {
                        const newsItem = {
                            headline: news.headline,
                            summary: news.summary,
                            source: `Finnhub Priority - ${news.source}`,
                            datetime: new Date(news.datetime * 1000).toLocaleString(),
                            url: news.url,
                            timestamp: news.datetime
                        };
                        
                        const importance = await analyzeNewsImportanceWithAI(newsItem);
                        newsItem.priority = importance.score;
                        newsItem.reasoning = importance.reasoning;
                        newsItem.analysisMethod = importance.method;
                        
                        if (importance.method === 'AI-Enhanced') {
                            aiAnalyzedCount++;
                            await new Promise(resolve => setTimeout(resolve, 150));
                        }
                        
                        processedCount++;
                        
                        // Categorize by AI score
                        if (newsItem.priority >= 250) {
                            headlines.catastrophic.push(newsItem);
                        } else if (newsItem.priority >= 200) {
                            headlines.extreme.push(newsItem);
                        } else if (newsItem.priority >= 150) {
                            headlines.veryHigh.push(newsItem);
                        } else if (newsItem.priority >= 100) {
                            headlines.critical.push(newsItem);
                        } else {
                            headlines.general.push(newsItem);
                        }
                    }
                    
                    // Add remaining stories with basic analysis
                    for (const news of potentiallyImportant.slice(12)) {
                        const basicAnalysis = calculateComprehensivePriority(news.headline, news.summary, news.source);
                        const newsItem = {
                            headline: news.headline,
                            summary: news.summary,
                            source: `Finnhub - ${news.source}`,
                            datetime: new Date(news.datetime * 1000).toLocaleString(),
                            url: news.url,
                            priority: basicAnalysis.score,
                            reasoning: basicAnalysis.reasoning,
                            analysisMethod: basicAnalysis.method
                        };
                        
                        headlines.general.push(newsItem);
                        processedCount++;
                    }
                    
                    console.log(`    ✅ Finnhub: ${potentiallyImportant.length} priority stories processed`);
                }
            } catch (error) {
                console.log('    ❌ Finnhub comprehensive fetch failed:', error.message);
            }
        }
        
        // Enhanced Alpha Vantage with comprehensive topic coverage
        if (ALPHA_VANTAGE_API_KEY) {
            console.log('📊 Alpha Vantage: Comprehensive sentiment & topic analysis...');
            
            const comprehensiveAlphaSearches = [
                // Critical Corporate Events
                { topics: 'earnings', keywords: 'Microsoft,Apple,Google,Amazon,Meta,Tesla,Nvidia,Netflix,Adobe,Salesforce', category: 'critical', limit: 30 },
                { topics: 'mergers_and_acquisitions', keywords: 'merger,acquisition,takeover,deal,billion', category: 'critical', limit: 25 },
                { topics: 'financial_markets', keywords: 'trillion,market cap,valuation,record,milestone,breakthrough', category: 'critical', limit: 25 },
                
                // Federal Reserve & Monetary Policy
                { topics: 'economy_fiscal', keywords: 'Federal Reserve,Jerome Powell,interest rate,monetary policy,inflation', category: 'critical', limit: 25 },
                { topics: 'economy_monetary', keywords: 'Fed,FOMC,rate cut,rate hike,QE,quantitative easing', category: 'critical', limit: 20 },
                
                // Geopolitical & Trade
                { topics: 'politics', keywords: 'Trump,tariff,trade war,sanctions,China,Russia,Ukraine', category: 'high', limit: 20 },
                { topics: 'economy_macro', keywords: 'trade deal,export ban,supply chain,shipping,logistics', category: 'high', limit: 20 },
                
                // Technology & Innovation
                { topics: 'technology', keywords: 'artificial intelligence,AI breakthrough,quantum computing,autonomous,robotics', category: 'high', limit: 20 },
                { topics: 'technology', keywords: 'semiconductor,chip shortage,electric vehicle,battery,renewable energy', category: 'medium', limit: 15 },
                
                // Energy & Commodities
                { topics: 'energy_transportation', keywords: 'oil,natural gas,OPEC,energy crisis,pipeline,refinery', category: 'high', limit: 20 },
                { topics: 'economy_macro', keywords: 'gold,commodity,rare earth,mining,agriculture,wheat,corn', category: 'medium', limit: 15 },
                
                // Healthcare & Biotech
                { topics: 'life_sciences', keywords: 'FDA approval,drug approval,clinical trial,vaccine,biotech,pharma', category: 'medium', limit: 15 },
                { topics: 'life_sciences', keywords: 'pandemic,outbreak,health emergency,medical breakthrough', category: 'high', limit: 20 },
                
                // Financial Services
                { topics: 'financial_markets', keywords: 'banking crisis,credit crisis,stress test,regulation,fintech', category: 'high', limit: 20 },
                { topics: 'economy_fiscal', keywords: 'cryptocurrency,bitcoin,ethereum,digital currency,CBDC', category: 'medium', limit: 15 }
            ];
            
            for (const search of comprehensiveAlphaSearches) {
                try {
                    console.log(`  🎯 Alpha Vantage ${search.category}: ${search.topics} - ${search.keywords.substring(0, 30)}...`);
                    
                    const response = await axios.get(
                        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${search.topics}&keywords=${search.keywords}&limit=${search.limit}&apikey=${ALPHA_VANTAGE_API_KEY}`
                    );
                    
                    if (response.data && response.data.feed) {
                        // AI analyze high-priority searches
                        const articlesToAnalyze = search.category === 'critical' ? 8 : 
                                                (search.category === 'high' ? 5 : 3);
                        
                        for (const news of response.data.feed.slice(0, articlesToAnalyze)) {
                            const newsItem = {
                                headline: news.title,
                                summary: news.summary,
                                source: `Alpha Vantage ${search.category} - ${news.source}`,
                                datetime: new Date(news.time_published).toLocaleString(),
                                url: news.url,
                                sentiment: news.overall_sentiment_label,
                                sentimentScore: news.overall_sentiment_score,
                                relevanceScore: news.relevance_score
                            };
                            
                            const importance = await analyzeNewsImportanceWithAI(newsItem);
                            newsItem.priority = importance.score;
                            newsItem.reasoning = importance.reasoning;
                            newsItem.analysisMethod = importance.method;
                            
                            if (importance.method === 'AI-Enhanced') {
                                aiAnalyzedCount++;
                                await new Promise(resolve => setTimeout(resolve, 150));
                            }
                            
                            processedCount++;
                            
                            // Smart categorization
                            if (newsItem.priority >= 250) {
                                headlines.catastrophic.push(newsItem);
                            } else if (newsItem.priority >= 200) {
                                headlines.extreme.push(newsItem);
                            } else if (newsItem.priority >= 150) {
                                headlines.veryHigh.push(newsItem);
                            } else if (newsItem.priority >= 100) {
                                headlines.critical.push(newsItem);
                            } else {
                                headlines.general.push(newsItem);
                            }
                        }
                        
                        // Add remaining articles with basic scoring
                        for (const news of response.data.feed.slice(articlesToAnalyze)) {
                            const basicAnalysis = calculateComprehensivePriority(news.title, news.summary, news.source);
                            const newsItem = {
                                headline: news.title,
                                summary: news.summary,
                                source: `Alpha Vantage - ${news.source}`,
                                datetime: new Date(news.time_published).toLocaleString(),
                                url: news.url,
                                sentiment: news.overall_sentiment_label,
                                priority: basicAnalysis.score,
                                reasoning: basicAnalysis.reasoning,
                                analysisMethod: basicAnalysis.method
                            };
                            
                            headlines.general.push(newsItem);
                            processedCount++;
                        }
                        
                        console.log(`    ✅ Alpha Vantage ${search.category}: ${response.data.feed.length} articles (${articlesToAnalyze} AI-analyzed)`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 2500)); // Alpha Vantage rate limiting
                } catch (error) {
                    console.log(`    ❌ Alpha Vantage ${search.category} failed: ${error.message}`);
                }
            }
        }
        
        // Enhanced Polygon with corporate focus
        if (POLYGON_API_KEY) {
            console.log('💼 Polygon: Corporate intelligence with AI analysis...');
            try {
                const response = await axios.get('https://api.polygon.io/v2/reference/news', {
                    params: {
                        'published_utc.gte': new Date(timing.criticalLookbackTimestamp * 1000).toISOString().split('T')[0],
                        limit: 30,
                        sort: 'published_utc',
                        order: 'desc',
                        apikey: POLYGON_API_KEY
                    }
                });
                
                if (response.data && response.data.results) {
                    // AI analyze top corporate stories
                    for (const news of response.data.results.slice(0, 15)) {
                        const newsItem = {
                            headline: news.title,
                            summary: news.description,
                            source: `Polygon Corporate - ${news.publisher.name}`,
                            datetime: new Date(news.published_utc).toLocaleString(),
                            url: news.article_url,
                            tickers: news.tickers || []
                        };
                        
                        const importance = await analyzeNewsImportanceWithAI(newsItem);
                        newsItem.priority = importance.score;
                        newsItem.reasoning = importance.reasoning;
                        newsItem.analysisMethod = importance.method;
                        
                        if (importance.method === 'AI-Enhanced') {
                            aiAnalyzedCount++;
                            await new Promise(resolve => setTimeout(resolve, 150));
                        }
                        
                        processedCount++;
                        
                        if (newsItem.priority >= 250) {
                            headlines.catastrophic.push(newsItem);
                        } else if (newsItem.priority >= 200) {
                            headlines.extreme.push(newsItem);
                        } else if (newsItem.priority >= 150) {
                            headlines.veryHigh.push(newsItem);
                        } else if (newsItem.priority >= 100) {
                            headlines.critical.push(newsItem);
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
        
        // Enhanced Trading Economics with regional intelligence
        if (TRADING_ECONOMICS_API_KEY) {
            console.log('🌐 Trading Economics: Global economic intelligence...');
            try {
                const response = await axios.get('https://api.tradingeconomics.com/news', {
                    params: {
                        c: TRADING_ECONOMICS_API_KEY,
                        format: 'json',
                        limit: 40 // Increased for comprehensive coverage
                    }
                });
                
                if (response.data && Array.isArray(response.data)) {
                    // AI analyze top economic stories
                    for (const news of response.data.slice(0, 20)) {
                        const newsItem = {
                            headline: news.title,
                            summary: news.description,
                            source: `Trading Economics - ${news.country || 'Global'}`,
                            datetime: new Date(news.date).toLocaleString(),
                            url: news.url,
                            country: news.country,
                            category: news.category
                        };
                        
                        const importance = await analyzeNewsImportanceWithAI(newsItem);
                        newsItem.priority = importance.score;
                        newsItem.reasoning = importance.reasoning;
                        newsItem.analysisMethod = importance.method;
                        
                        if (importance.method === 'AI-Enhanced') {
                            aiAnalyzedCount++;
                            await new Promise(resolve => setTimeout(resolve, 150));
                        }
                        
                        processedCount++;
                        
                        // Smart categorization
                        if (newsItem.priority >= 250) {
                            headlines.catastrophic.push(newsItem);
                        } else if (newsItem.priority >= 200) {
                            headlines.extreme.push(newsItem);
                        } else if (newsItem.priority >= 150) {
                            headlines.veryHigh.push(newsItem);
                        } else if (newsItem.priority >= 100) {
                            headlines.critical.push(newsItem);
                        } else {
                            // Regional categorization for lower-priority news
                            if (news.country && ['United States', 'USA', 'US'].includes(news.country)) {
                                headlines.us.push(newsItem);
                            } else if (news.country && ['China', 'Japan', 'South Korea', 'India', 'Singapore', 'Hong Kong', 'Taiwan'].includes(news.country)) {
                                headlines.asian.push(newsItem);
                            } else if (news.country && ['Germany', 'France', 'UK', 'Italy', 'Spain', 'Netherlands'].includes(news.country)) {
                                headlines.european.push(newsItem);
                            } else if (news.country && ['Russia', 'Ukraine', 'Iran', 'Israel', 'North Korea'].includes(news.country)) {
                                headlines.geopolitical.push(newsItem);
                            } else {
                                headlines.globalMacro.push(newsItem);
                            }
                        }
                    }
                    
                    console.log(`    ✅ Trading Economics: ${response.data.length} economic stories analyzed`);
                }
            } catch (error) {
                console.log('    ❌ Trading Economics enhanced fetch failed:', error.message);
            }
        }
        
        // Additional API integrations (Marketstack, Twelve Data, etc.) with similar enhancements...
        if (MARKETSTACK_API_KEY) {
            console.log('📊 Marketstack: Enhanced market-specific intelligence...');
            try {
                const response = await axios.get('http://api.marketstack.com/v1/news', {
                    params: {
                        access_key: MARKETSTACK_API_KEY,
                        limit: 25,
                        sort: 'published_on',
                        keywords: 'earnings,Federal Reserve,market,trading,stocks,volatility,breakthrough'
                    }
                });
                
                if (response.data && response.data.data) {
                    for (const news of response.data.data.slice(0, 12)) {
                        const basicAnalysis = calculateComprehensivePriority(news.title, news.description, news.source);
                        const newsItem = {
                            headline: news.title,
                            summary: news.description,
                            source: `Marketstack - ${news.source}`,
                            datetime: new Date(news.published_on).toLocaleString(),
                            url: news.url,
                            priority: basicAnalysis.score,
                            reasoning: basicAnalysis.reasoning,
                            analysisMethod: basicAnalysis.method
                        };
                        
                        if (newsItem.priority >= 100) {
                            headlines.critical.push(newsItem);
                        } else {
                            headlines.us.push(newsItem);
                        }
                        
                        processedCount++;
                    }
                    
                    console.log(`    ✅ Marketstack: ${response.data.data.length} market stories processed`);
                }
            } catch (error) {
                console.log('    ❌ Marketstack enhanced fetch failed:', error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Error in ultra-comprehensive news fetch:', error.message);
    }
    
    // PHASE 4: POST-PROCESSING & INTELLIGENT CURATION
    console.log('🔄 PHASE 4: Advanced post-processing & intelligent curation...');
    
    // Sort all priority categories by score and recency
    ['catastrophic', 'extreme', 'veryHigh', 'critical'].forEach(category => {
        headlines[category].sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return new Date(b.datetime) - new Date(a.datetime);
        });
        
        // Advanced deduplication with similarity matching
        headlines[category] = headlines[category].filter((news, index, self) => {
            return index === self.findIndex(n => {
                const similarity = calculateStringSimilarity(n.headline, news.headline);
                return similarity > 0.85; // 85% similarity threshold
            });
        });
    });
    
    // Sort other categories by priority and recency
    Object.keys(headlines).forEach(category => {
        if (!['catastrophic', 'extreme', 'veryHigh', 'critical'].includes(category)) {
            headlines[category].sort((a, b) => {
                const aPriority = a.priority || 0;
                const bPriority = b.priority || 0;
                if (bPriority !== aPriority) return bPriority - aPriority;
                return new Date(b.datetime || 0) - new Date(a.datetime || 0);
            });
            
            // Keep top articles per category
            headlines[category] = headlines[category].slice(0, 20);
        }
    });
    
    const totalHeadlines = Object.values(headlines).reduce((sum, arr) => sum + arr.length, 0);
    const catastrophicCount = headlines.catastrophic.length;
    const extremeCount = headlines.extreme.length;
    const veryHighCount = headlines.veryHigh.length;
    const criticalCount = headlines.critical.length;
    
    console.log('');
    console.log('🌐 ULTRA-COMPREHENSIVE MARKET INTELLIGENCE SUMMARY:');
    console.log(`📰 Total articles processed: ${processedCount}`);
    console.log(`🤖 AI-analyzed articles: ${aiAnalyzedCount}`);
    console.log(`🚨 CATASTROPHIC events (250+ score): ${catastrophicCount}`);
    console.log(`⚠️ EXTREME impact events (200-249 score): ${extremeCount}`);
    console.log(`📈 VERY HIGH impact events (150-199 score): ${veryHighCount}`);
    console.log(`🔥 CRITICAL events (100-149 score): ${criticalCount}`);
    console.log(`📊 Total headlines collected: ${totalHeadlines}`);
    console.log(`🎯 Keyword matrix coverage: ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} terms`);
    console.log('');
    
    // Log top catastrophic and extreme events
    if (catastrophicCount > 0) {
        console.log('🚨 CATASTROPHIC MARKET EVENTS DETECTED:');
        headlines.catastrophic.slice(0, 3).forEach((news, i) => {
            console.log(`${i + 1}. [${news.priority}] ${news.headline.substring(0, 80)}...`);
            console.log(`   ${news.reasoning}`);
        });
        console.log('');
    }
    
    if (extremeCount > 0) {
        console.log('⚠️ EXTREME IMPACT EVENTS DETECTED:');
        headlines.extreme.slice(0, 3).forEach((news, i) => {
            console.log(`${i + 1}. [${news.priority}] ${news.headline.substring(0, 80)}...`);
            console.log(`   ${news.reasoning}`);
        });
        console.log('');
    }
    
    return headlines;
}

// String similarity function for advanced deduplication
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

// Ultra-comprehensive AI-powered summary prompt
function createUltraComprehensivePrompt(headlines, timing) {
    let prompt = `You are a world-class financial market analyst creating an ultra-comprehensive pre-market intelligence briefing for institutional investors, hedge funds, and portfolio managers.

Generate a detailed pre-market report analyzing ALL significant news developments since yesterday's market close (${timing.lastCloseString}) through this morning, with special emphasis on AI-identified high-impact events.

🌐 ULTRA-COMPREHENSIVE INTELLIGENCE BRIEFING DATA:
Total articles analyzed: ${Object.values(headlines).reduce((sum, arr) => sum + arr.length, 0)}
AI-powered analysis: Advanced Claude Sonnet 4 scoring with ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length}-term keyword matrix
Market timing: ${timing.isMarketHours ? 'MARKET HOURS' : timing.isAfterHours ? 'AFTER HOURS' : 'MARKET CLOSED'}

**🚨 CATASTROPHIC MARKET EVENTS (AI Score: 250-300)**
IMMEDIATE CRISIS-LEVEL ATTENTION - These events could trigger market-wide panic or systematic disruption:
`;

    if (headlines.catastrophic && headlines.catastrophic.length > 0) {
        headlines.catastrophic.forEach((news, index) => {
            prompt += `${index + 1}. [CATASTROPHIC SCORE: ${news.priority}] ${news.headline} (${news.source} - ${news.datetime})\n`;
            if (news.summary) prompt += `   Summary: ${news.summary}\n`;
            if (news.reasoning) prompt += `   AI Analysis: ${news.reasoning}\n`;
            if (news.url) prompt += `   URL: ${news.url}\n`;
            prompt += `   Analysis Method: ${news.analysisMethod}\n\n`;
        });
    } else {
        prompt += "No catastrophic market events detected in current comprehensive scan.\n\n";
    }

    prompt += `**⚠️ EXTREME IMPACT EVENTS (AI Score: 200-249)**
Major market-moving potential - Likely to cause significant sector or index movements:
`;

    if (headlines.extreme && headlines.extreme.length > 0) {
        headlines.extreme.slice(0, 10).forEach((news, index) => {
            prompt += `${index + 1}. [EXTREME SCORE: ${news.priority}] ${news.headline} (${news.source})\n`;
            if (news.reasoning) prompt += `   AI Reasoning: ${news.reasoning}\n`;
            if (news.url) prompt += `   URL: ${news.url}\n`;
        });
    } else {
        prompt += "No extreme impact events identified in current scan.\n";
    }

    prompt += `\n**📈 VERY HIGH IMPACT EVENTS (AI Score: 150-199)**
Significant market relevance - Notable potential for stock/sector movements:
`;

    if (headlines.veryHigh && headlines.veryHigh.length > 0) {
        headlines.veryHigh.slice(0, 12).forEach((news, index) => {
            prompt += `${index + 1}. [HIGH SCORE: ${news.priority}] ${news.headline} (${news.source})\n`;
            if (news.url) prompt += `   URL: ${news.url}\n`;
        });
    }

    // Continue with comprehensive data sections
    const sections = [
        { key: 'critical', title: 'CRITICAL EVENTS (100-149 Score)' },
        { key: 'general', title: 'GENERAL MARKET HEADLINES' },
        { key: 'us', title: 'US MARKET HEADLINES' },
        { key: 'asian', title: 'ASIAN MARKET HEADLINES' },
        { key: 'european', title: 'EUROPEAN MARKET HEADLINES' },
        { key: 'geopolitical', title: 'GEOPOLITICAL HEADLINES' },
        { key: 'currencies', title: 'CURRENCY MARKET UPDATES' },
        { key: 'commodities', title: 'COMMODITY MARKET NEWS' },
        { key: 'earnings', title: 'EARNINGS & CORPORATE NEWS' },
        { key: 'research', title: 'RESEARCH REPORTS & ANALYST COVERAGE' },
        { key: 'sectorRotation', title: 'SECTOR ROTATION & THEMATIC TRENDS' },
        { key: 'globalMacro', title: 'GLOBAL MACRO DEVELOPMENTS' },
        { key: 'breakingNews', title: 'BREAKING NEWS & REAL-TIME UPDATES' }
    ];

    sections.forEach(section => {
        if (headlines[section.key] && headlines[section.key].length > 0) {
            prompt += `\n\n${section.title}:\n`;
            headlines[section.key].forEach((news, index) => {
                prompt += `${index + 1}. ${news.headline} (${news.source} - ${news.datetime})\n`;
                if (news.summary) prompt += `   Summary: ${news.summary}\n`;
                if (news.url) prompt += `   URL: ${news.url}\n`;
                if (news.priority) prompt += `   Priority Score: ${news.priority}\n`;
                if (news.reasoning) prompt += `   Analysis: ${news.reasoning}\n`;
                if (news.sentiment) prompt += `   Sentiment: ${news.sentiment}\n`;
            });
        }
    });

    prompt += `

Create a comprehensive professional pre-market briefing with ultra-comprehensive AI-enhanced analysis:

# 🌐 ULTRA-COMPREHENSIVE AI-POWERED MARKET INTELLIGENCE BRIEFING
## ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## 🚨 CATASTROPHIC MARKET ALERTS
**CRISIS-LEVEL ANALYSIS:** If any catastrophic events (AI score 250+) were detected, provide immediate comprehensive analysis of their potential to trigger market-wide disruption, trading halts, or systematic risks. Detail specific sectors, indices, and asset classes likely to be affected.

## ⚠️ EXTREME IMPACT DEVELOPMENTS  
**MAJOR MARKET MOVERS:** Analyze extreme impact events (AI score 200-249) that could drive significant movements in major indices, sectors, or individual mega-cap stocks. Quantify potential impact ranges// Ultra-Comprehensive Market Intelligence System with Broad Event Detection

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

// ULTRA-COMPREHENSIVE MARKET-MOVING KEYWORDS - 400+ terms across all categories
const COMPREHENSIVE_KEYWORDS = {
    // TIER 1: MARKET CATASTROPHIC EVENTS (250+ priority points)
    marketCatastrophic: [
        // Market Structure Collapse
        'market crash', 'flash crash', 'black monday', 'market meltdown', 'financial crisis',
        'banking crisis', 'credit crisis', 'liquidity crisis', 'margin calls', 'forced selling',
        'circuit breaker', 'trading halt', 'market closure', 'exchange shutdown', 'systematic failure',
        'bank run', 'deposit flight', 'credit freeze', 'interbank lending', 'repo market',
        'clearing house', 'settlement failure', 'counterparty risk', 'contagion',
        
        // Geopolitical Catastrophes
        'nuclear attack', 'nuclear threat', 'world war', 'military invasion', 'terrorist attack',
        'assassination', 'coup attempt', 'regime collapse', 'government shutdown', 'martial law',
        'border war', 'cyber warfare', 'infrastructure attack', 'power grid', 'internet shutdown',
        
        // Economic Disasters
        'hyperinflation', 'deflation spiral', 'currency collapse', 'sovereign default',
        'debt ceiling breach', 'government default', 'fiscal cliff', 'economic collapse',
        'depression', 'severe recession', 'stagflation'
    ],

    // TIER 2: EXTREME MARKET IMPACT (200-249 priority points)
    extremeImpact: [
        // Corporate Mega Events
        'trillion market cap', 'trillion valuation', '$4 trillion', '$5 trillion', '$3 trillion',
        'largest company', 'most valuable company', 'market cap record', 'valuation milestone',
        'biggest ipo', 'mega ipo', 'largest merger', 'mega acquisition', 'hostile takeover',
        'bankruptcy filing', 'chapter 11', 'insolvency', 'liquidation', 'asset fire sale',
        'fraud charges', 'criminal investigation', 'sec enforcement', 'regulatory action',
        'ceo arrest', 'executive indictment', 'accounting scandal', 'earnings restatement',
        
        // Federal Reserve Emergencies
        'fed emergency meeting', 'federal reserve emergency', 'interest rate shock',
        'monetary policy emergency', 'jerome powell emergency', 'fed chair resignation',
        'emergency rate cut', 'emergency rate hike', 'quantitative easing', 'qe announcement',
        'operation twist', 'yield curve control', 'negative interest rates',
        
        // Trade Wars & Sanctions
        'trade war escalation', 'tariff shock', 'export ban', 'import embargo',
        'economic sanctions', 'financial sanctions', 'swift ban', 'asset freeze',
        'trade retaliation', 'supply chain collapse', 'shipping disruption',
        
        // Energy & Commodity Crises
        'oil embargo', 'energy crisis', 'opec emergency', 'strategic reserve',
        'pipeline explosion', 'refinery fire', 'natural gas shortage', 'power outage',
        'commodity shortage', 'rare earth ban', 'critical materials'
    ],

    // TIER 3: VERY HIGH IMPACT (150-199 priority points)
    veryHighImpact: [
        // Major Corporate Events
        'record earnings', 'blowout earnings', 'massive beat', 'huge earnings miss',
        'guidance shock', 'outlook slash', 'profit warning', 'earnings surprise',
        'revenue record', 'margin expansion', 'cost cutting program', 'restructuring plan',
        'mass layoffs', 'plant closure', 'facility shutdown', 'operations halt',
        'product recall', 'safety issue', 'regulatory fine', 'settlement payment',
        'dividend cut', 'dividend suspension', 'buyback halt', 'credit downgrade',
        
        // Trump & Political Events
        'trump tariff', 'trump announcement', 'trump policy', 'trump executive order',
        'tariff announcement', 'trade deal', 'trade agreement', 'bilateral deal',
        'nafta', 'usmca', 'wto ruling', 'trade dispute', 'diplomatic crisis',
        'election results', 'midterm elections', 'presidential election', 'political crisis',
        
        // Central Bank Actions Globally
        'ecb emergency', 'european central bank', 'christine lagarde', 'rate decision',
        'bank of japan', 'boj intervention', 'yen intervention', 'kuroda',
        'pboc policy', 'china central bank', 'yuan devaluation', 'capital controls',
        'bank of england', 'boe rate', 'pound intervention', 'brexit impact',
        'rbi policy', 'bank of canada', 'rba decision', 'snb intervention',
        
        // Technology Breakthroughs
        'artificial intelligence breakthrough', 'ai breakthrough', 'agi achieved',
        'quantum computer breakthrough', 'quantum supremacy', 'fusion breakthrough',
        'autonomous driving', 'self-driving approval', 'robotics breakthrough',
        'space technology', 'satellite internet', 'chip breakthrough'
    ],

    // TIER 4: HIGH IMPACT (100-149 priority points)
    highImpact: [
        // Regular Major Corporate News
        'capex increase', 'capital expenditure', 'investment program', 'expansion plan',
        'major acquisition', 'strategic partnership', 'joint venture', 'licensing deal',
        'spin-off announcement', 'divestiture', 'asset sale', 'business unit sale',
        'stock split', 'share split', 'dividend increase', 'special dividend',
        'share buyback', 'stock repurchase', 'capital return program',
        'ceo change', 'management change', 'board resignation', 'executive hire',
        'succession plan', 'leadership transition', 'founder return',
        
        // Economic Data & Policy
        'inflation data', 'cpi report', 'ppi data', 'core inflation',
        'employment report', 'jobs report', 'unemployment rate', 'nonfarm payrolls',
        'gdp growth', 'gdp revision', 'economic growth', 'recession warning',
        'consumer confidence', 'business confidence', 'sentiment index',
        'retail sales', 'consumer spending', 'housing data', 'home sales',
        'manufacturing data', 'industrial production', 'capacity utilization',
        'trade deficit', 'current account', 'balance of payments',
        
        // Healthcare & Pharma
        'fda approval', 'drug approval', 'vaccine approval', 'clinical trial',
        'phase 3 results', 'trial failure', 'drug recall', 'safety warning',
        'breakthrough therapy', 'orphan drug', 'biosimilar', 'generic competition',
        'patent expiry', 'patent challenge', 'intellectual property',
        'pandemic', 'outbreak', 'public health emergency', 'vaccine mandate',
        
        // Financial Sector
        'stress test results', 'bank earnings', 'net interest margin', 'loan losses',
        'credit provision', 'deposit growth', 'loan growth', 'mortgage rates',
        'credit rating', 'rating upgrade', 'rating downgrade', 'outlook change',
        'regulatory approval', 'merger approval', 'antitrust', 'competition',
        'fintech', 'digital banking', 'cryptocurrency', 'cbdc', 'stablecoin'
    ],

    // TIER 5: SIGNIFICANT IMPACT (75-99 priority points)
    significantImpact: [
        // Technology & Innovation
        'product launch', 'new product', 'innovation', 'patent filing',
        'r&d investment', 'technology upgrade', 'platform launch', 'service expansion',
        'cloud computing', 'artificial intelligence', 'machine learning', 'data analytics',
        'cybersecurity', 'data breach', 'privacy', 'gdpr', 'regulation compliance',
        'semiconductor', 'chip shortage', 'memory prices', 'processor', 'gpu',
        'electric vehicle', 'ev sales', 'battery technology', 'charging infrastructure',
        'renewable energy', 'solar power', 'wind energy', 'energy storage',
        
        // Regional Economic Events
        'china gdp', 'china pmi', 'china exports', 'china policy', 'belt and road',
        'japan data', 'nikkei', 'yen', 'boj', 'abenomics',
        'eurozone', 'eu gdp', 'german data', 'french economy', 'italian debt',
        'brexit', 'uk economy', 'pound', 'bank of england', 'northern ireland',
        'emerging markets', 'developing nations', 'frontier markets',
        'latin america', 'brazil', 'mexico', 'argentina', 'commodity exporters',
        
        // ESG & Sustainability
        'climate change', 'carbon emissions', 'net zero', 'sustainability',
        'esg rating', 'environmental policy', 'carbon tax', 'cap and trade',
        'green energy', 'clean technology', 'sustainable finance', 'green bonds',
        'social responsibility', 'diversity', 'governance', 'stakeholder capitalism'
    ],

    // MEGA-CAP COMPANIES (Enhanced list - 100+ companies)
    megaCapCompanies: [
        // US Tech Giants
        'microsoft', 'apple', 'google', 'alphabet', 'amazon', 'meta', 'facebook',
        'nvidia', 'tesla', 'netflix', 'adobe', 'salesforce', 'oracle', 'intel',
        'cisco', 'broadcom', 'qualcomm', 'texas instruments', 'amd', 'micron',
        'servicenow', 'workday', 'snowflake', 'crowdstrike', 'zoom', 'slack',
        'uber', 'lyft', 'airbnb', 'doordash', 'shopify', 'square', 'paypal',
        'mastercard', 'visa', 'american express', 'block', 'coinbase',
        
        // Traditional Blue Chips
        'berkshire hathaway', 'warren buffett', 'jpmorgan', 'bank of america',
        'wells fargo', 'goldman sachs', 'morgan stanley', 'citigroup',
        'johnson & johnson', 'pfizer', 'merck', 'abbvie', 'bristol myers',
        'eli lilly', 'unitedhealth', 'anthem', 'cvs health', 'walgreens',
        'walmart', 'target', 'costco', 'home depot', 'lowes',
        'coca cola', 'pepsico', 'procter gamble', 'unilever', 'nestle',
        'mcdonalds', 'starbucks', 'nike', 'disney', 'comcast',
        
        // Energy & Industrials
        'exxon mobil', 'chevron', 'conocophillips', 'schlumberger', 'halliburton',
        'general electric', 'boeing', 'lockheed martin', 'raytheon', 'northrop',
        'caterpillar', 'deere', 'honeywell', '3m', 'general motors', 'ford',
        
        // International Giants
        'taiwan semiconductor', 'tsmc', 'samsung', 'asml', 'sap', 'sony',
        'toyota', 'volkswagen', 'bmw', 'mercedes', 'ferrari', 'porsche',
        'nestle', 'unilever', 'lvmh', 'hermes', 'richemont',
        'saudi aramco', 'petrobras', 'gazprom', 'lukoil', 'total',
        'shell', 'bp', 'conocophillips', 'eni', 'equinor'
    ],

    // SECTOR-SPECIFIC KEYWORDS
    sectorKeywords: [
        // Technology
        'artificial intelligence', 'ai', 'machine learning', 'deep learning',
        'cloud computing', 'saas', 'paas', 'iaas', 'edge computing', 'quantum computing',
        'cybersecurity', '5g', '6g', 'internet of things', 'iot', 'blockchain',
        'cryptocurrency', 'bitcoin', 'ethereum', 'defi', 'nft', 'metaverse',
        'autonomous vehicles', 'self driving', 'electric vehicles', 'ev',
        'semiconductor', 'chips', 'processors', 'memory', 'storage',
        
        // Healthcare & Biotech
        'gene therapy', 'cell therapy', 'immunotherapy', 'precision medicine',
        'personalized medicine', 'biomarkers', 'diagnostics', 'medical devices',
        'telemedicine', 'digital health', 'health tech', 'pharma',
        'clinical trials', 'drug development', 'vaccine', 'antibody',
        'crispr', 'gene editing', 'stem cells', 'regenerative medicine',
        
        // Energy & Environment
        'renewable energy', 'solar power', 'wind power', 'hydroelectric',
        'nuclear power', 'fusion energy', 'battery storage', 'grid storage',
        'smart grid', 'energy efficiency', 'carbon capture', 'green hydrogen',
        'biofuels', 'natural gas', 'lng', 'oil drilling', 'fracking',
        
        // Financial Services
        'fintech', 'digital payments', 'mobile payments', 'contactless',
        'buy now pay later', 'bnpl', 'peer to peer', 'p2p lending',
        'robo advisor', 'algorithmic trading', 'high frequency trading',
        'regulatory technology', 'regtech', 'compliance technology',
        'insurance technology', 'insurtech', 'property technology', 'proptech'
    ],

    // MARKET SENTIMENT & TECHNICAL INDICATORS
    marketSentiment: [
        'market volatility', 'vix spike', 'fear index', 'volatility surge',
        'risk off', 'risk on', 'flight to safety', 'safe haven demand',
        'market rotation', 'sector rotation', 'style rotation',
        'growth stocks', 'value stocks', 'dividend stocks', 'momentum stocks',
        'small cap', 'mid cap', 'large cap', 'mega cap',
        'bull market', 'bear market', 'correction', 'pullback',
        'resistance level', 'support level', 'breakout', 'breakdown',
        'moving average', 'trend line', 'chart pattern', 'technical analysis',
        'volume surge', 'unusual volume', 'block trades', 'insider trading',
        'short interest', 'short squeeze', 'gamma squeeze', 'options flow'
    ],

    // ECONOMIC INDICATORS & DATA
    economicIndicators: [
        'gdp', 'gross domestic product', 'economic growth', 'recession',
        'inflation', 'deflation', 'cpi', 'ppi', 'pce', 'core inflation',
        'employment', 'unemployment', 'jobs', 'payrolls', 'labor market',
        'wage growth', 'productivity', 'unit labor costs',
        'consumer confidence', 'consumer sentiment', 'retail sales',
        'personal income', 'personal spending', 'savings rate',
        'housing starts', 'building permits', 'existing home sales',
        'new home sales', 'home prices', 'mortgage applications',
        'industrial production', 'manufacturing', 'pmi', 'ism',
        'capacity utilization', 'factory orders', 'durable goods',
        'trade balance', 'exports', 'imports', 'current account'
    ],

    // GEOPOLITICAL & REGULATORY
    geopoliticalRegulatory: [
        'russia ukraine', 'china taiwan', 'north korea', 'iran nuclear',
        'middle east', 'israel palestine', 'syria', 'afghanistan',
        'nato', 'european union', 'brexit', 'trade war',
        'sanctions', 'tariffs', 'quotas', 'embargos',
        'regulatory approval', 'antitrust', 'competition policy',
        'data privacy', 'gdpr', 'ccpa', 'cybersecurity regulation',
        'financial regulation', 'banking regulation', 'insurance regulation',
        'environmental regulation', 'climate policy', 'carbon pricing',
        'tax policy', 'corporate tax', 'capital gains', 'dividend tax'
    ]
};

// AI-powered news importance analyzer with enhanced logic
async function analyzeNewsImportanceWithAI(newsItem) {
    if (!ANTHROPIC_API_KEY) {
        return calculateComprehensivePriority(newsItem.headline, newsItem.summary, newsItem.source);
    }
    
    try {
        const prompt = `You are an expert financial market analyst with 20+ years of experience. Analyze this news item for its potential market-moving impact across ALL asset classes and markets globally.

Headline: "${newsItem.headline}"
Summary: "${newsItem.summary || 'No summary available'}"
Source: "${newsItem.source}"
Timestamp: "${newsItem.datetime}"

Provide a comprehensive market impact score from 0-300:

SCORING FRAMEWORK:
• 250-300: MARKET CATASTROPHIC - Could trigger market-wide panic, trading halts, or systemic crisis
• 200-249: EXTREME IMPACT - Likely to move major indices 2%+, affect multiple sectors significantly
• 150-199: VERY HIGH IMPACT - Could move individual stocks 5%+, sector indices 1-2%, influence Fed policy
• 100-149: HIGH IMPACT - Notable impact on relevant stocks/sectors, important for active traders
• 75-99: SIGNIFICANT - Affects specific companies or niches, relevant for sector specialists
• 50-74: MODERATE - Standard corporate news, minor policy updates, routine announcements
• 25-49: LOW - General business news with limited direct market relevance
• 0-24: MINIMAL - Background information, historical context, non-market content

EVALUATION CRITERIA:
1. **Market Cap Relevance**: Larger companies = higher impact potential
2. **Timing Sensitivity**: Breaking news, earnings season, Fed meetings = multiplier effect
3. **Precedent Analysis**: How have similar events moved markets historically?
4. **Ripple Effects**: Could this trigger broader sector/market movements?
5. **Economic Implications**: Does this affect GDP, inflation, employment, productivity?
6. **Policy Impact**: Could this influence monetary/fiscal policy decisions?
7. **Global Scope**: Regional impact vs worldwide implications
8. **Surprise Factor**: Was this expected or completely unexpected?
9. **Liquidity Impact**: Could this affect trading volumes or market structure?
10. **Sentiment Shift**: Could this change overall market psychology?

Consider these specific factors:
- Company market cap and index weighting
- Sector interconnectedness and supply chain effects  
- Currency implications for international markets
- Commodity price impacts
- Bond market effects (yield curves, credit spreads)
- Volatility implications (VIX impact)
- Options and derivatives effects
- After-hours/pre-market implications

Respond with: "SCORE: [number] | REASONING: [detailed 2-3 sentence justification focusing on specific market mechanisms and quantitative impact potential]"`;

        const response = await axios.post(ANTHROPIC_API_URL, {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
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
        const reasoningMatch = aiResponse.match(/REASONING:\s*(.+)$/s);
        
        if (scoreMatch) {
            const aiScore = parseInt(scoreMatch[1]);
            return {
                score: Math.min(Math.max(aiScore, 0), 300), // Clamp between 0-300
                reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'AI market impact analysis',
                method: 'AI-Enhanced',
                confidence: 'High'
            };
        }
    } catch (error) {
        console.log(`  ⚠️ AI analysis failed for "${newsItem.headline.substring(0, 50)}...": ${error.message}`);
    }
    
    // Fallback to comprehensive keyword scoring
    const basicAnalysis = calculateComprehensivePriority(newsItem.headline, newsItem.summary, newsItem.source);
    return {
        score: basicAnalysis.score,
        reasoning: basicAnalysis.reasoning,
        method: 'Comprehensive-Keyword',
        confidence: 'Medium'
    };
}

// Enhanced comprehensive priority calculation with 400+ keywords
function calculateComprehensivePriority(headline, summary, source) {
    let score = 0;
    let reasons = [];
    const text = `${headline} ${summary}`.toLowerCase();
    
    // TIER 1: Market Catastrophic Events (250+ points)
    COMPREHENSIVE_KEYWORDS.marketCatastrophic.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 250;
            reasons.push(`CATASTROPHIC: "${keyword}" detected`);
            console.log(`    🚨 CATASTROPHIC EVENT: "${keyword}" (+250 points)`);
        }
    });
    
    // TIER 2: Extreme Impact Events (200-249 points)
    COMPREHENSIVE_KEYWORDS.extremeImpact.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 200;
            reasons.push(`EXTREME: "${keyword}" identified`);
            console.log(`    ⚠️ EXTREME IMPACT: "${keyword}" (+200 points)`);
        }
    });
    
    // TIER 3: Very High Impact Events (150-199 points)
    COMPREHENSIVE_KEYWORDS.veryHighImpact.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 150;
            reasons.push(`HIGH: "${keyword}" found`);
            console.log(`    📈 VERY HIGH IMPACT: "${keyword}" (+150 points)`);
        }
    });
    
    // TIER 4: High Impact Events (100-149 points)
    COMPREHENSIVE_KEYWORDS.highImpact.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 100;
            reasons.push(`Significant: "${keyword}"`);
        }
    });
    
    // TIER 5: Significant Impact Events (75-99 points)
    COMPREHENSIVE_KEYWORDS.significantImpact.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 75;
        }
    });
    
    // MEGA-CAP COMPANY IMPACT MULTIPLIERS (50-150 points based on size)
    const megaCapScoring = {
        // Tier 1: Ultra Mega-Caps (150 point boost)
        'microsoft': 150, 'apple': 150, 'google': 140, 'alphabet': 140,
        'amazon': 140, 'nvidia': 135, 'meta': 130, 'tesla': 130,
        
        // Tier 2: Major Mega-Caps (120 point boost)
        'berkshire hathaway': 120, 'taiwan semiconductor': 120, 'tsmc': 120,
        'samsung': 115, 'saudi aramco': 115, 'johnson & johnson': 110,
        'exxon mobil': 110, 'unitedhealth': 110, 'jpmorgan': 110,
        
        // Tier 3: Large Mega-Caps (100 point boost)
        'visa': 100, 'mastercard': 100, 'procter gamble': 100, 'home depot': 100,
        'pfizer': 100, 'abbvie': 100, 'coca cola': 100, 'walmart': 100,
        'netflix': 95, 'adobe': 95, 'salesforce': 95, 'oracle': 95,
        
        // Tier 4: Significant Large-Caps (80 point boost)
        'intel': 80, 'cisco': 80, 'broadcom': 80, 'qualcomm': 80,
        'boeing': 80, 'disney': 80, 'mcdonalds': 80, 'nike': 80,
        
        // Tier 5: Notable Large-Caps (60 point boost)
        'amd': 60, 'uber': 60, 'airbnb': 60, 'snowflake': 60,
        'zoom': 60, 'shopify': 60, 'square': 60, 'paypal': 60
    };
    
    Object.entries(megaCapScoring).forEach(([company, boost]) => {
        if (text.includes(company)) {
            score += boost;
            reasons.push(`Mega-cap: ${company} (+${boost})`);
            console.log(`    🏢 MEGA-CAP IMPACT: "${company}" (+${boost} points)`);
        }
    });
    
    // SECTOR-SPECIFIC KEYWORD SCORING
    COMPREHENSIVE_KEYWORDS.sectorKeywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 40;
        }
    });
    
    // MARKET SENTIMENT INDICATORS
    COMPREHENSIVE_KEYWORDS.marketSentiment.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 50;
            if (['vix spike', 'market crash', 'volatility surge'].some(critical => text.includes(critical))) {
                score += 100; // Extra boost for critical sentiment indicators
                reasons.push(`Critical sentiment: "${keyword}"`);
            }
        }
    });
    
    // ECONOMIC INDICATORS SCORING
    COMPREHENSIVE_KEYWORDS.economicIndicators.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 60;
            if (['recession', 'inflation shock', 'employment crisis'].some(critical => text.includes(critical))) {
                score += 80; // Extra boost for critical economic indicators
                reasons.push(`Critical economic data: "${keyword}"`);
            }
        }
    });
    
    // GEOPOLITICAL & REGULATORY SCORING
    COMPREHENSIVE_KEYWORDS.geopoliticalRegulatory.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 70;
            if (['trade war', 'sanctions', 'military conflict'].some(critical => text.includes(critical))) {
                score += 100; // Extra boost for critical geopolitical events
                reasons.push(`Critical geopolitical: "${keyword}"`);
            }
        }
    });
    
    // SOURCE CREDIBILITY MULTIPLIER
    const sourceCredibility = {
        'reuters': 1.3, 'bloomberg': 1.3, 'wall street journal': 1.25, 'wsj': 1.25,
        'financial times': 1.25, 'cnbc': 1.2, 'marketwatch': 1.15,
        'yahoo finance': 1.1, 'seeking alpha': 1.05, 'benzinga': 1.05,
        'sec filing': 1.4, 'earnings call': 1.3, 'company announcement': 1.25,
        'federal reserve': 1.5, 'fed': 1.5, 'central bank': 1.4
    };
    
    let credibilityMultiplier = 1.0;
    Object.entries(sourceCredibility).forEach(([srcName, multiplier]) => {
        if (source.toLowerCase().includes(srcName)) {
            credibilityMultiplier = Math.max(credibilityMultiplier, multiplier);
            reasons.push(`Premium source: ${srcName}`);
        }
    });
    
    score = Math.floor(score * credibilityMultiplier);
    
    // URGENCY & TIMING MULTIPLIERS
    const urgentKeywords = ['breaking', 'urgent', 'alert', 'just in', 'developing', 'emergency'];
    urgentKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            score += 30;
            reasons.push(`Urgent news: "${keyword}"`);
        }
    });
    
    // TIME-SENSITIVE MULTIPLIERS
    const now = new Date();
    const isMarketHours = (now.getHours() >= 9 && now.getHours() < 16) && 
                         (now.getDay() >= 1 && now.getDay() <= 5);
    const isAfterHours = (now.getHours() >= 16 || now.getHours() < 9) && 
                        (now.getDay() >= 1 && now.getDay() <= 5);
    
    if (isAfterHours) {
        score = Math.floor(score * 1.2); // 20% boost for after-hours news
        reasons.push('After-hours timing boost');
    }
    
    // EARNINGS SEASON MULTIPLIER
    const earningsKeywords = ['earnings', 'quarterly results', 'guidance', 'outlook'];
    if (earningsKeywords.some(keyword => text.includes(keyword))) {
        score += 50;
        reasons.push('Earnings-related content');
    }
    
    // Cap maximum score and provide reasoning
    const finalScore = Math.min(score, 300);
    const reasoning = reasons.length > 0 ? 
        reasons.slice(0, 3).join('; ') : 
        'Standard keyword-based analysis';
    
    return {
        score: finalScore,
        reasoning: reasoning,
        method: 'Comprehensive-Keyword',
        keywordMatches: reasons.length
    };
}

// Enhanced timing calculation with multiple strategic lookback periods
function getEnhancedMarketTimingInfo() {
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
    
    // Multiple strategic lookback periods for comprehensive coverage
    const lookbacks = {
        immediate: new Date(lastClose), // Since last market close
        extended: new Date(lastClose.getTime() - 48 * 60 * 60 * 1000), // 48 hours
        critical: new Date(lastClose.getTime() - 72 * 60 * 60 * 1000), // 72 hours for major events
        weekly: new Date(lastClose.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days for ongoing stories
        comprehensive: new Date(lastClose.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days for market context
    };
    
    return {
        lastCloseTimestamp: Math.floor(lastClose.getTime() / 1000),
        extendedLookbackTimestamp: Math.floor(lookbacks.extended.getTime() / 1000),
        criticalLookbackTimestamp: Math.floor(lookbacks.critical.getTime() / 1000),
        weeklyLookbackTimestamp: Math.floor(lookbacks.weekly.getTime() / 1000),
        comprehensiveLookbackTimestamp: Math.floor(lookbacks.comprehensive.getTime() / 1000),
        lastCloseString: lastClose.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        currentTime: now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        lookbacks,
        isMarketHours: (now.getHours() >= 9 && now.getHours() < 16) && (now.getDay() >= 1 && now.getDay() <= 5),
        isAfterHours: (now.getHours() >= 16 || now.getHours() < 9) && (now.getDay() >= 1 && now.getDay() <= 5)
    };
}

// ULTRA-COMPREHENSIVE NEWS FETCHING WITH BROAD SEARCH STRATEGY
async function fetchUltraComprehensiveNews() {
    const timing = getEnhancedMarketTimingInfo();
    const headlines = {
        catastrophic: [], // NEW: 250+ AI score
        extreme: [],      // NEW: 200-249 AI score
        veryHigh: [],     // NEW: 150-199 AI score
        critical: [],     // 100+ priority (legacy compatibility)
        general: [],
        us: [],
        asian: [],
        european: [],
        geopolitical: [],
        currencies: [],
        commodities: [],
        earnings: [],
        research: [],
        premarketMovers: [],
        breakingNews: [], // NEW: Real-time breaking news
        sectorRotation: [], // NEW: Sector-specific major moves
        globalMacro: []   // NEW: Global macro events
    };
    
    console.log('🌐 ULTRA-COMPREHENSIVE MARKET INTELLIGENCE SYSTEM ACTIVATED');
    console.log(`📰 Broad spectrum news gathering since: ${timing.lastCloseString}`);
    console.log(`🔍 Multi-tier lookback strategy: 10-day comprehensive coverage`);
    console.log(`🎯 Enhanced keyword matrix: ${Object.values(COMPREHENSIVE_KEYWORDS).flat().length} market-moving terms`);
    console.log(`⏰ Market Status: ${timing.isMarketHours ? 'MARKET HOURS' : timing.isAfterHours ? 'AFTER HOURS' : 'CLOSED'}`);
    
    let processedCount = 0;
    let aiAnalyzedCount = 0;
    
    try {
        // PHASE 1: BREAKING NEWS & CRITICAL EVENT DETECTION
        if (NEWS_API_KEY) {
            console.log('🚨 PHASE 1: Ultra-Critical Event Detection & Breaking News...');
            
            // ULTRA-COMPREHENSIVE CRITICAL SEARCHES - 50+ targeted queries
            const ultraCriticalSearches = [
                // Market Structure & Systemic Events
                '("market crash" OR "flash crash" OR "circuit breaker" OR "trading halt") AND (NYSE OR NASDAQ OR "S&P 500" OR Dow)',
                '("banking crisis" OR "liquidity crisis" OR "credit crisis" OR "margin calls") AND (market OR financial OR economy)',
                '("systematic risk" OR "contagion" OR "financial crisis" OR "credit freeze") AND (global OR worldwide OR market)',
                '("repo market" OR "interbank lending" OR "clearing house" OR "settlement failure") AND crisis',
                
                // Federal Reserve & Monetary Policy Emergencies
                '("Federal Reserve emergency" OR "Fed emergency meeting" OR "Jerome Powell emergency") AND (announcement OR policy OR rate)',
                '("emergency rate cut" OR "emergency rate hike" OR "monetary policy shock") AND (Fed OR "Federal Reserve")',
                '("quantitative easing" OR "QE announcement" OR "yield curve control") AND (Fed OR emergency OR surprise)',
                '("negative interest rates" OR "NIRP" OR "unconventional policy") AND ("United States" OR Fed OR America)',
                
                // Mega-Cap Corporate Catastrophes
                '("trillion market cap" OR "trillion valuation" OR "$4 trillion" OR "$5 trillion" OR "$3 trillion") AND (milestone OR record OR first)',
                '("bankruptcy filing" OR "chapter 11" OR "insolvency" OR "liquidation") AND (Microsoft OR Apple OR Google OR Amazon OR Meta OR Tesla OR Nvidia)',
                '("fraud charges" OR "criminal investigation" OR "SEC enforcement" OR "regulatory action") AND (CEO OR executive OR "C-suite")',
                '("massive layoffs" OR "plant closure" OR "facility shutdown" OR "operations halt") AND (thousand OR "mass firing" OR restructuring)',
                
                // Earnings Shocks & Corporate Mega Events
                '("record earnings" OR "blowout earnings" OR "massive beat" OR "huge earnings miss") AND (Microsoft OR Apple OR Google OR Amazon OR Meta OR Tesla OR Nvidia OR Netflix OR Adobe)',
                '("guidance shock" OR "outlook slash" OR "profit warning" OR "earnings surprise") AND (billion OR revenue OR margin)',
                '("largest merger" OR "mega acquisition" OR "hostile takeover" OR "mega deal") AND (billion OR "largest ever" OR record)',
                '("product recall" OR "safety crisis" OR "regulatory shutdown") AND (global OR worldwide OR massive OR millions)',
                
                // Geopolitical Catastrophes & Trade Wars
                '("nuclear threat" OR "nuclear attack" OR "military invasion" OR "world war") AND (market OR economy OR global)',
                '("cyber warfare" OR "infrastructure attack" OR "power grid attack" OR "internet shutdown") AND (national OR security OR crisis)',
                '("trade war escalation" OR "economic warfare" OR "export ban" OR "import embargo") AND (China OR Russia OR Europe OR global)',
                '("Trump tariff" OR "tariff shock" OR "trade retaliation" OR "economic sanctions") AND (announcement OR policy OR decision)',
                
                // Energy & Commodity Crises
                '("oil embargo" OR "energy crisis" OR "OPEC emergency" OR "strategic reserve release") AND (price OR shortage OR crisis)',
                '("pipeline explosion" OR "refinery fire" OR "natural gas shortage" OR "power outage") AND (major OR massive OR widespread)',
                '("commodity shortage" OR "supply chain collapse" OR "shipping crisis" OR "port closure") AND (global OR worldwide OR critical)',
                '("rare earth ban" OR "critical materials" OR "semiconductor shortage") AND (China OR supply OR crisis)',
                
                // Technology & Innovation Breakthroughs
                '("AI breakthrough" OR "artificial intelligence breakthrough" OR "AGI achieved" OR "quantum supremacy") AND (announced OR achieved OR breakthrough)',
                '("fusion breakthrough" OR "nuclear fusion" OR "clean energy breakthrough") AND (commercial OR viable OR announced)',
                '("autonomous driving approval" OR "self-driving cars" OR "robotics breakthrough") AND (FDA OR regulatory OR commercial)',
                '("space technology" OR "satellite internet" OR "mars mission") AND (breakthrough OR success OR launch)',
                
                // Healthcare & Pandemic Events
                '("pandemic" OR "outbreak" OR "public health emergency" OR "vaccine breakthrough") AND (WHO OR CDC OR global OR emergency)',
                '("drug approval" OR "FDA approval" OR "breakthrough therapy" OR "gene therapy") AND (first OR breakthrough OR revolutionary)',
                '("clinical trial failure" OR "drug recall" OR "safety warning" OR "black box warning") AND (major OR widespread OR serious)',
                
                // Political & Regulatory Shocks
                '("election crisis" OR "constitutional crisis" OR "government shutdown" OR "political crisis") AND (United States OR America OR US)',
                '("Supreme Court decision" OR "landmark ruling" OR "constitutional ruling") AND (business OR corporate OR regulation)',
                '("regulatory crackdown" OR "antitrust action" OR "DOJ investigation" OR "FTC action") AND (tech OR big tech OR monopoly)',
                
                // Currency & International Finance
                '("dollar collapse" OR "currency crisis" OR "sovereign default" OR "debt ceiling breach") AND (United States OR America OR global)',
                '("yuan devaluation" OR "currency war" OR "capital controls" OR "forex intervention") AND (China OR major OR crisis)',
                '("euro crisis" OR "eurozone crisis" OR "ECB emergency" OR "European crisis") AND (debt OR banking OR financial)',
                
                // Sector-Wide Disruptions
                '("cybersecurity breach" OR "ransomware attack" OR "data breach" OR "cyber attack") AND (major OR massive OR widespread OR Fortune)',
                '("supply chain disruption" OR "manufacturing halt" OR "factory shutdown" OR "production stop") AND (global OR major OR critical)',
                '("transportation crisis" OR "airline crisis" OR "shipping disruption" OR "logistics breakdown") AND (major OR global OR widespread)',
                
                // Climate & Environmental Disasters
                '("climate disaster" OR "natural disaster" OR "extreme weather" OR "climate emergency") AND (economic OR market OR impact)',
                '("carbon pricing" OR "climate regulation" OR "green new deal" OR "net zero mandate") AND (policy OR regulation OR law)',
                
                // Real Estate & Housing
                '("housing crisis" OR "real estate crash" OR "mortgage crisis" OR "foreclosure wave") AND (market OR nationwide OR crisis)',
                '("commercial real estate" OR "office buildings" OR "retail apocalypse") AND (crisis OR collapse OR crash)',
                
                // Labor & Social
                '("general strike" OR "labor strike" OR "union action" OR "work stoppage") AND (nationwide OR major OR mass)',
                '("social unrest" OR "civil unrest" OR "protests" OR "riots") AND (economic OR market OR business)',
                
                // Additional Broad Captures
                '("breaking" OR "urgent" OR "just in" OR "developing") AND ("market moving" OR "stocks" OR "trading" OR "financial")',
                '("unprecedented" OR "historic" OR "record breaking" OR "first time ever") AND (market OR financial OR economic OR corporate)',
                '("emergency meeting" OR "special session" OR "urgent announcement") AND (Fed OR SEC OR Treasury OR government OR corporate)'
            ];
            
            const comprehensiveFromDate = new Date(timing.lookbacks.comprehensive);
            const fromDate = comprehensiveFromDate.toISOString().split('T')[0];
            
            for (const query of ultraCriticalSearches) {
                try {
                    console.log(`  🔍 Critical scan: "${query.substring(0, 60)}..."`);
                    
                    const response = await axios.get('https://newsapi.org/v2/everything', {
                        params: {
                            q: query,
                            from: fromDate,
                            sortBy: 'publishedAt',
                            language: 'en',
                            pageSize: 25, // Increased for critical searches
                            apiKey: NEWS_API_KEY
                        }
                    });
                    
                    if (response.data && response.data.articles) {
                        // Process top articles with AI analysis
                        for (const article of response.data.articles.slice(0, 8)) {
                            const newsItem = {
                                headline: article.title,
                                summary: article.description,
                                source: `NewsAPI Critical - ${article.source.name}`,
                                datetime: new Date(article.publishedAt).toLocaleString(),
                                url: article.url,
                                publishedAt: new Date(article.publishedAt),
                                searchQuery: query.substring(0, 50) + '...'
                            };
                            
                            // AI-powered importance analysis for all critical searches
                            const importance = await analyzeNewsImportanceWithAI(newsItem);
                            newsItem.priority = importance.score;
                            newsItem.reasoning = importance.reasoning;
                            newsItem.analysisMethod = importance.method;
                            newsItem.confidence = importance.confidence;
                            
                            processedCount++;
                            if (importance.method === 'AI-Enhanced') {
                                aiAnalyzedCount++;
                                await new Promise(resolve => setTimeout(resolve, 150)); // AI rate limiting
                            }
                            
                            // Smart categorization based on AI score
                            if (importance.score >= 250) {
                                headlines.catastrophic.push(newsItem);
                                console.log(`    🚨 CATASTROPHIC: ${newsItem.headline.substring(0, 60)}... (Score: ${importance.score})`);
                            } else if (importance.score >= 200) {
                                headlines.extreme.push(newsItem);
                                console.log(`    ⚠️ EXTREME: ${newsItem.headline.substring(0, 60)}... (Score: ${importance.score})`);
                            } else if (importance.score >= 150) {
                                headlines.veryHigh.push(newsItem);
                                console.log(`    📈 VERY HIGH: ${newsItem.headline.substring(0, 60)}... (Score: ${importance.score})`);
                            } else if (importance.score >= 100) {
                                headlines.critical.push(newsItem);
                            } else {
                                headlines.breakingNews.push(newsItem);
                            }
                        }
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 800)); // NewsAPI rate limiting
                } catch (error) {
                    console.log(`    ❌ Critical search failed: ${error.message}`);
                }
            }
        }
        
        // PHASE 2: COMPREHENSIVE REGIONAL & SECTORAL INTELLIGENCE
        if (NEWS_API_KEY) {
            console.log('🌍 PHASE 2: Ultra-Comprehensive Regional & Sectoral Analysis...');
            
            const comprehensiveRegionalSearches = [
                // US MARKETS - Ultra-Comprehensive Coverage
                {
                    query: '("S&P 500" OR "Dow Jones" OR "NASDAQ" OR "Russell 2000") AND (record OR high OR low OR milestone OR breakthrough)',
                    category: 'us',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("Federal Reserve" OR "FOMC" OR "Jerome Powell" OR "Fed minutes") AND (decision OR policy OR statement OR meeting)',
                    category: 'us',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("Treasury" OR "yield curve" OR "bond market" OR "10-year treasury") AND (inversion OR spike OR record OR unusual)',
                    category: 'us',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("inflation" OR "CPI" OR "PPI" OR "PCE") AND (data OR report OR surprise OR shock OR record)',
                    category: 'us',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("employment" OR "jobs report" OR "unemployment" OR "payrolls") AND (data OR report OR surprise OR record)',
                    category: 'us',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("GDP" OR "economic growth" OR "recession" OR "expansion") AND (data OR report OR forecast OR warning)',
                    category: 'us',
                    priority: 'high',
                    aiAnalyze: true
                },
                
                // EARNINGS - Ultra-Comprehensive Coverage
                {
                    query: '("earnings" OR "quarterly results") AND ("beat" OR "miss" OR "surprise" OR "guidance") AND (Microsoft OR Apple OR Google OR Amazon)',
                    category: 'earnings',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("earnings" OR "quarterly results") AND ("beat" OR "miss" OR "surprise" OR "guidance") AND (Meta OR Tesla OR Nvidia OR Netflix)',
                    category: 'earnings',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("earnings season" OR "quarterly earnings" OR "Q1 earnings" OR "Q2 earnings" OR "Q3 earnings" OR "Q4 earnings") AND (summary OR outlook OR trends)',
                    category: 'earnings',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("after hours" OR "pre market" OR "extended trading") AND (earnings OR results OR announcement OR guidance)',
                    category: 'earnings',
                    priority: 'high',
                    aiAnalyze: true
                },
                
                // ASIAN MARKETS - Ultra-Comprehensive Coverage  
                {
                    query: '("China" OR "Chinese economy" OR "PBOC" OR "yuan") AND (policy OR regulation OR data OR announcement OR crisis)',
                    category: 'asian',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("Japan" OR "Japanese economy" OR "BOJ" OR "yen" OR "Nikkei") AND (policy OR intervention OR data OR crisis)',
                    category: 'asian',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("South Korea" OR "Taiwan" OR "Hong Kong" OR "Singapore") AND (market OR economy OR policy OR technology OR semiconductor)',
                    category: 'asian',
                    priority: 'high',
                    aiAnalyze: false
                },
                {
                    query: '("India" OR "Indian economy" OR "RBI" OR "rupee") AND (growth OR policy OR reform OR technology)',
                    category: 'asian',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("ASEAN" OR "Southeast Asia" OR "emerging Asia") AND (trade OR growth OR policy OR investment)',
                    category: 'asian',
                    priority: 'medium',
                    aiAnalyze: false
                },
                
                // EUROPEAN MARKETS - Ultra-Comprehensive Coverage
                {
                    query: '("ECB" OR "European Central Bank" OR "Christine Lagarde" OR "euro") AND (policy OR decision OR announcement OR crisis)',
                    category: 'european',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("Brexit" OR "UK economy" OR "Bank of England" OR "pound sterling") AND (deal OR policy OR impact OR crisis)',
                    category: 'european',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("Germany" OR "German economy" OR "Bundesbank" OR "DAX") AND (data OR policy OR industrial OR manufacturing)',
                    category: 'european',
                    priority: 'high',
                    aiAnalyze: false
                },
                {
                    query: '("France" OR "Italy" OR "Spain" OR "Netherlands") AND (economy OR debt OR policy OR election OR crisis)',
                    category: 'european',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("European Union" OR "EU regulation" OR "eurozone") AND (policy OR law OR regulation OR crisis OR recovery)',
                    category: 'european',
                    priority: 'high',
                    aiAnalyze: false
                },
                
                // GEOPOLITICAL - Ultra-Comprehensive Coverage
                {
                    query: '("Russia" OR "Ukraine" OR "Putin") AND (war OR conflict OR sanctions OR energy OR gas OR ceasefire)',
                    category: 'geopolitical',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("China" OR "Taiwan" OR "Xi Jinping") AND (tension OR military OR security OR threat OR strait OR conflict)',
                    category: 'geopolitical',
                    priority: 'critical',
                    aiAnalyze: true
                },
                {
                    query: '("Middle East" OR "Iran" OR "Israel" OR "Saudi Arabia") AND (conflict OR oil OR energy OR security OR nuclear)',
                    category: 'geopolitical',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("North Korea" OR "Kim Jong Un") AND (missile OR nuclear OR threat OR sanctions OR diplomacy)',
                    category: 'geopolitical',
                    priority: 'high',
                    aiAnalyze: false
                },
                {
                    query: '("NATO" OR "alliance" OR "defense") AND (military OR spending OR threat OR Article 5 OR expansion)',
                    category: 'geopolitical',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("trade war" OR "economic warfare" OR "supply chain") AND (China OR Europe OR global OR disruption)',
                    category: 'geopolitical',
                    priority: 'high',
                    aiAnalyze: true
                },
                
                // CURRENCIES - Ultra-Comprehensive Coverage
                {
                    query: '("dollar" OR "DXY" OR "dollar index" OR "USD strength") AND (record OR high OR low OR intervention OR policy)',
                    category: 'currencies',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("euro" OR "EUR/USD" OR "eurozone currency") AND (parity OR intervention OR policy OR crisis OR strength)',
                    category: 'currencies',
                    priority: 'high',
                    aiAnalyze: false
                },
                {
                    query: '("yen" OR "USD/JPY" OR "Japanese yen") AND (intervention OR weakness OR strength OR policy OR record)',
                    category: 'currencies',
                    priority: 'high',
                    aiAnalyze: false
                },
                {
                    query: '("pound" OR "GBP" OR "sterling") AND (strength OR weakness OR Brexit OR policy OR Bank of England)',
                    category: 'currencies',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("yuan" OR "renminbi" OR "CNY") AND (devaluation OR strength OR policy OR capital controls OR PBOC)',
                    category: 'currencies',
                    priority: 'high',
                    aiAnalyze: false
                },
                {
                    query: '("cryptocurrency" OR "bitcoin" OR "ethereum" OR "digital currency") AND (regulation OR policy OR adoption OR crash OR rally)',
                    category: 'currencies',
                    priority: 'medium',
                    aiAnalyze: false
                },
                
                // COMMODITIES - Ultra-Comprehensive Coverage
                {
                    query: '("oil" OR "crude oil" OR "Brent" OR "WTI") AND (price OR production OR OPEC OR inventory OR shortage OR surplus)',
                    category: 'commodities',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("natural gas" OR "gas prices" OR "LNG") AND (shortage OR price OR supply OR demand OR storage OR pipeline)',
                    category: 'commodities',
                    priority: 'high',
                    aiAnalyze: false
                },
                {
                    query: '("gold" OR "precious metals" OR "silver") AND (price OR demand OR supply OR safe haven OR inflation OR record)',
                    category: 'commodities',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("copper" OR "aluminum" OR "steel" OR "industrial metals") AND (price OR demand OR supply OR shortage OR China)',
                    category: 'commodities',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("wheat" OR "corn" OR "soybeans" OR "agricultural") AND (price OR harvest OR weather OR supply OR demand OR food)',
                    category: 'commodities',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("rare earth" OR "lithium" OR "cobalt" OR "critical minerals") AND (shortage OR supply OR demand OR China OR battery)',
                    category: 'commodities',
                    priority: 'high',
                    aiAnalyze: false
                },
                
                // RESEARCH & ANALYSIS - Comprehensive Coverage
                {
                    query: '("research report" OR "analyst report" OR "investment research") AND ("price target" OR "rating change" OR "initiation")',
                    category: 'research',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("upgrade" OR "downgrade" OR "outperform" OR "underperform") AND (analyst OR research OR rating OR target)',
                    category: 'research',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("market outlook" OR "economic forecast" OR "sector analysis") AND (2025 OR forecast OR prediction OR outlook)',
                    category: 'research',
                    priority: 'low',
                    aiAnalyze: false
                },
                
                // SECTOR ROTATION & THEMATIC - New Categories
                {
                    query: '("artificial intelligence" OR "AI stocks" OR "machine learning") AND (breakthrough OR investment OR sector OR growth)',
                    category: 'sectorRotation',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("electric vehicles" OR "EV market" OR "battery technology") AND (growth OR adoption OR policy OR infrastructure)',
                    category: 'sectorRotation',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("renewable energy" OR "clean energy" OR "solar" OR "wind power") AND (policy OR investment OR technology OR growth)',
                    category: 'sectorRotation',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("healthcare" OR "biotech" OR "pharmaceuticals") AND (innovation OR breakthrough OR merger OR regulation)',
                    category: 'sectorRotation',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("fintech" OR "digital payments" OR "blockchain") AND (regulation OR adoption OR innovation OR partnership)',
                    category: 'sectorRotation',
                    priority: 'medium',
                    aiAnalyze: false
                },
                
                // GLOBAL MACRO - New Category
                {
                    query: '("global economy" OR "world economy" OR "international trade") AND (growth OR recession OR recovery OR crisis)',
                    category: 'globalMacro',
                    priority: 'high',
                    aiAnalyze: true
                },
                {
                    query: '("emerging markets" OR "developing countries" OR "frontier markets") AND (crisis OR growth OR investment OR policy)',
                    category: 'globalMacro',
                    priority: 'medium',
                    aiAnalyze: false
                },
                {
                    query: '("IMF" OR "World Bank" OR "OECD") AND (forecast OR warning OR report OR policy OR recommendation)',
                    category: 'globalMacro',
                    priority: 'medium',
                    aiAnalyze: false
                }
            ];
            
            for (const search of comprehensiveRegionalSearches) {
                try {
                    const pageSize = search.priority === 'critical' ? 30 : 
                                   (search.priority === 'high' ? 25 : 
                                    (search.priority === 'medium' ? 20 : 15));
                    
                    console.log(`  🔍 ${search.category.toUpperCase()} (${search.priority}): "${search.query.substring(0, 50)}..."`);
                    
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
                        // AI analyze high-priority articles
                        const articlesToAnalyze = search.aiAnalyze ? 
                            response.data.articles.slice(0, search.priority === 'critical' ? 10 : 5) : [];
                        
                        for (const article of articlesToAnalyze) {
                            const newsItem = {
                                headline: article.title,
                                summary: article.description,
                                source: `NewsAPI ${search.category} - ${article.source.name}`,
                                datetime: new Date(article.publishedAt).toLocaleString(),
                                url: article.url,
                                publishedAt: new Date(article.publishedAt),
                                searchCategory: search.category,
                                searchPriority: search.priority
                            };
                            
                            const importance = await analyzeNewsImportanceWithAI(newsItem);
                            newsItem.priority = importance.score;
                            newsItem.reasoning = importance.reasoning;
                            newsItem.analysisMethod = importance.method;
                            
                            if (importance.method === 'AI-Enhanced') {
                                aiAnalyzedCount++;
                                await new Promise(resolve => setTimeout(resolve, 150));
                            }
                            
                            processedCount++;
                            
                            // Smart categorization based on AI score
                            if (newsItem.priority >= 250) {
                                headlines.catastrophic.push(newsItem);
                            } else if (newsItem.priority >= 200) {
                                headlines.extreme.push(newsItem);
                            } else if (newsItem.priority >= 150) {
                                headlines.veryHigh.push(newsItem);
                            } else if (newsItem.priority >= 100) {
                                headlines.critical.push(newsItem);
                            } else {
                                headlines[search.category].push(newsItem);
                            }
                        }
                        
                        // Add remaining articles with basic scoring
                        const remainingArticles = response.data.articles.slice(articlesToAnalyze.length);
                        for (const article of remainingArticles) {
                            const basicAnalysis = calculateComprehensivePriority(
                                article.title, 
                                article.description, 
                                article.source.name
