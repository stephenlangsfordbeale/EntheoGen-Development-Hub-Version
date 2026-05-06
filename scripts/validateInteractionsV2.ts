import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCanonicalDatasetSourcePaths } from './datasetPaths';
import {
  CONFIDENCE_LEVELS,
  DERIVATION_TYPES,
  EVIDENCE_STATUSES_V2,
  EVIDENCE_SUPPORT_TYPES,
  EVIDENCE_STRENGTHS_V2,
  EVIDENCE_TIERS_V2,
  INTERACTION_CODES_V2,
  INTERACTION_STATUSES,
  MECHANISM_CATEGORIES_V2,
  REVIEW_STATES_V2,
  SOURCE_KINDS,
  SOURCE_MATCH_TYPES_V2,
  VALIDATION_FLAGS_V2,
  type ValidationFlagV2,
  type InteractionDatasetV2
} from '../src/data/interactionSchemaV2';
import { isAggregateNodeId } from '../src/data/aggregateNodeDecomposition';
import { groupValidationFlags, VALIDATION_FLAG_SEVERITY } from '../src/data/evidenceEpistemics';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const datasetPath = process.env.INTERACTION_DATASET_V2_PATH ?? getCanonicalDatasetSourcePaths(root).interactionDatasetV2;

const expectedRiskByCode: Record<string, number | null> = {
  SELF: -1,
  UNKNOWN: 0,
  INFERRED: null,
  THEORETICAL: 2,
  DETERMINISTIC: null,
  LOW: 1,
  LOW_MOD: 2,
  CAUTION: 3,
  UNSAFE: 4,
  DANGEROUS: 5
};

const asSet = <T extends string>(values: readonly T[]) => new Set<string>(values);

const enums = {
  code: asSet(INTERACTION_CODES_V2),
  status: asSet(INTERACTION_STATUSES),
  confidence: asSet(CONFIDENCE_LEVELS),
  mechanism: asSet(MECHANISM_CATEGORIES_V2),
  evidenceTier: asSet(EVIDENCE_TIERS_V2),
  supportType: asSet(EVIDENCE_SUPPORT_TYPES),
  derivationType: asSet(DERIVATION_TYPES),
  sourceType: asSet(SOURCE_KINDS),
  validationFlag: asSet(VALIDATION_FLAGS_V2),
  evidenceStatus: asSet(EVIDENCE_STATUSES_V2),
  reviewState: asSet(REVIEW_STATES_V2)
};

const canonicalPairKey = (a: string, b: string): string => [a, b].sort().join('|');

const run = async (): Promise<void> => {
  const raw = await readFile(datasetPath, 'utf8');
  const dataset = JSON.parse(raw) as InteractionDatasetV2;

  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];
  const severityCounts = { critical: 0, warning: 0, info: 0 };

  const substanceIds = new Set(dataset.substances.map((s) => s.id));
  const pairKeys = new Set<string>();
  const activePairKeys = new Set<string>();
  const selfPairKeys = new Set<string>();
  const sourceIds = new Set(dataset.sources.map((s) => s.id));

  for (const source of dataset.sources) {
    if (!enums.sourceType.has(source.source_type)) {
      errors.push(`invalid source_type for source ${source.id}: ${source.source_type}`);
    }
  }

  for (const pair of dataset.pairs) {
    const [a, b] = pair.substances;
    const expectedKey = canonicalPairKey(a, b);
    if (pair.key !== expectedKey) {
      errors.push(`pair key mismatch for ${pair.key}; expected ${expectedKey}`);
    }

    if (pairKeys.has(pair.key)) {
      errors.push(`duplicate pair key: ${pair.key}`);
    }
    pairKeys.add(pair.key);

    if (!pair.provenance.deprecated) {
      if (activePairKeys.has(pair.key)) {
        errors.push(`duplicate active pair key: ${pair.key}`);
      }
      activePairKeys.add(pair.key);
    }

    if (!substanceIds.has(a) || !substanceIds.has(b)) {
      errors.push(`pair ${pair.key} references unknown substance id(s): ${a}, ${b}`);
    }

    if (!enums.code.has(pair.classification.code)) errors.push(`invalid code in ${pair.key}`);
    if (!enums.status.has(pair.classification.status)) errors.push(`invalid status in ${pair.key}`);
    if (!enums.confidence.has(pair.classification.confidence)) errors.push(`invalid confidence in ${pair.key}`);
    if (!enums.derivationType.has(pair.provenance.derivation_type)) errors.push(`invalid derivation type in ${pair.key}`);
    if (!enums.evidenceTier.has(pair.evidence.tier)) errors.push(`invalid evidence tier in ${pair.key}`);
    if (!enums.supportType.has(pair.evidence.support_type)) errors.push(`invalid support type in ${pair.key}`);

    if (pair.evidence.status && !enums.evidenceStatus.has(pair.evidence.status)) {
      errors.push(`invalid evidence status in ${pair.key}: ${pair.evidence.status}`);
    }
    if (pair.evidence.review_state && !enums.reviewState.has(pair.evidence.review_state)) {
      errors.push(`invalid evidence review_state in ${pair.key}: ${pair.evidence.review_state}`);
    }
    if (pair.evidence.evidence_strength && !EVIDENCE_STRENGTHS_V2.includes(pair.evidence.evidence_strength)) {
      errors.push(`invalid evidence_strength in ${pair.key}: ${pair.evidence.evidence_strength}`);
    }

    const groupedValidation = pair.validation?.flags;
    if (a !== b && !groupedValidation) {
      errors.push(`missing grouped validation flags in ${pair.key}`);
    }

    if (groupedValidation) {
      const grouped = groupValidationFlags([
        ...groupedValidation.critical,
        ...groupedValidation.warning,
        ...groupedValidation.info
      ]);
      const flatGroupedFlags = [...groupedValidation.critical, ...groupedValidation.warning, ...groupedValidation.info];
      const flatGroupedSet = new Set(flatGroupedFlags);
      const flatAuditSet = new Set(pair.audit.validation_flags);

      if (flatGroupedFlags.length !== flatGroupedSet.size) {
        errors.push(`duplicate validation flag in grouped output for ${pair.key}`);
      }
      if (flatGroupedSet.size !== flatAuditSet.size || [...flatGroupedSet].some((flag) => !flatAuditSet.has(flag))) {
        errors.push(`grouped validation flags do not match audit.validation_flags in ${pair.key}`);
      }

      for (const flag of groupedValidation.critical) {
        if (VALIDATION_FLAG_SEVERITY[flag] !== 'critical') {
          errors.push(`non-critical flag ${flag} placed in critical bucket for ${pair.key}`);
        }
        severityCounts.critical += 1;
        errors.push(`critical validation flag ${flag} in ${pair.key}`);
      }
      for (const flag of groupedValidation.warning) {
        if (VALIDATION_FLAG_SEVERITY[flag] !== 'warning') {
          errors.push(`non-warning flag ${flag} placed in warning bucket for ${pair.key}`);
        }
        severityCounts.warning += 1;
        warnings.push(`warning validation flag ${flag} in ${pair.key}`);
      }
      for (const flag of groupedValidation.info) {
        if (VALIDATION_FLAG_SEVERITY[flag] !== 'info') {
          errors.push(`non-info flag ${flag} placed in info bucket for ${pair.key}`);
        }
        severityCounts.info += 1;
        info.push(`info validation flag ${flag} in ${pair.key}`);
      }

      if (grouped.critical.length !== groupedValidation.critical.length) {
        errors.push(`critical bucket mismatch in ${pair.key}`);
      }
      if (grouped.warning.length !== groupedValidation.warning.length) {
        errors.push(`warning bucket mismatch in ${pair.key}`);
      }
      if (grouped.info.length !== groupedValidation.info.length) {
        errors.push(`info bucket mismatch in ${pair.key}`);
      }
    }

    for (const flag of pair.audit.validation_flags) {
      if (!enums.validationFlag.has(flag)) {
        errors.push(`invalid validation flag ${flag} in ${pair.key}`);
      }
      if (groupedValidation) {
        const severity = VALIDATION_FLAG_SEVERITY[flag];
        const bucket =
          severity === 'critical'
            ? groupedValidation.critical
            : severity === 'warning'
              ? groupedValidation.warning
              : groupedValidation.info;
        if (!bucket.includes(flag)) {
          errors.push(`flat flag ${flag} missing from grouped validation in ${pair.key}`);
        }
      }
    }

    if (a === b) {
      if (pair.classification.code !== 'SELF') {
        errors.push(`self pair ${pair.key} must have code SELF`);
      }
      if (selfPairKeys.has(pair.key)) {
        errors.push(`duplicate self-pair: ${pair.key}`);
      }
      selfPairKeys.add(pair.key);
      continue;
    }

    if (!pair.evidence.status) {
      errors.push(`missing evidence.status in ${pair.key}`);
    }
    if (!pair.evidence.review_state) {
      errors.push(`missing evidence.review_state in ${pair.key}`);
    }
    const isProvisionalGapFill = pair.provenance.source === 'provisional_gap_fill';

    if (!pair.evidence.source_refs?.length && !isProvisionalGapFill) {
      errors.push(`missing source_refs in ${pair.key}`);
    }
    if (isProvisionalGapFill && pair.evidence.source_refs.length > 0) {
      errors.push(`provisional gap fill pair ${pair.key} must not have source_refs`);
    }
    if (!pair.validation) {
      errors.push(`missing validation grouping in ${pair.key}`);
    }

    if (!enums.mechanism.has(pair.mechanism.primary_category)) {
      errors.push(`invalid primary mechanism category in ${pair.key}`);
    }

    for (const category of pair.mechanism.categories) {
      if (!enums.mechanism.has(category)) {
        errors.push(`invalid mechanism category ${category} in ${pair.key}`);
      }
    }

    if (!pair.mechanism.categories.includes(pair.mechanism.primary_category)) {
      errors.push(`primary mechanism category missing from categories in ${pair.key}`);
    }

    if (!pair.provenance.source) {
      errors.push(`missing provenance.source in ${pair.key}`);
    }
    if (!pair.provenance.confidence_tier) {
      errors.push(`missing provenance.confidence_tier in ${pair.key}`);
    }
    if (pair.provenance.source === 'heuristic_fallback' && pair.provenance.confidence_tier === 'high') {
      errors.push(`heuristic fallback confidence too high in ${pair.key}`);
    }
    if (
      pair.classification.code === 'INFERRED' &&
      pair.provenance.source !== 'heuristic_fallback' &&
      pair.provenance.source !== 'decomposition'
    ) {
      errors.push(`inferred pair ${pair.key} must come from heuristic_fallback or decomposition`);
    }
    if (pair.classification.code !== 'INFERRED' && pair.provenance.source === 'heuristic_fallback') {
      errors.push(`heuristic fallback provenance requires INFERRED code in ${pair.key}`);
    }

    const hasAggregateNode = isAggregateNodeId(a) || isAggregateNodeId(b);
    if (hasAggregateNode && pair.provenance.deprecated !== true) {
      errors.push(`aggregate-node pair ${pair.key} must be marked deprecated`);
    }
    if (hasAggregateNode && pair.provenance.source !== 'decomposition') {
      errors.push(`aggregate-node pair ${pair.key} must use decomposition provenance`);
    }
    if (pair.provenance.source === 'decomposition' && pair.provenance.method !== 'aggregate_node_split_v1') {
      errors.push(`decomposition provenance in ${pair.key} must use aggregate_node_split_v1`);
    }

    if (pair.classification.code === 'UNKNOWN') {
      errors.push(`non-self pair ${pair.key} must not use UNKNOWN classification`);
    }
    if (pair.classification.code === 'UNKNOWN' && pair.evidence.status === 'supported') {
      errors.push(`unknown classification cannot be supported in ${pair.key}`);
    }
    if (pair.mechanism.primary_category === 'unknown') {
      errors.push(`non-self pair ${pair.key} must not have unknown primary mechanism category`);
    }

    if (pair.classification.code === 'THEORETICAL') {
      if (pair.evidence.tier !== 'theoretical') {
        errors.push(`theoretical pair ${pair.key} must have evidence tier theoretical`);
      }
      if (!pair.provenance.source) {
        errors.push(`theoretical pair ${pair.key} must include provenance.source`);
      }
      if (!pair.classification.confidence) {
        errors.push(`theoretical pair ${pair.key} must include confidence`);
      }
      if (!pair.provenance.rationale) {
        errors.push(`theoretical pair ${pair.key} must include provenance rationale`);
      }
      if (pair.mechanism.primary_category === 'unknown') {
        errors.push(`theoretical pair ${pair.key} must not have unknown primary mechanism category`);
      }
      if (pair.provenance.source !== 'mechanistic_inference' && pair.provenance.source !== 'decomposition') {
        errors.push(`theoretical pair ${pair.key} must use mechanistic_inference or decomposition provenance`);
      }
      if (pair.provenance.confidence_tier === 'high') {
        errors.push(`theoretical pair ${pair.key} must not have high provenance confidence`);
      }
      if (
        pair.evidence.status !== 'mechanistic_inference' &&
        pair.evidence.status !== 'supported' &&
        pair.evidence.status !== 'provisional_secondary'
      ) {
        warnings.push(`theoretical pair ${pair.key} uses evidence status ${pair.evidence.status ?? 'missing'}`);
      }
    }

    if (pair.classification.code === 'INFERRED' && pair.classification.risk_score !== null) {
      errors.push(`inferred pair ${pair.key} must have null risk_score`);
    }

    const expectedRisk = expectedRiskByCode[pair.classification.code];
    if (expectedRisk !== null && pair.classification.risk_score !== expectedRisk) {
      errors.push(`risk score mismatch for ${pair.key}; got ${pair.classification.risk_score}, expected ${expectedRisk}`);
    }

    if (pair.classification.risk_score === 0) {
      errors.push(`non-self pair ${pair.key} must not have risk_score 0`);
    }

    if (pair.evidence.status === 'mechanistic_inference' && pair.evidence.review_state === 'unreviewed') {
      errors.push(`mechanistic inference pair ${pair.key} cannot be unreviewed`);
    }
    if (
      pair.evidence.status === 'not_reviewed' &&
      pair.evidence.review_state !== 'unreviewed' &&
      pair.evidence.review_state !== 'requires_review'
    ) {
      errors.push(`not_reviewed pair ${pair.key} must be unreviewed or requires_review`);
    }
    if (pair.evidence.status === 'no_data' && pair.evidence.review_state === 'unreviewed') {
      errors.push(`no_data pair ${pair.key} must be reviewed`);
    }
    if (pair.evidence.status === 'supported' && pair.evidence.review_state === 'unreviewed') {
      errors.push(`supported pair ${pair.key} cannot be unreviewed`);
    }
    if (pair.evidence.status === 'conflicting_evidence' && pair.evidence.review_state === 'unreviewed') {
      errors.push(`conflicting evidence pair ${pair.key} cannot be unreviewed`);
    }

    const nonGapRefs = pair.evidence.source_refs.filter((ref) => ref.source_id !== 'source_gap');
    const gapRefs = pair.evidence.source_refs.filter((ref) => ref.source_id === 'source_gap');

    for (const ref of pair.evidence.source_refs) {
      if (!sourceIds.has(ref.source_id)) {
        errors.push(`source ref ${ref.source_id} in ${pair.key} does not exist in sources[]`);
      }
      if (ref.source_id !== 'source_gap') {
        if (!ref.match_type) {
          errors.push(`missing match_type in linked source ref for ${pair.key}: ${ref.source_id}`);
        } else if (!SOURCE_MATCH_TYPES_V2.includes(ref.match_type)) {
          errors.push(`invalid match_type in ${pair.key}: ${ref.match_type}`);
        }
        if (!ref.evidence_strength) {
          errors.push(`missing evidence_strength in linked source ref for ${pair.key}: ${ref.source_id}`);
        }
        if (!ref.relevance_score && !ref.notes) {
          errors.push(`linked source ref in ${pair.key} needs relevance_score or notes: ${ref.source_id}`);
        }
      } else {
        if (ref.evidence_strength !== 'none') {
          errors.push(`source_gap ref in ${pair.key} must have evidence_strength none`);
        }
        if (!ref.notes) {
          errors.push(`source_gap ref in ${pair.key} needs explanatory notes`);
        }
      }
      if (ref.support_type && !enums.supportType.has(ref.support_type)) {
        errors.push(`invalid source ref support_type in ${pair.key}: ${ref.support_type}`);
      }
    }

    if (gapRefs.length > 0 && nonGapRefs.length > 0) {
      errors.push(`source_gap must not coexist with linked sources in ${pair.key}`);
    }
    if (gapRefs.length > 0 && nonGapRefs.length === 0) {
      warnings.push(`source_gap_unresolved in ${pair.key}`);
    }

    if (!pair.provenance.source_linking_method) {
      errors.push(`missing provenance.source_linking_method in ${pair.key}`);
    }
    if (!pair.provenance.source_linking_confidence) {
      errors.push(`missing provenance.source_linking_confidence in ${pair.key}`);
    }

    if (isProvisionalGapFill) {
      if (pair.classification.code !== 'THEORETICAL') {
        errors.push(`provisional gap fill pair ${pair.key} must be THEORETICAL`);
      }
      if (pair.classification.confidence !== 'low') {
        errors.push(`provisional gap fill pair ${pair.key} must have low confidence`);
      }
      if (pair.evidence.support_type !== 'provisional_gap_fill') {
        errors.push(`provisional gap fill pair ${pair.key} must use provisional_gap_fill support type`);
      }
      if (pair.evidence.status !== 'provisional_secondary') {
        errors.push(`provisional gap fill pair ${pair.key} must have provisional_secondary evidence status`);
      }
      if (pair.evidence.review_state !== 'needs_verification') {
        errors.push(`provisional gap fill pair ${pair.key} must require verification`);
      }
      if (!pair.provenance.requires_verification) {
        errors.push(`provisional gap fill pair ${pair.key} must require verification`);
      }
      if (pair.provenance.confidence_tier !== 'low') {
        errors.push(`provisional gap fill pair ${pair.key} must have low provenance confidence`);
      }
      const provisionalFlags = new Set<ValidationFlagV2>(pair.audit.validation_flags);
      const expectedProvisionalFlags: ValidationFlagV2[] = [
        'low_confidence',
        'provisional_secondary',
        'needs_verification',
        'upgrade_candidate'
      ];
      for (const flag of expectedProvisionalFlags) {
        if (!provisionalFlags.has(flag)) {
          errors.push(`provisional gap fill pair ${pair.key} missing validation flag ${flag}`);
        }
      }
    }

    if (pair.classification.confidence === 'low' && !pair.audit.validation_flags.includes('low_confidence')) {
      warnings.push(`pair ${pair.key} has low confidence but no low_confidence flag`);
    }
    if (pair.evidence.review_state === 'requires_review' && !pair.audit.validation_flags.includes('needs_human_review')) {
      warnings.push(`pair ${pair.key} requires review but no needs_human_review flag`);
    }
    if (pair.evidence.status === 'mechanistic_inference' && !pair.audit.validation_flags.includes('machine_inferred')) {
      info.push(`pair ${pair.key} is mechanistic_inference but no machine_inferred flag`);
    }
  }

  for (const warning of warnings) {
    console.warn(`WARN: ${warning}`);
  }

  for (const item of info) {
    console.info(`INFO: ${item}`);
  }

  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }

  console.log(
    `Validation complete. errors=${errors.length} warnings=${warnings.length} info=${info.length} critical_flags=${severityCounts.critical} warning_flags=${severityCounts.warning} info_flags=${severityCounts.info}`
  );
  if (errors.length > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
