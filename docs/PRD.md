# MetraLab - OIML R76 Test Report Studio PRD

Status: Refined draft with implementation additions  
Version: 1.1  
Product type: Internal laboratory web application

## Summary

MetraLab is a browser-based application for preparing, reviewing, and retaining test records for non-automatic weighing instruments. It captures instrument and environmental information, records measurements, applies approved OIML R76 procedure configurations, calculates repeatability and descriptive statistics, and produces traceable reports.

The system is decision-support and record-keeping software. It must show the calculation basis behind each result. It must not imply that statistical normality alone establishes conformity, or that a generated report replaces competent review, applicable legal-metrology procedure, or laboratory quality-system controls.

## Added Requirements From Review

### Digital indication error and rounding correction

- The selected procedure configuration must define the sign convention for indication error, normally `E = I - L` unless the approved procedure states otherwise.
- For digital instruments, the configuration must define whether and how indication error is corrected for rounding of indication, including any additional-load or changeover-point method used by the laboratory.
- The application must not compare an uncorrected digital display error against MPE unless the approved procedure explicitly permits that method.
- Each error result must display the formula, correction terms, display division `d`, verification interval `e`, applied rounding rule, and source procedure/configuration version.

### Measurement uncertainty and decision rule

- The laboratory must decide whether uncertainty and guard-band decision rules are in scope for initial conformity disposition.
- If in scope, the report configuration must define the uncertainty inputs, coverage factor, confidence level, guard-band rule, and pass/fail decision rule.
- If out of scope, the report must state that uncertainty-based conformity assessment is outside MetraLab's automated disposition and remains a reviewer responsibility.

### Environmental validity

- Procedure configurations may define required temperature, humidity, warm-up, stability, vibration, or site-condition limits.
- Environmental values outside configured limits must produce a warning, blocking error, or `Not evaluated` result according to the approved configuration.

### Multi-range and multi-interval instruments

- Instrument records must support multiple ranges/intervals with range-specific `Max`, `Min`, `d`, `e`, and applicable MPE table references.
- Calculation rules must select the correct interval or range deterministically from the load and configured applicability rules.
- Ambiguous range selection must return `Not evaluated`.

### Status transition matrix

Allowed transitions are server-enforced:

| From | To | Actor | Required reason/comment |
|---|---|---|---|
| Draft | Submitted | Technician | No, unless warnings require acknowledgement |
| Submitted | Returned | Reviewer | Yes |
| Returned | Submitted | Technician | Change summary or acknowledgement |
| Submitted | Rejected | Reviewer | Yes |
| Submitted | Finalized | Reviewer | Disposition/sign-off |
| Finalized | Draft amendment | Authorized reviewer/admin | Yes, linked revision required |

Rejected reports are terminal unless an authorized amendment process creates a linked revision. Finalized reports are immutable.

### Disposition dominance

Overall report disposition is derived from configured required results:

1. `Incomplete` if required capture or review information is missing.
2. `Not evaluated` if a required rule/input is missing, unsupported, ambiguous, or invalid.
3. `Fail` if at least one required evaluated criterion fails.
4. `Warning` if only non-blocking warnings remain unresolved or acknowledged per configuration.
5. `Pass` only when every required evaluated criterion passes and no blocking issue remains.

### Concurrency and immutability

- Editable reports use optimistic concurrency with a revision/version field.
- Conflicting updates must be rejected with a safe, field-level conflict message rather than silently overwriting data.
- Submission, return, rejection, finalization, amendment, and export are auditable events.

### Time and report numbering

- Timestamps are stored in UTC and displayed with laboratory/site timezone context.
- Report numbers must be unique within the configured laboratory scope. The numbering format is a configuration item, for example `ML-{YYYY}-{sequence}`.

### Security additions

- Password-only authentication is acceptable only if explicitly approved for deployment. Two-factor authentication should be considered for production.
- Password policy, session lifetime, session revocation, and lockout/rate-limit thresholds must be documented before production use.
- CSV allowlisting may seed the system, but the runtime authorization source should be database-backed or otherwise atomically updated.

### Accessibility target

- The UI should target WCAG 2.1 AA for core workflows.

## Open Implementation Decisions

- Which OIML R76 edition, national implementation, and internal procedures are in scope?
- Which test modules ship first: repeatability, eccentricity, weighing test, discrimination, tare, or others?
- What approved formula set, MPE tables, rounding correction method, and uncertainty decision rule will be configured?
- Which roles may amend finalized reports, export raw data, and approve procedure configuration changes?
- What report-number format, retention period, backup objective, and electronic-signature requirements apply?

## Initial Architecture

- Frontend: Next.js application with server-validated workflows.
- Backend: FastAPI service with explicit API boundaries and role/record-level authorization.
- Database: PostgreSQL in production, Alembic migrations.
- Calculation layer: deterministic Python domain package with no HTTP request-state dependency.
- PDF export: server-rendered from finalized versioned report data.

The calculation layer is intentionally isolated so historical results can be regenerated from retained raw readings, engine version, and approved procedure configuration version.
