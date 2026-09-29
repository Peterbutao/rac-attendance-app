export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface Member {
  id: number;
  user_id: string | null;
  rac_number: string;
  email: string;
  gmail: string | null;
  full_name: string;
  phone: string | null;
  occupation: string | null;
  skills: string | null;
  is_admin: boolean;
  status: MemberStatus;
  notes: string | null;
  joined_year: number | null;
  committee_onboarding_completed: boolean;
  committee_onboarding_skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Committee {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface MemberCommittee {
  id: number;
  member_id: number;
  committee_id: number;
  created_at: string;
}

export interface MemberDues {
  id: number;
  member_id: number;
  period: string;
  dues_required: number;
  dues_paid: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendance {
  id: number;
  member_id: number;
  meeting_date: string;
  attended: boolean;
  created_at: string;
}

export interface VolunteerHours {
  id: number;
  member_id: number;
  activity_name: string;
  hours: number;
  activity_date: string;
  created_at: string;
}

export interface Activity {
  id: number;
  title: string;
  activity_date: string;
  description: string | null;
  created_at: string;
}

export interface MemberActivity {
  id: number;
  member_id: number;
  activity_id: number;
  attended: boolean;
  created_at: string;
}

export interface PendingAttendance {
  id: number;
  member_id: number;
  event_key: string;
  event_name: string;
  event_type: 'activity' | 'meeting' | 'event' | 'project';
  event_date: string | null;
  volunteer_hours: number | null;
  guest_name: string | null;
  guest_email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface AttendanceGuest {
  id: number;
  pending_attendance_id: number;
  member_id: number;
  event_name: string;
  event_date: string | null;
  guest_name: string;
  guest_email: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface ActivityTag {
  id: number;
  activity_id: number;
  tag_id: number;
  created_at: string;
}

export interface MemberProfileSummary {
  member_id: number;
  dues_required: number;
  dues_paid: number;
  balance: number;
  meetings_recorded: number;
  meetings_attended: number;
  attendance_rate: number;
  volunteer_hours: number;
  activities_attended: number;
  member_points: number;
}

export interface JoinApplication {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  occupation: string;
  motivation: string;
  skills: string | null;
  status: ApplicationStatus;
  rac_number: string | null;
  rac_assigned_at: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface PartnershipInquiry {
  id: number;
  organization_name: string;
  contact_name: string;
  email: string;
  phone: string;
  partnership_type: string;
  message: string;
  status: 'new' | 'contacted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface DonationInterest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  message: string | null;
  status: 'new' | 'contacted' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface EndPolioProgress {
  device_key: string;
  user_id: string | null;
  progress: Record<string, boolean>;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'joined_year' | 'committee_onboarding_completed' | 'committee_onboarding_skipped_at' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Member, 'id' | 'joined_year' | 'created_at'>>;
      };
      committees: {
        Row: Committee;
        Insert: Omit<Committee, 'id' | 'created_at'>;
        Update: Partial<Omit<Committee, 'id' | 'created_at'>>;
      };
      member_committees: {
        Row: MemberCommittee;
        Insert: Omit<MemberCommittee, 'id' | 'created_at'>;
        Update: Partial<Omit<MemberCommittee, 'id' | 'created_at'>>;
      };
      member_dues: {
        Row: MemberDues;
        Insert: Omit<MemberDues, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MemberDues, 'id' | 'created_at'>>;
      };
      meeting_attendance: {
        Row: MeetingAttendance;
        Insert: Omit<MeetingAttendance, 'id' | 'created_at'>;
        Update: Partial<Omit<MeetingAttendance, 'id' | 'created_at'>>;
      };
      volunteer_hours: {
        Row: VolunteerHours;
        Insert: Omit<VolunteerHours, 'id' | 'created_at'>;
        Update: Partial<Omit<VolunteerHours, 'id' | 'created_at'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'>;
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>;
      };
      member_activities: {
        Row: MemberActivity;
        Insert: Omit<MemberActivity, 'id' | 'created_at'>;
        Update: Partial<Omit<MemberActivity, 'id' | 'created_at'>>;
      };
      pending_attendance: {
        Row: PendingAttendance;
        Insert: Omit<PendingAttendance, 'id' | 'status' | 'reviewed_by' | 'reviewed_at' | 'rejection_reason' | 'created_at'>;
        Update: Partial<Omit<PendingAttendance, 'id' | 'member_id' | 'created_at'>>;
      };
      attendance_guests: {
        Row: AttendanceGuest;
        Insert: Omit<AttendanceGuest, 'id' | 'created_at'>;
        Update: Partial<Omit<AttendanceGuest, 'id' | 'created_at'>>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'created_at'>;
        Update: Partial<Omit<Tag, 'id' | 'created_at'>>;
      };
      activity_tags: {
        Row: ActivityTag;
        Insert: Omit<ActivityTag, 'id' | 'created_at'>;
        Update: Partial<Omit<ActivityTag, 'id' | 'created_at'>>;
      };
      join_applications: {
        Row: JoinApplication;
        Insert: Omit<JoinApplication, 'id' | 'status' | 'rac_number' | 'rac_assigned_at' | 'rejection_reason' | 'reviewed_by' | 'submitted_at' | 'created_at' | 'updated_at'>;
        Update: Partial<Pick<JoinApplication, 'status' | 'rac_number' | 'rac_assigned_at' | 'rejection_reason' | 'reviewed_by' | 'updated_at'>>;
      };
      partnership_inquiries: {
        Row: PartnershipInquiry;
        Insert: Omit<PartnershipInquiry, 'id' | 'status' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PartnershipInquiry, 'id' | 'created_at'>>;
      };
      donation_interests: {
        Row: DonationInterest;
        Insert: Omit<DonationInterest, 'id' | 'status' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DonationInterest, 'id' | 'created_at'>>;
      };
      endpolio_progress: {
        Row: EndPolioProgress;
        Insert: Pick<EndPolioProgress, 'device_key'> & Partial<Omit<EndPolioProgress, 'device_key' | 'updated_at'>>;
        Update: Partial<Omit<EndPolioProgress, 'device_key'>>;
      };
    };
    Views: {
      pending_applications_view: { Row: JoinApplication };
      active_members_view: { Row: Omit<Member, 'notes'> };
      member_profile_summary: { Row: MemberProfileSummary };
    };
    Functions: {
      is_current_user_admin: { Returns: boolean };
    };
  };
}
