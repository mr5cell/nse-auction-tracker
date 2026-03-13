# NSE Auction Market Tracker

A professional real-time web application for tracking NSE auction market opportunities with arbitrage detection. Built with Zerodha's exact design theme for seamless integration.

## 🎯 Features

### **Core Functionality**
- **Real-time Auction Data**: Live auction market instruments with quantity and pricing
- **Arbitrage Detection**: Shows percentage difference between auction and normal market prices  
- **Search & Filter**: Real-time search by stock symbol with instant results
- **Advanced Sorting**: Click any column header to sort (Symbol, Qty, Value, Best Bid, LTP, % Diff)
- **Auto-refresh**: Updates every 2 seconds via WebSocket for live data
- **Market Status**: Live market status with accurate auction session timing

### **Professional UI/UX**  
- **Zerodha Theme**: Exact replication of Zerodha's official design language
- **Responsive Design**: Works perfectly on desktop and mobile
- **Indian Number Format**: Values displayed in Lakhs/Crores format
- **Intuitive Controls**: Search, sort, and connection status in clean interface

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js, WebSocket
- **Frontend**: Vanilla HTML/CSS/JavaScript (optimized for performance)
- **Authentication**: Automated Kite Connect login with TOTP
- **Data Sources**: Kite Connect API & WebSocket for real-time feeds
- **Deployment**: Production-ready with environment variables

## ⚡ Quick Start (Local Development)

1. **Clone and Install**
```bash
git clone <repository-url>
cd nse-auction-tracker
npm install
```

2. **Configure API Credentials**
```bash
# Copy example and add your Kite credentials
cp .env.example .env
# Edit .env with your actual credentials
```

3. **Run Application**
```bash
npm start
# Open http://localhost:3000
```

## 🚀 Production Deployment

### **Environment Variables Required:**
```bash
KITE_USERNAME=your_zerodha_username
KITE_PASSWORD=your_zerodha_password  
KITE_TOTP_SECRET=your_totp_secret_key
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
NODE_ENV=production
PORT=3000
```

### **Deploy to Railway (Recommended)**

1. **Create Railway Account**: Visit [railway.app](https://railway.app)

2. **Connect GitHub Repository**: 
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository

3. **Configure Environment Variables**:
   - In Railway dashboard, go to Variables tab
   - Add all required environment variables from above

4. **Deploy**: 
   - Railway automatically detects Node.js and deploys
   - Your app will be available at `https://your-app-name.railway.app`

### **Alternative Deployment Options**
- **Render**: Similar to Railway, great Node.js support
- **Vercel**: Requires restructuring for serverless functions  
- **Heroku**: Traditional platform, more expensive

## 📊 Live Data & Performance

### **Current Metrics**
- ✅ **388 Total Auction Instruments** tracked
- ✅ **372 With Live Auction Bids** (95.9% coverage)  
- ✅ **388 With Normal Market LTP** (100% coverage)
- ✅ **Real-time Search & Sort** functionality
- ✅ **2-second Auto-refresh** for live arbitrage opportunities

### **Sample Arbitrage Opportunities** 
```
🔥 SUNTV: ₹711.50 vs ₹562.80 (+26.4%)
🔥 ECOSMOBLTY: ₹160 vs ₹126.17 (+26.8%)  
🔥 UNIDT: ₹214 vs ₹169.61 (+26.2%)
```

## 📱 Usage Guide

### **Data Columns**
| Column | Description |
|--------|------------|
| Symbol | Trading symbol of the instrument |
| Auction Qty | Maximum order quantity allowed in auction |
| Auction Value | Total value (Qty × LTP) in Lakhs/Crores |
| Best Bid | Highest bid price from auction market depth |
| Stock LTP | Last traded price in normal market |
| % Difference | Percentage difference between auction and normal price |

### **Market Timing**
- **Normal Trading**: 9:15 AM - 3:30 PM IST (Monday-Friday)
- **Auction Session**: 2:30 PM - 3:00 PM IST (All trading days)
- **Weekend**: Markets closed

## 🔧 API Endpoints

- `GET /api/status` - Check authentication and connection status
- `GET /api/auction-data` - Fetch current auction data with arbitrage analysis
- `GET /api/initialize` - Initialize Kite authentication and WebSocket connection

## 🎨 Design System

Built with Zerodha's exact design specifications:
- **Primary Blue**: `#387ed1` | **Success Green**: `#4caf50` | **Danger Red**: `#e84855`
- **Typography**: Inter font family with weights 400, 500, 600
- **Indian Number Format**: Lakhs/Crores display for large values

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Production deployment
NODE_ENV=production npm start
```

## 📄 License & Disclaimer

**For educational and personal use only.** This application is designed for learning about financial markets and trading concepts. 

- Use responsibly with your Zerodha account
- Not financial advice - conduct your own research
- Trading involves risk of financial loss
- Ensure compliance with applicable trading regulations

---

**Built with ❤️ using Kite Connect API | Styled with Zerodha's Design Language**