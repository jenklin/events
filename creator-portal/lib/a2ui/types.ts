/**
 * A2UI Framework Type Definitions
 *
 * Defines the structure for fragments, components, and validation results
 * used in the Agent-to-UI (A2UI) system.
 */

// Human archetypes (user-facing)
export type HumanArchetypeId = 'narrator' | 'strategist' | 'connector' | 'sponsor';

// Service layer archetypes (non-user-facing)
export type ServiceArchetypeId = 'sage' | 'guardian';

// All archetypes (for internal use)
export type ArchetypeId = HumanArchetypeId | ServiceArchetypeId;

export type SovereigntyClassification = 'local_only' | 'aggregate_only' | 'externalizable';

export type LayoutSlot = 'main' | 'sidebar' | 'modal';

export type JourneyStage = 'CAPTURE' | 'DECLARE' | 'COMPOSE' | 'DELEGATE' | 'CONSENT' | 'AUDIT';

/**
 * Fragment Component - Represents a single UI component within a fragment
 */
export interface FragmentComponent {
  type: string; // e.g., 'reflection-metric', 'next-actions', 'warning-alert'
  props: Record<string, any>;
}

/**
 * Fragment - JSON structure sent by services to render UI
 */
/**
 * Flow metadata — links a fragment into a multi-fragment flow that has its own
 * cross-archetype validation rules. Group flows (Group Accounts v1) require
 * Connector + Sponsor coverage across the flow; see validateGroupFlow().
 */
export interface FlowMetadata {
  /** Discriminator for the flow type. */
  type: 'group_flow';
  /** Stable identifier so all fragments in a flow share the same flowId. */
  flowId: string;
  /** Group-flow-specific role this fragment plays. */
  flowRole?: 'invite' | 'accept' | 'grant_approval' | 'digest' | 'revocation' | 'audit';
}

export interface Fragment {
  fragmentId: string;
  serviceId: string; // e.g., 'carepeers-health', 'xquest-video'
  archetypeId: ArchetypeId;
  components: FragmentComponent[];
  layout: {
    slot: LayoutSlot;
    priority: number; // Higher priority = rendered first
  };
  sovereignty: {
    classification: SovereigntyClassification;
    consent_required: boolean;
    fields_rendered?: string[]; // Which data fields are shown (for transparency)
  };
  mood?: string; // Optional mood hint (e.g., 'reflective', 'action-oriented')
  flow?: FlowMetadata; // Optional — set only on fragments that participate in a multi-fragment flow
}

/**
 * Validation Result - Result of behavioral compliance check
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  componentIndex?: number;
  componentType?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  componentIndex?: number;
  componentType?: string;
}

/**
 * Archetype Definition - Behavioral rules for an archetype
 */
export interface ArchetypeDefinition {
  metadata: {
    name: string;
    role: string;
    description: string;
    icon: string;
    color_primary: string;
    color_secondary: string;
  };
  behavioral_rules: Record<string, boolean>;
  fragment_constraints: {
    max_metrics_per_fragment?: number;
    min_reflection_prompts?: number;
    min_action_items?: number;
    min_warning_or_limit?: number;
    min_community_activity?: number;
    require_reflection_prompt?: boolean;
    require_trend_data?: boolean;
    require_action_items?: boolean;
    require_limit_indicators?: boolean;
    require_community_activity?: boolean;
    require_consent_prompts_for_sharing?: boolean;
    allow_raw_numbers?: boolean;
    allow_trend_charts?: boolean;
    allow_reflection_prompts?: boolean;
    allow_warnings?: boolean;
    allow_share_actions?: boolean;
    encourage_journaling?: boolean;
    encourage_goal_setting?: boolean;
    encourage_safety_checklists?: boolean;
    encourage_collaboration?: boolean;
  };
  component_preferences: {
    required: string[];
    recommended: string[];
    allowed: string[];
    forbidden: string[];
  };
}
