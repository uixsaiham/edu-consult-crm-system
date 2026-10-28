# BHE CRM — From Enquiry to Enrolment

*UI/UX product case study*

**Prepared:** 28 October 2026  
**Domain:** Education consultancy, student recruitment, and admissions  
**Project:** BHE CRM; application metadata currently uses “L2E CRM”  
**Current stage:** Interactive prototype with selected server integrations

This case study documents the CRM represented by the current repository. It distinguishes observable implementation from proposed improvements. It does not claim user interviews, production adoption, conversion gains, or commercial outcomes that have not been measured. Project authorship, team size, delivery timeline, and individual responsibilities have not been established.

## 2. Overview

BHE CRM brings student recruitment, admissions, partner management, and commission tracking into one administrative workspace. Its central product idea is continuity: staff should be able to follow a student from first enquiry through counselling and university applications to enrolment and the associated financial activities.

The prototype expresses this through lead queues, application records, course and institution directories, communications, performance reporting, and finance screens. Shared navigation and interface components help these areas feel like parts of one product.

The implementation demonstrates substantial interface coverage. The next development challenge is to connect that coverage to durable records, real identities, enforceable permissions, and dependable business transactions.


| Project detail | Case study context |
|---|---|
| Product | CRM for education consultancy teams |
| Design focus | Recruitment, admissions, and operational coordination |
| Your role | [Add your title, responsibilities, and collaborators] |
| Timeline | [Add actual project dates and duration] |
| Constraints | Multiple user roles, dense records, complex handoffs, prototype storage and integration boundaries |
| Deliverable demonstrated | Interactive interface spanning the student recruitment lifecycle |
| Impact | Production outcomes have not been measured; proposed measures appear below |

## 4. Problem & Solution

**Core problem hypothesis:** Staff coordinating student recruitment need a clear view of ownership, progress, and the next action across enquiries, applications, and commissions. Fragmented handoffs can make that work difficult to prioritize.

**Product solution:** Bring operational records into a shared CRM, with actionable queues, staged applications, contextual communication, and financial dependencies.

| Friction hypothesis | Design response | Intended benefit to validate |
|---|---|---|
| Enquiries have no clear owner | Assignment controls and unassigned queues | Faster routing to a responsible counsellor |
| Long applications are difficult to complete | Guided steps and progress feedback | Clearer requirements and fewer abandoned tasks |
| Teams lose track of pending work | Follow-ups, deadlines, and blocker categories | Easier identification of the next action |
| Records require frequent context switching | Detail drawers and contextual actions | Easier review while preserving list context |
| Enrolment and commissions become disconnected | Linked claim eligibility and payout states | Clearer financial follow-through |

## 5. Researching User To Validate Design Choices

| Design hypothesis | Proposed task | Evidence to collect | Decision if the hypothesis fails |
|---|---|---|---|
| Action queues help staff prioritize | Find the oldest unassigned enquiry and assign it | Completion, first-click choice, missed records | Rework queue labels and default ordering |
| A stepper clarifies application preparation | Complete a new application and recover from an omission | Errors, backtracking, understanding of progress | Adjust grouping, required fields, and error feedback |
| Drawers preserve useful context | Inspect a record and return to the filtered list | Context loss, accidental navigation, repeated searches | Change drawer depth or use a dedicated details page |
| Blockers make next actions clearer | Find why an application has stalled | Correct diagnosis, time, confidence | Rewrite categories and expose owner and next action |
| Navigation matches staff expectations | Locate document requests and commission receipts | Path taken, misclassification, task completion | Regroup modules and remove duplicate destinations |

**Feedback and pivots:** [Add observed finding → design change → retest result once actual sessions have occurred.] The case study currently supports design rationale, not claims of validated user preference.

## 8. Research Process

**Work completed for this documentation:** repository inspection, navigation and workflow review, data-model inspection, and an implementation gap analysis. These methods establish what the prototype does; they do not establish what users need or prove usability.

No interviews, surveys, competitive study, participant counts, usability sessions, or research-led pivots have been documented in the material reviewed.

**Recommended research sequence:**

1. Observe front-office, counselling, admissions, management, and finance work to document tools, handoffs, and exceptions.
2. Interview representatives from those roles using recent real tasks rather than hypothetical preferences.
3. Map the current journey, separating observed problems from assumptions.
4. Review comparable CRM workflows against specific tasks, recording tradeoffs rather than copying screens.
5. Test low-fidelity navigation and core flows before evaluating visual polish.
6. Test the interactive prototype with realistic, synthetic records; record completion, errors, hesitation, and recovery.

**Expected research deliverables:** interview guide, anonymized observations, evidence-backed personas, current-state journey, prioritized problem statements, usability findings, and a decision log. These are proposed deliverables, not completed activities.

## User Flow

**Actor:** Counsellor. **Entry:** Leads list. **Intended success:** a saved application linked to the original lead and visible to authorized staff.

```text
Open Leads → Find enquiry → Is an owner assigned?
                              ├─ No → Assign branch and counsellor ─┐
                              └─ Yes ──────────────────────────────┤
                                                                  ↓
                         Review details → Contact student → Qualified?
                              ├─ No, more information → Schedule follow-up → Review again
                              ├─ No, unsuitable → Record lost reason → End
                              └─ Yes → Start linked application
                                       ↓
                         Personal details → Course choices → Academic history
                                       ↓
                         Work history → Documents → Language → Declaration
                                       ↓
                         Review → Required information valid?
                              ├─ No → Explain issue → Correct relevant step → Review
                              └─ Yes → Save application and link lead → Confirmation
```

This is a **proposed connected flow**. Qualification and form interfaces exist, but lead conversion is not connected to application creation, and the wizard currently displays success without saving a new application. The flow therefore specifies the intended completion behavior rather than claiming it is implemented.

## User Persona

The following are **provisional personas inferred from system responsibilities**. They are hypotheses for research, not validated profiles. Demographics and invented quotations have been omitted because task context is more useful here and no participant evidence was supplied.

| Persona | Goals | Assumed frustrations to validate | Expected behavior to observe |
|---|---|---|---|
| Counsellor — primary | Prioritize enquiries and move suitable students toward applications | Unclear ownership, scattered context, forgotten callbacks | Repeatedly checks assigned leads, compares courses, records follow-ups |
| Admissions officer — primary | Submit complete applications and resolve blockers on time | Missing documents, unclear status, repeated requests | Reviews requirements, follows deadlines, records university responses |
| Branch manager — secondary | Balance workload and improve branch delivery | Hidden unassigned work and inconsistent reporting | Reviews queues, assigns owners, checks pipeline and targets |
| Finance officer — secondary | Collect eligible commissions and release correct payouts | Unclear eligibility and disconnected payment records | Checks enrolments, prepares claims, records receipts, reviews balances |

**Research questions:** Which tasks recur most often? Where do handoffs fail? Which information must be visible without opening a record? How do responsibilities differ by branch?

## Information Architecture

The sidebar groups the product into four areas:

| Area | Modules | Purpose |
|---|---|---|
| Main | Dashboard, Leads, Applications, Communications | Daily recruitment and admissions activity |
| Directory | Countries, Institutions, Courses, Office, People, Agent Management | Reference information and operational resources |
| Insights | Target Setup, Finance, BHE Training | Performance, revenue activity, staff development |
| System | Archived, Settings | Recovery and configuration |

The structure gives broad administrative coverage. Some labels overlap across sections, including announcements and news feeds. A future navigation review should establish one clear home for each activity and tailor starting views to staff responsibilities.


```text
BHE CRM
├── Main: Dashboard · Leads · Applications · Communications
├── Directory: Countries · Institutions · Courses · Office · People · Agents
├── Insights: Targets · Finance · Training
└── System: Archives · Settings
```

**UX strategy:** keep primary work visible, provide context alongside actions, break complex input into manageable steps, and use a consistent vocabulary for status and ownership. Role-specific starting views are a proposed refinement, not a validated outcome.

## Scope of Work

The repository demonstrates the following deliverables. Confirm which you personally owned before publishing this as your portfolio case study.

| Deliverable | Available evidence | Ownership or process evidence needed |
|---|---|---|
| Information architecture | Grouped sidebar and module navigation | Your role in defining and testing the hierarchy |
| Workflow design | Lead management, application wizard, admissions actions, finance states | Original flows and rationale for iterations |
| UI design | Dashboards, tables, forms, drawers, responsive layouts | Your contribution and design source files |
| Design system components | Shared controls, semantic colors, typography, light and dark themes | Foundation decisions and component documentation |
| Interactive prototyping | Working frontend with simulated operational records | Prototype versions and testing context |
| UX research | No primary research evidence supplied | Interview notes, surveys, observations, or competitive analysis |
| Wireframing | No wireframe artifacts established in this review | Early explorations and selected direction |
| Developer handoff | Typed components and implementation structure exist | Actual specifications, annotations, and handoff responsibility |
