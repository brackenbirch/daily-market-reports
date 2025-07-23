import anthropic
import json
import os
from datetime import datetime
from tabulate import tabulate

# Load market data
with open('market_data.json', 'r') as f:
    data = json.load(f)

# Create market data summary
summary_parts = ["CURRENT MARKET DATA:", ""]

groups = [
    ("US MARKETS", ["S&P 500", "NASDAQ", "Dow Jones"]),
    ("ASIAN MARKETS", ["Nikkei 225", "Hang Seng", "Shanghai Composite", "ASX 200"]),
    ("EUROPEAN MARKETS", ["FTSE 100", "DAX", "CAC 40"]),
    ("CURRENCIES", ["EUR/USD", "GBP/USD", "USD/JPY"]),
    ("COMMODITIES", ["Gold", "Crude Oil"])
]

for group_name, instruments in groups:
    summary_parts.append(group_name + ":")
    for instrument in instruments:
        if instrument in data:
            info = data[instrument]
            line = "- " + instrument + ": " + str(info['price']) + " (" + str(info['change']) + "%)"
            summary_parts.append(line)
    summary_parts.append("")

market_summary = "\n".join(summary_parts)

# Generate report with Claude
print("Generating report with Claude...")
client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

prompt_text = "You are a senior financial analyst. Create a professional daily market summary using this data:\n\n"
prompt_text += market_summary
prompt_text += "\n\nInclude sections: EXECUTIVE SUMMARY, ASIAN MARKETS OVERNIGHT, EUROPEAN MARKETS SUMMARY, US MARKET OUTLOOK, CURRENCY & COMMODITIES WATCH, KEY TAKEAWAYS. Use sophisticated financial language for institutional clients."

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4000,
    messages=[{"role": "user", "content": prompt_text}]
)

# Create enhanced report file
os.makedirs('reports', exist_ok=True)
today = datetime.now().strftime('%Y-%m-%d')
filename = f'reports/market-summary-{today}.md'

with open(filename, 'w') as f:
    f.write("# Enhanced Daily Market Summary\n")
    f.write(f"**{datetime.now().strftime('%A, %B %d, %Y')}**\n\n")
    f.write(f"*Analysis of {len(data)} global instruments*\n\n")
    f.write("---\n\n")
    f.write(response.content[0].text)
    f.write("\n\n---\n\n")
    f.write("## MARKET DATA TABLES\n\n")
    
    for title, instruments in groups:
        table_data = []
        for instrument in instruments:
            if instrument in data:
                info = data[instrument]
                table_data.append([instrument, f"{info['price']:.2f}", f"{info['change']:+.2f}%"])
        
        if table_data:
            f.write(f"### {title}\n\n")
            headers = ['Instrument', 'Level', 'Change %']
            table = tabulate(table_data, headers=headers, tablefmt='pipe')
            f.write(table)
            f.write("\n\n")
    
    f.write(f"\n*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}*\n")

# Save info for GitHub issue
with open('report_info.json', 'w') as f:
    json.dump({'filename': filename, 'count': len(data)}, f)

print(f"Report saved: {filename}")
