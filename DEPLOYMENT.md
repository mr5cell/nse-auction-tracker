# 🚀 Deployment Guide - NSE Auction Tracker

## 🔧 **FIXED: Dependency Issues Resolved**

The deployment issues have been fixed by adding all required dependencies:
- ✅ `puppeteer-extra` and `puppeteer-extra-plugin-stealth`
- ✅ `otplib` for TOTP authentication
- ✅ Docker configuration for containerized deployment
- ✅ Railway-specific configuration files

---

## 📋 **Pre-Deployment Checklist**

### **Required Environment Variables:**
```bash
KITE_USERNAME=your_zerodha_username
KITE_PASSWORD=your_zerodha_password  
KITE_TOTP_SECRET=your_totp_secret_key
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
NODE_ENV=production
```

---

## 🛠️ **Option 1: Railway (Recommended)**

### **Steps:**
1. **Visit [railway.app](https://railway.app)** and sign up
2. **Connect GitHub**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `mr5cell/nse-auction-tracker`
3. **Configure Environment Variables**:
   - In Railway dashboard, go to "Variables" tab
   - Add all 6 environment variables above
4. **Deploy**: Railway auto-detects Node.js and builds using our Dockerfile

### **Expected Result:**
- ✅ Live app at `https://your-app-name.railway.app`
- ✅ Automatic SSL certificate
- ✅ Health checks via `/api/status` endpoint

---

## 🌐 **Option 2: Render.com (Alternative)**

### **Steps:**
1. **Visit [render.com](https://render.com)** and create account
2. **New Web Service**:
   - Connect GitHub repository
   - Choose "Build and deploy from Git repository"
3. **Configuration**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
4. **Environment Variables**: Add the same 6 variables as Railway

### **Benefits:**
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Good Docker support

---

## 🐳 **Option 3: Docker Deployment (Any Platform)**

### **For Any Container Platform (DigitalOcean, AWS, GCP, etc.):**

1. **Build Image**:
```bash
docker build -t nse-auction-tracker .
```

2. **Run Container**:
```bash
docker run -p 3000:3000 \
  -e KITE_USERNAME="your_username" \
  -e KITE_PASSWORD="your_password" \
  -e KITE_TOTP_SECRET="your_secret" \
  -e KITE_API_KEY="your_key" \
  -e KITE_API_SECRET="your_secret" \
  -e NODE_ENV="production" \
  nse-auction-tracker
```

---

## 🔍 **Troubleshooting**

### **Common Issues & Solutions:**

#### **1. "Cannot find module 'puppeteer-extra'" ❌**
- ✅ **Fixed**: Dependencies added to main package.json

#### **2. Puppeteer crashes in container** ❌  
- ✅ **Fixed**: Dockerfile includes Chromium and proper configuration

#### **3. Environment variables not working** ❌
- Check variable names exactly match (case-sensitive)
- Ensure no extra spaces in values
- Verify all 6 variables are set

#### **4. Health check failing** ❌
- Check `/api/status` endpoint responds with 200
- Verify server starts without errors
- Check logs for authentication issues

### **Debug Commands:**
```bash
# Check if app is responding
curl https://your-app.railway.app/api/status

# Should return:
{"authenticated":false,"auctionInstruments":0,"normalInstruments":0,"websocketConnected":false}
```

---

## 📊 **Post-Deployment Verification**

### **1. Check Application Health**
- ✅ Visit your app URL
- ✅ See "Auction markets" title
- ✅ Click "Initialize" button
- ✅ Verify data loads with real stock prices

### **2. Monitor Performance**
- ✅ Check Railway/Render logs for errors
- ✅ Verify authentication success in logs
- ✅ Confirm WebSocket connections
- ✅ Test search and sort functionality

---

## 🔐 **Security Best Practices**

### **Environment Variables:**
- ✅ Never commit API keys to GitHub
- ✅ Use platform's secure variable storage
- ✅ Rotate keys regularly for security

### **Domain & SSL:**
- ✅ Railway/Render provide automatic HTTPS
- ✅ Use custom domain for professional setup
- ✅ Configure CORS for your domain in production

---

## 🚀 **Production Ready Features**

- ✅ **Environment Configuration**: Automatic config.json generation
- ✅ **Docker Support**: Multi-stage build with Alpine Linux
- ✅ **Health Checks**: Built-in status monitoring
- ✅ **Error Handling**: Graceful fallbacks and retry logic
- ✅ **Security**: Non-root user, minimal attack surface
- ✅ **Performance**: Optimized dependencies and caching

---

## 📞 **Need Help?**

If deployment still fails:

1. **Check Logs**: Platform logs usually show the exact error
2. **Test Locally**: Run `docker build .` to test container build
3. **GitHub Issues**: Report issues in the repository
4. **Alternative Platforms**: Try Render if Railway fails

**Your NSE Auction Tracker is production-ready! 🎯**