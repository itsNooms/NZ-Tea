// Supabase Configuration for NZ Tea
const SUPABASE_URL = 'https://nprnngtixtdazegpvinq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcm5uZ3RpeHRkYXplZ3B2aW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjM3NTMsImV4cCI6MjA5MTM5OTc1M30.HUfPbZ2wsOHzXZ16L0rXn7izquNroyn6KH7aGzmSnxQ';

// Initialize the Supabase client
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Expose the client globally as 'supabase' for all HTML pages to use
window.supabase = supabaseClient;

/**
 * NZ Tea Auth Helper
 * Checks if the user is currently logged in via Supabase.
 * Redirects to login.html if unauthorized.
 */
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

/**
 * NZ Tea Logout Helper
 */
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}
