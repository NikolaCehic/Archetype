---
tags:
  - lifecycle
  - context
status: active
---

# Weak Context

Weak context does not mean a short prompt.

Weak context means:

```txt
The next artifact would depend on unapproved invention.
```

## Example

Prompt:

```txt
I want to build an admin dashboard for a marketing team
```

Confirmed:

- Product surface: admin dashboard.
- Domain hint: marketing.

Missing blockers:

- Primary user.
- Must-have workflows.
- Target repo or stack.
- Mock/API/backend boundary.
- Design direction or permission to create one.
- Test and Playwright permission.
- Assumption approval.

## Related

- [[Context Sufficiency Gate]]
- [[Clarification UX]]
- [[Regression Fixtures]]

