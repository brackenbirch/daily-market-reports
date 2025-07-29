// Enhanced Bloomberg API Manager with proper error handling and data fetching
class BloombergAPIManager {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.services = { mktdata: false, refdata: false };
        this.dataCache = {};
        this.connectionTimeout = 15000; // 15 seconds
    }

    async initialize() {
        if (!blpapi) {
            console.log('🔄 Bloomberg API not available, skipping Bloomberg initialization');
            return false;
        }

        try {
            console.log('🔄 Initializing Bloomberg API connection...');
            
            this.session = new blpapi.Session({
                host: BLOOMBERG_HOST,
                port: parseInt(BLOOMBERG_PORT)
            });

            // Set up event handlers with proper error handling
            this.session.on('SessionStarted', () => {
                console.log('✅ Bloomberg session started');
                this.isConnected = true;
                this.openServices();
            });

            this.session.on('ServiceOpened', (message) => {
                console.log(`✅ Bloomberg service opened: ${message.serviceName}`);
                if (message.serviceName === '//blp/mktdata') this.services.mktdata = true;
                if (message.serviceName === '//blp/refdata') this.services.refdata = true;
            });

            this.session.on('SessionTerminated', () => {
                console.log('❌ Bloomberg session terminated');
                this.isConnected = false;
                this.services = { mktdata: false, refdata: false };
            });

            // Add error handling
            this.session.on('SessionStartupFailure', (error) => {
                console.log(`❌ Bloomberg session startup failed: ${error.message}`);
                this.isConnected = false;
            });

            this.session.on('ServiceOpenFailure', (error) => {
                console.log(`❌ Bloomberg service open failed: ${error.message}`);
            });

            // Start session
            await this.session.start();
            
            // Wait for connection with timeout
            const connected = await this.waitForConnection(this.connectionTimeout);
            
            if (!connected) {
                console.log('❌ Bloomberg connection timeout - check if Bloomberg Terminal is running');
                return false;
            }

            console.log('✅ Bloomberg API fully initialized');
            return true;

        } catch (error) {
            console.log(`❌ Bloomberg initialization failed: ${error.message}`);
            console.log('💡 Ensure Bloomberg Terminal/API is running and accessible');
            return false;
        }
    }

    async waitForConnection(timeout = 15000) {
        return new Promise((resolve) => {
            let resolved = false;
            
            const checkConnection = () => {
                if (resolved) return;
                
                if (this.isConnected && this.services.mktdata && this.services.refdata) {
                    resolved = true;
                    resolve(true);
                }
            };

            const interval = setInterval(checkConnection, 500);
            
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    clearInterval(interval);
                    console.log('⚠️ Bloomberg connection timeout');
                    resolve(false);
                }
            }, timeout);
        });
    }

    openServices() {
        if (!this.session || !this.isConnected) {
            console.log('❌ Cannot open services - session not ready');
            return;
        }
        
        try {
            console.log('🔄 Opening Bloomberg services...');
            this.session.openService('//blp/mktdata');
            this.session.openService('//blp/refdata');
        } catch (error) {
            console.log(`❌ Error opening Bloomberg services: ${error.message}`);
        }
    }

    // Real Bloomberg data fetching methods
    async getFuturesData() {
        if (!this.isConnected || !this.services.refdata) {
            throw new Error('Bloomberg not connected or refdata service unavailable');
        }

        return new Promise((resolve, reject) => {
            try {
                const request = this.session.request('//blp/refdata', 'ReferenceDataRequest');
                
                // Major index futures symbols
                const futures = ['ES1 Index', 'NQ1 Index', 'YM1 Index', 'RTY1 Index'];
                const fields = ['PX_LAST', 'CHG_NET_1D', 'CHG_PCT_1D', 'VOLUME'];
                
                request.set('securities', futures);
                request.set('fields', fields);
                
                const futuresData = {};
                
                this.session.on('PartialResponse', (message) => {
                    const securityDataArray = message.getElement('securityData');
                    
                    for (let i = 0; i < securityDataArray.numValues(); i++) {
                        const securityData = securityDataArray.getValueAsElement(i);
                        const security = securityData.getElementAsString('security');
                        const fieldData = securityData.getElement('fieldData');
                        
                        futuresData[security] = {};
                        
                        fields.forEach(field => {
                            if (fieldData.hasElement(field)) {
                                futuresData[security][field] = fieldData.getElementAsString(field);
                            }
                        });
                    }
                });
                
                this.session.on('Response', () => {
                    resolve(futuresData);
                });
                
                this.session.sendRequest(request);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    reject(new Error('Bloomberg futures request timeout'));
                }, 10000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async getSectorData() {
        if (!this.isConnected || !this.services.refdata) {
            throw new Error('Bloomberg not connected or refdata service unavailable');
        }

        return new Promise((resolve, reject) => {
            try {
                const request = this.session.request('//blp/refdata', 'ReferenceDataRequest');
                
                // Sector ETFs
                const sectors = ['XLF US Equity', 'XLK US Equity', 'XLE US Equity', 'XLV US Equity', 
                               'XLI US Equity', 'XLY US Equity', 'XLP US Equity', 'XLU US Equity', 'XLB US Equity'];
                const fields = ['PX_LAST', 'CHG_NET_1D', 'CHG_PCT_1D', 'VOLUME'];
                
                request.set('securities', sectors);
                request.set('fields', fields);
                
                const sectorData = {};
                
                this.session.on('PartialResponse', (message) => {
                    const securityDataArray = message.getElement('securityData');
                    
                    for (let i = 0; i < securityDataArray.numValues(); i++) {
                        const securityData = securityDataArray.getValueAsElement(i);
                        const security = securityData.getElementAsString('security');
                        const fieldData = securityData.getElement('fieldData');
                        
                        sectorData[security] = {};
                        
                        fields.forEach(field => {
                            if (fieldData.hasElement(field)) {
                                sectorData[security][field] = fieldData.getElementAsString(field);
                            }
                        });
                    }
                });
                
                this.session.on('Response', () => {
                    resolve(sectorData);
                });
                
                this.session.sendRequest(request);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    reject(new Error('Bloomberg sector request timeout'));
                }, 10000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async getCurrencyData() {
        if (!this.isConnected || !this.services.refdata) {
            throw new Error('Bloomberg not connected or refdata service unavailable');
        }

        return new Promise((resolve, reject) => {
            try {
                const request = this.session.request('//blp/refdata', 'ReferenceDataRequest');
                
                // Major currency pairs
                const currencies = ['EURUSD Curncy', 'GBPUSD Curncy', 'USDJPY Curncy', 'AUDUSD Curncy', 'USDCAD Curncy'];
                const fields = ['PX_LAST', 'CHG_NET_1D', 'CHG_PCT_1D'];
                
                request.set('securities', currencies);
                request.set('fields', fields);
                
                const currencyData = {};
                
                this.session.on('PartialResponse', (message) => {
                    const securityDataArray = message.getElement('securityData');
                    
                    for (let i = 0; i < securityDataArray.numValues(); i++) {
                        const securityData = securityDataArray.getValueAsElement(i);
                        const security = securityData.getElementAsString('security');
                        const fieldData = securityData.getElement('fieldData');
                        
                        currencyData[security] = {};
                        
                        fields.forEach(field => {
                            if (fieldData.hasElement(field)) {
                                currencyData[security][field] = fieldData.getElementAsString(field);
                            }
                        });
                    }
                });
                
                this.session.on('Response', () => {
                    resolve(currencyData);
                });
                
                this.session.sendRequest(request);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    reject(new Error('Bloomberg currency request timeout'));
                }, 10000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async disconnect() {
        if (this.session && this.isConnected) {
            try {
                await this.session.stop();
                console.log('✅ Bloomberg session disconnected');
                this.isConnected = false;
                this.services = { mktdata: false, refdata: false };
            } catch (error) {
                console.log(`❌ Error disconnecting Bloomberg: ${error.message}`);
            }
        }
    }
}

// Updated hybrid futures data function
async function fetchHybridFuturesData(bloomberg) {
    console.log('📈 Fetching futures data...');
    let futuresData = {};
    
    // Try Bloomberg first
    if (bloomberg && bloomberg.isConnected) {
        try {
            console.log('🔄 Fetching Bloomberg futures data...');
            const bloombergFutures = await bloomberg.getFuturesData();
            
            // Transform Bloomberg data to consistent format
            Object.entries(bloombergFutures).forEach(([symbol, data]) => {
                const cleanSymbol = symbol.replace(' Index', '').replace('1', '');
                futuresData[cleanSymbol] = {
                    price: data.PX_LAST ? `$${parseFloat(data.PX_LAST).toFixed(2)}` : 'N/A',
                    change: data.CHG_NET_1D ? (parseFloat(data.CHG_NET_1D) >= 0 ? '+' : '') + parseFloat(data.CHG_NET_1D).toFixed(2) : 'N/A',
                    changePercent: data.CHG_PCT_1D ? (parseFloat(data.CHG_PCT_1D) >= 0 ? '+' : '') + parseFloat(data.CHG_PCT_1D).toFixed(2) + '%' : 'N/A',
                    volume: data.VOLUME || 'N/A',
                    source: 'Bloomberg',
                    session: 'Real-time'
                };
            });
            
            console.log(`✅ Bloomberg futures data retrieved: ${Object.keys(futuresData).length} instruments`);
            return futuresData;
            
        } catch (error) {
            console.log(`❌ Bloomberg futures failed: ${error.message}`);
        }
    }
    
    // Fallback to standard APIs if Bloomberg fails
    if (Object.keys(futuresData).length === 0 && ALPHA_VANTAGE_API_KEY) {
        console.log('🔄 Using Alpha Vantage for futures proxy data...');
        
        const majorETFs = ['SPY', 'QQQ', 'DIA', 'IWM']; // ETF proxies for futures
        
        for (const symbol of majorETFs) {
            try {
                const response = await makeAPICall(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                    {},
                    'alphavantage'
                );
                
                if (response['Global Quote']) {
                    const quote = response['Global Quote'];
                    futuresData[symbol] = {
                        price: `$${parseFloat(quote['05. price']).toFixed(2)}`,
                        change: (parseFloat(quote['09. change']) >= 0 ? '+' : '') + parseFloat(quote['09. change']).toFixed(2),
                        changePercent: quote['10. change percent'].replace('%', '') + '%',
                        volume: quote['06. volume'],
                        source: 'Alpha Vantage',
                        session: 'Extended Hours'
                    };
                }
                
                await new Promise(resolve => setTimeout(resolve, 12000)); // Rate limiting
                
            } catch (error) {
                console.log(`Failed to fetch futures proxy data for ${symbol}:`, error.message);
            }
        }
    }
    
    return futuresData;
}

// Updated hybrid sector data function
async function fetchOvernightSectors(bloomberg) {
    console.log('📊 Fetching sector data...');
    let sectorData = {};
    
    // Try Bloomberg first
    if (bloomberg && bloomberg.isConnected) {
        try {
            console.log('🔄 Fetching Bloomberg sector data...');
            const bloombergSectors = await bloomberg.getSectorData();
            
            // Transform Bloomberg data to consistent format
            Object.entries(bloombergSectors).forEach(([symbol, data]) => {
                const cleanSymbol = symbol.replace(' US Equity', '');
                sectorData[cleanSymbol] = {
                    price: data.PX_LAST ? `$${parseFloat(data.PX_LAST).toFixed(2)}` : 'N/A',
                    change: data.CHG_NET_1D ? (parseFloat(data.CHG_NET_1D) >= 0 ? '+' : '') + parseFloat(data.CHG_NET_1D).toFixed(2) : 'N/A',
                    changePercent: data.CHG_PCT_1D ? (parseFloat(data.CHG_PCT_1D) >= 0 ? '+' : '') + parseFloat(data.CHG_PCT_1D).toFixed(2) + '%' : 'N/A',
                    volume: data.VOLUME || 'N/A',
                    name: getSectorName(cleanSymbol),
                    source: 'Bloomberg',
                    session: 'Real-time'
                };
            });
            
            console.log(`✅ Bloomberg sector data retrieved: ${Object.keys(sectorData).length} sectors`);
            return sectorData;
            
        } catch (error) {
            console.log(`❌ Bloomberg sectors failed: ${error.message}`);
        }
    }
    
    // Fallback to standard APIs
    if (Object.keys(sectorData).length === 0 && ALPHA_VANTAGE_API_KEY) {
        console.log('🔄 Using Alpha Vantage for sector data...');
        
        const sectorETFs = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLB'];
        
        for (const etf of sectorETFs) {
            try {
                const response = await makeAPICall(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${ALPHA_VANTAGE_API_KEY}`,
                    {},
                    'alphavantage'
                );
                
                if (response['Global Quote']) {
                    const quote = response['Global Quote'];
                    sectorData[etf] = {
                        price: `$${parseFloat(quote['05. price']).toFixed(2)}`,
                        change: (parseFloat(quote['09. change']) >= 0 ? '+' : '') + parseFloat(quote['09. change']).toFixed(2),
                        changePercent: quote['10. change percent'].replace('%', '') + '%',
                        volume: quote['06. volume'],
                        name: getSectorName(etf),
                        source: 'Alpha Vantage',
                        session: 'Extended Hours'
                    };
                }
                
                await new Promise(resolve => setTimeout(resolve, 12000));
                
            } catch (error) {
                console.log(`Failed to fetch sector data for ${etf}:`, error.message);
            }
        }
    }
    
    // Generate sample data if no real data retrieved
    if (Object.keys(sectorData).length === 0) {
        console.log('⚠️ Generating sample sector data...');
        sectorData = generateOvernightSectors();
    }
    
    return sectorData;
}

// Updated currency data function
async function fetchCurrencyMoves(bloomberg) {
    console.log('💱 Fetching currency data...');
    let currencyData = {};
    
    // Try Bloomberg first
    if (bloomberg && bloomberg.isConnected) {
        try {
            console.log('🔄 Fetching Bloomberg currency data...');
            const bloombergCurrencies = await bloomberg.getCurrencyData();
            
            // Transform Bloomberg data to consistent format
            Object.entries(bloombergCurrencies).forEach(([symbol, data]) => {
                const cleanSymbol = symbol.replace(' Curncy', '');
                currencyData[cleanSymbol] = {
                    rate: data.PX_LAST ? parseFloat(data.PX_LAST).toFixed(4) : 'N/A',
                    change: data.CHG_NET_1D ? (parseFloat(data.CHG_NET_1D) >= 0 ? '+' : '') + parseFloat(data.CHG_NET_1D).toFixed(4) : 'N/A',
                    changePercent: data.CHG_PCT_1D ? (parseFloat(data.CHG_PCT_1D) >= 0 ? '+' : '') + parseFloat(data.CHG_PCT_1D).toFixed(2) + '%' : 'N/A',
                    source: 'Bloomberg',
                    session: 'Real-time',
                    lastRefreshed: new Date().toISOString()
                };
            });
            
            console.log(`✅ Bloomberg currency data retrieved: ${Object.keys(currencyData).length} pairs`);
            return currencyData;
            
        } catch (error) {
            console.log(`❌ Bloomberg currency failed: ${error.message}`);
        }
    }
    
    // Fallback to standard APIs (existing logic)
    if (Object.keys(currencyData).length === 0) {
        if (EXCHANGERATE_API_KEY) {
            try {
                const response = await makeAPICall(
                    `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`,
                    {},
                    'exchangerate'
                );
                
                if (response && response.conversion_rates) {
                    const rates = response.conversion_rates;
                    currencyData['EURUSD'] = {
                        rate: (1 / rates.EUR).toFixed(4),
                        lastRefreshed: response.time_last_update_utc,
                        source: 'ExchangeRate-API',
                        session: 'Overnight'
                    };
                    currencyData['GBPUSD'] = {
                        rate: (1 / rates.GBP).toFixed(4),
                        lastRefreshed: response.time_last_update_utc,
                        source: 'ExchangeRate-API',
                        session: 'Overnight'
                    };
                    currencyData['USDJPY'] = {
                        rate: rates.JPY.toFixed(2),
                        lastRefreshed: response.time_last_update_utc,
                        source: 'ExchangeRate-API',
                        session: 'Overnight'
                    };
                }
            } catch (error) {
                console.log('ExchangeRate API failed:', error.message);
            }
        }
    }
    
    return currencyData;
}
