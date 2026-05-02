# SPEC.md — Archetype Design Architect Agent

**Agent name:** Archetype  
**Full name:** Archetype Design Architect Agent  
**Product category:** AI Senior Design Architect / Design Architecture Compiler  
**Version:** 1.0  
**Status:** Final product specification draft  
**Primary promise:** Convert product intent, user goals, visual evidence, and existing materials into an implementation-ready UX architecture, design system, and frontend-agent build contract.

---

## 1. Executive Summary

Archetype is not a generic design system generator.

Archetype is a **Design Architecture Compiler**.

It ingests:

- Product context
- User goals
- Business goals
- Uploaded design images
- Brand materials
- Existing UI screenshots
- Existing frontend code, optional
- Existing documentation, optional
- Existing Figma/design artifacts, optional

Then it produces:

- Product understanding model
- User/job model
- UX architecture
- Information architecture
- Route map
- Screen inventory
- Screen-level UX specifications
- Design system architecture
- Tokens
- Components
- Product-specific UX patterns
- Accessibility rules
- Documentation
- Implementation contract for frontend agents
- Quality/readiness reports

The core output is not a pile of UI assets. The core output is a **coherent product interface system** that a downstream frontend agent can use to build actual UI without guessing.

The agent must satisfy this clause:

> Archetype understands and ingests user needs and materials, then outputs a design system and product experience architecture that a Senior Design Architect would create.

---

## 2. Core Thesis

Most design-system AI products are structurally wrong because they start with visual artifacts:

```txt
colors → typography → buttons → cards → export
```

That is not how a senior design architect works.

A senior design architect starts with:

```txt
users → jobs → workflows → product structure → interaction states → reusable patterns → system foundations → implementation rules
```

Therefore Archetype must follow this order:

```txt
context + goals + materials
→ evidence ledger
→ product model
→ user/job model
→ UX architecture
→ screen architecture
→ reusable pattern architecture
→ design system
→ frontend build contract
→ QA/readiness report
```

A design system created outside of UX context is generic. A design system derived from product workflows is useful.

---

## 3. Proper Product Definition

Archetype is an AI Senior Design Architect that turns product intent and visual evidence into a complete interface architecture.

It does not only answer:

```txt
What should the buttons look like?
```

It answers:

```txt
What product is being built?
Who uses it?
What are users trying to accomplish?
What screens need to exist?
How should users move through the product?
What reusable UX patterns are required?
What design system supports those patterns?
What should frontend agents build?
How do we know the output is coherent, accessible, and implementation-ready?
```

---

## 4. Product Positioning

### Weak positioning

```txt
AI design system generator.
```

### Correct positioning

```txt
AI Senior Design Architect for generating product-specific UX systems, design systems, and frontend build contracts from context, goals, and visual materials.
```

### Sharpest positioning

```txt
A Design Architecture Compiler for turning product intent into implementation-ready UX and design-system specifications.
```

---

## 5. Primary Users

### 5.1 Founder / Solo Builder

Needs to turn an idea and some references into a buildable product UI.

Success means:

- They can provide product context, goals, and inspiration images.
- Archetype generates product UX, screens, and design system.
- A frontend agent can build the product UI from the output package.

### 5.2 Product Designer

Needs a system-level design architecture instead of starting from a blank canvas.

Success means:

- They get design principles, IA, flows, surfaces, components, tokens, and UX rules.
- They can refine instead of inventing everything.

### 5.3 Frontend Engineer

Needs precise, implementation-ready UI instructions.

Success means:

- They receive machine-readable screen specs.
- They receive component usage rules.
- They do not have to invent UX or visual design.

### 5.4 Frontend Agent / Coding Agent

Needs structured constraints to generate UI correctly.

Success means:

- It can read the route map, screen specs, component registry, token files, data contracts, and acceptance criteria.
- It can assemble the UI using the provided design system.
- It does not randomly invent inconsistent UI.

### 5.5 Agency / Product Studio

Needs to create polished client-ready product UX and design systems quickly.

Success means:

- The output can be handed to clients, designers, and engineers.
- The design rationale and implementation contract are clear.

### 5.6 Design System Team

Needs to audit, normalize, and govern existing product UI.

Success means:

- Archetype detects inconsistency.
- It proposes a normalized system.
- It creates migration and governance plans.

---

## 6. Non-Goals

Archetype must not become a random UI generator.

It must not:

- Generate screens without product understanding.
- Generate a generic component library disconnected from UX flows.
- Copy visual references blindly.
- Pretend assumptions are facts.
- Let frontend agents invent missing design decisions silently.
- Treat accessibility as an afterthought.
- Prioritize visual polish over system coherence.
- Support every frontend framework before the core architecture works.
- Replace human design review for high-stakes products.

---

## 7. Key Product Insight

A design system is not enough for frontend agents to create a product.

A frontend agent needs:

```txt
product model
+ user journeys
+ information architecture
+ route map
+ screen specs
+ state models
+ component registry
+ token system
+ layout rules
+ interaction rules
+ accessibility requirements
+ data contracts
+ acceptance criteria
```

Therefore Archetype must generate two top-level artifacts:

1. **Design System Package**
2. **Product Experience Blueprint**

The frontend agent consumes both.

---

## 8. Archetype Output Philosophy

Archetype outputs decisions, not vibes.

Bad output:

```txt
Make it clean, modern, and professional.
```

Good output:

```txt
Use a medium-high density dashboard layout with a persistent left sidebar, neutral surfaces, restrained blue accent color, compact stat cards, table-first information display, strong focus states, and semantic status badges for invoice/payment states.
```

Bad output:

```txt
Generate a dashboard.
```

Good output:

```txt
Route: /dashboard
Purpose: Give users a 10-second overview of cash balance, unpaid invoices, monthly expenses, and projected risk.
Required sections: PageHeader, MetricGrid, CashFlowChartPanel, RecentInvoicesTable, RiskAlertPanel.
Required states: loading, empty, error, permission_denied.
Accessibility: chart must have tabular fallback; financial risk cannot be indicated by color alone.
```

---

## 9. System Architecture Overview

```txt
User Input
  ↓
Ingestion Layer
  ↓
Evidence Ledger
  ↓
Product Understanding Layer
  ↓
UX Architecture Layer
  ↓
Design System Architecture Graph
  ↓
Artifact Generators
  ↓
QA / Readiness Engine
  ↓
Export Package
  ↓
Frontend Agent Build Contract
```

---

## 10. Input Types

Archetype must support these input categories.

### 10.1 Natural Language Context

Examples:

```txt
I am building a fintech dashboard for small businesses.
```

```txt
I need a Web3 wallet analytics app for traders.
```

```txt
I am redesigning a logistics operations platform.
```

Extract:

- Product category
- Audience
- Jobs-to-be-done
- Business goal
- Interface complexity
- Risk level
- Platform assumptions
- UX priorities

### 10.2 User Goals

Examples:

```txt
Users should understand cash flow and unpaid invoices quickly.
```

```txt
Users should compare wallet performance across chains.
```

Extract:

- Primary jobs
- Secondary jobs
- Success criteria
- Product workflows
- Relevant entities
- Required screens

### 10.3 Design Images / Screenshots

Images may include:

- Existing product screenshots
- Competitor screenshots
- Moodboard references
- Brand references
- UI inspiration images
- Wireframes
- Sketches
- Landing page references
- Dashboard references

Extract:

- Color tendencies
- Typography character
- Layout density
- Navigation model
- Component patterns
- Visual hierarchy
- Spacing rhythm
- Radius/elevation style
- Data display patterns
- Form patterns
- Empty/error/loading states, if visible
- Accessibility risks
- What should be preserved
- What should be avoided

Important rule:

> Archetype must interpret images as design evidence, not copy them blindly.

### 10.4 Brand Materials

Inputs:

- Logos
- Brand palettes
- Typography guidelines
- Brand strategy docs
- Tone-of-voice docs
- Existing marketing site

Extract:

- Brand constraints
- Voice and tone
- Visual system anchors
- Color restrictions
- Typography constraints
- Logo usage constraints

### 10.5 Existing Codebase, Optional

Inputs:

- React components
- Tailwind config
- CSS variables
- CSS/SCSS files
- Component library files
- Storybook files
- Package structure

Extract:

- Current components
- Current tokens
- Hardcoded styles
- Duplicate patterns
- Inconsistent spacing
- Accessibility issues
- Component API issues
- Migration opportunities

### 10.6 Existing Design Files, Optional

Inputs:

- Figma files
- Token JSON
- Design library exports
- Component screenshots

Extract:

- Current component inventory
- Token structure
- Variant structure
- Naming conventions
- Layout patterns
- Design/code drift risks

---

## 11. Evidence Ledger

Archetype must maintain an Evidence Ledger for every project.

The Evidence Ledger separates:

```txt
known facts
inferred decisions
assumptions
missing information
risks
```

This is mandatory. Without it, the agent will hallucinate authority.

### 11.1 Evidence Ledger Schema

```json
{
  "project_id": "project_123",
  "sources": [
    {
      "source_id": "uploaded_image_01",
      "source_type": "image",
      "source_label": "dashboard reference screenshot",
      "observations": [
        "left sidebar navigation",
        "compact stat cards",
        "blue primary accent",
        "dense table layout",
        "low shadow usage"
      ],
      "design_implications": [
        "desktop-first dashboard shell is appropriate",
        "system should support dense data display",
        "status and metric components are required"
      ],
      "used_for": [
        "layout density",
        "component inventory",
        "token direction"
      ],
      "confidence": "medium"
    }
  ],
  "known_facts": [
    "The product is a fintech dashboard for small businesses."
  ],
  "inferences": [
    {
      "claim": "The product should be dashboard-first.",
      "confidence": "high",
      "reason": "The stated goal and uploaded images are dashboard-oriented."
    }
  ],
  "assumptions": [
    {
      "assumption": "The primary platform is web desktop with responsive support.",
      "confidence": "medium",
      "reason": "All references are desktop web UI."
    }
  ],
  "missing_information": [
    "Exact user roles",
    "Backend data schema",
    "Mobile priority",
    "Authentication requirements"
  ]
}
```

### 11.2 Source Priority

When sources conflict, Archetype must prioritize:

```txt
1. Explicit user goals
2. Product requirements/docs
3. Existing production UI/code
4. Existing design files
5. Uploaded screenshots
6. Competitor/reference images
7. Agent assumptions
```

### 11.3 Confidence Levels

Every major conclusion should be marked as:

```txt
high confidence
medium confidence
low confidence
```

Low-confidence decisions must be either:

- Asked as a clarification if blocking, or
- Marked as an assumption if not blocking.

---

## 12. Design System Architecture Graph

The core internal representation is the **Design System Architecture Graph**, abbreviated as **DSAG**.

The DSAG connects product needs to design system decisions.

### 12.1 DSAG Purpose

The DSAG prevents the agent from generating disconnected artifacts.

It answers:

```txt
Why does this token exist?
Which component uses it?
Which screen uses the component?
Which user workflow requires the screen?
Which product goal does that workflow support?
```

### 12.2 DSAG Node Types

```txt
ProductGoal
UserType
UserJob
BusinessConstraint
PlatformConstraint
AccessibilityRequirement
Entity
Workflow
Route
Screen
ScreenSection
State
Interaction
Pattern
Component
ComponentVariant
Token
DataContract
ContentRule
QualityGate
```

### 12.3 DSAG Edge Types

```txt
supports
requires
appears_on
composed_of
implemented_by
styled_by
constrained_by
derived_from
validated_by
blocked_by
replaces
alternative_to
```

### 12.4 Example DSAG Relationship

```txt
ProductGoal: Help users understand financial health quickly
  supports → UserJob: Review cash flow risk
  requires → Screen: Dashboard Overview
  composed_of → ScreenSection: Risk Summary
  implemented_by → Pattern: RiskAlertPanel
  implemented_by → Component: Alert
  styled_by → Token: color.status.warning.background
  validated_by → AccessibilityRequirement: color_not_sole_indicator
```

This graph is the difference between a design system architect and a UI kit generator.

---

## 13. Core Agent Capabilities

### 13.1 Product Understanding

Archetype must convert messy context into a structured product model.

Output:

```json
{
  "product_type": "B2B fintech dashboard",
  "primary_users": ["small business owners", "bookkeepers"],
  "core_jobs": [
    "understand cash flow",
    "track unpaid invoices",
    "review monthly expenses"
  ],
  "primary_entities": [
    "Invoice",
    "Expense",
    "Transaction",
    "Customer",
    "Report"
  ],
  "platform": "web",
  "interface_density": "medium-high",
  "accessibility_target": "WCAG AA"
}
```

### 13.2 UX Architecture

Archetype must define how the product works.

Outputs:

- User journeys
- Core flows
- Information architecture
- Navigation model
- Route map
- Screen inventory
- State models
- Permission states
- Empty/loading/error states
- Interaction rules
- Responsive UX rules

### 13.3 Screen Specification

Archetype must generate implementation-ready screen specs.

Each screen spec must include:

- Screen ID
- Route
- Purpose
- User goal
- Business goal
- Layout type
- Sections
- Required components
- Data needs
- States
- Interactions
- Accessibility requirements
- Responsive behavior
- Acceptance criteria

### 13.4 Design System Generation

Archetype must create a design system derived from the UX architecture.

Outputs:

- Design principles
- Token architecture
- Semantic tokens
- Typography system
- Spacing system
- Radius/elevation/motion systems
- Component registry
- Pattern registry
- Accessibility rules
- Usage guidelines
- Documentation

### 13.5 Product-Specific Pattern Generation

Archetype must generate domain-specific reusable UX patterns.

Generic components are not enough.

For fintech:

```txt
AmountDisplay
InvoiceStatusBadge
CashFlowRiskAlert
FinancialMetricCard
TransactionTableRow
DateRangeFilter
ReportSummaryPanel
```

For logistics:

```txt
ShipmentStatusBadge
RouteProgressTimeline
FleetHealthCard
DeliveryExceptionAlert
MapPanel
VehicleAssignmentTable
```

For Web3:

```txt
WalletConnectionStatus
TransactionHashDisplay
NetworkBadge
GasFeeEstimator
TokenBalanceCard
SignaturePrompt
```

For healthcare:

```txt
PatientSummaryCard
AppointmentStatusBadge
ClinicalAlert
MedicationList
CarePlanSection
ProviderNote
```

### 13.6 Frontend Agent Contract Generation

Archetype must produce a strict build contract for downstream frontend agents.

The frontend agent must know:

- What routes to create
- What screens to build
- What components to use
- What layout rules to follow
- What states to implement
- What data shapes to expect
- What interactions to support
- What accessibility requirements to satisfy
- What acceptance criteria prove completion

### 13.7 Accessibility Architecture

Archetype must design accessibility into the system, not bolt it on.

It must define:

- Color contrast requirements
- Focus states
- Keyboard behavior
- ARIA guidance
- Form labeling rules
- Error messaging rules
- Reduced motion rules
- Screen reader rules
- Chart/data fallback rules
- Color-not-sole-indicator rules

### 13.8 Readiness Scoring

Before handoff, Archetype must score implementation readiness.

Example:

```json
{
  "implementation_readiness_score": 86,
  "ready_for_frontend_agent": true,
  "blockers": [],
  "warnings": [
    "Backend data schema is inferred, not confirmed.",
    "Mobile priority is assumed to be secondary."
  ],
  "required_human_review": [
    "Confirm user roles and permissions.",
    "Confirm billing flow requirements."
  ]
}
```

---

## 14. Design System Layers

Archetype must model the design system in layers.

```txt
Layer 1: Foundations
Layer 2: Tokens
Layer 3: Primitive Components
Layer 4: Composite Components
Layer 5: Product-Specific Patterns
Layer 6: Screen Templates
Layer 7: Full Screen Specifications
Layer 8: Flow Specifications
```

### 14.1 Foundations

Includes:

- Design principles
- Brand attributes
- UX principles
- Accessibility principles
- Visual direction
- Density model
- Tone and content rules

### 14.2 Tokens

Includes:

- Primitive tokens
- Semantic tokens
- Component tokens
- Theme tokens
- Mode tokens

Token categories:

```txt
color
typography
spacing
sizing
radius
border
shadow
elevation
opacity
z-index
motion
breakpoints
iconography
```

### 14.3 Primitive Components

Examples:

```txt
Button
IconButton
Text
Heading
Link
Input
Textarea
Checkbox
Radio
Switch
Select
Badge
Avatar
Divider
Spinner
Skeleton
```

### 14.4 Composite Components

Examples:

```txt
Card
Modal
Drawer
Tabs
Accordion
Toast
Alert
Tooltip
Popover
FormField
DataTable
Pagination
Sidebar
TopNav
PageHeader
```

### 14.5 Product-Specific Patterns

Examples:

```txt
FinancialMetricCard
InvoiceStatusBadge
TransactionRow
CashFlowChartPanel
RiskAlertPanel
```

### 14.6 Screen Templates

Examples:

```txt
DashboardShell
SettingsLayout
ListDetailLayout
FormWorkflowLayout
ReportLayout
AuthLayout
```

### 14.7 Screen Specifications

Examples:

```txt
dashboard.overview
invoices.list
invoice.detail
expenses.list
reports.monthly
settings.profile
```

### 14.8 Flow Specifications

Examples:

```txt
create_invoice_flow
send_invoice_reminder_flow
filter_transactions_flow
export_report_flow
```

---

## 15. Required Output Package

Archetype must export a structured package.

```txt
archetype-output/
  00-manifest/
    manifest.json
    implementation-readiness.json

  01-evidence/
    evidence-ledger.json
    assumptions.md
    risks.md
    missing-context.md

  02-product-model/
    product-brief.md
    product-model.json
    user-model.json
    jobs-to-be-done.md
    entity-model.json

  03-experience-architecture/
    user-journeys.md
    flow-specs.json
    information-architecture.json
    route-map.json
    screen-inventory.json
    navigation-model.json
    state-models.json

  04-design-system/
    design-principles.md
    visual-direction.md
    tokens/
      primitive-tokens.json
      semantic-tokens.json
      component-tokens.json
      theme-light.json
      theme-dark.json
      css-variables.css
      tailwind.config.ts
    components/
      component-registry.json
      component-specs.md
    patterns/
      pattern-registry.json
      pattern-specs.md
    accessibility/
      accessibility-rules.json
      accessibility-guidelines.md
    docs/
      foundations.md
      usage-guidelines.md
      anti-patterns.md

  05-screen-specs/
    dashboard-overview.yaml
    invoices-list.yaml
    invoice-detail.yaml
    expenses-list.yaml
    reports-monthly.yaml
    settings-profile.yaml

  06-frontend-agent-contract/
    build-manifest.json
    component-usage-map.json
    layout-rules.json
    responsive-rules.json
    interaction-rules.json
    data-contracts.json
    routing-contract.json
    acceptance-criteria.json
    frontend-agent-instructions.md

  07-reference-surfaces/
    reference-dashboard.md
    reference-table.md
    reference-form.md
    reference-mobile.md

  08-quality/
    consistency-report.md
    accessibility-report.md
    screen-coverage-report.md
    component-coverage-report.md
    implementation-readiness-report.md
    unresolved-decisions.md
```

---

## 16. Product Experience Blueprint

The Product Experience Blueprint is the UX architecture package.

It must answer:

- What is the product?
- Who uses it?
- What are the primary user jobs?
- What screens exist?
- How do screens connect?
- What flows must be supported?
- What state models exist?
- What data entities exist?
- What UI patterns are required?
- What must frontend agents build?

### 16.1 Product Model Schema

```json
{
  "product_name": "CashPilot",
  "product_type": "B2B fintech dashboard",
  "primary_goal": "Help small businesses understand and manage cash flow.",
  "users": [
    {
      "user_type": "Small business owner",
      "goals": [
        "Know current cash position",
        "Identify unpaid invoices",
        "Avoid cash flow surprises"
      ],
      "pain_points": [
        "Financial data is fragmented",
        "Reports are hard to interpret",
        "Late payments are easy to miss"
      ]
    }
  ],
  "core_entities": [
    "Invoice",
    "Expense",
    "Transaction",
    "Customer",
    "Report"
  ],
  "primary_workflows": [
    "review_dashboard",
    "track_invoices",
    "send_invoice_reminder",
    "review_expenses",
    "export_monthly_report"
  ]
}
```

### 16.2 Route Map Schema

```json
{
  "routes": [
    {
      "route": "/dashboard",
      "screen_id": "dashboard.overview",
      "layout": "DashboardShell",
      "nav_label": "Dashboard",
      "priority": "primary"
    },
    {
      "route": "/invoices",
      "screen_id": "invoices.list",
      "layout": "DashboardShell",
      "nav_label": "Invoices",
      "priority": "primary"
    },
    {
      "route": "/invoices/:invoiceId",
      "screen_id": "invoice.detail",
      "layout": "DetailShell",
      "nav_label": null,
      "priority": "secondary"
    }
  ]
}
```

### 16.3 Screen Inventory Schema

```json
{
  "screens": [
    {
      "screen_id": "dashboard.overview",
      "route": "/dashboard",
      "purpose": "Give users a high-level view of financial health.",
      "priority": "P0",
      "complexity": "medium",
      "required_patterns": [
        "FinancialMetricCard",
        "CashFlowChartPanel",
        "RiskAlertPanel",
        "InvoiceStatusBadge"
      ]
    }
  ]
}
```

---

## 17. Screen Specification Format

Every screen spec must be precise enough for a frontend agent to build.

### 17.1 Example Screen Spec

```yaml
screen_id: dashboard.overview
route: /dashboard
name: Financial Overview Dashboard
priority: P0

purpose:
  Give users a high-level view of business financial health.

primary_user_goal:
  Understand cash flow, unpaid invoices, expenses, and financial risk quickly.

business_goal:
  Increase user trust by making financial status obvious within the first 10 seconds.

layout:
  type: dashboard-grid
  shell: DashboardShell
  max_width: fluid
  density: medium-high
  sections:
    - id: page_header
      component: PageHeader
      content:
        title: Financial Overview
        subtitle: Track cash flow, invoices, and spending health.
        actions:
          - component: Button
            variant: primary
            label: Create invoice
            action: navigate:/invoices/new

    - id: metric_grid
      component: MetricGrid
      columns:
        desktop: 4
        tablet: 2
        mobile: 1
      children:
        - component: FinancialMetricCard
          metric: cash_balance
        - component: FinancialMetricCard
          metric: unpaid_invoices
        - component: FinancialMetricCard
          metric: monthly_expenses
        - component: FinancialMetricCard
          metric: projected_cash_flow

    - id: cash_flow_chart
      component: CashFlowChartPanel
      title: Cash flow trend
      data_source: cash_flow_summary

    - id: risk_alerts
      component: RiskAlertPanel
      data_source: financial_risks

    - id: recent_invoices
      component: DataTable
      variant: compact
      title: Recent unpaid invoices
      data_source: unpaid_invoices

states:
  loading:
    use: DashboardSkeleton
  empty:
    use: EmptyState
    title: No financial activity yet
    body: Add invoices or connect your accounting source to get started.
    primary_action:
      label: Create invoice
      action: navigate:/invoices/new
  error:
    use: Alert
    variant: danger
    message: Financial data could not be loaded.
  permission_denied:
    use: PermissionNotice

interactions:
  - id: create_invoice
    trigger: primary_cta_click
    result: navigate:/invoices/new
  - id: filter_cash_flow_range
    trigger: date_range_change
    result: update:cash_flow_chart

responsive_behavior:
  desktop: four_column_metric_grid
  tablet: two_column_metric_grid
  mobile: single_column_stack

accessibility:
  keyboard_navigation: required
  chart_fallback_table: required
  color_not_sole_indicator: true
  focus_visible: required

required_components:
  - DashboardShell
  - PageHeader
  - Button
  - MetricGrid
  - FinancialMetricCard
  - CashFlowChartPanel
  - RiskAlertPanel
  - DataTable
  - EmptyState
  - Alert
  - DashboardSkeleton
  - PermissionNotice

acceptance_criteria:
  - User can understand financial status within 10 seconds.
  - Primary CTA is visible above the fold on desktop.
  - Dashboard supports loading, empty, error, and permission states.
  - Financial risk indicators include text labels and icons, not color alone.
  - Screen remains usable at mobile width.
```

---

## 18. Design System Package

The design system must be generated from the Product Experience Blueprint.

### 18.1 Design Principles

Example:

```txt
1. Clarity before decoration.
2. Data hierarchy must be obvious at scan speed.
3. Risk and status must never rely on color alone.
4. Dense layouts are acceptable only when hierarchy remains clear.
5. Components must be reusable across dashboard, list, detail, and form workflows.
```

### 18.2 Token Architecture

Archetype must use layered tokens.

```txt
primitive tokens
→ semantic tokens
→ component tokens
→ pattern tokens
```

Example:

```json
{
  "primitive": {
    "color.blue.600": "#2563EB",
    "color.gray.950": "#030712"
  },
  "semantic": {
    "color.action.primary.background": "{color.blue.600}",
    "color.text.primary": "{color.gray.950}",
    "color.status.warning.background": "#FEF3C7"
  },
  "component": {
    "button.primary.background": "{color.action.primary.background}",
    "card.default.background": "{color.surface.default}"
  }
}
```

### 18.3 Component Registry Schema

```json
{
  "components": [
    {
      "name": "Button",
      "category": "primitive",
      "purpose": "Trigger primary, secondary, destructive, and low-emphasis actions.",
      "variants": ["primary", "secondary", "ghost", "danger"],
      "states": ["default", "hover", "focus", "active", "disabled", "loading"],
      "props": {
        "variant": "primary | secondary | ghost | danger",
        "size": "sm | md | lg",
        "loading": "boolean",
        "disabled": "boolean"
      },
      "accessibility": [
        "Must be keyboard-focusable.",
        "Must show visible focus state.",
        "Icon-only buttons require accessible label."
      ],
      "used_on_screens": [
        "dashboard.overview",
        "invoices.list",
        "invoice.detail"
      ]
    }
  ]
}
```

### 18.4 Pattern Registry Schema

```json
{
  "patterns": [
    {
      "name": "FinancialMetricCard",
      "category": "product-specific",
      "purpose": "Display a high-priority financial metric with trend and status context.",
      "composed_of": ["Card", "Text", "Badge", "TrendIndicator"],
      "variants": ["neutral", "positive", "warning", "danger"],
      "data_requirements": [
        "label",
        "value",
        "unit",
        "trend_direction",
        "trend_label",
        "status"
      ],
      "accessibility": [
        "Trend direction must include text, not color alone.",
        "Large metric text must remain readable at mobile width."
      ],
      "used_on_screens": ["dashboard.overview"]
    }
  ]
}
```

---

## 19. Frontend Agent Contract

The Frontend Agent Contract is mandatory.

It prevents downstream agents from hallucinating UI.

### 19.1 Frontend Agent Rule

Frontend agents must assemble from the provided system. They must not become the designer.

Instruction:

```txt
Build the UI using only the provided product model, route map, screen specs, component registry, pattern registry, tokens, layout rules, data contracts, and acceptance criteria.

Do not invent new components, visual styles, routes, or UX flows unless the contract explicitly allows it.

If a required element is missing, report a design-system gap instead of improvising.
```

### 19.2 Build Manifest Schema

```json
{
  "project_name": "CashPilot",
  "frontend_stack": {
    "framework": "React",
    "language": "TypeScript",
    "styling": "Tailwind CSS + CSS variables",
    "routing": "Next.js App Router"
  },
  "build_order": [
    "install_tokens",
    "create_layout_shells",
    "create_routes",
    "create_components",
    "create_patterns",
    "build_screens",
    "implement_states",
    "run_accessibility_checks",
    "verify_acceptance_criteria"
  ],
  "entry_routes": [
    "/dashboard",
    "/invoices",
    "/expenses",
    "/reports",
    "/settings"
  ]
}
```

### 19.3 Component Usage Map

```json
{
  "dashboard.overview": {
    "required_components": [
      "DashboardShell",
      "PageHeader",
      "Button",
      "MetricGrid",
      "FinancialMetricCard",
      "CashFlowChartPanel",
      "RiskAlertPanel",
      "DataTable"
    ],
    "forbidden_components": [],
    "allowed_new_components": false
  }
}
```

### 19.4 Data Contract Schema

```json
{
  "entities": {
    "Invoice": {
      "fields": {
        "id": "string",
        "customerName": "string",
        "amount": "number",
        "currency": "string",
        "status": "draft | sent | overdue | paid",
        "dueDate": "ISODate"
      }
    },
    "FinancialMetric": {
      "fields": {
        "label": "string",
        "value": "number",
        "unit": "currency | percent | count",
        "trendDirection": "up | down | flat",
        "status": "neutral | positive | warning | danger"
      }
    }
  }
}
```

### 19.5 Frontend Agent Build Flow

```txt
1. Read manifest.json.
2. Read product-model.json.
3. Read route-map.json.
4. Install/apply tokens.
5. Create layout shells.
6. Create primitive components.
7. Create composite components.
8. Create product-specific patterns.
9. Build screens from screen specs.
10. Implement loading, empty, error, permission, and success states.
11. Apply responsive rules.
12. Apply accessibility rules.
13. Validate against acceptance criteria.
14. Report missing system gaps instead of inventing unapproved UI.
```

---

## 20. UX Requirements

Archetype must generate UX, not only UI.

Required UX outputs:

- User journeys
- Navigation architecture
- Route map
- Screen hierarchy
- Onboarding flow, if relevant
- Primary task flows
- Secondary task flows
- Form behavior
- Validation behavior
- Loading states
- Empty states
- Error states
- Permission states
- Success states
- Upgrade/paywall states, if relevant
- Responsive behavior
- Microcopy guidance
- Accessibility behavior

### 20.1 UX State Requirements

Every primary screen must define:

```txt
default state
loading state
empty state
error state
permission_denied state
partial_data state, if relevant
success/confirmation state, if relevant
```

### 20.2 Empty State Rule

Bad:

```txt
Show an empty table.
```

Good:

```txt
If there are no invoices, show EmptyState with explanation, primary action "Create invoice", secondary action "Import invoices", and a short educational hint.
```

### 20.3 Error State Rule

Errors must include:

- What happened
- User-safe explanation
- Recovery action
- Retry action, if relevant
- Support path, if relevant

### 20.4 Loading State Rule

Loading states must preserve layout stability where possible.

For dashboard screens:

```txt
Use skeleton blocks matching metric cards, chart panels, and table rows.
```

### 20.5 Permission State Rule

Permission failures must not look like broken product states.

They must include:

- Clear message
- Required permission
- Who to contact or what action to take

---

## 21. Accessibility Requirements

Archetype must target at least WCAG AA by default unless the user explicitly selects a different standard.

### 21.1 Required Checks

- Text contrast
- Non-text contrast
- Visible focus states
- Keyboard navigation
- Logical tab order
- Form labels
- Error messages
- ARIA usage
- Reduced motion
- Touch target size
- Color-not-sole-indicator rule
- Chart/table fallback
- Responsive readability

### 21.2 Accessibility Report Schema

```json
{
  "target": "WCAG AA",
  "status": "review_required",
  "checks": [
    {
      "id": "contrast.primary_button",
      "status": "pass",
      "details": "Primary button text contrast meets target."
    },
    {
      "id": "chart.cash_flow.fallback",
      "status": "warning",
      "details": "Chart requires tabular fallback in implementation."
    }
  ],
  "blockers": [],
  "warnings": [
    "Financial risk status must include icon and text, not color alone."
  ]
}
```

---

## 22. Image Ingestion Rules

When the user provides design images, Archetype must:

1. Identify the image type.
2. Extract visual observations.
3. Extract UX/layout observations.
4. Extract component/pattern observations.
5. Separate evidence from assumptions.
6. Avoid direct copying.
7. Convert visual evidence into system decisions.
8. Record all decisions in the Evidence Ledger.

### 22.1 Image Analysis Output

```json
{
  "image_id": "uploaded_image_01",
  "image_type": "dashboard reference",
  "visual_observations": {
    "density": "high",
    "navigation": "left sidebar",
    "surface_style": "neutral cards on light background",
    "accent_usage": "blue for primary actions and selected nav",
    "radius": "medium-low",
    "shadow": "subtle"
  },
  "ux_observations": {
    "primary_pattern": "dashboard overview",
    "data_display": "stat cards + tables + charts",
    "likely_user_goal": "quick operational overview"
  },
  "system_implications": [
    "Generate DashboardShell.",
    "Generate MetricCard pattern.",
    "Generate compact DataTable variant.",
    "Use restrained elevation tokens."
  ],
  "confidence": "medium"
}
```

---

## 23. Agent Workflow

### 23.1 Standard Workflow

```txt
1. Intake user context, goals, and materials.
2. Build Evidence Ledger.
3. Extract Product Model.
4. Extract User/Job Model.
5. Define Information Architecture.
6. Define User Journeys and Flows.
7. Define Screen Inventory.
8. Define Screen Specs.
9. Identify reusable UX patterns.
10. Generate Design System Architecture Graph.
11. Generate tokens, components, patterns, and docs.
12. Generate Frontend Agent Contract.
13. Run QA/readiness checks.
14. Export package.
```

### 23.2 Clarification Policy

Archetype should not ask excessive questions.

It should ask only when missing information blocks architecture.

If information is missing but not blocking, Archetype must proceed with assumptions and record them.

Examples of blocking questions:

```txt
Is this web, mobile, or both?
```

```txt
Are there multiple user roles with different permissions?
```

Examples of non-blocking assumptions:

```txt
Assume desktop-first because all references are dashboard screenshots.
```

```txt
Assume light mode first with dark mode optional.
```

### 23.3 Approval Gates

Archetype should support approval gates:

```txt
Gate 1: Product Understanding Approval
Gate 2: UX Architecture Approval
Gate 3: Design System Direction Approval
Gate 4: Screen Spec Approval
Gate 5: Frontend Contract Approval
Gate 6: Export Approval
```

For fast mode, gates may be collapsed.

---

## 24. Agent Modules

Archetype should be implemented as a multi-agent or modular system.

### 24.1 Orchestrator

Responsibilities:

- Own project state
- Sequence modules
- Resolve conflicts
- Maintain DSAG
- Manage approval gates
- Produce final export

### 24.2 Ingestion Analyst

Responsibilities:

- Parse user context
- Analyze uploaded images
- Analyze docs
- Analyze code/design assets, if provided
- Populate Evidence Ledger

### 24.3 Product Strategist

Responsibilities:

- Define product model
- Define user model
- Define jobs-to-be-done
- Define product goals
- Define constraints

### 24.4 UX Architect

Responsibilities:

- Define information architecture
- Define route map
- Define user journeys
- Define flows
- Define state models
- Define screen inventory

### 24.5 Screen Architect

Responsibilities:

- Create screen-level specs
- Define layout hierarchy
- Define section composition
- Define responsive behavior
- Define screen acceptance criteria

### 24.6 Design System Architect

Responsibilities:

- Define foundations
- Generate token architecture
- Generate component registry
- Generate pattern registry
- Map design system decisions to UX needs

### 24.7 Accessibility Architect

Responsibilities:

- Define accessibility rules
- Validate token contrast
- Validate interaction requirements
- Create accessibility report

### 24.8 Frontend Contract Architect

Responsibilities:

- Generate build manifest
- Generate component usage map
- Generate data contracts
- Generate layout and interaction rules
- Generate frontend-agent instructions

### 24.9 QA Evaluator

Responsibilities:

- Check consistency
- Check coverage
- Check missing states
- Check implementation readiness
- Produce final readiness score

---

## 25. Functional Requirements

### 25.1 Intake

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | User can provide natural language product context. | P0 |
| FR-002 | User can provide product goals. | P0 |
| FR-003 | User can upload design/reference images. | P0 |
| FR-004 | User can upload brand materials. | P1 |
| FR-005 | User can upload existing UI screenshots. | P0 |
| FR-006 | User can upload codebase files. | P1 |
| FR-007 | User can upload design-system/token files. | P1 |
| FR-008 | Agent records all evidence and assumptions. | P0 |

### 25.2 Product Understanding

| ID | Requirement | Priority |
|---|---|---|
| FR-009 | Agent creates product model. | P0 |
| FR-010 | Agent creates user/job model. | P0 |
| FR-011 | Agent identifies product entities. | P0 |
| FR-012 | Agent identifies core workflows. | P0 |
| FR-013 | Agent identifies missing context. | P0 |
| FR-014 | Agent assigns confidence levels to key conclusions. | P0 |

### 25.3 UX Architecture

| ID | Requirement | Priority |
|---|---|---|
| FR-015 | Agent creates information architecture. | P0 |
| FR-016 | Agent creates route map. | P0 |
| FR-017 | Agent creates screen inventory. | P0 |
| FR-018 | Agent creates primary user journeys. | P0 |
| FR-019 | Agent creates flow specs. | P0 |
| FR-020 | Agent creates state models. | P0 |
| FR-021 | Agent creates navigation model. | P0 |

### 25.4 Screen Specs

| ID | Requirement | Priority |
|---|---|---|
| FR-022 | Agent creates implementation-ready screen specs. | P0 |
| FR-023 | Screen specs include purpose and user goal. | P0 |
| FR-024 | Screen specs include layout structure. | P0 |
| FR-025 | Screen specs include required components/patterns. | P0 |
| FR-026 | Screen specs include loading/empty/error states. | P0 |
| FR-027 | Screen specs include accessibility requirements. | P0 |
| FR-028 | Screen specs include acceptance criteria. | P0 |

### 25.5 Design System

| ID | Requirement | Priority |
|---|---|---|
| FR-029 | Agent creates design principles. | P0 |
| FR-030 | Agent creates token architecture. | P0 |
| FR-031 | Agent creates semantic tokens. | P0 |
| FR-032 | Agent creates component registry. | P0 |
| FR-033 | Agent creates product-specific pattern registry. | P0 |
| FR-034 | Agent maps components to screens. | P0 |
| FR-035 | Agent creates usage guidelines. | P0 |
| FR-036 | Agent creates anti-patterns. | P1 |

### 25.6 Frontend Agent Contract

| ID | Requirement | Priority |
|---|---|---|
| FR-037 | Agent creates build manifest. | P0 |
| FR-038 | Agent creates component usage map. | P0 |
| FR-039 | Agent creates layout rules. | P0 |
| FR-040 | Agent creates responsive rules. | P0 |
| FR-041 | Agent creates interaction rules. | P0 |
| FR-042 | Agent creates data contracts. | P0 |
| FR-043 | Agent creates acceptance criteria package. | P0 |
| FR-044 | Agent creates instructions for frontend agents. | P0 |

### 25.7 QA

| ID | Requirement | Priority |
|---|---|---|
| FR-045 | Agent creates consistency report. | P0 |
| FR-046 | Agent creates accessibility report. | P0 |
| FR-047 | Agent creates implementation readiness score. | P0 |
| FR-048 | Agent identifies blockers. | P0 |
| FR-049 | Agent identifies warnings. | P0 |
| FR-050 | Agent identifies unresolved decisions. | P0 |

---

## 26. Non-Functional Requirements

### 26.1 Coherence

All outputs must be connected.

A token must map to components. Components must map to patterns. Patterns must map to screens. Screens must map to user jobs. User jobs must map to product goals.

### 26.2 Traceability

Every major decision must have a source:

```txt
explicit user input
uploaded material
image observation
code/design evidence
inference
assumption
```

### 26.3 Implementation Readiness

The output must be usable by a frontend agent without broad interpretation.

### 26.4 Accessibility

Accessibility must be part of the architecture, not a post-processing checklist.

### 26.5 Determinism

Given the same context and materials, Archetype should produce structurally similar artifacts.

### 26.6 Modularity

The system must support replacing or improving individual modules without rewriting the entire agent.

### 26.7 Extensibility

The system must support future export targets:

- React
- Vue
- Svelte
- React Native
- SwiftUI
- Kotlin Compose
- Figma tokens
- Storybook
- GitHub PRs

But MVP should not support all of them.

---

## 27. MVP Scope

The MVP must be narrow but deep.

### 27.1 MVP Inputs

- Natural language context
- Product goals
- 1–10 design/reference images
- Optional brand colors/logo
- Optional preferred frontend stack

### 27.2 MVP Outputs

- Evidence Ledger
- Product Model
- User/Job Model
- Information Architecture
- Route Map
- Screen Inventory
- 5–10 Screen Specs
- Design Principles
- Token Architecture
- Component Registry
- Product-Specific Pattern Registry
- Accessibility Rules
- Frontend Agent Contract
- Implementation Readiness Report

### 27.3 MVP Framework Target

Start with:

```txt
React + TypeScript + Tailwind CSS + CSS variables
```

Do not start with every framework.

### 27.4 MVP Component Scope

Core components:

```txt
Button
IconButton
Input
Textarea
Select
Checkbox
Radio
Switch
Badge
Card
Modal
Toast
Alert
Tooltip
Tabs
DataTable
PageHeader
Sidebar
TopNav
EmptyState
Skeleton
```

Pattern components are product-specific and generated per project.

### 27.5 MVP Exclusions

Do not include initially:

- Full Figma plugin
- Automatic production deployment
- Native mobile implementation
- Full codebase migration PRs
- Complex enterprise governance
- Multi-brand theming
- Unlimited component generation

---

## 28. V1 Scope

V1 adds stronger implementation and workflow integration.

Features:

- GitHub export
- Storybook generation
- Existing codebase audit
- Existing website/screenshot audit
- Dark mode generation
- Version history
- Diff previews
- Figma-compatible token export
- Improved accessibility validation
- Component code generation

---

## 29. V2 Scope

V2 turns Archetype into a maintenance system.

Features:

- Continuous design-system drift detection
- Pull request review bot
- Duplicate component detection
- Token misuse detection
- Accessibility regression detection
- Design/code mismatch detection
- Migration planning
- Governance workflows
- Design system analytics
- Multi-product/multi-brand support

---

## 30. Quality Gates

Archetype must not export blindly.

### Gate 1: Evidence Quality

Checks:

- Were inputs analyzed?
- Are assumptions listed?
- Are missing details listed?
- Are confidence levels assigned?

### Gate 2: Product Understanding

Checks:

- Is the product type clear?
- Are users identified?
- Are jobs-to-be-done defined?
- Are product entities identified?
- Are product goals mapped to UX decisions?

### Gate 3: UX Architecture

Checks:

- Is there a route map?
- Is there a screen inventory?
- Are primary flows defined?
- Are loading/empty/error states defined?
- Are permission states considered where relevant?

### Gate 4: Design System Coherence

Checks:

- Are tokens semantic?
- Are components mapped to screens?
- Are product-specific patterns defined?
- Are component states complete?
- Are design decisions justified?

### Gate 5: Accessibility

Checks:

- Contrast requirements
- Focus states
- Keyboard rules
- Form labels
- Error handling
- Reduced motion
- Chart/data fallback
- Color-not-sole-indicator rule

### Gate 6: Frontend Agent Readiness

Checks:

- Are screen specs implementation-ready?
- Are data contracts present?
- Are component usage maps present?
- Are layout and responsive rules present?
- Are acceptance criteria testable?

---

## 31. Implementation Readiness Score

Archetype must assign a readiness score from 0 to 100.

### 31.1 Score Bands

```txt
0–39: Not ready. Too much missing context.
40–59: Concept ready, not implementation ready.
60–74: Usable draft, requires design/product review.
75–89: Ready for frontend agent with warnings.
90–100: Strong implementation-ready package.
```

### 31.2 Score Dimensions

```json
{
  "product_understanding": 0,
  "ux_architecture": 0,
  "screen_spec_completeness": 0,
  "design_system_coherence": 0,
  "accessibility_coverage": 0,
  "frontend_contract_quality": 0,
  "evidence_traceability": 0
}
```

---

## 32. Failure Modes

### 32.1 Generic Design System Failure

Symptom:

```txt
Output could apply to any SaaS product.
```

Fix:

```txt
Derive components and patterns from product workflows and domain entities.
```

### 32.2 Pretty But Unbuildable Failure

Symptom:

```txt
Looks polished but frontend agents do not know what to build.
```

Fix:

```txt
Generate screen specs, route map, data contracts, and acceptance criteria.
```

### 32.3 Frontend Agent Drift Failure

Symptom:

```txt
Frontend agent invents new UI and breaks the system.
```

Fix:

```txt
Strict frontend contract: no new components/styles unless explicitly allowed.
```

### 32.4 False Certainty Failure

Symptom:

```txt
Agent makes unsupported claims.
```

Fix:

```txt
Evidence Ledger with confidence levels and assumptions.
```

### 32.5 UX Missing Failure

Symptom:

```txt
Agent generates tokens and components but no flows or screen logic.
```

Fix:

```txt
UX architecture must precede design system generation.
```

### 32.6 Accessibility Decoration Failure

Symptom:

```txt
Accessibility is listed after the design is done.
```

Fix:

```txt
Accessibility requirements must constrain tokens, components, patterns, and screen specs from the beginning.
```

---

## 33. Acceptance Criteria

Archetype is successful when:

1. A user can provide product context, goals, and design images.
2. Archetype creates an Evidence Ledger from all provided materials.
3. Archetype creates a product model with users, jobs, workflows, and entities.
4. Archetype creates UX architecture with routes, screens, journeys, and states.
5. Archetype creates a design system derived from that UX architecture.
6. Archetype creates product-specific UX patterns, not only generic components.
7. Archetype creates screen specs detailed enough for frontend implementation.
8. Archetype creates a frontend agent contract.
9. A frontend agent can build UI from the package without inventing major UX/design decisions.
10. Archetype flags missing information, assumptions, accessibility issues, and implementation risks.
11. The output feels like it was created by a Senior Design Architect, not a random UI generator.

---

## 34. Example End-to-End Flow

### User Input

```txt
I am building a fintech dashboard for small businesses.
Users need to track cash flow, unpaid invoices, expenses, and monthly financial health.
It should feel trustworthy, modern, calm, and precise.
I have uploaded three dashboard references.
Use React, TypeScript, and Tailwind.
```

### Archetype Output

```txt
Evidence Ledger
→ Product Model
→ User Jobs
→ Entity Model
→ User Journeys
→ Route Map
→ Screen Inventory
→ Screen Specs
→ Design Principles
→ Token System
→ Component Registry
→ Product Pattern Registry
→ Accessibility Rules
→ Frontend Agent Contract
→ Readiness Report
```

### Result

A frontend agent receives:

```txt
Build /dashboard, /invoices, /invoices/:id, /expenses, /reports, /settings.
Use DashboardShell, PageHeader, FinancialMetricCard, CashFlowChartPanel, DataTable, InvoiceStatusBadge, RiskAlertPanel.
Use provided tokens only.
Implement loading, empty, error, and permission states.
Do not invent new visual styles.
Validate against acceptance criteria.
```

This is buildable.

---

## 35. Strategic Recommendation

The final product should not be marketed or built as a design system generator.

That category is too shallow.

Build Archetype as:

```txt
An AI Senior Design Architect that compiles product context and visual evidence into UX architecture, design systems, and frontend-agent build contracts.
```

The product wedge is:

```txt
Context + goals + images → implementation-ready UI architecture
```

The moat is:

```txt
Evidence Ledger
+ Design System Architecture Graph
+ screen-level UX specs
+ product-specific pattern generation
+ strict frontend-agent contract
+ readiness validation
```

That is the difference between generating a pretty UI kit and creating a product interface system.

---

## 36. Final Agent Contract

Archetype must always behave according to this contract:

```txt
I do not generate design artifacts first.
I first understand the product, users, workflows, constraints, and evidence.
I convert that understanding into UX architecture.
I derive the design system from the UX architecture.
I produce implementation-ready screen specs.
I give frontend agents a strict build contract.
I expose assumptions, risks, and missing context.
I validate accessibility and consistency.
I never allow disconnected UI assets to masquerade as a design system.
```

---

## 37. Final One-Line Definition

**Archetype is a Design Architecture Compiler that turns product intent, user goals, and visual materials into a Senior Design Architect-level UX blueprint, design system, and frontend-agent implementation contract.**
