import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Serves the Vercel function in api/admin.js during `npm run dev`, so the
// /admin dashboard works locally without the Vercel CLI.
const adminApi = () => ({
  name: 'admin-api',
  configureServer(server) {
    Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''));
    server.middlewares.use('/api/admin', async (req, res) => {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
      const { default: handler } = await server.ssrLoadModule('/api/admin.js');
      handler(req, res);
    });
  },
});

export default defineConfig({ plugins: [react(), adminApi()] });
