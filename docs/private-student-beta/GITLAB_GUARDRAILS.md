# Private student beta: GitLab guardrails

Apply these in the [GitLab project](https://gitlab.com/new-psychonaut/private-student-beta-test-launch). This document is the implementation checklist; GitLab UI/API changes must be done by someone with **Maintainer** (or equivalent) access.

## 1. Branch protection

In **Settings → Repository → Protected branches** (paths may vary slightly by GitLab version):

| Branch | Allowed to merge | Allowed to push | Allowed to force push |
|--------|-------------------|-----------------|------------------------|
| `main` (production) | Maintainers + MR approval | No direct push | **Off** |
| `staging` / integration branch | Developers via MR | Optional: Maintainers only | **Off** unless emergency policy |

**Goals:** production branch never receives unreviewed commits; no force-push on protected branches.

Optional: **Approval rules** (Premium/Ultimate) requiring N approvals on MRs targeting `main`.

## 2. Separate CI/CD variables (staging vs production)

**Rule:** Production secrets and endpoints must never be loaded in jobs that deploy to staging (and vice versa), unless you use a single multi-env job that selects **one** target explicitly via rules.

### Naming convention

Use explicit prefixes so accidents show up in review:

| Prefix | Use |
|--------|-----|
| `STAGING_*` | Staging URLs, API keys, DB URLs, deploy tokens for non-production |
| `PRODUCTION_*` | Production-only; referenced **only** in production deploy jobs |

Avoid generic names like `DATABASE_URL` at project level unless scoped to one environment.

### GitLab Environments

In **Operate → Environments**, define at least:

- `staging`
- `production`

Assign variables per **environment** where GitLab supports it (Environment scopes), so `DATABASE_URL` can exist twice with different scopes.

### Pipeline rules

- Jobs that deploy to **production** must include `rules:` or `only:` that restrict to `main`, tags, or manual production triggers—not every pipeline on every branch.
- Staging deploy jobs should run from `staging`/`develop` or MR pipelines **without** production credentials.

### Example `.gitlab-ci.yml` pattern (adapt to your stack)

```yaml
# Illustrative only — replace with your real jobs/images.

.deploy_template:
  script:
    - echo "Deploy using scoped variables for ${DEPLOY_ENV}"

deploy_staging:
  extends: .deploy_template
  environment:
    name: staging
    url: $STAGING_APP_URL
  rules:
    - if: $CI_COMMIT_BRANCH == "staging"

deploy_production:
  extends: .deploy_template
  environment:
    name: production
    url: $PRODUCTION_APP_URL
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/ # example: semver tags only
  when: manual
```

Store `STAGING_*` and `PRODUCTION_*` in GitLab CI/CD variables with **environment scope** matching `staging` / `production`.

## 3. Verification checklist

After configuration:

- [ ] MR required to merge into `main`; direct push disabled.
- [ ] Production deploy is manual or tag-gated; not automatic on every push.
- [ ] Staging pipeline succeeds without accessing `PRODUCTION_*` variables (inspect job log masks / variable presence in dry run).
- [ ] Rollback path documented (redeploy previous tag / revert MR).

## Related

- [ENVIRONMENTS.md](./ENVIRONMENTS.md) — who deploys and branch mapping.
