# CRM case study screens

12 desktop captures at 4× resolution: 6400 × 4400 px (1600 × 1100 CSS pixels). Demo data.

1. **01-dashboard-4x.png** — Business overview and priorities. Route: `/`
2. **02-lead-management-4x.png** — Full 25-row lead page, all 11 columns and pagination. Original 1600 CSS pixel layout, with the table fitted to the available width and content-based capture height, at 4× resolution (6400 × 6808 px). Route: `/leads`. Regenerate with `node tmp/export-leads.mjs` while the local app and screenshot browser on port 9223 are running.
3. **03-follow-up-planner-4x.png** — Next actions and follow-up planning. Route: `/leads/follow-ups`
4. **04-application-pipeline-4x.png** — Application status and caseload management. Route: `/applications`
5. **05-student-application-detail-4x.png** — Student context and application progress. Route: `/applications/APP-2026-0481`
6. **06-guided-application-4x.png** — Step-by-step application entry. Route: `/applications/new`
7. **07-institution-directory-4x.png** — University discovery and management. Route: `/institutions`
8. **08-course-catalogue-4x.png** — Course search and programme comparison. Route: `/courses`
9. **09-whatsapp-workspace-4x.png** — Conversation and student context. Route: `/whatsapp-workspace`
10. **10-counsellor-performance-4x.png** — Team workload and performance. Route: `/performance/counsellors`
11. **11-finance-overview-4x.png** — Commission and payment visibility. Route: `/finance`
12. **12-agent-management-4x.png** — Partner network and agency management. Route: `/agent-management`
