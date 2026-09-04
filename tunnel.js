import { startTunnel } from 'untun';
import fs from 'fs';

async function run() {
  const port = process.env.TUNNEL_PORT ? parseInt(process.env.TUNNEL_PORT) : 3001;
  console.log('Starting Cloudflare Secure HTTPS Tunnel for Tripeye on port ' + port + '...');
  try {
    const tunnel = await startTunnel({ port });
    const url = await tunnel.getURL();
    console.log('==================================================');
    console.log('🚀 LIVE SECURE HTTPS URL:', url);
    console.log('==================================================');

    const info = { httpsUrl: url, updatedAt: Date.now() };
    fs.writeFileSync('public-tunnel.json', JSON.stringify(info, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to start tunnel:', err);
  }
}

run();
