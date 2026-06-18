/**
 * /create is now an alias of the canonical creator at /creator.
 *
 * The full event-creation experience (Build → Review → Launch) lives in
 * app/creator/page.tsx. This server component permanently redirects any
 * traffic to /create over to /creator so existing links keep working.
 */
import { redirect } from 'next/navigation';

export default function CreateEventRedirect() {
  redirect('/creator');
}
