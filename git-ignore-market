# git-ignore-market
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env-market
.env-market.local
.env-market.development.local
.env-market.test.local
.env-market.production.local

# Reports and logs
market-reports/*.json
market-reports/raw-data-*.json
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
tmp/
temp/

# Bloomberg API binaries (if installed)
blpapi3_32.dll
blpapi3_64.dll
libblpapi3.so
libblpapi3.dylib

---

# test-setup.js
// Test script to verify all dependencies are working
require('dotenv').config({ path: '.env-market' });

console.log('🔍 Testing Morning Market Report Dependencies...\n');

// Test core dependencies
const dependencies = [
    { name: 'axios', required: true },
    { name: 'nodemailer', required: true },
    { name: 'dotenv', required: true },
    { name: 'blpapi', required: false }
];

let allPassed = true;
let bloombergAvailable = false;

for (const dep of dependencies) {
    try {
        require(dep.name);
        console.log(`✅ ${dep.name} - OK`);
        if (dep.name === 'blpapi') {
            bloombergAvailable = true;
        }
    } catch (error) {
        if (dep.required) {
            console.log(`❌ ${dep.name} - MISSING (Required)`);
            allPassed = false;
        } else {
            console.log(`⚠️  ${dep.name} - Not available (Optional)`);
        }
    }
}

// Test environment variables
console.log('\n🔑 Testing Environment Variables...');

const requiredEnvVars = [
    'ANTHROPIC_API_KEY',
    'GMAIL_USER',
    'GMAIL_PASSWORD',
    'WORK_EMAIL_LIST'
];

const optionalEnvVars = [
    'BLOOMBERG_HOST',
    'BLOOMBERG_PORT',
    'ALPHA_VANTAGE_API_KEY',
    'TWELVE_DATA_API_KEY',
    'NEWS_API_KEY',
    'EXCHANGERATE_API_KEY',
    'FINNHUB_API_KEY'
];

let envPassed = true;

for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
        console.log(`✅ ${envVar} - Set`);
    } else {
        console.log(`❌ ${envVar} - Missing (Required)`);
        envPassed = false;
    }
}

let optionalCount = 0;
for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
        console.log(`✅ ${envVar} - Set`);
        optionalCount++;
    } else {
        console.log(`⚠️  ${envVar} - Not set (Optional)`);
    }
}

// Test Bloomberg connection if available
if (bloombergAvailable && process.env.BLOOMBERG_HOST) {
    console.log('\n🏛️ Testing Bloomberg Connection...');
    
    try {
        const blpapi = require('blpapi');
        const session = new blpapi.Session({
            host: process.env.BLOOMBERG_HOST || '127.0.0.1',
            port: parseInt(process.env.BLOOMBERG_PORT) || 8194
        });
        
        const timeout = setTimeout(() => {
            console.log('⚠️  Bloomberg connection timeout (Terminal may not be running)');
            session.stop();
        }, 5000);
        
        session.on('SessionStarted', function() {
            console.log('✅ Bloomberg connection successful!');
            clearTimeout(timeout);
            session.stop();
        });
        
        session.on('SessionStartupFailure', function() {
            console.log('⚠️  Bloomberg connection failed (Terminal not running or wrong host/port)');
            clearTimeout(timeout);
        });
        
        session.start();
        
    } catch (error) {
        console.log(`⚠️  Bloomberg test failed: ${error.message}`);
    }
} else {
    console.log('\n🏛️ Bloomberg API not available - will use free APIs only');
}

// Summary
console.log('\n📊 Test Summary:');
console.log(`Dependencies: ${allPassed ? '✅ All required dependencies OK' : '❌ Missing required dependencies'}`);
console.log(`Environment: ${envPassed ? '✅ All required variables set' : '❌ Missing required variables'}`);
console.log(`Optional APIs: ${optionalCount}/${optionalEnvVars.length} configured`);
console.log(`Bloomberg: ${bloombergAvailable ? '✅ Available' : '⚠️  Using free APIs only'}`);

if (allPassed && envPassed) {
    console.log('\n🎯 Ready to run market report!');
    console.log('Run: npm run report');
} else {
    console.log('\n❌ Setup incomplete. Please fix the issues above.');
    process.exit(1);
}

---

# env-market.example
# Copy this file to .env-market and fill in your actual API keys

# Bloomberg Connection Settings (if you have Bloomberg Terminal)
BLOOMBERG_HOST=127.0.0.1
BLOOMBERG_PORT=8194
BLOOMBERG_TYPE=DESKTOP

# REQUIRED: AI Report Generation
# Get from: https://console.anthropic.com
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# REQUIRED: Email Delivery
# Use Gmail App Password (not regular password)
# Setup: Google Account → Security → 2-Step Verification → App passwords
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_16_character_app_password
WORK_EMAIL_LIST=recipient1@company.com,recipient2@company.com

# OPTIONAL: Free API Keys (Highly Recommended)
# Alpha Vantage - Free: 25 calls/day
# Get from: https://alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Twelve Data - Free: 800 calls/day
# Get from: https://twelvedata.com
TWELVE_DATA_API_KEY=your_twelve_data_key

# News API - Free: 100 calls/day
# Get from: https://newsapi.org
NEWS_API_KEY=your_news_api_key

# Exchange Rate API - Free: 1500 calls/month
# Get from: https://exchangerate-api.com
EXCHANGERATE_API_KEY=your_exchangerate_key

# Finnhub - Free: 60 calls/minute
# Get from: https://finnhub.io
FINNHUB_API_KEY=your_finnhub_key
