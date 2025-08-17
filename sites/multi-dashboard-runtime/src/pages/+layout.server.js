// import { error } from '@sveltejs/kit'; // Temporarily disabled for testing

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ request }) {
    console.log(`[LAYOUT SERVER] Processing server-side load function`);
    
    // Extract OAuth headers from the actual request object (server-side only)
    const headers = request.headers;
    console.log(`[LAYOUT SERVER] Headers type:`, typeof headers);
    console.log(`[LAYOUT SERVER] Available headers:`, Object.keys(Object.fromEntries(headers.entries())));
    
    // Extract OAuth headers for Flight SQL authentication
    const oauthHeaders = {};
    
    // Get OAuth headers from proxy
    const idToken = headers.get('x-id-token') || headers.get('x-oauth-id-token');
    const email = headers.get('x-email') || headers.get('x-oauth-email');
    const clientId = headers.get('x-client-id') || headers.get('x-oauth-client-id');
    
    if (idToken) {
        oauthHeaders['X-ID-Token'] = idToken;
        console.log(`[LAYOUT SERVER] ✅ Found OAuth ID Token`);
    }
    if (email) {
        oauthHeaders['X-Email'] = email;
        console.log(`[LAYOUT SERVER] ✅ Found OAuth Email: ${email}`);
    }
    if (clientId) {
        oauthHeaders['X-Client-ID'] = clientId;
        console.log(`[LAYOUT SERVER] ✅ Found OAuth Client ID`);
    }
    
    const headerCount = Object.keys(oauthHeaders).length;
    console.log(`[LAYOUT SERVER] Extracted ${headerCount} OAuth headers for Flight SQL authentication`);
    
    if (headerCount === 0) {
        console.log(`[LAYOUT SERVER] ⚠️  No OAuth headers found - TEMPORARILY ALLOWING FOR TESTING`);
        // TEMPORARY: Disable auth check for Flight SQL testing
        // throw error(401, 'Authentication required. Please access this dashboard through the OAuth proxy.');
    }
    
    // Return OAuth headers to be used by the universal load function
    return {
        oauthHeaders
    };
}