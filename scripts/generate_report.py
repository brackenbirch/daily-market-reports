import anthropic
import json
import os
from datetime import datetime
from tabulate import tabulate

# Load market data
with open('market_data.json', 'r') as f:
    data = json.load(f)

# Create comprehensive market data summary
summary_parts = ["COMPREHENSIVE MARKET DATA WITH TECHNICAL ANALYSIS:", ""]

# Group by categories
categories = {
    "US EQUITY MARKETS": "US_Equity",
    "US SECTOR PERFORMANCE": "US_Sector", 
    "ASIAN EQUITY MARKETS": "Asian_Equity",
    "EUROPEAN EQUITY MARKETS": "European_Equity",
    "MAJOR CURRENCIES": "Currency",
    "COMMODITIES": "Commodity",
    "BOND YIELDS": "Bond",
    "CRYPTOCURRENCY": "Crypto"
}

for category_name, category_key in categories.items():
    category_items = []
    for name, info in data.items():
        if info['category'] == category_key:
            # Enhanced data string with technical indicators
            price_str = str(info['price'])
            change_str = str(info['change_pct']) + "%"
            
            technical_info = ""
            if info.get('rsi'):
                rsi_signal = "Oversold" if info['rsi'] < 30 else "Overbought" if info['rsi'] > 70 else "Neutral"
                technical_info += " RSI:" + str(info['rsi']) + "(" + rsi_signal + ")"
            
            if info.get('above_sma20') is not None:
                ma_signal = "Above MA20" if info['above_sma20'] else "Below MA20"
                technical_info += " " + ma_signal
            
            if info.get('volume_ratio') and info['volume_ratio'] > 1.5:
                technical_info += " HighVol"
            
            line = "- " + name + ": " + price_str + " (" + change_str + ")" + technical_info
            category_items.append(line)
    
    if category_items:
        summary_parts.append(category_name + ":")
        summary_parts.extend(category_items)
        summary_parts.append("")

market_summary = "\n".join(summary_parts)

# Generate enhanced report with Claude
print("Generating comprehensive report with technical analysis...")
client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

prompt_text = """You are a senior financial analyst and portfolio manager creating a comprehensive daily market summary for institutional clients.

""" + market_summary + """

Create a professional, detailed report with these sections:

**EXECUTIVE SUMMARY**
Provide a compelling 4-sentence overview highlighting the most significant market moves, technical signals, and cross-asset themes from the comprehensive data above.

**ASIAN MARKETS OVERNIGHT**
Analyze Asian market performance using the real data and technical indicators:
- Focus on major indices with specific numbers and RSI/moving average signals
- Discuss currency movements and their technical implications
- Highlight any unusual volume or momentum patterns
- Connect to broader themes (central bank policy, trade, earnings)
[Target: 250 words]

**EUROPEAN MARKETS SUMMARY**
Comprehensive European market analysis:
- Cover major indices with technical indicator insights
- Analyze EUR/USD, GBP/USD movements with momentum signals
- Discuss sector rotation evident in the data
- Address ECB policy implications and economic developments
[Target: 250 words]

**US MARKET OUTLOOK**
In-depth US market analysis:
- Detailed analysis of major indices with RSI and moving average signals
- Sector performance analysis using the sector ETF data
- VIX analysis and risk sentiment implications
- Bond market analysis using yield curve data
- Federal Reserve policy considerations
[Target: 300 words]

**COMMODITIES & CURRENCIES DEEP DIVE**
Comprehensive analysis of:
- All commodity moves with technical signals (Gold, Silver, Oil, Gas, Copper)
- Major currency pair analysis with momentum indicators
- Cross-asset implications and risk sentiment themes
- Inflation expectations and monetary policy impacts
[Target: 200 words]

**CRYPTOCURRENCY & ALTERNATIVE ASSETS**
Brief analysis of:
- Bitcoin and Ethereum performance
- Correlation with traditional risk assets
- Technical momentum signals
[Target: 100 words]

**TECHNICAL ANALYSIS SUMMARY**
- Market breadth analysis (how many instruments above/below moving averages)
- RSI signals across asset classes
- Volume patterns and momentum shifts
- Key technical levels to watch
[Target: 150 words]

**KEY TAKEAWAYS & TRADING THEMES**
- 5 bullet points summarizing the most actionable insights
- Focus on cross-asset themes and technical setups
- Include specific levels and signals for portfolio managers

Use the specific numbers, RSI values, and technical signals from the data. Write in sophisticated financial language appropriate for institutional portfolio managers and hedge fund analysts."""

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4000,
    messages=[{"role": "user", "content": prompt_text}]
)

# Create comprehensive report file
os.makedirs('reports', exist_ok=True)
today = datetime.now().strftime('%Y-%m-%d')
filename = 'reports/comprehensive-market-analysis-' + today + '.md'

with open(filename, 'w') as f:
    f.write("# Comprehensive Daily Market Analysis\n")
    current_date = datetime.now().strftime('%A, %B %d, %Y')
    f.write("**" + current_date + "**\n\n")
    f.write("*Professional analysis of " + str(len(data)) + " global instruments with technical indicators*\n\n")
    f.write("---\n\n")
    
    # Add Claude's enhanced analysis
    f.write(response.content[0].text)
    f.write("\n\n---\n\n")
    
    # Add comprehensive data tables
    f.write("## COMPREHENSIVE MARKET DATA TABLES\n\n")
    
    for category_name, category_key in categories.items():
        table_data = []
        for name, info in data.items():
            if info['category'] == category_key:
                price_str = str(info['price'])
                change_str = "+" + str(info['change_pct']) + "%" if info['change_pct'] >= 0 else str(info['change_pct']) + "%"
                rsi_str = str(info['rsi']) if info.get('rsi') else "N/A"
                ma_signal = "Above" if info.get('above_sma20') else "Below" if info.get('above_sma20') is False else "N/A"
                table_data.append([name, price_str, change_str, rsi_str, ma_signal])
        
        if table_data:
            f.write("### " + category_name + "\n\n")
            headers = ['Instrument', 'Level', 'Change %', 'RSI', 'vs MA20']
            table = tabulate(table_data, headers=headers, tablefmt='pipe')
            f.write(table)
            f.write("\n\n")
    
    # Technical analysis summary
    f.write("## TECHNICAL ANALYSIS DASHBOARD\n\n")
    
    # Count instruments by technical signals
    above_ma20 = sum(1 for info in data.values() if info.get('above_sma20') == True)
    below_ma20 = sum(1 for info in data.values() if info.get('above_sma20') == False)
    oversold = sum(1 for info in data.values() if info.get('rsi') and info['rsi'] < 30)
    overbought = sum(1 for info in data.values() if info.get('rsi') and info['rsi'] > 70)
    
    f.write("**Market Breadth:**\n")
    f.write("- Above 20-day MA: " + str(above_ma20) + " instruments\n")
    f.write("- Below 20-day MA: " + str(below_ma20) + " instruments\n")
    f.write("- RSI Oversold (<30): " + str(oversold) + " instruments\n")
    f.write("- RSI Overbought (>70): " + str(overbought) + " instruments\n\n")
    
    # Performance highlights by category
    f.write("## PERFORMANCE HIGHLIGHTS BY ASSET CLASS\n\n")
    
    for category_name, category_key in categories.items():
        category_items = [(name, info) for name, info in data.items() if info['category'] == category_key]
        if category_items:
            sorted_items = sorted(category_items, key=lambda x: x[1]['change_pct'], reverse=True)
            if len(sorted_items) >= 2:
                f.write("**" + category_name + ":**\n")
                f.write("- Best: " + sorted_items[0][0] + " (" + str(sorted_items[0][1]['change_pct']) + "%)\n")
                f.write("- Worst: " + sorted_items[-1][0] + " (" + str(sorted_items[-1][1]['change_pct']) + "%)\n\n")
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    f.write("\n---\n*Comprehensive analysis generated: " + timestamp + "*\n")
    f.write("*Next report: Next business day at 6:00 AM EST*\n")

# Save enhanced info for notifications
top_performer = max(data.items(), key=lambda x: x[1]['change_pct'])
biggest_decline = min(data.items(), key=lambda x: x[1]['change_pct'])

with open('report_info.json', 'w') as f:
    json.dump({
        'filename': filename,
        'count': len(data),
        'top_performer': [top_performer[0], top_performer[1]['change_pct']],
        'biggest_decline': [biggest_decline[0], biggest_decline[1]['change_pct']],
        'above_ma20': above_ma20,
        'below_ma20': below_ma20,
        'oversold': oversold,
        'overbought': overbought
    }, f)

print("Comprehensive report saved: " + filename)
