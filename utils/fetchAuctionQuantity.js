const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to get today's date in DDMMYYYY format
function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}${month}${year}`;
}

// Function to get settlement number (this is typically based on the date)
function getSettlementNumber() {
  // NSE settlement numbers are in format: YYYYNNN where NNN is a sequence
  // For now, using the pattern you've confirmed works
  // TODO: Implement dynamic logic to calculate the correct sequence
  return '2026050';
}

// Function to fetch auction quantity file from NSE
async function fetchAuctionQuantityFile() {
  try {
    console.log('🔄 Fetching auction quantity from NSE...');
    
    // Step 1: Get cookies from the main page
    const cookieResponse = await axios.get(
      'https://www.nseindia.com/market-data/securities-available-for-trading',
      {
        headers: {
          'authority': 'www.nseindia.com',
          'accept': '*/*',
          'accept-language': 'en',
          'dnt': '1',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest'
        }
      }
    );
    
    // Extract cookies from response
    const cookies = cookieResponse.headers['set-cookie']
      ?.map(cookie => cookie.split(';')[0])
      .join('; ') || '';
    
    console.log('✅ Got NSE cookies');
    
    // Step 2: Build the auction file URL
    const dateStr = getTodayDate();
    const settlementNum = getSettlementNumber();
    const auctionFileUrl = `https://nsearchives.nseindia.com/content/nsccl/AUB_${settlementNum}_${dateStr}.csv`;
    
    console.log(`📎 Fetching auction file: ${auctionFileUrl}`);
    
    // Step 3: Fetch the auction file with cookies
    const fileResponse = await axios.get(auctionFileUrl, {
      headers: {
        'authority': 'www.nseindia.com',
        'accept': '*/*',
        'accept-language': 'en',
        'dnt': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookies
      },
      responseType: 'text'
    });
    
    // Step 4: Parse the CSV data
    const csvData = fileResponse.data;
    const lines = csvData.split('\n');
    const auctionQuantities = {};
    
    // Parse CSV format: Sr No, Symbol, Series, Total Qty
    // Skip first two lines (title and header)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length >= 4) {
        const symbol = parts[1].trim().replace(/"/g, ''); // Symbol is in column 1
        const quantity = parseInt(parts[3].trim().replace(/"/g, ''), 10) || 0; // Total Qty is in column 3
        auctionQuantities[symbol] = quantity;
      }
    }
    
    console.log(`✅ Fetched auction quantities for ${Object.keys(auctionQuantities).length} symbols`);
    return auctionQuantities;
    
  } catch (error) {
    console.error('❌ Failed to fetch auction quantity file:', error.message);
    
    // Try alternative URLs with different settlement numbers if first fails
    if (error.response?.status === 404) {
      console.log('🔄 Trying alternative settlement number...');
      // You can implement fallback logic here
    }
    
    return {};
  }
}

// Function to get auction quantity for a specific symbol
function getAuctionQuantity(symbol, auctionQuantities) {
  return auctionQuantities[symbol] || 0;
}

module.exports = {
  fetchAuctionQuantityFile,
  getAuctionQuantity,
  getTodayDate,
  getSettlementNumber
};