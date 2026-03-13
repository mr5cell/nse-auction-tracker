# NSE Auction Market Tracker

A real-time web application for tracking NSE auction market opportunities with Zerodha's design theme.

## Features

- **Real-time Auction Data**: Displays live auction market instruments with quantity and pricing
- **Price Comparison**: Shows percentage difference between auction prices and normal market LTP
- **Auto-refresh**: Updates every 2 seconds via WebSocket
- **Zerodha Theme**: Exact replication of Zerodha's UI/UX design language
- **Market Status**: Indicates if market is open or closed
- **Indian Number Format**: Displays values in Lakhs/Crores format

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Authentication**: kite-auto-auth module (automated Kite Connect login)
- **Data Source**: Kite Connect API & WebSocket
- **Styling**: Custom CSS matching Zerodha theme

## Installation

1. Clone the repository:
```bash
cd nse-auction-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Ensure kite-auto-auth is configured with your credentials in `kite-auto-auth/config.json`

## Usage

1. Start the server:
```bash
npm start
```

2. Open browser at http://localhost:3000

3. Click "Initialize" button to authenticate and start data streaming

## Data Columns

| Column | Description |
|--------|------------|
| Symbol | Trading symbol of the instrument |
| Auction Qty | Maximum order quantity allowed in auction |
| Auction Value | Total value (Qty × LTP) in Lakhs/Crores |
| Best Bid | Highest bid price from auction market depth |
| Stock LTP | Last traded price in normal market |
| % Difference | Percentage difference between auction and normal price |

## API Endpoints

- `GET /api/status` - Check connection status
- `GET /api/auction-data` - Fetch current auction data
- `GET /api/initialize` - Initialize authentication and WebSocket

## Market Hours

- **Trading Hours**: 9:15 AM - 3:30 PM IST (Monday-Friday)
- **Auction Session**: Typically after market close
- **Weekend**: Markets closed

## Architecture

```
nse-auction-tracker/
├── server.js           # Express backend with WebSocket
├── public/
│   └── index.html     # Single-page frontend
├── kite-auto-auth/    # Authentication module
└── package.json       # Dependencies
```

## Key Components

### Backend (server.js)
- Handles Kite authentication via kite-auto-auth
- Fetches auction instruments from https://api.kite.trade/auction_instruments.json
- Manages WebSocket connection for real-time data
- Provides REST API for frontend

### Frontend (index.html)
- Zerodha-themed UI with exact styling
- Real-time table updates
- Auto-refresh every 2 seconds
- Market status indicator

## Design Specifications

### Colors
- Primary Blue: `#387ed1`
- Success Green: `#4caf50`
- Danger Red: `#e84855`
- Text Primary: `#424242`
- Text Secondary: `#9b9b9b`
- Background: `#fbfbfb`

### Typography
- Font: Inter, -apple-system, sans-serif
- Weights: 400 (normal), 500 (medium), 600 (bold)

## Notes

- Auction data is available only during market hours
- WebSocket provides real-time updates when market is active
- Best bid prices come from auction market depth
- Percentage difference helps identify arbitrage opportunities

## Dependencies

- express: Web server
- axios: HTTP client
- kiteconnect: Kite Connect API client
- ws: WebSocket support
- cors: CORS middleware

## License

For educational purposes only. Use responsibly with your Zerodha account.