/**
 * Multi-User Simulation Test Script
 * 
 * This script simulates multiple users connecting and scrolling
 * to test the Global Scroll Service under load.
 * 
 * Usage:
 *   1. Make sure server is running: npm run dev
 *   2. Install socket.io-client: npm install socket.io-client
 *   3. Run this script: node test-simulation.js
 */

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';
const NUM_USERS = 5;
const SCROLL_INTERVAL = 1000; // ms between scrolls
const MIN_DELTA = 10;
const MAX_DELTA = 200;

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(userId, message, data = '') {
    const timestamp = new Date().toLocaleTimeString();
    const color = colors.cyan;
    console.log(
        `${colors.bright}[${timestamp}]${colors.reset} ` +
        `${color}[User ${userId}]${colors.reset} ` +
        `${message} ${data ? colors.yellow + JSON.stringify(data) + colors.reset : ''}`
    );
}

function createUser(userId) {
    const deviceId = `sim_user_${userId}`;
    let scrollCount = 0;
    let totalDelta = 0;

    log(userId, '🔌 Connecting...', { deviceId });

    const socket = io(SERVER_URL, {
        query: {
            deviceId,
            lang: Math.random() > 0.5 ? 'en' : 'th'
        },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        log(userId, `${colors.green}✅ Connected${colors.reset}`, { socketId: socket.id });

        // Start sending random scrolls
        const scrollInterval = setInterval(() => {
            if (!socket.connected) {
                clearInterval(scrollInterval);
                return;
            }

            const delta = Math.floor(Math.random() * (MAX_DELTA - MIN_DELTA + 1)) + MIN_DELTA;
            socket.emit('scroll_batch', { delta });
            scrollCount++;
            totalDelta += delta;

            if (scrollCount % 10 === 0) {
                log(userId, '📤 Scrolls sent', {
                    count: scrollCount,
                    total: totalDelta
                });
            }
        }, SCROLL_INTERVAL + Math.random() * 500); // Add some randomness
    });

    socket.on('tick', (data) => {
        if (scrollCount === 1 || scrollCount % 20 === 0) {
            log(userId, '📊 Tick received', {
                height: data.height,
                velocity: data.velocity?.toFixed(2),
                countries: Object.keys(data.countryHeights || {}).length
            });
        }
    });

    socket.on('milestone_reached', (data) => {
        log(userId, `${colors.magenta}🎉 MILESTONE REACHED!${colors.reset}`, data);
    });

    socket.on('disconnect', (reason) => {
        log(userId, `${colors.red}❌ Disconnected${colors.reset}`, { reason });
    });

    socket.on('connect_error', (error) => {
        log(userId, `${colors.red}❌ Connection Error${colors.reset}`, {
            message: error.message
        });
    });

    socket.on('error', (error) => {
        log(userId, `${colors.red}❌ Error${colors.reset}`, error);
    });

    return socket;
}

// Main execution
console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🌍 Global Scroll Service - Multi-User Simulation      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`\n${colors.bright}Configuration:${colors.reset}`);
console.log(`  Server URL: ${colors.cyan}${SERVER_URL}${colors.reset}`);
console.log(`  Number of Users: ${colors.cyan}${NUM_USERS}${colors.reset}`);
console.log(`  Scroll Interval: ${colors.cyan}${SCROLL_INTERVAL}ms${colors.reset}`);
console.log(`  Delta Range: ${colors.cyan}${MIN_DELTA}-${MAX_DELTA}px${colors.reset}\n`);

console.log(`${colors.bright}Starting simulation...${colors.reset}\n`);

// Create all users
const sockets = [];
for (let i = 1; i <= NUM_USERS; i++) {
    setTimeout(() => {
        const socket = createUser(i);
        sockets.push(socket);
    }, i * 200); // Stagger connections
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n\n${colors.bright}${colors.yellow}Shutting down...${colors.reset}`);
    sockets.forEach(socket => {
        if (socket) socket.disconnect();
    });
    setTimeout(() => {
        console.log(`${colors.green}✅ All users disconnected${colors.reset}`);
        process.exit(0);
    }, 1000);
});

// Keep alive
console.log(`${colors.bright}Press Ctrl+C to stop${colors.reset}\n`);
