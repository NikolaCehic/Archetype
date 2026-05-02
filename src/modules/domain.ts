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

  if (includesAny(text, ["logistics", "shipment", "fleet", "delivery", "route"])) {
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

  if (includesAny(text, ["web3", "wallet", "token", "chain", "gas", "transaction hash"])) {
    return {
      domain: "web3",
      productType: "Web3 wallet analytics app",
      category: "crypto analytics",
      entities: ["Wallet", "Token", "Transaction", "Network", "Position"],
      workflows: ["connect_wallet", "review_portfolio", "compare_networks", "inspect_transaction", "estimate_gas_fee"],
      routes: [
        { route: "/portfolio", screen_id: "portfolio.overview", layout: "AnalyticsShell", nav_label: "Portfolio", nav_group: "core", priority: "primary", auth_requirement: "wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_wallet_analytics"] },
        { route: "/transactions", screen_id: "transactions.list", layout: "AnalyticsShell", nav_label: "Transactions", nav_group: "core", priority: "primary", auth_requirement: "wallet_connected", role_requirement: ["wallet_user"], deep_linking: true, evidence_refs: ["decision_transaction_workflow"] }
      ],
      patterns: ["WalletConnectionStatus", "TransactionHashDisplay", "NetworkBadge", "GasFeeEstimator", "TokenBalanceCard", "SignaturePrompt"],
      riskFlags: ["finance"],
      visualDirection: "Technical, high-signal, trust-oriented, with explicit network, wallet, and transaction states."
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
