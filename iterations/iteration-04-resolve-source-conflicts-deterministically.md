# Iteration 04 - Resolve source conflicts deterministically

Source spec: /Users/nikolacehic/Desktop/Archetype/SPEC.md
Source line count: 2462
Source sha256: 2c03386cc1fafd857bdfdac21b5f14c2b7ad03ed174a0a92655c39cb7e9ff621

## Convergence Question

Do you know any better version of this spec and do you know what is wrong on the spec you came up with?

## Answer At This Iteration

Yes. A better version is still known: Added explicit conflict handling: compare priority, recency, scope, confidence, and ask only when the conflict blocks architecture.

## Problem Found

Source priority exists, but it does not describe tie-breaking or what to do when high-priority sources conflict.

## Change Applied To The Evolving Spec

Added explicit conflict handling: compare priority, recency, scope, confidence, and ask only when the conflict blocks architecture.

## Verification

The change was carried into the converged artifact at /Users/nikolacehic/Desktop/Archetype/SPEC_CONVERGED.md.

## Residual Known Problem

The output package still lacks schema versioning and stable IDs for deterministic exports.
