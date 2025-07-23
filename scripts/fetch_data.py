import yfinance as yf
import json

instruments = {
    "^GSPC": "S&P 500",
    "^IXIC": "NASDAQ", 
    "^DJI": "Dow Jones",
    "^N225": "Nikkei 225",
    "^HSI": "Hang Seng",
    "000001.SS": "Shanghai Composite",
    "^AXJO": "ASX 200",
    "^FTSE": "FTSE 100",
    "^GDAXI": "DAX",
    "^FCHI": "CAC 40",
    "EURUSD=X": "EUR/USD",
    "GBPUSD=X": "GBP/USD",
    "JPY=X": "USD/JPY",
    "GC=F": "Gold",
    "CL=F": "Crude Oil"
}

data = {}
for ticker, name in instruments.items():
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")
        if len(hist) >= 2:
            current = float(hist['Close'].iloc[-1])
            previous = float(hist['Close'].iloc[-2])
            change_pct = ((current - previous) / previous) * 100
            data[name] = {'price': round(current, 2), 'change': round(change_pct, 2)}
            print(f"Success: {name}: {current:.2f} ({change_pct:+.2f}%)")
    except Exception as e:
        print(f"Error {name}: {e}")

with open('market_data.json', 'w') as f:
    json.dump(data, f)
print(f"Fetched {len(data)} instruments")
