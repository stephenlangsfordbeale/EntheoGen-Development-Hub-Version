import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFIDENCE_LEVELS,
  EVIDENCE_SUPPORT_TYPES,
  EVIDENCE_TIERS_V2,
  INTERACTION_CODES_V2,
  MECHANISM_CATEGORIES_V2
} from '../src/data/interactionSchemaV2';

type Json = Record<string, unknown>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const agentDir = path.join(root, 'packages/agents/knowledge_steward');

const asObject = (value: unknown, label: string): Json => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Json;
};

const asArray = (value: unknown, label: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
};

const requireKeys = (value: Json, keys: string[], label: string): void => {
  for (const key of keys) {
    if (!(key in value)) {
      throw new Error(`${label} missing required key: ${key}`);
    }
  }
};

const enumValuesFromSchema = (schema: Json, property: string): string[] => {
  const properties = asObject(schema.properties, 'schema.properties');
  const node = asObject(properties[property], `schema.properties.${property}`);
  return asArray(node.enum, `${property}.enum`) as string[];
};

const assertSubset = (actual: string[], allowed: readonly string[], label: string): void => {
  const unknown = actual.filter((value) => !allowed.includes(value));
  if (unknown.length > 0) {
    throw new Error(`${label} includes values not present in current repo enums: ${unknown.join(', ')}`);
  }
};

const constValue = (schema: Json, label: string): unknown => {
  if (!('const' in schema)) {
    throw new Error(`${label} must define a const`);
  }
  return schema.const;
};

const enumValues = (schema: Json, label: string): string[] => asArray(schema.enum, `${label}.enum`).map(String);

const run = async (): Promise<void> => {
  const [contractRaw, exampleRaw, claimSchemaRaw, sourceSchemaRaw] = await Promise.all([
    readFile(path.join(agentDir, 'output-contract.json'), 'utf8'),
    readFile(path.join(agentDir, 'examples/interaction-draft.example.json'), 'utf8'),
    readFile(path.join(root, 'knowledge-base/schemas/claim.schema.json'), 'utf8'),
    readFile(path.join(root, 'knowledge-base/schemas/source.schema.json'), 'utf8')
  ]);

  const contract = asObject(JSON.parse(contractRaw), 'contract');
  const example = asObject(JSON.parse(exampleRaw), 'example');
  const claimSchema = asObject(JSON.parse(claimSchemaRaw), 'claim schema');
  const sourceSchema = asObject(JSON.parse(sourceSchemaRaw), 'source schema');

  const requiredOutputKeys = [
    'output_type',
    'agent',
    'role',
    'contract_version',
    'draft_status',
    'boundaries',
    'source_context',
    'record_draft',
    'extracted_from_source',
    'inferred_or_suggested',
    'uncertain_or_missing',
    'provenance_map',
    'validation_notes',
    'duplicate_conflict_checks',
    'reviewer_next_action',
    'prohibited_assertions_check'
  ];

  const contractRequired = asArray(contract.required, 'contract.required').map(String);
  for (const key of requiredOutputKeys) {
    if (!contractRequired.includes(key)) {
      throw new Error(`contract.required missing key: ${key}`);
    }
  }

  const properties = asObject(contract.properties, 'contract.properties');
  requireKeys(properties, requiredOutputKeys, 'contract.properties');

  requireKeys(
    example,
    [
      'output_type',
      'role',
      'contract_version',
      'draft_status',
      'boundaries',
      'source_context',
      'record_draft',
      'extracted_from_source',
      'inferred_or_suggested',
      'uncertain_or_missing',
      'provenance_map',
      'validation_notes',
      'duplicate_conflict_checks',
      'reviewer_next_action',
      'prohibited_assertions_check'
    ],
    'example'
  );

  const boundariesSchema = asObject(properties.boundaries, 'contract.properties.boundaries');
  const boundariesProperties = asObject(boundariesSchema.properties, 'contract.properties.boundaries.properties');
  const draftOnlySchema = asObject(boundariesProperties.draft_only, 'contract.properties.boundaries.properties.draft_only');
  const humanApprovalSchema = asObject(boundariesProperties.human_approval_required, 'contract.properties.boundaries.properties.human_approval_required');
  if (constValue(draftOnlySchema, 'draft_only') !== true || constValue(humanApprovalSchema, 'human_approval_required') !== true) {
    throw new Error('contract boundaries must keep draft_only and human_approval_required true');
  }

  const exampleBoundariesForProhibited = asObject(example.boundaries, 'example.boundaries');
  const prohibited = asArray(exampleBoundariesForProhibited.prohibited, 'example.boundaries.prohibited');
  for (const requiredPhrase of ['inventing evidence', 'collapsing uncertainty into fact', 'implying publication authority']) {
    if (!prohibited.some((item) => String(item).includes(requiredPhrase))) {
      throw new Error(`example prohibited list must include: ${requiredPhrase}`);
    }
  }

  const recordDraftSchema = asObject(properties.record_draft, 'contract.properties.record_draft');
  const recordDraftProperties = asObject(recordDraftSchema.properties, 'contract.properties.record_draft.properties');
  const targetSurfaceSchema = asObject(recordDraftProperties.target_surface, 'contract.properties.record_draft.properties.target_surface');

  const targetSurfaces = asArray(targetSurfaceSchema.enum, 'contract record_draft target_surface enum').map(String);
  for (const surface of ['knowledge-base/extracted/claims/pending', 'src/curation/interaction-updates.jsonl']) {
    if (!targetSurfaces.includes(surface)) {
      throw new Error(`contract target_surfaces must include ${surface}`);
    }
  }

  const defs = asObject(contract.$defs, 'contract.$defs');
  const confidenceDef = asObject(defs.confidence, 'contract.$defs.confidence');
  const supportTypeDef = asObject(defs.supportType, 'contract.$defs.supportType');
  const claimTypeDef = asObject(defs.claimType, 'contract.$defs.claimType');
  assertSubset(enumValues(confidenceDef, 'contract.$defs.confidence'), CONFIDENCE_LEVELS, 'confidence');
  assertSubset(enumValues(supportTypeDef, 'contract.$defs.supportType'), EVIDENCE_SUPPORT_TYPES, 'supportType');
  assertSubset(
    enumValues(claimTypeDef, 'contract.$defs.claimType'),
    enumValuesFromSchema(claimSchema, 'claim_type'),
    'claimType'
  );

  const exampleBoundaries = asObject(example.boundaries, 'example.boundaries');
  if (exampleBoundaries.draft_only !== true || exampleBoundaries.human_approval_required !== true) {
    throw new Error('example boundaries must keep draft_only and human_approval_required true');
  }

  const extracted = asObject(example.extracted_from_source, 'example.extracted_from_source');
  const inferred = asObject(example.inferred_or_suggested, 'example.inferred_or_suggested');
  const uncertain = asObject(example.uncertain_or_missing, 'example.uncertain_or_missing');
  if (Object.keys(extracted).length === 0 || Object.keys(inferred).length === 0 || Object.keys(uncertain).length === 0) {
    throw new Error('example must keep extracted, inferred, and uncertain sections populated separately');
  }

  const duplicateConflictChecks = asObject(example.duplicate_conflict_checks, 'example.duplicate_conflict_checks');
  requireKeys(duplicateConflictChecks, ['possible_duplicates', 'possible_conflicts', 'checked_surfaces'], 'example.duplicate_conflict_checks');

  const sourceContext = asObject(example.source_context, 'example.source_context');
  const sourceContextSchema = asObject(properties.source_context, 'contract.properties.source_context');
  const sourceContextProperties = asObject(sourceContextSchema.properties, 'contract.properties.source_context.properties');
  const inputTypeSchema = asObject(sourceContextProperties.input_type, 'contract.properties.source_context.properties.input_type');
  if (!enumValues(inputTypeSchema, 'source_context.input_type').includes(String(sourceContext.input_type))) {
    throw new Error(`example source_context.input_type is not allowed: ${sourceContext.input_type}`);
  }

  const recordDraftExample = asObject(example.record_draft, 'example.record_draft');
  const operationSchema = asObject(recordDraftProperties.operation, 'contract.properties.record_draft.properties.operation');
  if (!targetSurfaces.includes(String(recordDraftExample.target_surface))) {
    throw new Error(`example record_draft.target_surface is not allowed: ${recordDraftExample.target_surface}`);
  }
  if (!enumValues(operationSchema, 'record_draft.operation').includes(String(recordDraftExample.operation))) {
    throw new Error(`example record_draft.operation is not allowed: ${recordDraftExample.operation}`);
  }

  const payload = asObject(recordDraftExample.payload, 'example.record_draft.payload');
  const requestedChange = asObject(payload.requested_change, 'example.record_draft.payload.requested_change');
  requireKeys(
    requestedChange,
    [
      'clinical_summary.headline',
      'clinical_summary.mechanism',
      'clinical_summary.timing_guidance',
      'clinical_summary.field_notes'
    ],
    'example.record_draft.payload.requested_change'
  );
  if ('clinical_summary.practical_guidance' in requestedChange) {
    throw new Error('example requested_change must use clinical_summary.field_notes instead of stale practical_guidance');
  }
  assertSubset([String(requestedChange['classification.code'])], INTERACTION_CODES_V2, 'example classification.code');
  assertSubset([String(requestedChange['classification.confidence'])], CONFIDENCE_LEVELS, 'example classification.confidence');
  assertSubset([String(requestedChange['mechanism.primary_category'])], MECHANISM_CATEGORIES_V2, 'example mechanism.primary_category');
  assertSubset(asArray(requestedChange['mechanism.categories'], 'example mechanism.categories').map(String), MECHANISM_CATEGORIES_V2, 'example mechanism.categories');
  assertSubset([String(requestedChange['evidence.tier'])], EVIDENCE_TIERS_V2, 'example evidence.tier');
  assertSubset(asArray(requestedChange['evidence.support_type'], 'example evidence.support_type').map(String), EVIDENCE_SUPPORT_TYPES, 'example evidence.support_type');

  const extractedClaims = asArray(extracted.direct_claims, 'example.extracted_from_source.direct_claims').map((claim, index) =>
    asObject(claim, `example.extracted_from_source.direct_claims[${index}]`)
  );
  for (const claim of extractedClaims) {
    assertSubset([String(claim.claim_type)], enumValuesFromSchema(claimSchema, 'claim_type'), 'example extracted claim_type');
  }

  const sourceRefs = asArray(extracted.source_refs, 'example.extracted_from_source.source_refs').map((ref, index) =>
    asObject(ref, `example.extracted_from_source.source_refs[${index}]`)
  );
  for (const ref of sourceRefs) {
    assertSubset([String(ref.claim_support)], EVIDENCE_SUPPORT_TYPES, 'example source_ref claim_support');
  }

  const reviewerNextAction = asObject(example.reviewer_next_action, 'example.reviewer_next_action');
  if (reviewerNextAction.human_approval_required !== true) {
    throw new Error('example reviewer next action must require human approval');
  }

  const prohibitedCheck = asObject(example.prohibited_assertions_check, 'example.prohibited_assertions_check');
  for (const [key, value] of Object.entries(prohibitedCheck)) {
    if (value !== true) {
      throw new Error(`example prohibited assertion check must keep ${key} true`);
    }
  }

  console.log('Knowledge Steward contract verification passed.');
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
