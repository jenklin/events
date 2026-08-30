// @ts-nocheck — VENDORED verbatim from cloudpeers-github/lib/a2ui/validator.ts (2026-08-29); type-checked at source.
/**
 * A2UI Behavioral Compliance Validator
 *
 * Enforces archetype behavioral rules on incoming fragments.
 * Rejects fragments that violate archetype constraints.
 */

import type {
  Fragment,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ArchetypeDefinition
} from './types';
import archetypeDefinitionsJson from './archetype-definitions.json';

// Type-safe archetype definitions
const archetypeDefinitions = archetypeDefinitionsJson.archetypes as Record<string, ArchetypeDefinition>;

/**
 * Validates a fragment against its archetype's behavioral rules
 */
export function validateFragment(fragment: Fragment): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Get archetype definition
  const archetypeDef = archetypeDefinitions[fragment.archetypeId];
  if (!archetypeDef) {
    errors.push({
      code: 'INVALID_ARCHETYPE',
      message: `Unknown archetype: ${fragment.archetypeId}`
    });
    return { valid: false, errors, warnings };
  }

  // Validate component types (required, recommended, forbidden)
  validateComponentTypes(fragment, archetypeDef, errors, warnings);

  // Validate fragment constraints (min/max counts, required fields)
  validateFragmentConstraints(fragment, archetypeDef, errors, warnings);

  // Validate sovereignty requirements
  validateSovereignty(fragment, archetypeDef, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates that components are allowed for the archetype
 */
function validateComponentTypes(
  fragment: Fragment,
  archetypeDef: ArchetypeDefinition,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const { required, recommended, allowed, forbidden } = archetypeDef.component_preferences;

  // Check for required components
  const componentTypes = fragment.components.map(c => c.type);
  const missingRequired = required.filter(type => !componentTypes.includes(type));

  if (missingRequired.length > 0) {
    errors.push({
      code: 'MISSING_REQUIRED_COMPONENTS',
      message: `${archetypeDef.metadata.name} requires these components: ${missingRequired.join(', ')}`
    });
  }

  // Check for forbidden components
  fragment.components.forEach((component, index) => {
    if (forbidden.includes(component.type)) {
      errors.push({
        code: 'FORBIDDEN_COMPONENT',
        message: `${archetypeDef.metadata.name} does not allow component type: ${component.type}`,
        componentIndex: index,
        componentType: component.type
      });
    }
  });

  // Warn about recommended components
  const missingRecommended = recommended.filter(type => !componentTypes.includes(type));
  if (missingRecommended.length > 0) {
    warnings.push({
      code: 'MISSING_RECOMMENDED_COMPONENTS',
      message: `${archetypeDef.metadata.name} recommends these components: ${missingRecommended.join(', ')}`
    });
  }

  // Check if components are in allowed list (if they're not required or recommended)
  fragment.components.forEach((component, index) => {
    const isRequired = required.includes(component.type);
    const isRecommended = recommended.includes(component.type);
    const isAllowed = allowed.includes(component.type);

    if (!isRequired && !isRecommended && !isAllowed && !forbidden.includes(component.type)) {
      warnings.push({
        code: 'UNKNOWN_COMPONENT',
        message: `Component type '${component.type}' is not defined in ${archetypeDef.metadata.name} preferences`,
        componentIndex: index,
        componentType: component.type
      });
    }
  });
}

/**
 * Validates fragment-level constraints (min/max counts, required fields)
 */
function validateFragmentConstraints(
  fragment: Fragment,
  archetypeDef: ArchetypeDefinition,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const constraints = archetypeDef.fragment_constraints;

  // Count metrics
  const metricComponents = fragment.components.filter(c =>
    c.type.includes('metric') || c.type.includes('trend')
  );

  if (constraints.max_metrics_per_fragment && metricComponents.length > constraints.max_metrics_per_fragment) {
    errors.push({
      code: 'TOO_MANY_METRICS',
      message: `${archetypeDef.metadata.name} allows max ${constraints.max_metrics_per_fragment} metrics, found ${metricComponents.length}`
    });
  }

  // Check for reflection prompts (Sage requirement)
  if (constraints.require_reflection_prompt) {
    const hasReflectionPrompt = fragment.components.some(c =>
      c.type.includes('reflection') || c.props.reflectionPrompt
    );

    if (!hasReflectionPrompt) {
      errors.push({
        code: 'MISSING_REFLECTION_PROMPT',
        message: `${archetypeDef.metadata.name} requires reflectionPrompt for all metrics`
      });
    }
  }

  // Check for trend data (Strategist requirement)
  if (constraints.require_trend_data) {
    const hasTrendData = fragment.components.some(c =>
      c.type.includes('trend') || c.props.trend || c.props.chart_data
    );

    if (!hasTrendData) {
      errors.push({
        code: 'MISSING_TREND_DATA',
        message: `${archetypeDef.metadata.name} requires trend data`
      });
    }
  }

  // Check for action items (Strategist requirement)
  if (constraints.require_action_items) {
    const hasActionItems = fragment.components.some(c =>
      c.type.includes('action') || c.type.includes('next-actions')
    );

    if (!hasActionItems) {
      errors.push({
        code: 'MISSING_ACTION_ITEMS',
        message: `${archetypeDef.metadata.name} requires action items`
      });
    }
  }

  // Check for limit indicators (Guardian requirement)
  if (constraints.require_limit_indicators) {
    const hasLimitIndicators = fragment.components.some(c =>
      c.type.includes('limit') || c.type.includes('boundary') || c.type.includes('warning')
    );

    if (!hasLimitIndicators) {
      errors.push({
        code: 'MISSING_LIMIT_INDICATORS',
        message: `${archetypeDef.metadata.name} requires limit indicators or warnings`
      });
    }
  }

  // Check for community activity (Connector requirement)
  if (constraints.require_community_activity) {
    const hasCommunityActivity = fragment.components.some(c =>
      c.type.includes('community') || c.type.includes('collaboration') || c.type.includes('shared')
    );

    if (!hasCommunityActivity) {
      errors.push({
        code: 'MISSING_COMMUNITY_ACTIVITY',
        message: `${archetypeDef.metadata.name} requires community activity`
      });
    }
  }

  // Check for consent prompts when sharing (Connector requirement)
  if (constraints.require_consent_prompts_for_sharing) {
    const hasShareAction = fragment.components.some(c =>
      c.type.includes('share') || c.type.includes('collaboration')
    );

    if (hasShareAction) {
      const hasConsentPrompt = fragment.components.some(c =>
        c.props.privacy_notice || c.props.consent_required
      );

      if (!hasConsentPrompt) {
        errors.push({
          code: 'MISSING_CONSENT_PROMPT',
          message: `${archetypeDef.metadata.name} requires explicit consent prompts for sharing`
        });
      }
    }
  }

  // Check for raw numbers (Sage prohibition)
  if (constraints.allow_raw_numbers === false) {
    fragment.components.forEach((component, index) => {
      // Check if props contain raw numeric values without context
      const hasRawNumber = Object.entries(component.props).some(([key, value]) =>
        typeof value === 'number' && !key.includes('percentage') && !key.includes('count')
      );

      if (hasRawNumber && !component.props.reflectionPrompt && !component.props.reflectionContext) {
        errors.push({
          code: 'RAW_NUMBERS_NOT_ALLOWED',
          message: `${archetypeDef.metadata.name} does not allow raw numbers without reflection context`,
          componentIndex: index,
          componentType: component.type
        });
      }
    });
  }
}

/**
 * Validates sovereignty requirements
 */
function validateSovereignty(
  fragment: Fragment,
  archetypeDef: ArchetypeDefinition,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Ensure consent is required for externalizable data
  if (fragment.sovereignty.classification === 'externalizable') {
    if (!fragment.sovereignty.consent_required) {
      errors.push({
        code: 'CONSENT_REQUIRED_FOR_EXTERNALIZABLE',
        message: 'Externalizable data must require explicit consent'
      });
    }
  }

  // Guardian archetype should prioritize local_only
  if (fragment.archetypeId === 'guardian') {
    if (fragment.sovereignty.classification === 'externalizable') {
      warnings.push({
        code: 'GUARDIAN_WITH_EXTERNALIZABLE',
        message: 'Guardian archetype typically uses local_only for maximum privacy'
      });
    }
  }

  // Connector archetype needs externalizable for OUTWARD sharing.
  // Precision fix 2026-08-28: a share action is a component that performs sharing beyond the
  // circle (type includes 'share', or props.shares_externally === true). `collaboration-prompt`
  // is Connector's REQUIRED consent/ask component — treating it as a share action made every
  // honest aggregate_only family fragment impossible, which invited the exact bypass this
  // validator exists to prevent (relabel as externalizable to pass). Consent prompts stay
  // required (see require_consent_prompts_for_sharing above); sovereignty stays truthful.
  if (fragment.archetypeId === 'connector') {
    const hasShareAction = fragment.components.some(c =>
      c.type.includes('share') || c.props?.shares_externally === true
    );

    if (hasShareAction && fragment.sovereignty.classification !== 'externalizable') {
      errors.push({
        code: 'CONNECTOR_SHARING_REQUIRES_EXTERNALIZABLE',
        message: 'Connector sharing actions require externalizable sovereignty classification'
      });
    }
  }
}

/**
 * Helper function to get validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid) {
    return `✅ Fragment is valid${result.warnings.length > 0 ? ` (${result.warnings.length} warnings)` : ''}`;
  }

  return `❌ Fragment is invalid: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`;
}

/**
 * Validates a group flow (Group Accounts v1) — a multi-fragment surface
 * spanning the grant handshake (Connector) and the accountability loop (Sponsor).
 *
 * Per cloudpeers-mcp/mcp/docs/GROUP_ACCOUNTS_SPEC.md §Open Questions resolution 4 (originally
 * cloudpeers-github/docs/HOUSEHOLD_ACCOUNTS_SPEC.md before the 2026-05-09 rename + cross-repo move):
 *   "household flows must invoke both Connector (for the grant handshake) and
 *    Sponsor (for the accountability loop) — missing either side is a validation failure."
 *
 * Applies to all group_type values, not just `family` — creator coalitions, artist
 * coalitions, ensembles, civic cohorts all share the same Connector+Sponsor requirement.
 *
 * Each individual fragment is also validated with validateFragment().
 *
 * @param fragments All fragments belonging to a single group flow (matching flow.flowId).
 */
export function validateGroupFlow(fragments: Fragment[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (fragments.length === 0) {
    errors.push({
      code: 'EMPTY_GROUP_FLOW',
      message: 'Group flow must contain at least one fragment'
    });
    return { valid: false, errors, warnings };
  }

  // All fragments in a flow must share the same flowId and type='group_flow'.
  const flowIds = new Set(fragments.map(f => f.flow?.flowId));
  const flowTypes = new Set(fragments.map(f => f.flow?.type));

  if (flowIds.size !== 1 || flowIds.has(undefined)) {
    errors.push({
      code: 'INCONSISTENT_FLOW_ID',
      message: 'All fragments in a group flow must share the same flow.flowId; missing flow metadata is not allowed'
    });
  }

  if (!flowTypes.has('group_flow') || flowTypes.size !== 1) {
    errors.push({
      code: 'INCONSISTENT_FLOW_TYPE',
      message: 'All fragments in a group flow must have flow.type === "group_flow"'
    });
  }

  // Connector + Sponsor coverage requirement.
  const archetypes = new Set(fragments.map(f => f.archetypeId));

  if (!archetypes.has('connector')) {
    errors.push({
      code: 'GROUP_FLOW_MISSING_CONNECTOR',
      message: 'Group flow must include at least one Connector fragment for the grant handshake (consent-explicit, community-first tone)'
    });
  }

  if (!archetypes.has('sponsor')) {
    errors.push({
      code: 'GROUP_FLOW_MISSING_SPONSOR',
      message: 'Group flow must include at least one Sponsor fragment for the accountability loop (subject-side digest, "what was done on my behalf", revocation review)'
    });
  }

  // Validate each individual fragment with the standard validator and collect issues.
  fragments.forEach((fragment, index) => {
    const fragmentResult = validateFragment(fragment);
    fragmentResult.errors.forEach(err => {
      errors.push({
        ...err,
        message: `[fragment #${index} ${fragment.fragmentId}] ${err.message}`
      });
    });
    fragmentResult.warnings.forEach(warn => {
      warnings.push({
        ...warn,
        message: `[fragment #${index} ${fragment.fragmentId}] ${warn.message}`
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
