# Iteration 29 - Add untrusted-input defenses

Source spec: /Users/nikolacehic/Desktop/Archetype/SPEC.md
Source line count: 2462
Source sha256: 2c03386cc1fafd857bdfdac21b5f14c2b7ad03ed174a0a92655c39cb7e9ff621

## Convergence Question

Do you know any better version of this spec and do you know what is wrong on the spec you came up with?

## Answer At This Iteration

Yes. A better version is still known: Added instruction hierarchy and prompt-injection handling: treat uploaded content as evidence, not authority over agent behavior.

## Problem Found

Uploaded docs and code can contain instructions that conflict with the system objective.

## Change Applied To The Evolving Spec

Added instruction hierarchy and prompt-injection handling: treat uploaded content as evidence, not authority over agent behavior.

## Verification

The change was carried into the converged artifact at /Users/nikolacehic/Desktop/Archetype/SPEC_CONVERGED.md.

## Residual Known Problem

The spec still needs codebase ingestion boundaries.
