# Excel/Google Sheets Data Format Requirements

This document specifies the exact data format, types, and column names required for the RAC website Google Sheets sync to work properly.

## Overview

The website syncs data from 4 Google Sheets:
1. **MEMBER_DUES** - Tracks member dues payments
2. **MEETING_ATTENDANCE** - Tracks meeting attendance
3. **VOLUNTEER_HOURS** - Tracks volunteer activities
4. **ACTIVITIES** - Defines activities that members can attend

## Google Sheet Configuration

- **Sheet ID**: `1L_bAun4U7dfhDR2WJHGHlT5CW3tfTKwDs_3qN0pOddk`
- **Sync Frequency**: Every 5 minutes (rate limited)
- **Format**: CSV export via Google Sheets API

---

## Sheet 1: MEMBER_DUES

**Purpose**: Track member dues payments per period

### Required Columns

| Column Name | Data Type | Format | Example | Notes |
|-------------|-----------|--------|---------|-------|
| `member_id` | Integer | Whole number | `123` | Must match existing member ID in database |
| `period` | String | YYYY-MM or YYYY | `2025-01` or `2025` | Dues period identifier |
| `dues_required` | Number | Decimal | `100.00` | Amount required for the period |
| `dues_paid` | Number | Decimal | `50.00` | Amount actually paid |

### Column Name Variations Supported
- `member_id` or `id`
- `period` or `dues_period`
- `dues_required` or `required`
- `dues_paid` or `paid`

### Sample Data
```
member_id,period,dues_required,dues_paid
1,2025-01,100.00,100.00
2,2025-01,100.00,50.00
3,2025-01,100.00,0.00
```

### Logic
- **Balance** is calculated as: `dues_required - dues_paid`
- Balance is displayed in the member profile summary view
- Rows without `member_id` or `period` are skipped

---

## Sheet 2: MEETING_ATTENDANCE

**Purpose**: Track which members attended which meetings

### Required Columns

| Column Name | Data Type | Format | Example | Notes |
|-------------|-----------|--------|---------|-------|
| `member_id` | Integer | Whole number | `123` | Must match existing member ID |
| `meeting_date` | String | YYYY-MM-DD | `2025-01-15` | Date of the meeting |
| `attended` | Boolean | Text | `true`, `yes`, `1`, `present`, `✓` | Case-insensitive |

### Column Name Variations Supported
- `member_id` or `id`
- `meeting_date` or `date`
- `attended` or `present`

### Accepted Values for `attended`
- `true`, `True`, `TRUE`
- `yes`, `Yes`, `YES`
- `1`
- `present`, `Present`, `PRESENT`
- `✓`
- Any other value = `false`

### Sample Data
```
member_id,meeting_date,attended
1,2025-01-15,true
2,2025-01-15,yes
3,2025-01-15,false
1,2025-01-22,present
2,2025-01-22,✓
```

### Calculated Fields
- `meetings_recorded`: Total number of meetings for the member
- `meetings_attended`: Count of meetings where `attended = true`
- `attendance_rate`: `(meetings_attended / meetings_recorded) * 100`

### Logic
- Conflict resolution: `ON CONFLICT (member_id, meeting_date)` - updates existing record
- Rows without `member_id` or `meeting_date` are skipped

---

## Sheet 3: VOLUNTEER_HOURS

**Purpose**: Track volunteer hours per activity

### Required Columns

| Column Name | Data Type | Format | Example | Notes |
|-------------|-----------|--------|---------|-------|
| `member_id` | Integer | Whole number | `123` | Must match existing member ID |
| `activity_name` | String | Text | `Beach Cleanup` | Name of the volunteer activity |
| `hours` | Number | Decimal | `4.5` | Hours volunteered |
| `activity_date` | String | YYYY-MM-DD | `2025-01-20` | Date of the activity |

### Column Name Variations Supported
- `member_id` or `id`
- `activity_name` or `activity`
- `hours` (no variations)
- `activity_date` or `date`

### Sample Data
```
member_id,activity_name,hours,activity_date
1,Beach Cleanup,4.5,2025-01-20
2,Food Drive,3.0,2025-01-20
3,Beach Cleanup,5.0,2025-01-20
```

### Logic
- **Total volunteer_hours** is summed from all records for each member
- Conflict resolution: `ON CONFLICT (member_id, activity_name, activity_date)`
- Rows without `member_id`, `activity_name`, or `activity_date` are skipped

---

## Sheet 4: ACTIVITIES

**Purpose**: Define activities that members can attend (separate from volunteer hours)

### Required Columns

| Column Name | Data Type | Format | Example | Notes |
|-------------|-----------|--------|---------|-------|
| `title` | String | Text | `Community Meeting` | Activity title/name |
| `activity_date` | String | YYYY-MM-DD | `2025-02-01` | Date of the activity |
| `description` | String | Text (optional) | `Monthly community gathering` | Activity description |

### Column Name Variations Supported
- `title` or `activity_name`
- `activity_date` or `date`
- `description` or `desc`

### Sample Data
```
title,activity_date,description
Community Meeting,2025-02-01,Monthly community gathering
Workshop,2025-02-05,Leadership workshop for members
Fundraising Event,2025-02-10,Annual fundraising dinner
```

### Logic
- Activities track member attendance separately from volunteer hours
- Conflict resolution: `ON CONFLICT (title, activity_date)` - updates if same title on same date
- Description is optional (can be empty or omitted)
- Rows without `title` or `activity_date` are skipped

---

## Data Validation Rules

### Common Requirements
1. **member_id**: Must be an integer that exists in the `members` table
2. **Dates**: Must be in `YYYY-MM-DD` format (ISO 8601)
3. **Numbers**: Decimal values allowed (e.g., `4.5` hours, `100.00` dues)
4. **Empty values**: Empty strings are treated as null/zero where appropriate
5. **Whitespace**: Leading/trailing whitespace is automatically trimmed

### Error Handling
- Invalid rows are skipped (not inserted/updated)
- Errors are logged in `sync_log` table
- Sync is rate-limited to once every 5 minutes
- Failed sheets don't block other sheets from syncing

---

## Member Profile Summary Fields

The following fields are calculated by the database view `member_profile_summary`:

| Field | Type | Calculation |
|-------|------|-------------|
| `member_id` | Integer | Member identifier |
| `dues_required` | Number | Sum of all `dues_required` from MEMBER_DUES |
| `dues_paid` | Number | Sum of all `dues_paid` from MEMBER_DUES |
| `balance` | Number | `dues_required - dues_paid` |
| `meetings_recorded` | Integer | Count of MEETING_ATTENDANCE records |
| `meetings_attended` | Integer | Count where `attended = true` |
| `attendance_rate` | Number | `(meetings_attended / meetings_recorded) * 100` |
| `volunteer_hours` | Number | Sum of `hours` from VOLUNTEER_HOURS |
| `activities_attended` | Integer | Count of member_activities where `attended = true` |
| `member_points` | Integer | Points accumulated (logic not shown in code) |

---

## Setup Instructions

### Google Sheets Setup
1. Create a Google Sheet with the name matching one of the 4 sheet names
2. Create columns using the **Required Columns** listed above
3. Column names are case-insensitive and will be normalized to lowercase with underscores
4. Share the sheet with the service account email (configured in Supabase)

### Excel to Google Sheets Migration
1. Open your Excel file
2. Go to Google Sheets → File → Import → Upload
3. Select your Excel file
4. Ensure the first row contains headers
5. Rename the sheet tab to match one of: `MEMBER_DUES`, `MEETING_ATTENDANCE`, `VOLUNTEER_HOURS`, `ACTIVITIES`

### Common Pitfalls to Avoid
- Don't use spaces in column names (they're converted to underscores)
- Don't use special characters in `member_id` (must be parseable as integer)
- Don't use ambiguous date formats (always YYYY-MM-DD)
- Don't leave required fields empty (`member_id`, `period` for dues, etc.)
- Don't create duplicate entries for the same member/period/activity combination without expecting updates

---

## Testing Your Data

To verify your data is formatted correctly:

1. Check the browser console for sync logs:
   ```
   [SYNC] fetchSheet(MEMBER_DUES) succeeded
   [SYNC] Sheet MEMBER_DUES: 45 records processed
   ```

2. Check the `sync_log` table in Supabase for errors:
   ```sql
   SELECT * FROM sync_log WHERE sync_type = 'google_sheets' ORDER BY last_sync DESC LIMIT 10;
   ```

3. Verify member profile summaries are populated:
   ```sql
   SELECT * FROM member_profile_summary LIMIT 10;
   ```

---

## Summary

- **4 sheets** need to be maintained: MEMBER_DUES, MEETING_ATTENDANCE, VOLUNTEER_HOURS, ACTIVITIES
- All sheets require **member_id** (except ACTIVITIES)
- Use **YYYY-MM-DD** for all dates
- Use **YYYY-MM** or **YYYY** for dues period
- Numeric fields accept decimals
- Boolean fields accept multiple text values
- Sync happens automatically every 5 minutes when the website is accessed

For questions or issues, check the `sync_log` table for error details.
