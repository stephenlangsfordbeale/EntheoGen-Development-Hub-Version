# <change title>

Template note: this template is reviewer guidance only. Missing fields must not
block PR creation, CI, review, or merge.

Provenance timestamp: <YYYY-MM-DDTHH:mm:ssZ>

## Control Plane

- Work source/provenance: <Linear issue if relevant, direct user request, maintenance context, or other source>
- Executor/delegate: <Codex | Cursor | Copilot | human>
- Branch/commits: <branch name and commit range or key commits>
- PR flow expectation: <not_required | recommended | required_for_publication | already_published_or_retired>

## Intake

- Source: <Linear issue, report path, source IDs, or manual note>
- Priority: <howler | dataset-hole | other>
- Target: <substance pair or surface>
- Intake path: <rapid manual | submission intake | not applicable>

## Preview

Example UI readout or reviewer-facing summary:

## Deployment Awareness

- [ ] No runtime/deployment impact
- [ ] App data/readout change covered by validation
- [ ] Cloudflare assets behavior unchanged
- [ ] Azure deploy guards expected to pass
- [ ] GitHub Actions checks expected to pass

## Execution Trace

- Changed surfaces:
- Commands run:
- Generated or review artifacts:
- Residual risks:

## Human Approval Boundary

- [ ] PR records available provenance without treating Linear as required.
- [ ] Merge decision remains human-controlled.
- [ ] Publication, deployment, safety, and dataset approval remain human-controlled.
- [ ] Linear state and automation output are not treated as approval artifacts.

## Verification

- [ ] Not run
- [ ] `npm run test:submission-intake`
- [ ] `npm run validate:interactions:v2`
- [ ] `npm run test:ui-adapter`
- [ ] `npm run typecheck`
- [ ] `npm run build`

Notes:
