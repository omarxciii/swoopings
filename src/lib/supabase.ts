/**
 * Supabase Client Initialization
 * 
 * File Purpose:
 * - Creates and exports a single Supabase client instance
 * - Handles both browser and server-side authentication
 * - Provides access to database, auth, and storage
 * 
 * Dependencies:
 * - @supabase/supabase-js - Supabase SDK
 * - Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * High-Level Logic:
 * - Initializes client with environment variables
 * - Uses anon key (public) for client-side operations with RLS policies
 * - For server-side operations, use service role key (see API routes)
 * 
 * Assumptions:
 * - Environment variables are set in .env.local
 * - RLS policies are properly configured in Supabase
 * 
 * Notes to Future Developer:
 * - Never expose SUPABASE_SERVICE_ROLE_KEY in client code
 * - All database queries must be filtered by user ID or protected by RLS
 * - Image uploads go to Supabase Storage with bucket policies
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Lazy-initialize Supabase client
 * This ensures the client is only created in the browser/runtime,
 * not during build time when env vars may not be available
 */
let supabaseInstance: any = null;

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder that will throw if used
    return {
      auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
      from: () => {
        throw new Error('Supabase client should not be used server-side. Use API routes instead.');
      },
    };
  }
  
  // Client-side: create the real client
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
})();
