import { defineConfig } from 'vite';
// Add exact hostnames for named Cloudflare tunnels; never disable host checking.
const hosts = ['.e2b.app', '.trycloudflare.com', ...(process.env.TRILL_ALLOWED_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean)];
export default defineConfig({
  server: { host: '0.0.0.0', allowedHosts: hosts },
  preview: { host: '0.0.0.0', allowedHosts: hosts },
});
