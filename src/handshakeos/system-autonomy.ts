/**
 * HandshakeOS-E System Autonomy Calculator
 *
 * Measures how long before a system can disconnect from the internet
 * and remain fully operational.
 *
 * Core question: When can you pull the plug and keep running?
 */

import type { EventRecord } from "./types.js";
import { eventStore } from "./event-store.js";

/**
 * System dependency - external service or resource needed.
 */
export type SystemDependency = {
  /** Dependency ID */
  id: string;
  /** Dependency name */
  name: string;
  /** Type of dependency */
  type:
    | "authentication" // OAuth servers, SSO
    | "discovery" // DNS, service discovery
    | "routing" // Internet routing, BGP
    | "storage" // Cloud storage
    | "compute" // Cloud compute
    | "time" // NTP servers
    | "certificates" // CA servers
    | "content"; // CDNs, external content
  /** Is this critical? (system fails without it) */
  critical: boolean;
  /** Can this be replaced locally? */
  replaceable: boolean;
  /** Replacement complexity (1-10) */
  replacementComplexity: number;
  /** Current usage frequency (calls/hour) */
  usageFrequency: number;
  /** Estimated time to replace (days) */
  estimatedReplacementTime: number;
  /** Current internet dependency (0-1) */
  internetDependency: number;
};

/**
 * Local alternative to internet dependency.
 */
export type LocalAlternative = {
  /** Alternative ID */
  id: string;
  /** What dependency does this replace */
  replacesId: string;
  /** Alternative name */
  name: string;
  /** Implementation status */
  status: "not_started" | "in_progress" | "complete" | "deployed";
  /** Capabilities coverage (0-1) */
  coverage: number;
  /** Performance vs internet (0-1, 1.0 = equal) */
  performance: number;
  /** Reliability (0-1) */
  reliability: number;
  /** Time to deploy (days) */
  timeToDeployDays: number;
};

/**
 * Autonomy milestone - waypoint on path to full independence.
 */
export type AutonomyMilestone = {
  /** Milestone ID */
  id: string;
  /** Milestone name */
  name: string;
  /** Description */
  description: string;
  /** Dependencies that must be replaced */
  requiredReplacements: string[];
  /** Estimated days from start */
  estimatedDays: number;
  /** Status */
  status: "pending" | "in_progress" | "achieved";
  /** Capability unlocked */
  capabilityUnlocked: string;
};

/**
 * System autonomy state.
 */
export type AutonomyState = {
  /** Overall autonomy score (0-1) */
  autonomyScore: number;
  /** Internet dependency score (0-1, lower is better) */
  internetDependency: number;
  /** Self-sufficiency score (0-1) */
  selfSufficiency: number;
  /** Days to basic autonomy */
  daysToBasicAutonomy: number;
  /** Days to full autonomy */
  daysToFullAutonomy: number;
  /** Critical blockers count */
  criticalBlockers: number;
  /** Completed milestones */
  milestonesCompleted: number;
  /** Total milestones */
  milestonesTotal: number;
  /** Timestamp */
  timestamp: number;
};

/**
 * Autonomy timeline - complete roadmap to independence.
 */
export type AutonomyTimeline = {
  /** Current state */
  currentState: AutonomyState;
  /** All dependencies */
  dependencies: SystemDependency[];
  /** Local alternatives */
  alternatives: LocalAlternative[];
  /** Milestones */
  milestones: AutonomyMilestone[];
  /** Critical path (bottleneck dependencies) */
  criticalPath: string[];
  /** Estimated completion date */
  estimatedCompletion: number;
  /** Generated timestamp */
  generatedAt: number;
};

/**
 * Calculate system autonomy state.
 */
export function calculateAutonomyState(
  dependencies: SystemDependency[],
  alternatives: LocalAlternative[],
  milestones: AutonomyMilestone[],
): AutonomyState {
  // Calculate internet dependency
  const criticalDeps = dependencies.filter((d) => d.critical);
  const replacedCritical = criticalDeps.filter((d) => {
    const alt = alternatives.find((a) => a.replacesId === d.id && a.status === "deployed");
    return alt !== undefined;
  });

  const internetDependency =
    criticalDeps.length > 0 ? 1 - replacedCritical.length / criticalDeps.length : 0;

  // Calculate self-sufficiency (includes non-critical deps)
  const allReplaced = dependencies.filter((d) => {
    const alt = alternatives.find((a) => a.replacesId === d.id && a.status === "deployed");
    return alt !== undefined;
  });

  const selfSufficiency = dependencies.length > 0 ? allReplaced.length / dependencies.length : 1;

  // Autonomy score (weighted average)
  const autonomyScore = selfSufficiency * 0.7 + (1 - internetDependency) * 0.3;

  // Calculate time to autonomy
  const unreplacedCritical = criticalDeps.filter((d) => {
    const alt = alternatives.find((a) => a.replacesId === d.id && a.status === "deployed");
    return alt === undefined;
  });

  const daysToBasicAutonomy = Math.max(
    ...unreplacedCritical.map((d) => d.estimatedReplacementTime),
    0,
  );

  const unreplacedAll = dependencies.filter((d) => {
    const alt = alternatives.find((a) => a.replacesId === d.id && a.status === "deployed");
    return alt === undefined;
  });

  const daysToFullAutonomy = Math.max(...unreplacedAll.map((d) => d.estimatedReplacementTime), 0);

  // Count critical blockers
  const criticalBlockers = unreplacedCritical.length;

  // Count milestones
  const milestonesCompleted = milestones.filter((m) => m.status === "achieved").length;

  return {
    autonomyScore,
    internetDependency,
    selfSufficiency,
    daysToBasicAutonomy,
    daysToFullAutonomy,
    criticalBlockers,
    milestonesCompleted,
    milestonesTotal: milestones.length,
    timestamp: Date.now(),
  };
}

/**
 * Generate complete autonomy timeline.
 */
export function generateAutonomyTimeline(): AutonomyTimeline {
  // Define current dependencies
  const dependencies: SystemDependency[] = [
    // Critical dependencies
    {
      id: "dep_auth_oauth",
      name: "OAuth Authentication Servers",
      type: "authentication",
      critical: true,
      replaceable: true,
      replacementComplexity: 6,
      usageFrequency: 10,
      estimatedReplacementTime: 14,
      internetDependency: 1.0,
    },
    {
      id: "dep_discovery_dns",
      name: "DNS Resolution",
      type: "discovery",
      critical: true,
      replaceable: true,
      replacementComplexity: 4,
      usageFrequency: 100,
      estimatedReplacementTime: 7,
      internetDependency: 1.0,
    },
    {
      id: "dep_routing_internet",
      name: "Internet Routing (BGP)",
      type: "routing",
      critical: true,
      replaceable: true,
      replacementComplexity: 8,
      usageFrequency: 1000,
      estimatedReplacementTime: 30,
      internetDependency: 1.0,
    },
    {
      id: "dep_time_ntp",
      name: "NTP Time Servers",
      type: "time",
      critical: true,
      replaceable: true,
      replacementComplexity: 2,
      usageFrequency: 1,
      estimatedReplacementTime: 3,
      internetDependency: 1.0,
    },
    {
      id: "dep_certs_ca",
      name: "Certificate Authorities",
      type: "certificates",
      critical: true,
      replaceable: true,
      replacementComplexity: 7,
      usageFrequency: 5,
      estimatedReplacementTime: 21,
      internetDependency: 1.0,
    },
    // Non-critical dependencies
    {
      id: "dep_storage_cloud",
      name: "Cloud Storage APIs",
      type: "storage",
      critical: false,
      replaceable: true,
      replacementComplexity: 5,
      usageFrequency: 20,
      estimatedReplacementTime: 14,
      internetDependency: 0.8,
    },
    {
      id: "dep_content_cdn",
      name: "CDN Content Delivery",
      type: "content",
      critical: false,
      replaceable: true,
      replacementComplexity: 3,
      usageFrequency: 50,
      estimatedReplacementTime: 10,
      internetDependency: 0.6,
    },
  ];

  // Define local alternatives
  const alternatives: LocalAlternative[] = [
    {
      id: "alt_auth_p2p",
      replacesId: "dep_auth_oauth",
      name: "P2P Cryptographic Identity",
      status: "not_started",
      coverage: 0.9,
      performance: 0.95,
      reliability: 0.85,
      timeToDeployDays: 14,
    },
    {
      id: "alt_discovery_mdns",
      replacesId: "dep_discovery_dns",
      name: "mDNS Local Discovery",
      status: "in_progress",
      coverage: 0.8,
      performance: 1.0,
      reliability: 0.9,
      timeToDeployDays: 7,
    },
    {
      id: "alt_routing_mesh",
      replacesId: "dep_routing_internet",
      name: "Mesh Network Routing",
      status: "not_started",
      coverage: 0.7,
      performance: 0.6,
      reliability: 0.75,
      timeToDeployDays: 30,
    },
    {
      id: "alt_time_local",
      replacesId: "dep_time_ntp",
      name: "Local Time Consensus",
      status: "complete",
      coverage: 1.0,
      performance: 0.99,
      reliability: 0.95,
      timeToDeployDays: 0,
    },
    {
      id: "alt_certs_self",
      replacesId: "dep_certs_ca",
      name: "Self-Signed Trust Network",
      status: "not_started",
      coverage: 0.85,
      performance: 1.0,
      reliability: 0.8,
      timeToDeployDays: 21,
    },
    {
      id: "alt_storage_local",
      replacesId: "dep_storage_cloud",
      name: "Local P2P Storage",
      status: "in_progress",
      coverage: 0.95,
      performance: 0.8,
      reliability: 0.9,
      timeToDeployDays: 14,
    },
    {
      id: "alt_content_cache",
      replacesId: "dep_content_cdn",
      name: "Local Content Cache",
      status: "complete",
      coverage: 1.0,
      performance: 1.2,
      reliability: 0.95,
      timeToDeployDays: 0,
    },
  ];

  // Define milestones
  const milestones: AutonomyMilestone[] = [
    {
      id: "ms_time",
      name: "Time Independence",
      description: "No longer need internet NTP servers",
      requiredReplacements: ["dep_time_ntp"],
      estimatedDays: 3,
      status: "achieved",
      capabilityUnlocked: "Local time consensus without external servers",
    },
    {
      id: "ms_discovery",
      name: "Service Discovery Independence",
      description: "Can discover peers without DNS",
      requiredReplacements: ["dep_discovery_dns"],
      estimatedDays: 7,
      status: "in_progress",
      capabilityUnlocked: "Peer-to-peer service discovery",
    },
    {
      id: "ms_auth_basic",
      name: "Basic Authentication Independence",
      description: "Can verify identities without OAuth servers",
      requiredReplacements: ["dep_auth_oauth"],
      estimatedDays: 14,
      status: "pending",
      capabilityUnlocked: "P2P identity verification",
    },
    {
      id: "ms_certs",
      name: "Certificate Independence",
      description: "Trust network without CAs",
      requiredReplacements: ["dep_certs_ca"],
      estimatedDays: 21,
      status: "pending",
      capabilityUnlocked: "Self-signed trust web",
    },
    {
      id: "ms_routing",
      name: "Routing Independence",
      description: "Can route without internet infrastructure",
      requiredReplacements: ["dep_routing_internet"],
      estimatedDays: 30,
      status: "pending",
      capabilityUnlocked: "Mesh network routing",
    },
    {
      id: "ms_full_autonomy",
      name: "Full System Autonomy",
      description: "Complete independence from internet",
      requiredReplacements: [
        "dep_auth_oauth",
        "dep_discovery_dns",
        "dep_routing_internet",
        "dep_time_ntp",
        "dep_certs_ca",
      ],
      estimatedDays: 90,
      status: "pending",
      capabilityUnlocked: "Full self-sufficient operation",
    },
  ];

  const currentState = calculateAutonomyState(dependencies, alternatives, milestones);

  // Identify critical path (longest dependency chain)
  const criticalPath = dependencies
    .filter((d) => d.critical)
    .sort((a, b) => b.estimatedReplacementTime - a.estimatedReplacementTime)
    .slice(0, 3)
    .map((d) => d.id);

  const estimatedCompletion = Date.now() + currentState.daysToFullAutonomy * 24 * 60 * 60 * 1000;

  return {
    currentState,
    dependencies,
    alternatives,
    milestones,
    criticalPath,
    estimatedCompletion,
    generatedAt: Date.now(),
  };
}

/**
 * Format autonomy timeline as human-readable report.
 */
export function formatAutonomyReport(timeline: AutonomyTimeline): string {
  const lines: string[] = [];
  const state = timeline.currentState;

  lines.push("=== SYSTEM AUTONOMY REPORT ===");
  lines.push("");
  lines.push("CURRENT STATE:");
  lines.push(`  Autonomy Score: ${(state.autonomyScore * 100).toFixed(1)}%`);
  lines.push(`  Internet Dependency: ${(state.internetDependency * 100).toFixed(1)}%`);
  lines.push(`  Self-Sufficiency: ${(state.selfSufficiency * 100).toFixed(1)}%`);
  lines.push(`  Critical Blockers: ${state.criticalBlockers}`);
  lines.push("");

  lines.push("TIMELINE:");
  lines.push(`  Days to Basic Autonomy: ${state.daysToBasicAutonomy} days`);
  lines.push(`  Days to Full Autonomy: ${state.daysToFullAutonomy} days`);
  lines.push(
    `  Estimated Completion: ${new Date(timeline.estimatedCompletion).toISOString().split("T")[0]}`,
  );
  lines.push("");

  lines.push("MILESTONES:");
  for (const milestone of timeline.milestones) {
    const status =
      milestone.status === "achieved" ? "✅" : milestone.status === "in_progress" ? "🔄" : "⏳";
    lines.push(`  ${status} ${milestone.name} (Day ${milestone.estimatedDays})`);
    lines.push(`     ${milestone.description}`);
  }
  lines.push("");

  lines.push("CRITICAL PATH (Longest blockers):");
  for (const depId of timeline.criticalPath) {
    const dep = timeline.dependencies.find((d) => d.id === depId);
    if (dep) {
      lines.push(`  - ${dep.name} (${dep.estimatedReplacementTime} days)`);
    }
  }
  lines.push("");

  lines.push("ANSWER: How long before it no longer needs the internet?");
  if (state.criticalBlockers === 0) {
    lines.push(`  ✅ System is already internet-independent!`);
  } else {
    lines.push(`  ⏳ ${state.daysToBasicAutonomy} days for basic autonomy`);
    lines.push(`  ⏳ ${state.daysToFullAutonomy} days for full autonomy`);
  }
  lines.push("");

  lines.push("CAPABILITIES WHEN FULLY AUTONOMOUS:");
  lines.push("  ✓ Login/authentication without OAuth servers");
  lines.push("  ✓ Peer discovery without DNS");
  lines.push("  ✓ Routing without internet infrastructure");
  lines.push("  ✓ Time sync without NTP servers");
  lines.push("  ✓ Trust without certificate authorities");
  lines.push("  ✓ Storage without cloud providers");
  lines.push("  ✓ Content without CDNs");
  lines.push("");

  lines.push("The system becomes a self-sustaining network.");
  lines.push("Computers talking to computers. No upstream required.");
  lines.push("Procedure survives belief. Local survives internet.");

  return lines.join("\n");
}

/**
 * Test system's ability to operate without internet.
 */
export function testInternetIndependence(): {
  canOperate: boolean;
  missingCapabilities: string[];
  workarounds: string[];
} {
  const timeline = generateAutonomyTimeline();
  const criticalDeps = timeline.dependencies.filter((d) => d.critical);

  const missingCapabilities: string[] = [];
  const workarounds: string[] = [];

  for (const dep of criticalDeps) {
    const alt = timeline.alternatives.find(
      (a) => a.replacesId === dep.id && a.status === "deployed",
    );

    if (!alt) {
      missingCapabilities.push(dep.name);

      // Suggest workarounds
      if (dep.type === "authentication") {
        workarounds.push("Use cached credentials with expiry tolerance");
      } else if (dep.type === "discovery") {
        workarounds.push("Use hardcoded peer list + broadcast discovery");
      } else if (dep.type === "routing") {
        workarounds.push("Operate in isolated LAN mode only");
      }
    }
  }

  return {
    canOperate: missingCapabilities.length === 0,
    missingCapabilities,
    workarounds,
  };
}
