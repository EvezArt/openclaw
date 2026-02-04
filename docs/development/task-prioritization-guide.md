# Task Prioritization & Resolution Guide

This guide explains how to prioritize and resolve conflicts when multiple tasks compete for attention in OpenClaw development.

## Quick Decision Matrix

When deciding what to work on next, use this decision tree:

```
Is it a security vulnerability? ──YES──> P0: Fix immediately
│
NO
│
Does it cause data loss? ──YES──> P0: Fix immediately
│
NO
│
Does it block core functionality? ──YES──> P1: Schedule for current sprint
│
NO
│
Does it affect many users? ──YES──> P1: Schedule for current sprint
│
NO
│
Is it technical debt slowing development? ──YES──> P2: Add to backlog
│
NO
│
Is it a nice-to-have feature? ──YES──> P3: Community contribution welcome
```

## Conflict Resolution Framework

### When Two P0 Tasks Conflict

**Evaluation Criteria (in order):**
1. **Blast Radius:** Choose the task that affects more users
2. **Time to Fix:** If similar impact, choose the faster fix
3. **Cascading Impact:** Choose the one that blocks other work
4. **Data Integrity:** Always prioritize data loss prevention

**Example:**
- Task A: Security vulnerability in media parser (affects file uploads)
- Task B: Gateway auth bypass (affects all access)
- **Resolution:** Fix B first (wider blast radius, blocks everything)

### When P0 and P1 Conflict

**Rule:** Always prioritize P0 unless:
- The P1 is completely blocking P0's fix, OR
- The P1 fix is trivial (<1 hour) and unblocks multiple people

**Example:**
- P0: LFI vulnerability needs patching
- P1: Test suite broken, preventing verification
- **Resolution:** Fix P1 first (blocks P0 validation)

### When Multiple P1 Tasks Conflict

**Evaluation Criteria:**
1. **User Impact Score:** (# affected users) × (severity)
2. **Strategic Alignment:** Does it align with roadmap priorities?
3. **Dependency Chain:** Does it unblock other tasks?
4. **Resource Availability:** Do we have the right expertise?

**Example Scoring:**
```
Task: Channel Connection Stability
- Affected Users: 500 (high)
- Severity: 3/5 (moderate - workarounds exist)
- Score: 1500
- Strategic: YES (CONTRIBUTING.md priority)
- Blocks: 2 other tasks
- PRIORITY: HIGH

Task: Plugin SDK Enhancement
- Affected Users: 50 (low)
- Severity: 2/5 (low - feature request)
- Score: 100
- Strategic: YES (CONTRIBUTING.md priority)
- Blocks: 0 other tasks
- PRIORITY: MEDIUM
```

## Priority Escalation Rules

### Automatic Escalation Triggers

Tasks automatically escalate when:

1. **P3 → P2:** Requested by 10+ different users
2. **P2 → P1:** Affects 100+ active users OR blocks 3+ other P1 tasks
3. **P1 → P0:** Causes any data loss OR complete service outage

### De-escalation Triggers

Tasks de-escalate when:

1. **P0 → P1:** Workaround discovered that prevents critical impact
2. **P1 → P2:** Affects <10 users after investigation
3. **P2 → P3:** Better alternative solution found

## Resource Allocation Guidelines

### Time-Boxing by Priority

- **P0:** All hands on deck until resolved
- **P1:** 70% of sprint capacity
- **P2:** 20% of sprint capacity
- **P3:** 10% of sprint capacity (community contributions preferred)

### Sprint Planning

**Week 1-2:**
- Focus: Active P0s and highest-impact P1s
- Review: Daily standups for P0s

**Week 3-4:**
- Focus: Remaining P1s and strategic P2s
- Review: Weekly progress review

## Handling Emergency Interrupts

### Emergency Response Protocol

1. **Triage (5 minutes):**
   - Is it really an emergency?
   - What's the blast radius?
   - Is there a quick workaround?

2. **Communicate (10 minutes):**
   - Alert team via Discord #emergencies
   - Update status page if user-facing
   - Assign incident commander

3. **Mitigate (30-60 minutes):**
   - Implement immediate workaround
   - Document the incident
   - Plan permanent fix

4. **Fix (varies):**
   - Implement permanent solution
   - Add regression tests
   - Document lessons learned

5. **Post-Mortem (next business day):**
   - What happened?
   - Why did it happen?
   - How do we prevent it?

### Example Emergency: Gateway Down

```
T+0:00 - Gateway reports connection errors
T+0:05 - Triage: P0, affects all users, no workaround
T+0:10 - Alert: Posted in Discord, status page updated
T+0:15 - Mitigate: Restart gateway (temporary fix)
T+1:00 - Fix: Deploy patch with proper error handling
T+1:30 - Verify: Monitor for 30 minutes
T+24h  - Post-mortem: Document root cause and prevention
```

## Stakeholder Communication

### Communication Frequency by Priority

| Priority | Update Frequency | Channels |
|----------|-----------------|----------|
| P0 | Real-time | Discord #emergencies, GitHub issue |
| P1 | Daily | Discord #development, Sprint board |
| P2 | Weekly | Sprint review, Changelog |
| P3 | Per release | Changelog only |

### Communication Templates

**P0 Update:**
```
🚨 P0 Update: [Issue Name]
Status: [In Progress/Mitigated/Fixed]
Impact: [Brief description]
ETA: [Expected resolution time]
Workaround: [If available]
Owner: [@username]
```

**P1 Update:**
```
📌 P1 Progress: [Issue Name]
Completed: [What's done]
In Progress: [Current work]
Blockers: [If any]
Next Steps: [Planned work]
```

## Balancing Act: Stability vs. Features

### When to Prioritize Stability

Choose stability work (bug fixes, refactoring) when:
- Tech debt is slowing development by >20%
- Test suite failures are frequent
- Production incidents increasing
- Developer satisfaction declining

### When to Prioritize Features

Choose new features when:
- User growth is strong
- Stability metrics are good (>99% uptime)
- Feature requests align with strategic goals
- Competitive pressure exists

### The 70/30 Rule

Healthy projects maintain:
- **70% core work:** Existing features, stability, security
- **30% innovation:** New features, experiments, refactoring

If this ratio drifts too far in either direction, adjust priorities.

## Special Cases

### Community Contributions

When evaluating external PRs:
1. **Quality > Priority:** A well-tested P3 PR is better than a rushed P1 PR
2. **Mentor First-Timers:** P3 tasks are great learning opportunities
3. **Guide Architecture:** Provide early feedback on P1/P2 PRs to avoid rework

### Dependency Updates

Treat dependency updates as:
- **P0:** Security vulnerabilities in dependencies
- **P1:** Breaking changes in major dependencies
- **P2:** Regular minor/patch updates
- **P3:** Non-critical library updates

### Platform Parity

When one platform lags behind:
- **P1:** Core features missing (breaks user workflow)
- **P2:** Nice-to-have features missing
- **P3:** UI/UX differences that don't affect functionality

## Metrics for Success

### Leading Indicators (Predictive)

- Cycle time per priority level
- P0 frequency trend
- Tech debt % of codebase
- Test coverage %
- Community contribution rate

### Lagging Indicators (Results)

- Mean time to resolution (MTTR)
- User satisfaction scores
- Production incident count
- Release velocity
- Contributor retention

### Target Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| P0 MTTR | <4 hours | >8 hours |
| P1 MTTR | <1 week | >2 weeks |
| Test Coverage | >70% | <60% |
| P0 Incidents/Month | <2 | >5 |
| Sprint Completion | >80% | <60% |

## Tools & Automation

### Automated Priority Assignment

Use GitHub Actions to auto-label issues:
- Security keywords → `priority: P0`
- Crash/data loss → `priority: P0`
- Feature request → `priority: P3`
- Bug report → `priority: P2` (human review needed)

### Priority Dashboard

Monitor these views:
1. **P0 Board:** All active critical issues
2. **Sprint Board:** Current P1 work
3. **Backlog:** Prioritized P2/P3 items
4. **Blocked Tasks:** Tasks waiting on dependencies

### Alerting Rules

Set up alerts for:
- New P0 issue created
- P0 open >24 hours
- P1 open >2 weeks
- Sprint burn rate <50% at midpoint

## Further Reading

- [DEVELOPMENT_AGENDA.md](../../DEVELOPMENT_AGENDA.md) - Current prioritized task list
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](../../SECURITY.md) - Security policies
- https://docs.openclaw.ai - Full documentation

---

**Remember:** Priority is not just about urgency—it's about impact. Always ask: "If we only fix one thing today, which would create the most value?"

🦞 **EXFOLIATE! EXFOLIATE!** 🦞
