# Copilot Instructions

Use this repository as the operating source for EntheoGen changes.

## Scope

- App UI and adapters live under `src/`, especially `src/data/uiInteractions.ts`.
- Knowledge-base sources, claim artifacts, schemas, and indexes live under
  `knowledge-base/`.
- Repeatable data and validation work lives under `scripts/` and is exposed
  through `package.json` when it is part of the standard workflow.
- Repository layout notes live in `docs/REPO_LAYOUT.md`.

## Automation role

Automation may draft scoped changes, run local checks, and summarize residual
risks in PR-ready form. Humans retain final authority over safety
interpretation, publication, dataset acceptance, and high-impact product
decisions.

Do not treat external workspace playbooks, local cache folders, or absent paths
as operational facts for this repo. If a path, script, or workflow is not
present here, describe it as proposed work instead of relying on it.

Keep technical verification separate from project-management ceremony. Tests,
CI, scripts, and build checks should prove implementation behavior, data
validity, or build health. They must not fail because a PR lacks a Linear issue,
because provenance/checklist/template fields are incomplete, because a branch is
named differently, or because an agent/delegate label is absent. Treat those
fields as optional traceability notes unless a human explicitly requests
enforcement.

Before adding any test, script, CI check, or package command, confirm it proves
runtime, code, data, schema, build, or executable workflow behavior. Do not add
checks that assert Linear references, PR-template wording, branch names,
checklist completion, provenance fields, issue labels, agent identity, or
documentation anchors.

## Repo-local verification

Prefer the narrowest command that proves the change:

```sh
npm run test:submission-intake
npm run typecheck
npm run validate:interactions:v2
npm run kb:validate
npm test
```

For documentation-only edits, at minimum check Markdown diffs for stale paths,
commands that are not in `package.json`, and claims that imply autonomous
publication or medical authority.

For rapid manual submissions or natural-language report intake, use
`docs/automation/SUBMISSION_HOW_TO.md` as a reference. It does not replace the
existing parser, workflow transition scripts, prompt contracts, or review
gates.
