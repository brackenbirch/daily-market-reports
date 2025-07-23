import yfinance as yf
import json
import pandas as pd
import numpy as np

def calculate_rsi(prices, window=14):
    """Calculate RSI indicator"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50

def calculate_sma(prices, window):
    """Calculate Simple Moving Average"""
    return prices.rolling(window=window).mean().iloc[-1]

# Expanded instrument list
instruments = {
    # US Equities
    "^GSPC": {"name": "S&P 500", "category": "US_Equity"},
    "^IXIC": {"name": "NASDAQ", "category": "US_Equity"},
    "^DJI": {"name": "Dow Jones", "category": "US_Equity"},
    "^RUT": {"name": "Russell 2000", "category": "US_Equity"},
    "^VIX": {"name": "VIX", "category": "US_Equity"},
    
    # US Sectors
    "XLF": {"name": "Financial Sector", "category": "US_Sector"},
    "XLK": {"name": "Technology Sector", "category": "US_Sector"},
    "XLE": {"name": "Energy Sector", "category": "US_Sector"},
    "XLV": {"name": "Healthcare Sector", "category": "US_Sector"},
    
    # Asian Markets
    "^N225": {"name": "Nikkei 225", "category": "Asian_Equity"},
    "^HSI": {"name": "Hang Seng", "category": "Asian_Equity"},
    "000001.SS": {"name": "Shanghai Composite", "category": "Asian_Equity"},
    "^AXJO": {"name": "ASX 200", "category": "Asian_Equity"},
    "^KS11": {"name": "KOSPI", "category": "Asian_Equity"},
    "^TWII": {"name": "Taiwan Weighted", "category": "Asian_Equity"},
    
    # European Markets
    "^FTSE": {"name": "FTSE 100", "category": "European_Equity"},
    "^GDAXI": {"name": "DAX", "category": "European_Equity"},
    "^FCHI": {"name": "CAC 40", "category": "European_Equity"},
    "^STOXX50E": {"name": "Euro Stoxx 50", "category": "European_Equity"},
    "^AEX": {"name": "AEX", "category": "European_Equity"},
    
    # Major Currencies
    "EURUSD=X": {"name": "EUR/USD", "category": "Currency"},
    "GBPUSD=X": {"name": "GBP/USD", "category": "Currency"},
    "JPY=X": {"name": "USD/JPY", "category": "Currency"},
    "AUDUSD=X": {"name": "AUD/USD", "category": "Currency"},
    "CNY=X": {"name": "USD/CNY", "category": "Currency"},
    "CHF=X": {"name": "USD/CHF", "category": "Currency"},
    "CAD=X": {"name": "USD/CAD", "category": "Currency"},
    
    # Commodities
    "GC=F": {"name": "Gold", "category": "Commodity"},
    "SI=F": {"name": "Silver", "category": "Commodity"},
    "CL=F": {"name": "Crude Oil", "category": "Commodity"},
    "NG=F": {"name": "Natural Gas", "category": "Commodity"},
    "HG=F": {"name": "Copper", "category": "Commodity"},
    
    # Bonds
    "^TNX": {"name": "10Y Treasury", "category": "Bond"},
    "^TYX": {"name": "30Y Treasury", "category": "Bond"},
    "^FVX": {"name": "5Y Treasury", "category": "Bond"},
    "^IRX": {"name": "3M Treasury", "category": "Bond"},
    
    # Crypto (via futures)
    "BTC-USD": {"name": "Bitcoin", "category": "Crypto"},
    "ETH-USD": {"name": "Ethereum", "category": "Crypto"}
}

data = {}
print("Fetching expanded market data with technical analysis...")

for ticker, info in instruments.items():
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="30d")  # Get more data for technical analysis
        
        if len(hist) >= 15:  # Need enough data for calculations
            current = float(hist['Close'].iloc[-1])
            previous = float(hist['Close'].iloc[-2])
            change = current - previous
            change_pct = (change / previous) * 100
            
            # Technical indicators
            sma_20 = calculate_sma(hist['Close'], 20)
            sma_50 = calculate_sma(hist['Close'], 50) if len(hist) >= 50 else sma_20
            rsi = calculate_rsi(hist['Close'])
            
            # Volume analysis (if available)
            volume_avg = hist['Volume'].tail(5).mean() if 'Volume' in hist.columns else 0
            volume_current = hist['Volume'].iloc[-1] if 'Volume' in hist.columns else 0
            
            # Price position relative to moving averages
            above_sma20 = current > sma_20 if not pd.isna(sma_20) else True
            above_sma50 = current > sma_50 if not pd.isna(sma_50) else True
            
            data[info['name']] = {
                'price': round(current, 4 if info['category'] == 'Currency' else 2),
                'change': round(change, 4 if info['category'] == 'Currency' else 2),
                'change_pct': round(change_pct, 2),
                'category': info['category'],
                'sma_20': round(sma_20, 2) if not pd.isna(sma_20) else None,
                'sma_50': round(sma_50, 2) if not pd.isna(sma_50) else None,
                'rsi': round(rsi, 1) if not pd.isna(rsi) else None,
                'above_sma20': above_sma20,
                'above_sma50': above_sma50,
                'volume_ratio': round(volume_current / volume_avg, 2) if volume_avg > 0 else None
            }
            
            print("Success: " + info['name'] + ": " + str(round(current, 2)) + " (" + str(round(change_pct, 2)) + "%, RSI: " + str(round(rsi, 1)) + ")")
    except Exception as e:
        print("Error " + info['name'] + ": " + str(e))

with open('market_data.json', 'w') as f:
    json.dump(data, f, indent=2)
print("Fetched " + str(len(data)) + " instruments with technical analysis")
