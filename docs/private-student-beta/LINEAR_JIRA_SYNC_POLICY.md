# Private student beta: Linear ↔ Jira sync policy

## Current snapshot (project kickoff)

As of the May 3 project update: Jira parent **PSBTL-1** and sub-tasks **PSBTL-2 … PSBTL-6** mirror the five Linear milestones; Confluence stakeholder landing includes Jira board and epic links; governance page defines Linear-first flow. While everything remains **To Do** / unmoved in Linear, status alignment is trivial—revisit this policy when states diverge.

## Evaluation

**Bidirectional** Linear ↔ Jira sync often creates:

- Duplicate issues and mismatched IDs after edits in one tool only.
- Status drift when workflows differ (Linear cycles vs Jira columns).
- Ongoing cleanup cost that competes with shipping the beta.

**Recommendation:** Default to **Linear-first** for the delivery team. Treat Jira as **ceremonial or reporting** when the org requires it: either **link-only** (paste Linear URL into Jira, update Jira status at milestones only) or **one-way automation** from Linear → Jira if your integration is reliable and owned by someone who fixes breakage.

## Policy

| Situation | Action |
|-----------|--------|
| Sync works reliably; minimal drift | Keep automation; review quarterly for duplicate noise. |
| Frequent duplicate tickets, wrong assignees, or manual merges | **Pause bidirectional sync.** Use Linear as source of truth; mirror status to Jira manually at sprint boundaries **or** use one-way Linear → Jira if available. |
| Jira required only for executives / SAFe reporting | Create **lightweight** Jira epics; link to Linear project; **do not** duplicate every sub-task in both tools. |
| Confluence needed | Single canonical doc per initiative; link from Linear and optionally from Jira **description** once. |

## When to “give up” on tight alignment

If maintaining Jira in lockstep with Linear costs more than **~30 minutes per week** of reconciliation, switch explicitly to:

1. **Linear** — day-to-day issues, priorities, and engineering discussion.
2. **Jira** — high-level epic keys only; status rolled up manually or via one-way export.
3. **Confluence** — narrative and runbooks; embed Linear **project** link at top of space index page.

Announce that policy in the team channel so stakeholders know where to look.

## Related

- [LINEAR_WORKFLOW_LINKS.md](./LINEAR_WORKFLOW_LINKS.md)
