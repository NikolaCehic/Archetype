import type { ArchetypeInput, DomainProfile, EvidenceLedger, ProductArtifacts } from "../core/types";
import { slugify } from "../core/stable";

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

export function buildProductArtifacts(input: ArchetypeInput, profile: DomainProfile, evidence: EvidenceLedger): ProductArtifacts {
  const projectName = input.projectName ?? titleCase(slugify(profile.category, "archetype-product"));
  const users = input.users && input.users.length > 0 ? input.users : ["Primary operator", "Workspace administrator"];
  const primaryGoal = input.goals?.[0] ?? `Help users complete ${profile.category} workflows with clarity and confidence.`;
  const roles = users.map((user) => ({
    role_id: slugify(user),
    label: user,
    description: `Primary product role inferred from supplied context: ${user}.`,
    confidence: input.users ? "medium" : "low",
    evidence_refs: input.users ? ["source_user_context"] : ["assumption_web_responsive"]
  }));

  const entityModel = {
    entities: profile.entities.map((entity) => ({
      name: entity,
      entity_id: slugify(entity),
      purpose: `${entity} is required to support ${profile.category} workflows.`,
      ownership: "workspace",
      evidence_refs: ["decision_financial_entities", "inference_domain_profile"]
    }))
  };

  const entityLifecycle = {
    lifecycles: profile.entities.map((entity) => ({
      entity,
      states: entity.toLowerCase().includes("invoice")
        ? ["draft", "sent", "overdue", "paid", "void"]
        : ["active", "review", "archived"],
      transitions: entity.toLowerCase().includes("invoice")
        ? ["draft_to_sent", "sent_to_overdue", "sent_to_paid", "overdue_to_paid", "any_to_void"]
        : ["create", "update", "archive"],
      destructive_actions: ["delete", "archive"],
      evidence_refs: ["inference_domain_profile"]
    }))
  };

  const jobs = (input.goals && input.goals.length > 0 ? input.goals : profile.workflows.map(titleCase)).map((goal, index) => ({
    job_id: `job_${index + 1}`,
    job: goal,
    user_type: users[index % users.length],
    success_criteria: "The user can complete or understand the job without broad interpretation.",
    evidence_refs: input.goals?.[index] ? [`fact_user_goal_${index + 1}`] : ["inference_domain_profile"]
  }));

  const roleModel = {
    roles,
    default_role: roles[0]?.role_id ?? "primary-operator",
    evidence_refs: ["source_user_context"]
  };

  const permissionMatrix = {
    permissions: roles.map((role) => ({
      role_id: role.role_id,
      can_view_dashboard: true,
      can_manage_core_entities: role.role_id.includes("owner") || role.role_id.includes("admin") || role.role_id.includes("bookkeeper"),
      can_export_reports: true,
      can_manage_settings: role.role_id.includes("owner") || role.role_id.includes("admin")
    })),
    fallback_state: "permission_denied"
  };

  return {
    productModel: {
      product_name: projectName,
      product_type: profile.productType,
      product_category: profile.category,
      primary_goal: primaryGoal,
      business_goals: input.businessGoals ?? ["Create implementation-ready product UI architecture."],
      primary_users: users,
      secondary_users: [],
      core_jobs: jobs,
      core_entities: profile.entities,
      primary_workflows: profile.workflows,
      platform: "web",
      interface_density: "medium-high",
      accessibility_target: "WCAG AA",
      risk_domain_flags: profile.riskFlags,
      evidence_refs: ["fact_product_context", "inference_domain_profile"]
    },
    userModel: {
      users: users.map((user, index) => ({
        user_type: user,
        priority: index === 0 ? "primary" : "secondary",
        goals: input.goals ?? profile.workflows.map(titleCase),
        pain_points: evidence.missing_information.slice(0, 3),
        evidence_refs: ["source_user_context"]
      }))
    },
    jobsToBeDone: [
      "# Jobs To Be Done",
      "",
      ...jobs.map((job) => `- ${job.user_type}: ${job.job}`)
    ].join("\n"),
    roleModel,
    permissionMatrix,
    entityModel,
    entityLifecycle
  };
}
