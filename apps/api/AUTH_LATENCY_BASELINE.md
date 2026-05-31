# Auth Latency Baseline (Demo Scope)

- Endpoint budget target: login/register/recovery should stay below 250ms per request in normal local runs.
- Short burst check: 8 concurrent login requests complete in under 2 seconds total (integration test baseline).
- These numbers are starter guardrails for hackathon demos, not production SLOs.

Mapped issues: #427, #428, #429.
