const https = require('https');

const token = 'sbp_b77ac0a62aab2e88c0fc1ccfd3c1cc57dd569d33';
const projectRef = 'zvjurirrkthtlngstyuk';

const sql = `SELECT id FROM auth.users WHERE email = 'testuser@gmail.com' LIMIT 1;`;

const data = JSON.stringify({ query: sql });

const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/queries`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(body);
    });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
