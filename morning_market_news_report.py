#!/usr/bin/env python3
"""
Enhanced Morning Market News Intelligence Report Generator
Automated daily market intelligence and news report for traders
"""

import os
import json
import asyncio
import aiohttp
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import logging
from typing import Dict, List, Any
import anthropic

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketDataCollector:
    """Collects data from multiple financial APIs"""
    
    def __init__(self):
        self.api_keys = {
            'alpha_vantage': os.getenv('ALPHA_VANTAGE_API_KEY'),
            'finnhub': os.getenv('FINNHUB_API_KEY'),
            'news_api': os.getenv('NEWS_API_KEY'),
            'polygon': os.getenv('POLYGON_API_KEY'),
            'twelve_data': os.getenv('TWELVE_DATA_API_KEY'),
            'marketstack': os.getenv('MARKETSTACK_API_KEY'),
            'trading_economics': os.getenv('TRADING_ECONOMICS_API_KEY'),
            'exchangerate': os.getenv('EXCHANGERATE_API_KEY'),
            'fixer': os.getenv('FIXER_API_KEY')
        }
        
    async def get_market_news(self, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """Fetch latest market news from multiple sources"""
        news_data = {}
        
        # News API - Financial news
        if self.api_keys['news_api']:
            try:
                url = f"https://newsapi.org/v2/everything"
                params = {
                    'apiKey': self.api_keys['news_api'],
                    'q': 'market OR economy OR federal reserve OR inflation OR GDP OR unemployment',
                    'sortBy': 'publishedAt',
                    'language': 'en',
                    'pageSize': 20,
                    'from': (datetime.now() - timedelta(hours=24)).strftime('%Y-%m-%d')
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        news_data['general_news'] = data.get('articles', [])
            except Exception as e:
                logger.error(f"Error fetching News API data: {e}")
        
        # Finnhub - Market news
        if self.api_keys['finnhub']:
            try:
                url = f"https://finnhub.io/api/v1/news"
                params = {
                    'token': self.api_keys['finnhub'],
                    'category': 'general',
                    'minId': 0
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        news_data['finnhub_news'] = data[:15] if data else []
            except Exception as e:
                logger.error(f"Error fetching Finnhub news: {e}")
        
        return news_data
    
    async def get_market_indices(self, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """Fetch major market indices data"""
        indices_data = {}
        
        # Major indices symbols
        symbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'EFA', 'EEM']
        
        # Alpha Vantage - Market data
        if self.api_keys['alpha_vantage']:
            try:
                for symbol in symbols[:3]:  # Limit to avoid rate limits
                    url = f"https://www.alphavantage.co/query"
                    params = {
                        'function': 'GLOBAL_QUOTE',
                        'symbol': symbol,
                        'apikey': self.api_keys['alpha_vantage']
                    }
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            if 'Global Quote' in data:
                                indices_data[symbol] = data['Global Quote']
                    await asyncio.sleep(0.5)  # Rate limiting
            except Exception as e:
                logger.error(f"Error fetching Alpha Vantage data: {e}")
        
        # Twelve Data - Additional market data
        if self.api_keys['twelve_data']:
            try:
                symbols_str = ','.join(symbols)
                url = f"https://api.twelvedata.com/quote"
                params = {
                    'symbol': symbols_str,
                    'apikey': self.api_keys['twelve_data']
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        indices_data['twelve_data'] = data
            except Exception as e:
                logger.error(f"Error fetching Twelve Data: {e}")
        
        return indices_data
    
    async def get_economic_data(self, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """Fetch economic indicators and data"""
        economic_data = {}
        
        # Trading Economics API
        if self.api_keys['trading_economics']:
            try:
                # Key economic indicators
                indicators = ['united-states/gdp-growth-rate', 'united-states/inflation-rate', 
                            'united-states/unemployment-rate', 'united-states/interest-rate']
                
                for indicator in indicators:
                    url = f"https://api.tradingeconomics.com/{indicator}"
                    params = {'c': self.api_keys['trading_economics']}
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            economic_data[indicator.split('/')[-1]] = data
                    await asyncio.sleep(0.5)  # Rate limiting
            except Exception as e:
                logger.error(f"Error fetching Trading Economics data: {e}")
        
        return economic_data
    
    async def get_forex_data(self, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """Fetch foreign exchange rates"""
        forex_data = {}
        
        # Fixer API
        if self.api_keys['fixer']:
            try:
                url = f"http://data.fixer.io/api/latest"
                params = {
                    'access_key': self.api_keys['fixer'],
                    'symbols': 'EUR,GBP,JPY,CHF,CAD,AUD,CNY'
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        forex_data['fixer'] = data
            except Exception as e:
                logger.error(f"Error fetching Fixer data: {e}")
        
        # ExchangeRate API
        if self.api_keys['exchangerate']:
            try:
                url = f"https://v6.exchangerate-api.com/v6/{self.api_keys['exchangerate']}/latest/USD"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        forex_data['exchangerate'] = data
            except Exception as e:
                logger.error(f"Error fetching ExchangeRate data: {e}")
        
        return forex_data
    
    async def collect_all_data(self) -> Dict[str, Any]:
        """Collect all market data asynchronously"""
        async with aiohttp.ClientSession() as session:
            tasks = [
                self.get_market_news(session),
                self.get_market_indices(session),
                self.get_economic_data(session),
                self.get_forex_data(session)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            return {
                'news': results[0] if not isinstance(results[0], Exception) else {},
                'indices': results[1] if not isinstance(results[1], Exception) else {},
                'economic': results[2] if not isinstance(results[2], Exception) else {},
                'forex': results[3] if not isinstance(results[3], Exception) else {},
                'timestamp': datetime.now().isoformat()
            }

class ReportGenerator:
    """Generates market report using Claude AI"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    
    def create_professional_prompt(self, market_data: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for Claude to generate the market report"""
        
        prompt = f"""You are a senior financial analyst and market strategist tasked with creating a comprehensive morning market intelligence report for professional traders and investment managers. This report will be distributed at 5:30 AM MST and must provide actionable insights for the trading day ahead.

**REPORT REQUIREMENTS:**
- Professional, concise, and actionable tone suitable for institutional traders
- Focus on market-moving events and their potential trading implications  
- Prioritize information that could impact major asset classes (equities, bonds, currencies, commodities)
- Include both domestic (US) and international market developments
- Provide clear risk assessments and trading considerations
- Format for easy scanning with clear sections and bullet points where appropriate

**DATA PROVIDED:**
The following real-time market data has been collected from multiple financial APIs:

**MARKET NEWS & HEADLINES:**
{json.dumps(market_data.get('news', {}), indent=2)}

**MARKET INDICES & EQUITY DATA:**
{json.dumps(market_data.get('indices', {}), indent=2)}

**ECONOMIC INDICATORS:**
{json.dumps(market_data.get('economic', {}), indent=2)}

**FOREIGN EXCHANGE RATES:**
{json.dumps(market_data.get('forex', {}), indent=2)}

**REPORT STRUCTURE:**
Please structure your report with the following sections:

1. **EXECUTIVE SUMMARY**
   - 2-3 sentences highlighting the most critical market-moving developments
   - Overall market sentiment and key risk factors for today

2. **OVERNIGHT DEVELOPMENTS**
   - Key events from Asian and European markets
   - Any significant after-hours US market movements
   - Central bank communications or policy changes

3. **US MARKET OUTLOOK**
   - Pre-market futures direction and key levels to watch
   - Sector rotation themes and individual stock catalysts
   - Economic data releases scheduled for today and their potential impact

4. **INTERNATIONAL MARKETS**
   - European market performance and key drivers
   - Asian market recap and implications for US trading
   - Emerging market developments of note

5. **CURRENCY & COMMODITIES**
   - USD strength/weakness themes and forex implications
   - Oil, gold, and other commodity movements
   - Interest rate differential impacts

6. **KEY LEVELS & TECHNICAL CONSIDERATIONS**
   - Critical support/resistance levels for major indices
   - Options flow or unusual trading activity if notable
   - Volatility expectations (VIX levels and trends)

7. **ECONOMIC CALENDAR & CATALYSTS**
   - Today's key economic releases and consensus expectations
   - Earnings reports or corporate events that could move markets
   - Federal Reserve or other central bank communications

8. **RISK FACTORS & SCENARIO ANALYSIS**
   - Potential market disruptors or tail risks
   - Geopolitical developments impacting markets
   - Policy or regulatory changes affecting specific sectors

9. **TRADING CONSIDERATIONS**
   - Actionable trade ideas or themes for consideration
   - Sectors or assets showing relative strength/weakness
   - Risk management considerations for current market environment

**IMPORTANT GUIDELINES:**
- Keep the total report length to 1,200-1,500 words for optimal readability
- Use precise financial terminology appropriate for professional traders
- Include specific price levels, percentages, and data points where relevant
- Highlight time-sensitive information that requires immediate attention
- Maintain objectivity while providing clear directional bias where warranted
- Cross-reference multiple data sources when drawing conclusions
- If data appears inconsistent or outdated, note these limitations

**STYLE REQUIREMENTS:**
- Use active voice and present tense
- Bold key terms, price levels, and critical information
- Use bullet points for lists but maintain narrative flow
- Include relevant currency symbols ($ for USD amounts, % for percentages)
- Ensure all recommendations are clearly marked as analysis, not investment advice

Please generate a comprehensive morning market report that professional traders would find valuable for making informed trading decisions today."""

        return prompt
    
    async def generate_report(self, market_data: Dict[str, Any]) -> str:
        """Generate the market report using Claude"""
        try:
            prompt = self.create_professional_prompt(market_data)
            
            message = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=4000,
                temperature=0.3,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            return message.content[0].text
            
        except Exception as e:
            logger.error(f"Error generating report with Claude: {e}")
            return f"Error generating report: {str(e)}"

class EmailSender:
    """Handles email distribution of the market report"""
    
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.username = os.getenv('GMAIL_USER')
        self.password = os.getenv('GMAIL_PASSWORD')
        self.recipient_list = os.getenv('WORK_EMAIL_LIST', '').split(',')
    
    def send_report(self, report_content: str, market_data: Dict[str, Any]) -> bool:
        """Send the market report via email"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = ', '.join(self.recipient_list)
            msg['Subject'] = f"Morning Market News Intelligence Report - {datetime.now().strftime('%B %d, %Y')}"
            
            # Add report content
            body = f"""
            <html>
            <head></head>
            <body>
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h2 style="color: #1f4e79;">Morning Market News Intelligence Report</h2>
            <p style="color: #666;"><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S MST')}</p>
            <hr>
            <pre style="white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6;">
            {report_content}
            </pre>
            <hr>
            <p style="font-size: 12px; color: #888;">
            This report is generated automatically using real-time market data from multiple financial APIs.
            For questions or technical issues, please contact the system administrator.
            </p>
            </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Add data attachment
            data_json = json.dumps(market_data, indent=2)
            attachment = MIMEBase('application', 'json')
            attachment.set_payload(data_json.encode())
            encoders.encode_base64(attachment)
            attachment.add_header(
                'Content-Disposition',
                f'attachment; filename="morning_market_news_data_{datetime.now().strftime("%Y%m%d")}.json"'
            )
            msg.attach(attachment)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"Report sent successfully to {len(self.recipient_list)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False

async def main():
    """Main execution function"""
            logger.info("Starting morning market news intelligence report generation...")
    
    try:
        # Collect market data
        collector = MarketDataCollector()
        market_data = await collector.collect_all_data()
        logger.info("Market data collection completed")
        
        # Generate report
        generator = ReportGenerator()
        report = await generator.generate_report(market_data)
        logger.info("Report generation completed")
        
        # Send email
        sender = EmailSender()
        success = sender.send_report(report, market_data)
        
        if success:
            logger.info("Morning market news intelligence report sent successfully!")
        else:
            logger.error("Failed to send morning market news intelligence report")
            
    except Exception as e:
        logger.error(f"Error in main execution: {e}")

if __name__ == "__main__":
    asyncio.run(main())
