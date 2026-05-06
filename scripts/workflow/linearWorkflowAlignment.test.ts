import assert from 'node:assert/strict';
import { WORKFLOW_STATES } from './stateMachine';
import {
  getLinearWorkflowAlignment,
  listLinearWorkflowAlignments,
  type LinearIssueStateName,
  type GitHubPrFlowExpectation
} from './linearWorkflowAlignment';

const allowedLinearStates = new Set<LinearIssueStateName>([
  'Backlog',
  'Todo',
  'In Progress',
  'In Review',
  'Done',
  'Canceled',
  'Duplicate'
]);

const allowedGithubPrFlows = new Set<GitHubPrFlowExpectation>([
  'not_required',
  'recommended',
  'required_for_publication',
  'already_published_or_retired'
]);

const allMappings = listLinearWorkflowAlignments();
assert.strictEqual(allMappings.length, WORKFLOW_STATES.length, 'all workflow states should have alignment mappings');

for (const workflowState of WORKFLOW_STATES) {
  const mapping = getLinearWorkflowAlignment(workflowState);
  assert.ok(allowedLinearStates.has(mapping.linearState), `invalid linear state mapping for ${workflowState}`);
  assert.ok(mapping.ownerRole.length > 0, `missing owner role mapping for ${workflowState}`);
  assert.ok(mapping.reviewAction.trim().length > 0, `missing review action mapping for ${workflowState}`);
  assert.ok(allowedGithubPrFlows.has(mapping.githubPrFlow), `invalid github PR flow mapping for ${workflowState}`);
  assert.ok(mapping.rationale.trim().length > 0, `missing rationale for ${workflowState}`);
}

assert.strictEqual(getLinearWorkflowAlignment('published').linearState, 'Done');
assert.strictEqual(getLinearWorkflowAlignment('approved').linearState, 'In Review');
assert.strictEqual(getLinearWorkflowAlignment('blocked').linearState, 'Todo');
assert.strictEqual(getLinearWorkflowAlignment('approved').githubPrFlow, 'required_for_publication');
assert.strictEqual(getLinearWorkflowAlignment('published').githubPrFlow, 'already_published_or_retired');

console.log('workflow-linear alignment assertions passed');
