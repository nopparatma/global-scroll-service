# 🧪 Testing Guide for Global Scroll Service

This guide will help you test all features of the Global Scroll Service.

## Quick Start Testing

### ✅ Prerequisites Check

Your server is running! Here's what's active:
- ✅ **Node.js Server**: Running on port 3000
- ✅ **PostgreSQL**: Running in Docker (port 5432)
- ✅ **Redis**: Running in Docker (port 6379)
- ✅ **Prisma Studio**: Running (database GUI)

---

## 🎯 Testing Methods

### Method 1: Interactive Web Client (Recommended)

I've created a beautiful test client for you!

**To use it:**

1. **Open the test client in your browser:**
   ```bash
   open test-client.html
   ```
   
   Or manually open: `file:///Users/nopparat/iCloud Drive (Archive)/Documents/SourceCode/global-scroll-service/test-client.html`

2. **Click "Connect"** - It will auto-generate a device ID

3. **Start scrolling!** You can:
   - Scroll in the scroll box (real scroll events)
   - Click the quick action buttons (+10, +100, +1000, +10000)
   - Watch real-time metrics update
   - See country heights
   - Monitor event logs

4. **Test with multiple devices:**
   - Open the same HTML file in multiple browser tabs/windows
   - Each will get a unique device ID
   - Watch how they all contribute to the global height!

---

### Method 2: Command Line Testing with wscat

Install wscat (WebSocket client):
```bash
npm install -g wscat
```

Connect to the server:
```bash
wscat -c "ws://localhost:3000?deviceId=test123&lang=en"
```

Send scroll events:
```json
{"type":"scroll_batch","data":{"delta":100}}
```

---

### Method 3: Node.js Test Script

Create a test script to simulate multiple users:

```bash
npm install socket.io-client
```

Then create `test-script.js`:

```javascript
const io = require('socket.io-client');

function createClient(deviceId) {
    const socket = io('http://localhost:3000', {
        query: { deviceId, lang: 'en' }
    });

    socket.on('connect', () => {
        console.log(`[${deviceId}] Connected`);
        
        // Send random scrolls
        setInterval(() => {
            const delta = Math.floor(Math.random() * 100) + 10;
            socket.emit('scroll_batch', { delta });
            console.log(`[${deviceId}] Sent delta: ${delta}`);
        }, 1000);
    });

    socket.on('tick', (data) => {
        console.log(`[${deviceId}] Tick:`, data);
    });

    socket.on('milestone_reached', (data) => {
        console.log(`[${deviceId}] 🎉 MILESTONE:`, data);
    });
}

// Create 5 simulated users
for (let i = 1; i <= 5; i++) {
    createClient(`test_user_${i}`);
}
```

Run it:
```bash
node test-script.js
```

---

### Method 4: Browser Console Testing

1. Open your browser console (F12)
2. Load Socket.io client:
```javascript
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.8.1/socket.io.min.js';
document.head.appendChild(script);
```

3. After it loads, connect:
```javascript
const socket = io('http://localhost:3000', {
    query: { deviceId: 'browser_test', lang: 'en' }
});

socket.on('connect', () => console.log('Connected!'));
socket.on('tick', (data) => console.log('Tick:', data));
socket.on('milestone_reached', (data) => console.log('🎉 Milestone:', data));

// Send scrolls
socket.emit('scroll_batch', { delta: 100 });
```

---

## 🧪 Test Scenarios

### Test 1: Basic Connection
**Goal:** Verify WebSocket connection works

1. Open test-client.html
2. Click "Connect"
3. ✅ Status should show "Connected"
4. ✅ Logs should show connection event

---

### Test 2: Scroll Events
**Goal:** Verify scroll events are processed

1. Connect to the server
2. Click "+100 px" button
3. ✅ Should see "scroll_batch" in logs
4. ✅ "Your Scrolls" counter should increment
5. ✅ Should receive "tick" event with updated height

---

### Test 3: Real-time Updates
**Goal:** Verify real-time synchronization

1. Open test-client.html in **two browser tabs**
2. Connect both tabs with different device IDs
3. Scroll in Tab 1
4. ✅ Tab 2 should receive tick updates
5. ✅ Global height should update in both tabs

---

### Test 4: Country Tracking
**Goal:** Verify country-based tracking

1. Connect to the server
2. Send scroll events
3. ✅ Country heights section should populate
4. ✅ Your country (based on IP) should show scroll contribution

**Note:** For local testing, you might see "XX" as the country code. To test with real countries, you can:
- Use a VPN
- Modify the geoip-lite database
- Check the code in `src/services/user.service.ts`

---

### Test 5: Milestones
**Goal:** Verify milestone notifications

1. Connect to the server
2. Send large scroll amounts (click "+10000 px" multiple times)
3. ✅ Should see milestone alerts when reaching thresholds
4. ✅ Check logs for "milestone_reached" events

**Milestone thresholds** (check `src/services/milestoneManager.ts`):
- 1,000 pixels
- 10,000 pixels
- 100,000 pixels
- 1,000,000 pixels
- etc.

---

### Test 6: Database Persistence
**Goal:** Verify data is saved to PostgreSQL

1. Send scroll events
2. Open Prisma Studio (already running at http://localhost:5555)
3. ✅ Check `users` table - should see your device ID
4. ✅ Check `flags` table - should see scroll records
5. ✅ Check `global_history` table - should see height snapshots

---

### Test 7: Redis State
**Goal:** Verify Redis is storing real-time state

```bash
# Connect to Redis container
docker exec -it global-scroll-service-redis-1 redis-cli

# Check global height
GET global:height

# Check velocity
GET global:velocity

# Check country heights
HGETALL country:heights

# Exit
exit
```

---

### Test 8: Multi-User Simulation
**Goal:** Test with many concurrent users

1. Create the test-script.js from Method 3 above
2. Run it to simulate 5 users
3. Open test-client.html to watch the metrics
4. ✅ Global height should increase rapidly
5. ✅ Velocity should fluctuate
6. ✅ Multiple countries might appear (if users have different IPs)

---

### Test 9: Gravity Decay
**Goal:** Verify velocity decreases over time

1. Send a large scroll amount (+10000)
2. Watch the velocity metric
3. Stop scrolling
4. ✅ Velocity should gradually decrease
5. ✅ This is the "gravity" effect from `gravity.worker.ts`

---

### Test 10: Internationalization (i18n)
**Goal:** Test language support

1. Connect with `lang=en`
2. Check milestone messages (should be in English)
3. Disconnect and connect with `lang=th`
4. ✅ Milestone messages should be in Thai
5. ✅ Check `src/locales/` for available translations

---

## 📊 Monitoring & Debugging

### View Server Logs
Your dev server is running. Check the terminal where you ran `npm run dev` for logs.

### View Database
Prisma Studio is already running at: **http://localhost:5555**

### View Redis Data
```bash
docker exec -it global-scroll-service-redis-1 redis-cli
```

Common Redis commands:
```redis
KEYS *                    # List all keys
GET global:height         # Get global height
GET global:velocity       # Get velocity
HGETALL country:heights   # Get all country heights
FLUSHALL                  # Clear all data (CAUTION!)
```

### Check Docker Logs
```bash
# Redis logs
docker logs global-scroll-service-redis-1 -f

# PostgreSQL logs
docker logs global-scroll-service-postgres-1 -f
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to server"
**Solution:**
```bash
# Check if server is running
curl http://localhost:3000

# Check server logs
# Look at your terminal running npm run dev

# Restart server
# Stop with Ctrl+C, then: npm run dev
```

### Issue: "Database connection failed"
**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check database URL in .env
cat .env | grep DATABASE_URL
```

### Issue: "Redis connection failed"
**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
docker-compose restart redis

# Test Redis connection
docker exec -it global-scroll-service-redis-1 redis-cli ping
# Should return: PONG
```

### Issue: "No tick events received"
**Solution:**
- Check if you're connected (status indicator should be green)
- Check browser console for errors (F12)
- Verify server logs for errors
- Try disconnecting and reconnecting

### Issue: "Country shows as XX"
**Explanation:** This is expected for localhost. The geoip-lite library can't determine country from local IPs.

**To test with real countries:**
- Deploy to a server with a public IP
- Use a VPN
- Manually set country in the code for testing

---

## 🎯 Performance Testing

### Load Test with Artillery

Install Artillery:
```bash
npm install -g artillery
```

Create `load-test.yml`:
```yaml
config:
  target: "ws://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
  engines:
    socketio:
      query:
        deviceId: "load_test_{{ $randomString() }}"
        lang: "en"

scenarios:
  - engine: socketio
    flow:
      - emit:
          channel: "scroll_batch"
          data:
            delta: 100
      - think: 1
```

Run load test:
```bash
artillery run load-test.yml
```

---

## ✅ Testing Checklist

Use this checklist to ensure everything works:

- [ ] Server starts without errors
- [ ] Can connect via WebSocket
- [ ] Can send scroll_batch events
- [ ] Receive tick events with updated data
- [ ] Global height increases
- [ ] Velocity changes appropriately
- [ ] Country heights are tracked
- [ ] Milestones trigger notifications
- [ ] Data persists to PostgreSQL
- [ ] Data is cached in Redis
- [ ] Multiple clients can connect simultaneously
- [ ] Gravity decay works (velocity decreases)
- [ ] i18n works (English and Thai)
- [ ] Prisma Studio shows data
- [ ] Server handles disconnections gracefully

---

## 🚀 Next Steps

After testing:

1. **Build a real client** (web, mobile, or desktop app)
2. **Deploy to production** (see deployment guide)
3. **Add more features** (leaderboards, achievements, etc.)
4. **Monitor performance** (add APM tools)
5. **Scale** (add more Redis instances, load balancers)

---

## 📞 Need Help?

If something isn't working:

1. Check the server logs
2. Check browser console (F12)
3. Check Docker logs
4. Verify all services are running: `docker ps`
5. Check the database with Prisma Studio
6. Check Redis with `redis-cli`

Happy testing! 🎉
