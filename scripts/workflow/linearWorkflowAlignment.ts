import type { WorkflowState } from './stateMachine';

export type LinearIssueStateName =
  | 'Backlog'
  | 'Todo'
  | 'In Progress'
  | 'In Review'
  | 'Done'
  | 'Canceled'
  | 'Duplicate';

export type WorkflowOwnerRole =
  | 'Beta Coordinator / UX'
  | 'Data Curator'
  | 'Ethics Advisor'
  | 'Product Lead'
  | 'Technical Lead';

export type GitHubPrFlowExpectation =
  | 'not_required'
  | 'recommended'
  | 'required_for_publication'
  | 'already_published_or_retired';

export interface LinearWorkflowAlignment {
  workflowState: WorkflowState;
  linearState: LinearIssueStateName;
  ownerRole: WorkflowOwnerRole;
  reviewAction: string;
  githubPrFlow: GitHubPrFlowExpectation;
  rationale: string;
}

const WORKFLOW_TO_LINEAR_ALIGNMENT: Record<WorkflowState, Omit<LinearWorkflowAlignment, 'workflowState'>> = {
  submitted: {
    linearState: 'Todo',
    ownerRole: 'Beta Coordinator / UX',
    reviewAction: 'Triage intake and assign curator ownership.',
    githubPrFlow: 'not_required',
    rationale: 'New intake is ready for triage and structuring.'
  },
  structured: {
    linearState: 'In Progress',
    ownerRole: 'Data Curator',
    reviewAction: 'Structure payload and prepare curator review evidence.',
    githubPrFlow: 'recommended',
    rationale: 'Structured record is under active curation.'
  },
  curator_review: {
    linearState: 'In Progress',
    ownerRole: 'Data Curator',
    reviewAction: 'Resolve evidence conflicts and produce curator recommendation.',
    githubPrFlow: 'recommended',
    rationale: 'Curator is actively reviewing evidence and requested changes.'
  },
  safety_review: {
    linearState: 'In Review',
    ownerRole: 'Ethics Advisor',
    reviewAction: 'Perform safety/ethics review and record decision notes.',
    githubPrFlow: 'recommended',
    rationale: 'Record is awaiting safety/ethics review decision.'
  },
  approved: {
    linearState: 'In Review',
    ownerRole: 'Product Lead',
    reviewAction: 'Link approval evidence and stage publication through PR review.',
    githubPrFlow: 'required_for_publication',
    rationale: 'Approved content should remain review-visible until publication evidence is linked.'
  },
  published: {
    linearState: 'Done',
    ownerRole: 'Product Lead',
    reviewAction: 'Confirm publication evidence is linked and close workflow.',
    githubPrFlow: 'already_published_or_retired',
    rationale: 'Publication lane is complete with review evidence captured.'
  },
  archived: {
    linearState: 'Canceled',
    ownerRole: 'Product Lead',
    reviewAction: 'Record archive rationale and close active review lane.',
    githubPrFlow: 'already_published_or_retired',
    rationale: 'Record is intentionally retired from the active publication lane.'
  },
  blocked: {
    linearState: 'Todo',
    ownerRole: 'Technical Lead',
    reviewAction: 'Capture blocker details and assign explicit unblocking owner.',
    githubPrFlow: 'not_required',
    rationale: 'Blocked records need explicit unblocking ownership before active execution resumes.'
  }
};

export function getLinearWorkflowAlignment(workflowState: WorkflowState): LinearWorkflowAlignment {
  const mapping = WORKFLOW_TO_LINEAR_ALIGNMENT[workflowState];
  return {
    workflowState,
    linearState: mapping.linearState,
    ownerRole: mapping.ownerRole,
    reviewAction: mapping.reviewAction,
    githubPrFlow: mapping.githubPrFlow,
    rationale: mapping.rationale
  };
}

export function listLinearWorkflowAlignments(): LinearWorkflowAlignment[] {
  const states = Object.keys(WORKFLOW_TO_LINEAR_ALIGNMENT) as WorkflowState[];
  return states.map((workflowState) => getLinearWorkflowAlignment(workflowState));
}
