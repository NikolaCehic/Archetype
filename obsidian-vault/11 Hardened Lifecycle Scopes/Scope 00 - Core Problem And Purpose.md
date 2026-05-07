---
tags:
  - hardened-lifecycle
  - scope
  - leaf
status: active
scope_id: HL-00
---

# Scope 00 - Core Problem And Purpose

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define why the hardened lifecycle exists.

## Core Problem

Archetype can detect weak context, but currently does not obey the signal strongly enough.

The observed failure:

```txt
I want to build a admin dashboard for a marketing team
```

Correct behavior:

```txt
Archetype stops, asks one clarification question, and builds a context matrix.
```

Incorrect behavior:

```txt
Archetype generates a full app, invents product details, generates shallow tests, and produces false confidence.
```

## Exit Condition

The product direction is clear:

```txt
The lifecycle must make fake certainty impossible.
```

