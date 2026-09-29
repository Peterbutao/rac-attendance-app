import { createSupabaseServiceClient } from './supabase';

const SHEET_ID = '1L_bAun4U7dfhDR2WJHGHlT5CW3tfTKwDs_3qN0pOddk';

function parseCSV(text: string): Record<string, string>[] {
  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  }

  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = splitLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  
  return lines.slice(1).map(line => {
    const cols = splitLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (cols[i] ?? '').trim()]));
  });
}

async function fetchSheet(name: string): Promise<Record<string, string>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  
  try {
    const res = await fetch(url, {
      // Cache for 5 minutes to avoid rate limits
      next: { revalidate: 300 }
    });
    
    if (!res.ok) {
      console.error(`[SYNC] fetchSheet(${name}) failed:`, res.status);
      return [];
    }
    
    const text = await res.text();
    return parseCSV(text);
  } catch (err) {
    console.error(`[SYNC] Error fetching sheet ${name}:`, err);
    return [];
  }
}

// Map sheet column names to database column names
function mapDuesRow(row: Record<string, string>) {
  return {
    member_id: parseInt(row['member_id'] || row['id'] || '0'),
    period: row['period'] || row['dues_period'] || '',
    dues_required: parseFloat(row['dues_required'] || row['required'] || '0') || 0,
    dues_paid: parseFloat(row['dues_paid'] || row['paid'] || '0') || 0,
  };
}

function mapAttendanceRow(row: Record<string, string>) {
  return {
    member_id: parseInt(row['member_id'] || row['id'] || '0'),
    meeting_date: row['meeting_date'] || row['date'] || '',
    attended: ['true', 'yes', '1', 'present', '✓'].includes(
      (row['attended'] || row['present'] || '').toLowerCase()
    ),
  };
}

function mapVolunteerRow(row: Record<string, string>) {
  return {
    member_id: parseInt(row['member_id'] || row['id'] || '0'),
    activity_name: row['activity_name'] || row['activity'] || '',
    hours: parseFloat(row['hours'] || '0') || 0,
    activity_date: row['activity_date'] || row['date'] || '',
  };
}

function mapActivityRow(row: Record<string, string>) {
  return {
    title: row['title'] || row['activity_name'] || '',
    activity_date: row['activity_date'] || row['date'] || '',
    description: row['description'] || row['desc'] || null,
  };
}

export interface SyncResult {
  sheet: string;
  success: boolean;
  recordsProcessed: number;
  errors: string[];
}

export interface SyncSummary {
  results: SyncResult[];
  totalProcessed: number;
  hasErrors: boolean;
  timestamp: string;
}

// Check if sync was already performed recently
async function shouldSync(supabase: ReturnType<typeof createSupabaseServiceClient>): Promise<boolean> {
  const { data } = await supabase
    .from('sync_log')
    .select('last_sync')
    .eq('sync_type', 'google_sheets')
    .order('last_sync', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.last_sync) return true;

  const lastSync = new Date(data.last_sync);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return lastSync < fiveMinutesAgo;
}

async function logSync(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  result: SyncResult
): Promise<void> {
  await supabase.from('sync_log').insert({
    sync_type: 'google_sheets',
    sheet_name: result.sheet,
    records_processed: result.recordsProcessed,
    success: result.success,
    errors: result.errors,
    last_sync: new Date().toISOString(),
  });
}

export async function syncAllSheets(): Promise<SyncSummary> {
  const supabase = createSupabaseServiceClient();
  const results: SyncResult[] = [];

  // Check if we should sync (rate limiting)
  if (!(await shouldSync(supabase))) {
    return {
      results: [],
      totalProcessed: 0,
      hasErrors: false,
      timestamp: new Date().toISOString(),
    };
  }

  // Sync Member Dues
  try {
    const duesResult = await syncMemberDues(supabase);
    results.push(duesResult);
    await logSync(supabase, duesResult);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    results.push({ sheet: 'MEMBER_DUES', success: false, recordsProcessed: 0, errors: [error] });
  }

  // Sync Meeting Attendance
  try {
    const attendanceResult = await syncMeetingAttendance(supabase);
    results.push(attendanceResult);
    await logSync(supabase, attendanceResult);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    results.push({ sheet: 'MEETING_ATTENDANCE', success: false, recordsProcessed: 0, errors: [error] });
  }

  // Sync Volunteer Hours
  try {
    const volunteerResult = await syncVolunteerHours(supabase);
    results.push(volunteerResult);
    await logSync(supabase, volunteerResult);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    results.push({ sheet: 'VOLUNTEER_HOURS', success: false, recordsProcessed: 0, errors: [error] });
  }

  // Sync Activities
  try {
    const activitiesResult = await syncActivities(supabase);
    results.push(activitiesResult);
    await logSync(supabase, activitiesResult);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    results.push({ sheet: 'ACTIVITIES', success: false, recordsProcessed: 0, errors: [error] });
  }

  return {
    results,
    totalProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
    hasErrors: results.some(r => !r.success),
    timestamp: new Date().toISOString(),
  };
}

async function syncMemberDues(supabase: ReturnType<typeof createSupabaseServiceClient>): Promise<SyncResult> {
  const rows = await fetchSheet('MEMBER_DUES');
  const errors: string[] = [];
  let processed = 0;

  for (const row of rows) {
    try {
      const data = mapDuesRow(row);
      
      if (!data.member_id || !data.period) {
        continue; // Skip invalid rows
      }

      const { error } = await supabase
        .from('member_dues')
        .upsert(
          { ...data, updated_at: new Date().toISOString() },
          { onConflict: 'member_id,period' }
        );

      if (error) {
        errors.push(`Row ${processed + 1}: ${error.message}`);
      } else {
        processed++;
      }
    } catch (err) {
      errors.push(`Row ${processed + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
    }
  }

  return {
    sheet: 'MEMBER_DUES',
    success: errors.length === 0,
    recordsProcessed: processed,
    errors,
  };
}

async function syncMeetingAttendance(supabase: ReturnType<typeof createSupabaseServiceClient>): Promise<SyncResult> {
  const rows = await fetchSheet('MEETING_ATTENDANCE');
  const errors: string[] = [];
  let processed = 0;

  for (const row of rows) {
    try {
      const data = mapAttendanceRow(row);
      
      if (!data.member_id || !data.meeting_date) {
        continue;
      }

      const { error } = await supabase
        .from('meeting_attendance')
        .upsert(
          data,
          { onConflict: 'member_id,meeting_date' }
        );

      if (error) {
        errors.push(`Row ${processed + 1}: ${error.message}`);
      } else {
        processed++;
      }
    } catch (err) {
      errors.push(`Row ${processed + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
    }
  }

  return {
    sheet: 'MEETING_ATTENDANCE',
    success: errors.length === 0,
    recordsProcessed: processed,
    errors,
  };
}

async function syncVolunteerHours(supabase: ReturnType<typeof createSupabaseServiceClient>): Promise<SyncResult> {
  const rows = await fetchSheet('VOLUNTEER_HOURS');
  const errors: string[] = [];
  let processed = 0;

  for (const row of rows) {
    try {
      const data = mapVolunteerRow(row);
      
      if (!data.member_id || !data.activity_name || !data.activity_date) {
        continue;
      }

      const { error } = await supabase
        .from('volunteer_hours')
        .upsert(data, { onConflict: 'member_id,activity_name,activity_date' });

      if (error) {
        errors.push(`Row ${processed + 1}: ${error.message}`);
      } else {
        processed++;
      }
    } catch (err) {
      errors.push(`Row ${processed + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
    }
  }

  return {
    sheet: 'VOLUNTEER_HOURS',
    success: errors.length === 0,
    recordsProcessed: processed,
    errors,
  };
}

async function syncActivities(supabase: ReturnType<typeof createSupabaseServiceClient>): Promise<SyncResult> {
  const rows = await fetchSheet('ACTIVITIES');
  const errors: string[] = [];
  let processed = 0;

  for (const row of rows) {
    try {
      const data = mapActivityRow(row);
      
      if (!data.title || !data.activity_date) {
        continue;
      }

      const { error } = await supabase
        .from('activities')
        .upsert(
          data,
          { onConflict: 'title,activity_date' }
        );

      if (error) {
        errors.push(`Row ${processed + 1}: ${error.message}`);
      } else {
        processed++;
      }
    } catch (err) {
      errors.push(`Row ${processed + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
    }
  }

  return {
    sheet: 'ACTIVITIES',
    success: errors.length === 0,
    recordsProcessed: processed,
    errors,
  };
}

// Get last sync status
export async function getLastSyncStatus(): Promise<{
  lastSync: string | null;
  recentResults: Array<{
    sheet_name: string;
    success: boolean;
    records_processed: number;
    last_sync: string;
  }>;
}> {
  const supabase = createSupabaseServiceClient();

  const { data: recentSyncs } = await supabase
    .from('sync_log')
    .select('sheet_name, success, records_processed, last_sync')
    .eq('sync_type', 'google_sheets')
    .order('last_sync', { ascending: false })
    .limit(10);

  const lastSync = recentSyncs?.[0]?.last_sync ?? null;

  return {
    lastSync,
    recentResults: recentSyncs ?? [],
  };
}