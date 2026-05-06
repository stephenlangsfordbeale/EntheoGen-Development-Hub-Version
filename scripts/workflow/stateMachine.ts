export const WORKFLOW_STATES = [
  'submitted',
  'structured',
  'curator_review',
  'safety_review',
  'approved',
  'published',
  'archived',
  'blocked'
] as const;

export type WorkflowState = (typeof WORKFLOW_STATES)[number];

export const PUBLISH_LANE = [
  'submitted',
  'structured',
  'curator_review',
  'safety_review',
  'approved',
  'published'
] as const satisfies readonly WorkflowState[];

type AllowedTransitions = Record<WorkflowState, readonly WorkflowState[]>;

const ALLOWED_TRANSITIONS: AllowedTransitions = {
  submitted: ['structured', 'blocked', 'archived'],
  structured: ['curator_review', 'blocked', 'archived'],
  curator_review: ['structured', 'safety_review', 'blocked', 'archived'],
  safety_review: ['curator_review', 'approved', 'blocked', 'archived'],
  approved: ['safety_review', 'published', 'blocked', 'archived'],
  published: ['safety_review', 'blocked', 'archived'],
  archived: ['structured', 'curator_review', 'safety_review'],
  blocked: ['structured', 'curator_review', 'safety_review', 'archived']
};

export interface WorkflowTransitionValidation {
  allowed: boolean;
  reason?: string;
}

export interface WorkflowTransition {
  from: WorkflowState;
  to: WorkflowState;
  actor: string;
  at: string;
  note?: string;
}

export interface WorkflowRecord {
  id: string;
  state: WorkflowState;
  transition_history: WorkflowTransition[];
}

interface TransitionContext {
  actor: string;
  at?: string;
  note?: string;
}

const laneIndex = (state: WorkflowState): number => PUBLISH_LANE.indexOf(state as (typeof PUBLISH_LANE)[number]);

export function getAllowedTransitions(state: WorkflowState): readonly WorkflowState[] {
  return ALLOWED_TRANSITIONS[state];
}

export function validateWorkflowTransition(from: WorkflowState, to: WorkflowState): WorkflowTransitionValidation {
  if (from === to) {
    return {
      allowed: false,
      reason: `No-op transition is not allowed (${from} -> ${to}).`
    };
  }

  if (to === 'published' && from !== 'approved') {
    return {
      allowed: false,
      reason: `Direct publishing is forbidden (${from} -> published).`
    };
  }

  const currentIndex = laneIndex(from);
  const nextIndex = laneIndex(to);
  if (currentIndex >= 0 && nextIndex >= 0 && nextIndex > currentIndex + 1) {
    return {
      allowed: false,
      reason: `State skipping is forbidden (${from} -> ${to}).`
    };
  }

  const allowedTargets = getAllowedTransitions(from);
  if (!allowedTargets.includes(to)) {
    return {
      allowed: false,
      reason: `Transition ${from} -> ${to} is not allowed by workflow policy.`
    };
  }

  return { allowed: true };
}

export function assertWorkflowTransition(from: WorkflowState, to: WorkflowState): void {
  const decision = validateWorkflowTransition(from, to);
  if (!decision.allowed) {
    throw new Error(decision.reason ?? `Invalid workflow transition (${from} -> ${to}).`);
  }
}

export function applyWorkflowTransition(
  record: WorkflowRecord,
  to: WorkflowState,
  context: TransitionContext
): WorkflowRecord {
  assertWorkflowTransition(record.state, to);

  const transition: WorkflowTransition = {
    from: record.state,
    to,
    actor: context.actor,
    at: context.at ?? new Date().toISOString(),
    note: context.note
  };

  return {
    ...record,
    state: to,
    transition_history: [...record.transition_history, transition]
  };
}
