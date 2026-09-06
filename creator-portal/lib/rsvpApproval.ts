/**
 * Approval state derived from the columns rsvp_responses actually has
 * (requires_approval, approved_at, decline_reason). There is no
 * approval_status column — writing/filtering on it 500'd every RSVP submit.
 */

export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export function approvalStatusOf(r: {
  requires_approval?: boolean | null;
  approved_at?: string | null;
  decline_reason?: string | null;
}): ApprovalStatus {
  if (!r?.requires_approval) return 'approved';
  if (!r.approved_at) return 'pending';
  return r.decline_reason ? 'rejected' : 'approved';
}

/** PostgREST `.or()` filter selecting approved RSVPs. */
export const APPROVED_OR_FILTER =
  'requires_approval.eq.false,requires_approval.is.null,and(approved_at.not.is.null,decline_reason.is.null)';
