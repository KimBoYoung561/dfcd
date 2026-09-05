import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function kakaoProxyPlugin(): Plugin {
  return {
    name: 'kakao-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/kakao-sdk.js')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost:3000');
            const targetUrl = `https://dapi.kakao.com/v2/maps/sdk.js${parsedUrl.search}`;
            const upstreamRes = await fetch(targetUrl, {
              headers: {
                'Referer': 'http://localhost:5173/',
                'Origin': 'http://localhost:5173',
              },
            });
            const scriptContent = await upstreamRes.text();
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.statusCode = upstreamRes.status;
            res.end(scriptContent);
            return;
          } catch (err) {
            console.error('Failed to proxy Kakao SDK:', err);
          }
        }

        if (req.url && req.url.startsWith('/api/kakao-dapi/')) {
          try {
            const pathAfter = req.url.replace(/^\/api\/kakao-dapi\//, '');
            const targetUrl = `https://dapi.kakao.com/${pathAfter}`;
            const authHeader = req.headers['authorization'] || 'KakaoAK c4d1b687ae75d00ca6539a5e7c241fca';
            const upstreamRes = await fetch(targetUrl, {
              method: req.method || 'GET',
              headers: {
                'Authorization': String(authHeader),
                'KA': 'sdk/1.1.1 os/javascript lang/ko device/web origin/http%3A%2F%2Flocalhost%3A5173',
                'Origin': 'http://localhost:5173',
                'Referer': 'http://localhost:5173/',
              },
            });
            const data = await upstreamRes.text();
            res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = upstreamRes.status;
            res.end(data);
            return;
          } catch (err) {
            console.error('Failed to proxy Kakao Local API:', err);
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), kakaoProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
