# 🧪 Quick Testing Reference

## 🚀 Your Server Status
✅ Server is RUNNING on http://localhost:3000
✅ PostgreSQL is RUNNING (port 5432)
✅ Redis is RUNNING (port 6379)
✅ Prisma Studio is RUNNING on http://localhost:5555

---

## 🎯 3 Ways to Test (Easiest to Advanced)

### 1️⃣ **Web Test Client** (EASIEST - Already Opened!)
The interactive web client should be open in your browser.

**If not, open it:**
```bash
open test-client.html
```

**What to do:**
1. Click "🔌 Connect"
2. Click the scroll buttons or scroll in the box
3. Watch the metrics update in real-time!
4. Open in multiple tabs to simulate multiple users

---

### 2️⃣ **Multi-User Simulation** (Test with 5 simulated users)
```bash
node test-simulation.js
```

This will:
- Create 5 virtual users
- Each sends random scroll events
- Shows colorful logs
- Press Ctrl+C to stop

---

### 3️⃣ **Manual WebSocket Testing**
```bash
# Install wscat if needed
npm install -g wscat

# Connect
wscat -c "ws://localhost:3000?deviceId=test123&lang=en"

# Then send (paste this):
{"type":"scroll_batch","data":{"delta":100}}
```

---

## 📊 Monitoring Tools

### View Database (Prisma Studio)
Already running at: **http://localhost:5555**

Or open it:
```bash
npm run db:studio
```

### Check Redis Data
```bash
docker exec -it global-scroll-service-redis-1 redis-cli

# Inside redis-cli:
GET global:height
GET global:velocity
HGETALL country:heights
exit
```

### View Server Logs
Check the terminal where `npm run dev` is running

### View Docker Logs
```bash
# Redis
docker logs global-scroll-service-redis-1 -f

# PostgreSQL
docker logs global-scroll-service-postgres-1 -f
```

---

## 🎮 Quick Test Scenarios

### Test 1: Basic Functionality
1. Open test-client.html
2. Click "Connect"
3. Click "+100 px" button
4. ✅ Should see metrics update

### Test 2: Multiple Users
1. Open test-client.html in 2 browser tabs
2. Connect both
3. Scroll in one tab
4. ✅ Both tabs should see the same global height

### Test 3: Milestones
1. Connect to server
2. Click "+10000 px" multiple times
3. ✅ Should see milestone alerts

### Test 4: Database Persistence
1. Send some scrolls
2. Open http://localhost:5555
3. ✅ Check `users`, `flags`, and `global_history` tables

---

## 🐛 Troubleshooting

### Server not responding?
```bash
# Check if it's running
curl http://localhost:3000

# Should see: "Cannot GET /" (this is normal!)
```

### Can't connect via WebSocket?
1. Check browser console (F12) for errors
2. Make sure server is running
3. Try disconnecting and reconnecting

### Database issues?
```bash
# Restart database
docker-compose restart postgres

# Reset database (WARNING: deletes data)
npm run db:push
```

### Redis issues?
```bash
# Restart Redis
docker-compose restart redis

# Test connection
docker exec -it global-scroll-service-redis-1 redis-cli ping
# Should return: PONG
```

---

## 📁 Important Files

- **test-client.html** - Interactive web test client
- **test-simulation.js** - Multi-user simulation script
- **TESTING_GUIDE.md** - Comprehensive testing guide
- **STARTUP_GUIDE.md** - How to run the project
- **.env** - Environment configuration
- **prisma/schema.prisma** - Database schema

---

## 🎯 Testing Checklist

- [ ] Can connect via WebSocket
- [ ] Can send scroll events
- [ ] Receive tick updates
- [ ] Global height increases
- [ ] Velocity changes
- [ ] Country heights tracked
- [ ] Milestones trigger
- [ ] Data saves to PostgreSQL
- [ ] Multiple users work simultaneously

---

## 🚀 Next Steps

1. ✅ Test with the web client
2. ✅ Run the simulation script
3. ✅ Check Prisma Studio to see data
4. ✅ Monitor Redis state
5. 🎨 Build your own client app!

---

## 📞 Quick Commands

```bash
# Start server
npm run dev

# View database
npm run db:studio

# Run simulation
node test-simulation.js

# Open test client
open test-client.html

# Check Redis
docker exec -it global-scroll-service-redis-1 redis-cli

# Restart services
docker-compose restart
```

---

**Happy Testing! 🎉**

For detailed information, see **TESTING_GUIDE.md**
