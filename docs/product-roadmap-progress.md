# AI Hub — Progress board

Last updated **2026-09-07** (R1).  
Plan: product roadmap R0→R10. One release at a time.  
Standing rule: **Site Evaluation stays in the Directory on every page.**

I will refresh this file at the end of each release.

## Now

**R1 — True home page** is implemented on `cursor/product-r1-homepage-16ec`. Waiting for review before **R2**.

## In order of execution

| # | Release | Status | What it is |
|---|---|---|---|
| R0 | Baseline and safeguards | **Done** | Recorded tests, links, menu, deploy, screen sizes. No site redesign. |
| R1 | True home page | **Done (this branch)** | `index.html` is the AI Hub front door. Chatbot list is `chatbot-hub.html`. Goal cards. Courses wording. Site Admin still in the menu. |
| R2 | Goal-based guides | **Next** | Six how-to guides (choose an AI, coding tool, RAG, agent, local, evaluate). |
| R3 | Knowledge units | Waiting | Expand ~20 high-value concepts (what / when / when not / how). |
| R4 | Ask-an-AI 2.0 | Waiting | Explain / Implement / Compare / Troubleshoot + ChatGPT, Claude, Perplexity. |
| R5 | Decision support | Waiting | Help choose on Chatbot, Harness, Local Models, Architecture hubs. |
| R6 | Search and cross-links | Waiting | Client-side search from a static JSON index. |
| R7 | Freshness / provenance | Waiting | Last reviewed + verification status. No invented dates. |
| R8 | What’s New | Waiting | Home shows recent meaningful site changes. |
| R9 | SEO, accessibility, hardening | Waiting | Metadata, sitemap, keyboard/mobile polish. |
| R10 | Outcome-based evaluation | Waiting | Tests that a visitor can actually finish jobs, not only structural checks. |

## Already decided (not a separate release)

- Site Evaluation / quality metrics **stay linked on every page**.
- Stay on static HTML, CSS, vanilla JS. No React/backend/CMS.

## Not on this board

The older “revamp V2” P0–P9 list is **not** the current execution order. Useful bits (responsive cards, glossary, prompt bodies, symptoms) are covered later by R1–R10 or can be requested separately.

## How updates work

After each release you will get:

1. What just finished
2. What is still left, in this same order
3. The single next step — and a stop until you ask for it
