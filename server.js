require('dotenv').config();

const express = require('express');
const axios = require('axios');
const KiteConnect = require('kiteconnect').KiteConnect;
const KiteTicker = require('kiteconnect').KiteTicker;
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const KiteAuth = require('./kite-auto-auth');

// Initialize environment variables and create config
function initializeConfig() {
  // Check if we're in production and using env vars
  if (process.env.KITE_API_KEY) {
    console.log('Using environment variables for configuration');
    
    const config = {
      username: process.env.KITE_USERNAME,
      password: process.env.KITE_PASSWORD,
      totpSecret: process.env.KITE_TOTP_SECRET,
      apiKey: process.env.KITE_API_KEY,
      apiSecret: process.env.KITE_API_SECRET
    };

    // Validate required environment variables
    const required = ['KITE_USERNAME', 'KITE_PASSWORD', 'KITE_TOTP_SECRET', 'KITE_API_KEY', 'KITE_API_SECRET'];
    for (const field of required) {
      if (!process.env[field]) {
        throw new Error(`Environment variable ${field} is required`);
      }
    }

    // Try to create config.json, but don't fail if we can't write to filesystem
    try {
      const configPath = path.join(__dirname, 'kite-auto-auth', 'config.json');
      
      // Ensure directory exists
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('Created config.json from environment variables');
    } catch (writeError) {
      console.log('Cannot write config.json (read-only filesystem), using environment variables directly');
      // Store config globally for kite-auto-auth to use
      global.kiteConfig = config;
    }
  } else {
    console.log('Using existing config.json file');
  }
}

// Initialize configuration
initializeConfig();

const app = express();
const PORT = process.env.PORT || 3000;
console.log(`🔧 Using PORT: ${PORT} (from env: ${process.env.PORT})`);

// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://your-domain.com'] // Update with your actual domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

// Store global state
let accessToken = null;
let kite = null;
let ticker = null;
let auctionInstruments = [];
let normalInstruments = [];
let tickData = {};
let auctionTickData = {};

// Initialize Kite authentication
async function initializeAuth() {
  try {
    console.log('Initializing authentication...');
    accessToken = await KiteAuth.login();
    kite = await KiteAuth.getKite();
    console.log('Authentication successful!');
    return true;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
}

// Fetch auction instruments from API
async function fetchAuctionInstruments() {
  try {
    console.log('Fetching auction instruments...');
    const response = await axios.get('https://api.kite.trade/auction_instruments.json');
    
    // Parse NDJSON format (newline delimited JSON)
    const lines = response.data.split('\n').filter(line => line.trim());
    auctionInstruments = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(item => item !== null);
    
    console.log(`Fetched ${auctionInstruments.length} auction instruments`);
    return auctionInstruments;
  } catch (error) {
    console.error('Error fetching auction instruments:', error);
    return [];
  }
}

// Fetch normal market instruments
async function fetchNormalInstruments() {
  try {
    if (!kite) return [];
    console.log('Fetching normal market instruments...');
    normalInstruments = await kite.getInstruments('NSE');
    console.log(`Fetched ${normalInstruments.length} NSE instruments`);
    return normalInstruments;
  } catch (error) {
    console.error('Error fetching normal instruments:', error);
    return [];
  }
}

// Setup WebSocket for real-time data
function setupWebSocket() {
  if (!accessToken) {
    console.error('No access token available for WebSocket');
    return;
  }

  try {
    const config = require('./kite-auto-auth/config.json');
    
    // Ensure accessToken is a string
    const tokenString = typeof accessToken === 'object' ? accessToken.access_token : accessToken;
    
    ticker = new KiteTicker({
      api_key: config.apiKey,
      access_token: tokenString
    });

  ticker.on('connect', () => {
    console.log('WebSocket connected');
    
    // Subscribe to auction instruments
    const auctionTokens = auctionInstruments
      .filter(inst => inst.auction_number)
      .map(inst => inst.instrument_token)
      .filter(token => token);

    // Subscribe to normal instruments (matching names)
    const normalTokens = [];
    auctionInstruments.forEach(auctionInst => {
      const normalInst = normalInstruments.find(n => 
        n.tradingsymbol === auctionInst.tradingsymbol && n.exchange === 'NSE'
      );
      if (normalInst) {
        normalTokens.push(normalInst.instrument_token);
      }
    });

    const allTokens = [...new Set([...auctionTokens, ...normalTokens])];
    
    if (allTokens.length > 0) {
      console.log(`Subscribing to ${allTokens.length} instruments`);
      ticker.subscribe(allTokens);
      ticker.setMode(ticker.modeFull, allTokens);
    }
  });

  ticker.on('ticks', (ticks) => {
    ticks.forEach(tick => {
      const token = tick.instrument_token;
      
      // Check if this is an auction instrument
      const auctionInst = auctionInstruments.find(inst => inst.instrument_token === token);
      if (auctionInst) {
        auctionTickData[token] = tick;
      } else {
        // Normal market tick
        tickData[token] = tick;
      }
    });
  });

  ticker.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ticker.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  ticker.connect();
  } catch (error) {
    console.error('WebSocket setup error:', error);
  }
}

// API Endpoints
app.get('/api/status', (req, res) => {
  try {
    res.json({
      authenticated: !!accessToken,
      auctionInstruments: auctionInstruments?.length || 0,
      normalInstruments: normalInstruments?.length || 0,
      websocketConnected: ticker && ticker.connected,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed', message: error.message });
  }
});

// Test auction quotes endpoint
app.get('/api/test-auction-quotes', async (req, res) => {
  if (!kite) {
    return res.status(400).json({ error: 'Not authenticated' });
  }
  
  try {
    // Try to fetch quotes for first 3 auction instruments
    const testAuctionInsts = auctionInstruments.slice(0, 3);
    const auctionQuotes = {};
    
    for (const auction of testAuctionInsts) {
      try {
        // Try different formats to get auction quotes
        const formats = [
          auction.instrument_token,
          `NSE:${auction.tradingsymbol}`,
          auction.id
        ];
        
        for (const format of formats) {
          try {
            console.log(`Trying to fetch auction quote for ${auction.tradingsymbol} using format: ${format}`);
            const quote = await kite.getQuote([format]);
            if (quote && Object.keys(quote).length > 0) {
              auctionQuotes[auction.tradingsymbol] = {
                format_used: format,
                quote: Object.values(quote)[0],
                has_depth: !!Object.values(quote)[0]?.depth
              };
              console.log(`Success! Got auction quote for ${auction.tradingsymbol}`);
              break;
            }
          } catch (err) {
            console.log(`Format ${format} failed:`, err.message);
          }
        }
      } catch (error) {
        auctionQuotes[auction.tradingsymbol] = { error: error.message };
      }
    }
    
    res.json({
      auction_quotes: auctionQuotes,
      total_attempted: testAuctionInsts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to see actual data
app.get('/api/debug', (req, res) => {
  // Get first 5 auction instruments as sample
  const sampleAuction = auctionInstruments.slice(0, 5);
  
  const debugData = sampleAuction.map(auction => {
    const normalInst = normalInstruments.find(n => 
      n.tradingsymbol === auction.tradingsymbol && n.exchange === 'NSE'
    );
    
    return {
      symbol: auction.tradingsymbol,
      auction_data: {
        instrument_token: auction.instrument_token,
        auction_number: auction.auction_number,
        max_order_quantity: auction.max_order_quantity,
        last_price: auction.last_price
      },
      normal_instrument: normalInst ? {
        instrument_token: normalInst.instrument_token,
        last_price: normalInst.last_price,
        tradingsymbol: normalInst.tradingsymbol
      } : null,
      auction_tick: auctionTickData[auction.instrument_token] || 'No tick data',
      normal_tick: normalInst ? (tickData[normalInst.instrument_token] || 'No tick data') : 'No normal instrument'
    };
  });
  
  res.json({
    sample_data: debugData,
    tick_data_count: Object.keys(tickData).length,
    auction_tick_count: Object.keys(auctionTickData).length,
    first_tick: Object.values(tickData)[0] || null
  });
});

app.get('/api/auction-data', async (req, res) => {
  try {
    // Fetch quotes for instruments that don't have tick data
    if (kite && auctionInstruments.length > 0) {
      try {
        // Find normal instruments that don't have tick data
        const missingTickInstruments = [];
        auctionInstruments.forEach(auctionInst => {
          const normalInst = normalInstruments.find(n => 
            n.tradingsymbol === auctionInst.tradingsymbol && n.exchange === 'NSE'
          );
          if (normalInst && !tickData[normalInst.instrument_token]) {
            missingTickInstruments.push(`NSE:${normalInst.tradingsymbol}`);
          }
        });
        
        // Also fetch quotes for auction instruments that don't have tick data
        const missingAuctionInstruments = [];
        auctionInstruments.forEach(auctionInst => {
          if (!auctionTickData[auctionInst.instrument_token]) {
            missingAuctionInstruments.push(auctionInst.instrument_token);
          }
        });
        
        // Fetch quotes in batches of 50 (API limit)
        if (missingTickInstruments.length > 0) {
          const batchSize = 50;
          for (let i = 0; i < missingTickInstruments.length; i += batchSize) {
            const batch = missingTickInstruments.slice(i, i + batchSize);
            try {
              const quotes = await kite.getQuote(batch);
              console.log(`Fetched quotes for ${Object.keys(quotes).length} instruments (batch ${Math.floor(i/batchSize) + 1})`);
              
              // Store quote data as tick data
              Object.entries(quotes).forEach(([key, quote]) => {
                if (quote && quote.instrument_token) {
                  tickData[quote.instrument_token] = quote;
                }
              });
            } catch (batchErr) {
              console.log(`Error fetching batch ${Math.floor(i/batchSize) + 1}:`, batchErr.message);
            }
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < missingTickInstruments.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
        
        // Fetch auction instrument quotes in batches
        if (missingAuctionInstruments.length > 0) {
          const batchSize = 50;
          for (let i = 0; i < missingAuctionInstruments.length; i += batchSize) {
            const batch = missingAuctionInstruments.slice(i, i + batchSize);
            try {
              const quotes = await kite.getQuote(batch);
              console.log(`Fetched auction quotes for ${Object.keys(quotes).length} instruments (batch ${Math.floor(i/batchSize) + 1})`);
              
              // Store quote data as auction tick data
              Object.entries(quotes).forEach(([key, quote]) => {
                if (quote && quote.instrument_token) {
                  auctionTickData[quote.instrument_token] = quote;
                }
              });
            } catch (batchErr) {
              console.log(`Error fetching auction batch ${Math.floor(i/batchSize) + 1}:`, batchErr.message);
            }
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < missingAuctionInstruments.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      } catch (err) {
        console.log('Could not fetch quotes:', err.message);
      }
    }

    // Combine auction instruments with tick data
    const data = auctionInstruments.map(auctionInst => {
      // Find matching normal instrument
      const normalInst = normalInstruments.find(n => 
        n.tradingsymbol === auctionInst.tradingsymbol && n.exchange === 'NSE'
      );

      // Get auction tick data
      const auctionTick = auctionTickData[auctionInst.instrument_token] || {};
      
      // Get normal market tick data or quote data
      const normalTick = normalInst ? (tickData[normalInst.instrument_token] || {}) : {};

      // Calculate best offer from auction depth (lowest selling price)
      // Note: In auctions, we want the best offer (selling price), not bid (buying price)
      let auctionBestOffer = 0;
      
      // Check sell orders for best offer (lowest price with quantity > 0)
      if (auctionTick.depth?.sell) {
        for (const sellOrder of auctionTick.depth.sell) {
          if (sellOrder.price > 0 && sellOrder.quantity > 0) {
            auctionBestOffer = sellOrder.price;
            break; // First valid order is the best offer
          }
        }
      }
      
      // If still no offer, fallback to other price sources
      if (auctionBestOffer === 0) {
        auctionBestOffer = auctionTick.last_price || 
                          auctionTick.ohlc?.close ||
                          auctionInst.last_price || 
                          0;
      }
      
      // Get LTP from normal market (or use last_price/close from various sources)
      const normalLTP = normalTick.last_price || 
                       normalTick.ohlc?.close ||
                       normalTick.close_price || 
                       normalInst?.last_price || 
                       auctionInst.last_price || 
                       0;

      // Calculate percentage difference
      let percentDiff = 0;
      if (normalLTP > 0 && auctionBestOffer > 0) {
        percentDiff = ((auctionBestOffer - normalLTP) / normalLTP) * 100;
      }

      return {
        symbol: auctionInst.tradingsymbol,
        exchange: auctionInst.exchange,
        auctionNumber: auctionInst.auction_number,
        quantity: auctionInst.max_order_quantity || 0,
        auctionBestBid: auctionBestOffer,
        normalLTP: normalLTP,
        percentDiff: percentDiff,
        auctionValue: (auctionInst.max_order_quantity || 0) * normalLTP,
        instrumentToken: auctionInst.instrument_token,
        normalToken: normalInst?.instrument_token
      };
    });

    // Sort by percentage difference (highest first)
    data.sort((a, b) => Math.abs(b.percentDiff) - Math.abs(a.percentDiff));

    res.json(data);
  } catch (error) {
    console.error('Error preparing auction data:', error);
    res.status(500).json({ error: 'Failed to prepare auction data' });
  }
});

app.get('/api/initialize', async (req, res) => {
  try {
    const authSuccess = await initializeAuth();
    if (!authSuccess) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    await fetchAuctionInstruments();
    await fetchNormalInstruments();
    setupWebSocket();

    res.json({ success: true, message: 'Initialization complete' });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`🚀 NSE Auction Tracker running on port ${PORT}`);
  
  if (isProduction) {
    console.log('🌐 Production mode - Server ready for hosting');
  } else {
    console.log(`🛠  Development mode - Open http://localhost:${PORT} in your browser`);
    console.log('📱 Click "Initialize" button to start authentication');
  }
});