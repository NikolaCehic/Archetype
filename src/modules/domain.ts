import type { ArchetypeInput, DomainProfile } from "../core/types";

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function inferDomainProfile(input: ArchetypeInput): DomainProfile {
  const text = [input.context, ...(input.goals ?? []), ...(input.businessGoals ?? [])]
    .join(" ")
    .toLowerCase();

  if (includesAny(text, ["fintech", "cash flow", "invoice", "expense", "financial", "payment"])) {
    return {
      domain: "fintech",
      productType: "B2B fintech dashboard",
      category: "financial operations",
      entities: ["Invoice", "Expense", "Transaction", "Customer", "Report"],
      workflows: ["review_dashboard", "track_invoices", "send_invoice_reminder", "review_expenses", "export_monthly_report"],
      routes: [
        { route: "/dashboard", screen_id: "dashboard.overview", layout: "DashboardShell", nav_label: "Dashboard", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["owner", "bookkeeper"], deep_linking: true, evidence_refs: ["decision_primary_dashboard"] },
        { route: "/invoices", screen_id: "invoices.list", layout: "DashboardShell", nav_label: "Invoices", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["owner", "bookkeeper"], deep_linking: true, evidence_refs: ["decision_invoice_workflow"] },
        { route: "/invoices/:invoiceId", screen_id: "invoice.detail", layout: "DetailShell", nav_label: null, nav_group: "core", priority: "secondary", auth_requirement: "authenticated", role_requirement: ["owner", "bookkeeper"], parent_route: "/invoices", deep_linking: true, evidence_refs: ["decision_invoice_workflow"] },
        { route: "/expenses", screen_id: "expenses.list", layout: "DashboardShell", nav_label: "Expenses", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["owner", "bookkeeper"], deep_linking: true, evidence_refs: ["decision_financial_entities"] },
        { route: "/reports", screen_id: "reports.monthly", layout: "DashboardShell", nav_label: "Reports", nav_group: "analysis", priority: "primary", auth_requirement: "authenticated", role_requirement: ["owner", "bookkeeper"], deep_linking: true, evidence_refs: ["decision_reporting_workflow"] },
        { route: "/settings", screen_id: "settings.profile", layout: "SettingsShell", nav_label: "Settings", nav_group: "utility", priority: "utility", auth_requirement: "authenticated", role_requirement: ["owner"], deep_linking: true, evidence_refs: ["assumption_settings_required"] }
      ],
      patterns: ["FinancialMetricCard", "InvoiceStatusBadge", "CashFlowChartPanel", "RiskAlertPanel", "TransactionTableRow", "DateRangeFilter", "ReportSummaryPanel"],
      riskFlags: ["finance"],
      visualDirection: "Trustworthy, calm, precise, medium-high density, table-forward, with restrained blue accents and explicit status labeling."
    };
  }

  if (includesAny(text, ["saas", "marketing", "campaign", "report builder", "workspace", "analytics dashboard", "growth analyst"])) {
    return {
      domain: "saas",
      productType: "B2B SaaS analytics dashboard",
      category: "marketing analytics",
      entities: ["Workspace", "Campaign", "Report", "BillingPlan", "User"],
      workflows: ["complete_onboarding", "select_workspace", "review_campaigns", "build_report", "manage_billing", "configure_settings"],
      routes: [
        { route: "/onboarding", screen_id: "onboarding.start", layout: "OnboardingShell", nav_label: "Onboarding", nav_group: "setup", priority: "primary", auth_requirement: "authenticated", role_requirement: ["admin", "member"], deep_linking: true, evidence_refs: ["decision_onboarding_required"] },
        { route: "/workspaces", screen_id: "workspaces.select", layout: "WorkspaceShell", nav_label: "Workspaces", nav_group: "setup", priority: "primary", auth_requirement: "authenticated", role_requirement: ["admin", "member"], deep_linking: true, evidence_refs: ["decision_workspace_selection_required"] },
        { route: "/campaigns", screen_id: "campaigns.overview", layout: "DashboardShell", nav_label: "Campaigns", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["admin", "analyst", "member"], deep_linking: true, evidence_refs: ["decision_campaign_overview_required"] },
        { route: "/reports/builder", screen_id: "reports.builder", layout: "BuilderShell", nav_label: "Report Builder", nav_group: "analysis", priority: "primary", auth_requirement: "authenticated", role_requirement: ["admin", "analyst"], deep_linking: true, evidence_refs: ["decision_report_builder_required"] },
        { route: "/billing", screen_id: "billing.overview", layout: "SettingsShell", nav_label: "Billing", nav_group: "admin", priority: "secondary", auth_requirement: "authenticated", role_requirement: ["admin"], deep_linking: true, evidence_refs: ["decision_billing_required"] },
        { route: "/settings", screen_id: "settings.workspace", layout: "SettingsShell", nav_label: "Settings", nav_group: "admin", priority: "utility", auth_requirement: "authenticated", role_requirement: ["admin"], deep_linking: true, evidence_refs: ["decision_settings_required"] }
      ],
      patterns: ["MetricCard", "CampaignStatusBadge", "CampaignTable", "ReportBuilderPanel", "WorkspaceSwitcher", "BillingSummaryPanel", "SettingsSection"],
      riskFlags: [],
      visualDirection: "Premium, dense, dark, enterprise-grade, table-forward, with restrained monochrome surfaces and precise analytics hierarchy."
    };
  }

  if (includesAny(text, ["marketplace", "seller", "listing", "dispute", "payout", "trust and safety"])) {
    return {
      domain: "marketplace",
      productType: "Marketplace admin console",
      category: "marketplace operations",
      entities: ["Seller", "Listing", "Dispute", "Payout", "Case"],
      workflows: ["review_operations_queue", "inspect_seller", "moderate_listing", "resolve_dispute", "review_payout"],
      routes: [
        { route: "/queue", screen_id: "queue.operations", layout: "AdminShell", nav_label: "Queue", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["operator", "lead"], deep_linking: true, evidence_refs: ["decision_operations_queue_required"] },
        { route: "/sellers", screen_id: "sellers.list", layout: "AdminShell", nav_label: "Sellers", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["operator", "lead"], deep_linking: true, evidence_refs: ["decision_seller_review_required"] },
        { route: "/listings", screen_id: "listings.moderation", layout: "AdminShell", nav_label: "Listings", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["operator", "lead"], deep_linking: true, evidence_refs: ["decision_listing_moderation_required"] },
        { route: "/disputes", screen_id: "disputes.list", layout: "CaseShell", nav_label: "Disputes", nav_group: "trust", priority: "primary", auth_requirement: "authenticated", role_requirement: ["operator", "lead"], deep_linking: true, evidence_refs: ["decision_dispute_workflow_required"] },
        { route: "/payouts", screen_id: "payouts.review", layout: "FinanceShell", nav_label: "Payouts", nav_group: "finance", priority: "secondary", auth_requirement: "authenticated", role_requirement: ["finance_reviewer", "lead"], deep_linking: true, evidence_refs: ["decision_payout_review_required"] }
      ],
      patterns: ["OperationsQueue", "StatusBadge", "CaseTimeline", "EvidencePanel", "BulkActionBar", "PayoutReviewPanel"],
      riskFlags: ["finance"],
      visualDirection: "Structured, operational, calm, dense, and audit-friendly with clear escalation and decision states."
    };
  }

  if (includesAny(text, ["logistics", "shipment", "fleet", "delivery", "vehicle route", "route optimization"])) {
    return {
      domain: "logistics",
      productType: "Logistics operations platform",
      category: "operations management",
      entities: ["Shipment", "Route", "Vehicle", "Driver", "DeliveryException"],
      workflows: ["review_operations", "track_shipments", "resolve_delivery_exception", "assign_vehicle", "monitor_route_progress"],
      routes: [
        { route: "/operations", screen_id: "operations.overview", layout: "OperationsShell", nav_label: "Operations", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["operator", "manager"], deep_linking: true, evidence_refs: ["decision_operations_dashboard"] },
        { route: "/shipments", screen_id: "shipments.list", layout: "OperationsShell", nav_label: "Shipments", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["operator", "manager"], deep_linking: true, evidence_refs: ["decision_shipments_required"] },
        { route: "/exceptions", screen_id: "exceptions.list", layout: "OperationsShell", nav_label: "Exceptions", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["operator", "manager"], deep_linking: true, evidence_refs: ["decision_exception_workflow"] }
      ],
      patterns: ["ShipmentStatusBadge", "RouteProgressTimeline", "FleetHealthCard", "DeliveryExceptionAlert", "MapPanel", "VehicleAssignmentTable"],
      riskFlags: ["safety"],
      visualDirection: "Operational, dense, alert-aware, map-friendly, with strong exception visibility and low-friction scanning."
    };
  }

  if (includesAny(text, ["web3", "wallet", "token", "chain", "gas", "transaction hash", "crypto", "portfolio analysis", "portfolio analytics", "defi", "trader", "trading"])) {
    return {
      domain: "web3",
      productType: "Crypto portfolio analytics app",
      category: "crypto analytics",
      entities: ["Wallet", "Token", "Transaction", "Network", "Position", "Performance"],
      workflows: ["connect_wallet", "review_portfolio", "review_positions", "inspect_activity", "compare_performance", "configure_wallet_safety"],
      routes: [
        { route: "/connect", screen_id: "wallet.connect", layout: "AuthShell", nav_label: "Connect", nav_group: "setup", priority: "primary", auth_requirement: "public_until_wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_connect_wallet"] },
        { route: "/portfolio", screen_id: "portfolio.overview", layout: "AnalyticsShell", nav_label: "Portfolio", nav_group: "core", priority: "primary", auth_requirement: "wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_wallet_analytics"] },
        { route: "/positions", screen_id: "positions.list", layout: "AnalyticsShell", nav_label: "Positions", nav_group: "core", priority: "primary", auth_requirement: "wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_positions_workflow"] },
        { route: "/activity", screen_id: "activity.timeline", layout: "AnalyticsShell", nav_label: "Activity", nav_group: "core", priority: "primary", auth_requirement: "wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_transaction_workflow"] },
        { route: "/performance", screen_id: "performance.compare", layout: "AnalyticsShell", nav_label: "Performance", nav_group: "analysis", priority: "secondary", auth_requirement: "wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_performance_workflow"] },
        { route: "/settings", screen_id: "settings.wallet", layout: "SettingsShell", nav_label: "Settings", nav_group: "utility", priority: "utility", auth_requirement: "wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_wallet_safety_settings"] }
      ],
      patterns: ["WalletConnectionStatus", "TransactionHashDisplay", "NetworkBadge", "GasFeeEstimator", "TokenBalanceCard", "SignaturePrompt", "PositionRiskPanel", "PerformanceChartPanel"],
      riskFlags: ["finance"],
      visualDirection: "Technical, high-signal, trust-oriented, with explicit wallet, network, portfolio, transaction, performance, and risk states."
    };
  }

  if (includesAny(text, ["healthcare", "patient", "clinical", "appointment", "medication"])) {
    return {
      domain: "healthcare",
      productType: "Healthcare workflow product",
      category: "clinical operations",
      entities: ["Patient", "Appointment", "Medication", "CarePlan", "ProviderNote"],
      workflows: ["review_patient_summary", "manage_appointments", "review_medications", "update_care_plan"],
      routes: [
        { route: "/patients", screen_id: "patients.list", layout: "ClinicalShell", nav_label: "Patients", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["provider", "admin"], deep_linking: true, evidence_refs: ["decision_patient_workflow"] },
        { route: "/appointments", screen_id: "appointments.list", layout: "ClinicalShell", nav_label: "Appointments", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["provider", "admin"], deep_linking: true, evidence_refs: ["decision_appointment_workflow"] }
      ],
      patterns: ["PatientSummaryCard", "AppointmentStatusBadge", "ClinicalAlert", "MedicationList", "CarePlanSection", "ProviderNote"],
      riskFlags: ["healthcare"],
      visualDirection: "Clear, calm, high-contrast, audit-sensitive, with clinical alerts and careful hierarchy."
    };
  }

  return {
    domain: "saas",
    productType: "B2B SaaS operations product",
    category: "workflow software",
    entities: ["Account", "Project", "Task", "User", "Report"],
    workflows: ["review_dashboard", "manage_records", "complete_primary_task", "review_reports", "configure_settings"],
    routes: [
      { route: "/dashboard", screen_id: "dashboard.overview", layout: "DashboardShell", nav_label: "Dashboard", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["admin", "member"], deep_linking: true, evidence_refs: ["decision_primary_dashboard"] },
      { route: "/records", screen_id: "records.list", layout: "DashboardShell", nav_label: "Records", nav_group: "core", priority: "primary", auth_requirement: "authenticated", role_requirement: ["admin", "member"], deep_linking: true, evidence_refs: ["decision_record_management"] },
      { route: "/reports", screen_id: "reports.overview", layout: "DashboardShell", nav_label: "Reports", nav_group: "analysis", priority: "secondary", auth_requirement: "authenticated", role_requirement: ["admin", "member"], deep_linking: true, evidence_refs: ["decision_reporting_workflow"] }
    ],
    patterns: ["OperationalMetricCard", "StatusBadge", "ActivityTableRow", "FilterBar", "ReportSummaryPanel"],
    riskFlags: [],
    visualDirection: "Quiet, structured, work-focused, medium density, with strong scanning hierarchy and restrained accents."
  };
}
