import { json } from '@sveltejs/kit';
import { createSupabaseServiceClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

// ⚠️ IMPORTANT: Replace this with your deployed Apps Script Web App URL
const MEMBERS_SHEET_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgJ2b5YNPyq-1yjTFyXCNLq8EOk40H6BmH9Va1AllmIW9y0rj2IFki6hhcI9NSNOA7jw/exec';

export const POST: RequestHandler = async ({ locals }) => {
  const member = await locals.getMember();
  
  if (!member?.is_admin) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = createSupabaseServiceClient();

    // Fetch members from database
    const { data: members, error } = await supabase
      .from('members')
      .select('id, rac_number, full_name, phone, gmail')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!members || members.length === 0) {
      return json({
        success: true,
        recordsProcessed: 0,
        message: 'No members found in the database.',
        timestamp: new Date().toISOString(),
      });
    }

    // If the App Script URL is configured, send data to Google Sheets
    let sheetsResponse = null;
    if (MEMBERS_SHEET_APP_SCRIPT_URL) {
      console.log(`[SYNC-MEMBERS] Sending ${members.length} members to Google Sheets...`);

      const res = await fetch(MEMBERS_SHEET_APP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members }),
        // Google Apps Script Web Apps sometimes need to follow redirects
        redirect: 'follow',
      });

      const responseText = await res.text();
      console.log(`[SYNC-MEMBERS] Google Sheets responded with status ${res.status}:`, responseText);

      // Try to parse as JSON, fallback to text
      try {
        sheetsResponse = JSON.parse(responseText);
      } catch {
        sheetsResponse = { raw: responseText };
      }

      if (!res.ok) {
        throw new Error(
          sheetsResponse?.error || 
          sheetsResponse?.raw || 
          `Google Sheets API returned HTTP ${res.status}`
        );
      }
    }

    return json({
      success: true,
      recordsProcessed: members.length,
      sheetsResponse,
      message: MEMBERS_SHEET_APP_SCRIPT_URL
        ? `Successfully synced ${members.length} members to Google Sheets.`
        : 'App Script URL not configured. No data sent to Google Sheets.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[SYNC-MEMBERS] Error:', err);
    return json(
      { 
        error: err instanceof Error ? err.message : 'Sync failed',
        details: err instanceof Error ? err.stack : null,
      },
      { status: 500 }
    );
  }
};