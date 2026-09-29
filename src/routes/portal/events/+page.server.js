import { fetchActivityEvents } from '$lib/server/activity-events';

export async function load() {
  return { ACTIVITES: await fetchActivityEvents() };
}
