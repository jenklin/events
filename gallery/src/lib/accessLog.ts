/**
 * Access Logging Utility
 * Tracks user interactions with albums and assets
 */

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type AccessAction = 'view_album' | 'view_asset' | 'download' | 'comment' | 'upload';

interface LogAccessParams {
  action: AccessAction;
  albumId?: string;
  assetId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an access event to the database
 * Uses service role to bypass RLS
 */
export async function logAccess(params: LogAccessParams): Promise<void> {
  try {
    // Skip logging if service key not configured
    if (!supabaseServiceKey) {
      console.warn('[Access Log] Service key not configured, skipping log');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request metadata
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') ||
               headersList.get('x-real-ip') ||
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Insert log entry
    const { error } = await supabase
      .from('access_logs')
      .insert({
        user_id: params.userId || null,
        album_id: params.albumId || null,
        asset_id: params.assetId || null,
        action: params.action,
        ip_address: ip,
        user_agent: userAgent,
        metadata: params.metadata || {}
      });

    if (error) {
      console.error('[Access Log] Failed to log access:', error);
    }
  } catch (err) {
    // Don't throw - logging failures shouldn't break the app
    console.error('[Access Log] Exception:', err);
  }
}

/**
 * Helper to get current user ID from request
 */
export async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) return undefined;

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id;
  } catch {
    return undefined;
  }
}
