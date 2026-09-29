import { writable } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';
import type { Member } from '$lib/types';

export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const member = writable<Member | null>(null);
export const loading = writable(true);
