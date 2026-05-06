# Private student beta: Linear workflow and cross-tool links

**Linear** is the operational hub for this project. Jira and Confluence stay useful for reporting and narrative; link them from Linear instead of duplicating full specs in multiple tools.

Linear project: [Private student beta test launch](https://linear.app/new-psychonaut/project/private-student-beta-test-launch-b463284ce5ed/overview).

## Which Confluence URL to share

Per your governance model: **stakeholder-facing** shares should use the **stakeholder landing page** ([Private (student) Beta Test Launch](https://newpsychonaut.atlassian.net/wiki/spaces/~71202004f7183a64314c4abe4ce332b12ef0fb/pages/2719971))—scope, target window, resources, work breakdown, and Jira board / PSBTL-1 links. The **governance** page ([Optimising Project Management…](https://newpsychonaut.atlassian.net/wiki/spaces/~71202004f7183a64314c4abe4ce332b12ef0fb/pages/2719961)) explains *how* the tools relate; keep it as internal policy, not the primary navigation centre.

## Jira ↔ Linear milestones (PSBTL)

Parent epic: [PSBTL-1](https://newpsychonaut.atlassian.net/browse/PSBTL-1). Sub-tasks align to Linear milestones (all **To Do** until work starts—no sync conflict while both stay at zero progress).

| Jira key | Summary |
|----------|---------|
| [PSBTL-2](https://newpsychonaut.atlassian.net/browse/PSBTL-2) | Minimum viable Beta |
| [PSBTL-3](https://newpsychonaut.atlassian.net/browse/PSBTL-3) | Volunteer experience standards |
| [PSBTL-4](https://newpsychonaut.atlassian.net/browse/PSBTL-4) | Collaborator experience standards |
| [PSBTL-5](https://newpsychonaut.atlassian.net/browse/PSBTL-5) | Communications strategy |
| [PSBTL-6](https://newpsychonaut.atlassian.net/browse/PSBTL-6) | Influencer communications strategy |

## Issue fields to add in Linear

Configure these as **custom fields** or standard **links**, depending on what your Linear workspace tier supports. Prefer URL fields or link integrations so issues stay scannable.

| Field label | Type | Purpose |
|-------------|------|---------|
| **Jira link** | URL | Pointer to the mirrored or parent Jira issue when one exists (reporting/ceremony). Empty if Jira not created yet. |
| **Confluence link** | URL | Spec, runbook, or **stakeholder landing** page—default to [2719971](https://newpsychonaut.atlassian.net/wiki/spaces/~71202004f7183a64314c4abe4ce332b12ef0fb/pages/2719971) for project-level issues unless a deeper doc applies. |
| **GitLab MR** | URL | Primary merge request for implementation (use MR link, not bare branch name). |
| **Deployment notes** | Short text (optional) | One line: staging verified / prod release tag—avoid duplicating GitLab pipeline history. |

### How to add them (Linear UI)

1. **Workspace settings → Custom fields** (or **Team settings → Fields**): create URL-type fields for Jira, Confluence, and GitLab MR where available.
2. For the **Private student beta** project, add these fields to the default **issue layout** so every new issue prompts for links when relevant.
3. Optionally create **issue templates** for “Feature”, “Bug”, and “DevOps” that pre-fill instructions: “Link Jira if required by org; link Confluence doc; paste MR when opened.”

## Linking discipline

- **One source of status:** Engineering progress and blocking discussion stay in **Linear** comments and state.
- **Jira:** Update Jira only if required for org SLAs; otherwise paste **Linear issue URL** into Jira description once and maintain status in Linear only (see [LINEAR_JIRA_SYNC_POLICY.md](./LINEAR_JIRA_SYNC_POLICY.md)).
- **Confluence:** Link **out** from Linear to Confluence for long-form specs; avoid copying full specs into Linear descriptions—use a summary + link.
- **GitLab:** MR is the implementation record; Linear issue links **to** MR; close Linear when MR merges and staging acceptance is done (define done in your team).

## Example issue description footer

Paste at the bottom of substantial issues for consistency:

```text
Links:
- Jira: 
- Confluence: 
- GitLab MR: 
```

## Related

- [ENVIRONMENTS.md](./ENVIRONMENTS.md)
- [GITLAB_GUARDRAILS.md](./GITLAB_GUARDRAILS.md)
