import { Server } from './.svelte-kit/output/server/index.js';
import { manifest } from './.svelte-kit/output/server/manifest-full.js';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = new Server(manifest);

await app.init({
    env: process.env
});

// Serve static files from the client build
function serveStatic(req, res, next) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Handle common missing files that cause 500 errors
    if (url.pathname === '/fix-tprotocol-service-worker.js' ||
        url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }
    
    // Handle static assets
    if (url.pathname.startsWith('/_app/') || 
        url.pathname === '/favicon.ico' ||
        url.pathname === '/manifest.webmanifest' ||
        url.pathname.startsWith('/icon-') ||
        url.pathname === '/icon.svg' ||
        url.pathname.startsWith('/data/')) {
        
        try {
            const staticPath = join(__dirname, '.svelte-kit/output/client', url.pathname);
            const content = readFileSync(staticPath);
            
            // Set appropriate content type
            const ext = url.pathname.split('.').pop();
            const contentTypes = {
                'js': 'application/javascript',
                'css': 'text/css',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'svg': 'image/svg+xml',
                'ico': 'image/x-icon',
                'woff': 'font/woff',
                'woff2': 'font/woff2',
                'webmanifest': 'application/manifest+json',
                'json': 'application/json'
            };
            
            res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
            res.writeHead(200);
            res.end(content);
            return;
        } catch (err) {
            console.log(`[STATIC] Could not serve ${url.pathname}:`, err.message);
            // Return 404 for missing static files instead of passing to SvelteKit
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
    }
    
    next();
}

createServer(async (req, res) => {
    // Try serving static files first
    serveStatic(req, res, async () => {
        // If not a static file, handle with SvelteKit
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        // Extract OAuth headers for Flight SQL authentication
        const headers = { ...req.headers };
        
        // Log OAuth headers for debugging
        if (headers['x-id-token']) {
            console.log(`[SERVER] Received X-ID-Token header from OAuth proxy`);
        }
        if (headers['x-email']) {
            console.log(`[SERVER] Received X-Email: ${headers['x-email']}`);
        }
        if (headers['x-client-id']) {
            console.log(`[SERVER] Received X-Client-ID header from OAuth proxy`);
        }
        
        // Create enhanced request with OAuth headers explicitly passed through
        const enhancedHeaders = new Headers(headers);
        
        // Ensure OAuth headers are properly forwarded to SvelteKit
        if (headers['x-id-token']) {
            enhancedHeaders.set('x-id-token', headers['x-id-token']);
            enhancedHeaders.set('x-oauth-id-token', headers['x-id-token']); // Alternative header name
        }
        if (headers['x-email']) {
            enhancedHeaders.set('x-email', headers['x-email']);
            enhancedHeaders.set('x-oauth-email', headers['x-email']); // Alternative header name
        }
        if (headers['x-client-id']) {
            enhancedHeaders.set('x-client-id', headers['x-client-id']);
            enhancedHeaders.set('x-oauth-client-id', headers['x-client-id']); // Alternative header name
        }
        
        const request = new Request(url, {
            method: req.method,
            headers: enhancedHeaders,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined
        });
        
        const response = await app.respond(request, {
            platform: undefined,
            getClientAddress: () => req.connection.remoteAddress || req.socket.remoteAddress
        });
        
        res.statusCode = response.status;
        
        for (const [key, value] of response.headers) {
            res.setHeader(key, value);
        }
        
        if (response.body) {
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        }
        
        res.end();
    });
}).listen(PORT, () => {
    console.log(`🚀 Evidence production server running on http://localhost:${PORT}`);
    console.log(`🔥 Multi-dashboard runtime with Flight SQL ready!`);
});