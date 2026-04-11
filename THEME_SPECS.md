# Dracpurp Theme Specifications

This document serves as the absolute reference for the Dracpurp aesthetic manifold and cognitive interface.

## 1. Lineage Architecture

The system is bifurcated into two primary lineages, each serving a distinct cognitive state.

### 1.1 Dracpurp Original (Ancestral Roots)
- **Source:** Based on the classic Dracula palette with "semantic fine-optimization."
- **Contrast:** Native Dracula contrast (~7.0-8.0).
- **High Contrast (HC):** Uses a pure black background (#000000) but maintains **unboosted** original colors.
- **Eggshell:** Replaces variable/parameter colors with Eggshell (#F0EAD6).

### 1.2 Dracpurp Optimized (The Singularity)
- **Source:** A new, high-fidelity palette designed for maximum legibility.
- **Contrast Targets:**
  - Standard: **10.0**
  - High Contrast: **12.0**
- **Core Palette:**
  - **Green:** Magic Mint (#AAF0D1)
  - **Orange:** Rajah (#FBAB60)
  - **Blue/Cyan:** Maya Blue (#74C3FC)
- **Sub-lineages:**
  - Night Owl Italic
  - No Italic

## 2. Semantic Mapping Rules

- **Types:** Always colored in the dedicated **YELLOW** variant to provide visual separation from logic.
- **Constants/Immutables:** Storage modifiers (const, static, readonly, final) use **PINK_DARK**, a darker variant of the syntax PINK.
- **Variables/Parameters:**
  - Standard: **ORANGE** (Rajah).
  - Eggshell Variants: **EGGSHELL** (#F0EAD6).
- **Semantic Highlighting:** Explicitly **DISABLED** (`semanticHighlighting: false`) to preserve the initial TextMate grammar state and prevent color "explosions."

## 3. Technical Constraints

- **Source of Truth:** `src/palette.yml` defines all hex codes.
- **Automation:** `scripts/generate.js` processes YAML sources in `src/` to produce JSON artifacts in `theme/`.
- **Validation:** `scripts/check-colors.js` enforces contrast ratios and luminance consistency.
- **Screenshots:** Generated via Playwright and Shiki for 100% color accuracy.
