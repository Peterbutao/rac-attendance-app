const SHEET_ID = '1L_bAun4U7dfhDR2WJHGHlT5CW3tfTKwDs_3qN0pOddk';

function parseCSV(text: string) {
  function splitLine(line: string) {
    const fields: string[] = [];
    let current = '';
    let inQuote = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (inQuote && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuote = !inQuote;
        }
      } else if (character === ',' && !inQuote) {
        fields.push(current);
        current = '';
      } else {
        current += character;
      }
    }

    fields.push(current);
    return fields;
  }

  const lines = text.trim().split('\n').filter(Boolean);
  if (!lines.length) return [];

  const headers = splitLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const columns = splitLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, (columns[index] ?? '').trim()]));
  });
}

async function fetchSheet(sheetName: string) {
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`);
  if (!response.ok) {
    console.error(`fetchSheet(${sheetName}) failed: ${response.status}`);
    return [];
  }

  return parseCSV(await response.text());
}

function eventType(row: Record<string, string>) {
  const value = String(row.event_type ?? row.type ?? row.category ?? row.tags ?? '').toLowerCase();
  if (value.includes('activ') || value.includes('volunteer') || value.includes('service') || value.includes('project')) {
    return 'activity';
  }
  if (value.includes('meeting')) return 'meeting';
  return 'event';
}

function eventDate(row: Record<string, string>) {
  const value = row.activity_date ?? row.event_date ?? row.project_date ?? row.date ?? '';
  const isoDate = value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export type ActivityEvent = Record<string, string | null> & {
  event_key: string;
  event_type: 'activity' | 'meeting' | 'event' | 'project';
  event_date: string | null;
};

export async function fetchActivityEvents(): Promise<ActivityEvent[]> {
  return (await fetchSheet('ACTIVITES')).map((row) => {
    const title = row.title || 'Untitled event';
    const date = eventDate(row);
    const event_key = row.id || `${title}|${row.activity_date ?? row.date ?? ''}`;

    return {
      ...row,
      event_key,
      event_type: eventType(row),
      event_date: date
    };
  });
}

export async function fetchProjects(): Promise<ActivityEvent[]> {
  return (await fetchSheet('PROJECTS')).map((row) => {
    const title = row.title || row.name || row.project_name || 'Untitled project';
    const date = eventDate(row);

    return {
      ...row,
      title,
      event_key: `project:${row.id || `${title}|${row.activity_date ?? row.project_date ?? row.date ?? ''}`}`,
      event_type: 'project',
      event_date: date
    };
  });
}

export async function fetchAttendanceOptions(): Promise<ActivityEvent[]> {
  const [events, projects] = await Promise.all([fetchActivityEvents(), fetchProjects()]);
  return [...events, ...projects];
}
