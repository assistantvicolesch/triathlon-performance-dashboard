const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// Load environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) env[key.trim()] = valueParts.join('=').trim();
});

const HEVY_API_KEY = env.HEVY_API_KEY || process.env.HEVY_API_KEY;
const STRAVA_ACCESS_TOKEN = env.STRAVA_ACCESS_TOKEN || process.env.STRAVA_ACCESS_TOKEN;
const STRAVA_REFRESH_TOKEN = env.STRAVA_REFRESH_TOKEN || process.env.STRAVA_REFRESH_TOKEN;
const STRAVA_CLIENT_ID = env.STRAVA_CLIENT_ID || process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = env.STRAVA_CLIENT_SECRET || process.env.STRAVA_CLIENT_SECRET;

// Helper to make HTTPS requests
function httpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

// Refresh Strava token if needed
async function refreshStravaToken() {
    const postData = `client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${STRAVA_REFRESH_TOKEN}`;
    const options = {
        hostname: 'www.strava.com',
        path: '/oauth/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };
    const result = await httpsRequest(options, postData);
    if (result.data.access_token) {
        // Update .env file with new tokens
        const newEnv = envContent
            .replace(/STRAVA_ACCESS_TOKEN=.*/g, `STRAVA_ACCESS_TOKEN=${result.data.access_token}`)
            .replace(/STRAVA_REFRESH_TOKEN=.*/g, `STRAVA_REFRESH_TOKEN=${result.data.refresh_token}`)
            .replace(/STRAVA_EXPIRES_AT=.*/g, `STRAVA_EXPIRES_AT=${result.data.expires_at}`);
        fs.writeFileSync(envPath, newEnv);
        return result.data.access_token;
    }
    return STRAVA_ACCESS_TOKEN;
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS headers for API endpoints
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Combined Dashboard Data
    if (pathname === '/api/dashboard') {
        try {
            let stravaToken = STRAVA_ACCESS_TOKEN;
            const expiresAt = parseInt(env.STRAVA_EXPIRES_AT || '0');
            if (Date.now() / 1000 > expiresAt - 600) {
                stravaToken = await refreshStravaToken();
            }

            // Fetch Strava activities
            const stravaOpts = {
                hostname: 'www.strava.com',
                path: '/api/v3/athlete/activities?per_page=15',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${stravaToken}` }
            };
            const stravaResult = await httpsRequest(stravaOpts);

            // Fetch Hevy workouts
            const hevyOpts = {
                hostname: 'api.hevyapp.com',
                path: '/v1/workouts?page=1&pageSize=10',
                method: 'GET',
                headers: { 'api-key': HEVY_API_KEY }
            };
            const hevyResult = await httpsRequest(hevyOpts);

            // Fetch Weather (Hamburg)
            const weatherOpts = {
                hostname: 'api.open-meteo.com',
                path: '/v1/forecast?latitude=53.5511&longitude=9.9937&current_weather=true&timezone=Europe%2FBerlin',
                method: 'GET'
            };
            const weatherResult = await httpsRequest(weatherOpts);

            // Load TRAINING_PLAN.md
            const trainingPlanPath = path.join(__dirname, '..', 'TRAINING_PLAN.md');
            const trainingPlan = fs.existsSync(trainingPlanPath) ? fs.readFileSync(trainingPlanPath, 'utf8') : '';

            // Load HEALTH_METRICS (Withings/Manual)
            const loadStatsPath = path.join(__dirname, 'api', 'load_stats.json');
            const loadStats = fs.existsSync(loadStatsPath) ? JSON.parse(fs.readFileSync(loadStatsPath, 'utf8')) : {};

            // Calculate weekly stats
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const weeklyActivities = (stravaResult.data || []).filter(a => new Date(a.start_date) > weekAgo);
            
            const weeklyStats = {
                totalDistance: weeklyActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000,
                totalTime: weeklyActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0) / 3600,
                totalElevation: weeklyActivities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0),
                activityCount: weeklyActivities.length,
                byType: {}
            };

            weeklyActivities.forEach(a => {
                const type = a.sport_type || a.type || 'Other';
                if (!weeklyStats.byType[type]) {
                    weeklyStats.byType[type] = { distance: 0, time: 0, count: 0 };
                }
                weeklyStats.byType[type].distance += (a.distance || 0) / 1000;
                weeklyStats.byType[type].time += (a.moving_time || 0) / 3600;
                weeklyStats.byType[type].count += 1;
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                strava: {
                    activities: stravaResult.data || [],
                    weeklyStats
                },
                hevy: {
                    workouts: hevyResult.data?.workouts || hevyResult.data || []
                },
                weather: weatherResult.data || {},
                trainingPlan: trainingPlan,
                healthData: {
                    vo2max: 37.6, // To be dynamic in future
                    weight: loadStats.nutrition?.weight || 77.2,
                    threshold: '5:00 min/km'
                },
                generated: new Date().toISOString()
            }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // Static file serving
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        let contentType = 'text/html';
        if (filePath.endsWith('.json')) contentType = 'application/json';
        if (filePath.endsWith('.js')) contentType = 'application/javascript';
        if (filePath.endsWith('.css')) contentType = 'text/css';
        if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard server running at http://192.168.2.103:${PORT}/`);
});
