# Private student beta: environments

Canonical GitLab project: [private-student-beta-test-launch](https://gitlab.com/new-psychonaut/private-student-beta-test-launch).

Linear project (organisational hub): [Private student beta test launch](https://linear.app/new-psychonaut/project/private-student-beta-test-launch-b463284ce5ed/overview). Jira (**PSBTL**), Confluence hub pages, and stakeholder vs governance Confluence roles are listed in [README.md](./README.md).

Fill in URLs below when each **deployed app** environment is provisioned. **Do not** use production URLs for experimentation or deploy resets.

## Layers

| Layer | Purpose | Safe to reset | Typical audience |
|-------|---------|---------------|------------------|
| **Dev** | Local or personal sandbox; feature work | Yes (individual) | Engineers |
| **Staging** | Pre-production integration; MR previews; deploy experiments | Yes (team-owned) | Engineers + internal testers |
| **Production** | Live private beta users | **No** without change control | Beta cohort |

## Branch → environment mapping

Document your chosen convention and keep it aligned with GitLab protected branches and CI jobs.

| Branch / tag pattern | Deploy target | Notes |
|---------------------|---------------|--------|
| `main` (or `production`) | **Production** | Protected; merge via MR only; deploy from tagged releases or manual pipeline when ready. |
| `staging` (or `develop`) | **Staging** | Default integration branch for staging deploys and destructive experiments. |
| `feature/*`, MR pipelines | **Preview** (optional) | Per-MR environment if enabled in GitLab; otherwise merge to `staging` to verify. |

Adjust branch names to match the repo; update this table when you rename branches.

## URLs (fill in)

| Environment | Base URL | Deployed ref (branch/tag/commit) |
|-------------|----------|----------------------------------|
| Dev | _local / Codespace / not deployed_ | N/A |
| Staging | `_______________________________` | `staging` @ `________________` |
| Production | `_______________________________` | tag `________` or `main` @ `________` |

## Who deploys

| Action | Role | Channel / gate |
|--------|------|----------------|
| Merge to default integration branch | Maintainers / designated engineers | MR approval per [GITLAB_GUARDRAILS.md](./GITLAB_GUARDRAILS.md) |
| Deploy to **staging** | Same | CI job or manual job scoped to staging variables only |
| Deploy to **production** | Release owner (name: `____________`) | Explicit approval + production pipeline; no “run latest on prod” from dev laptops |
| Emergency production fix | Release owner + on-call | Document incident + post-deploy MR back to `main` |

## Reset behaviour

- **Staging:** Document the repeatable reset (compose/infra commands, DB seed, env file copy). Reset **staging** when testing destructive changes; never use production for this.
- **Production:** No “reset”; roll forward with migrations and fixes.

## Related

- [GITLAB_GUARDRAILS.md](./GITLAB_GUARDRAILS.md) — branch protection and CI variable separation.
- [LINEAR_WORKFLOW_LINKS.md](./LINEAR_WORKFLOW_LINKS.md) — issue metadata and cross-tool links.
