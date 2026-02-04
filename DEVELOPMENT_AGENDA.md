# OpenClaw Development Agenda 🦞

**Last Updated:** 2026-02-04

This document provides a prioritized list of development tasks for the OpenClaw project, organized by urgency and impact on the overall system.

## Priority Classification

- **P0 (Critical):** Security issues, data loss risks, blocking bugs
- **P1 (High):** Major functionality gaps, stability issues, user-facing problems
- **P2 (Medium):** Quality improvements, technical debt, performance optimizations
- **P3 (Low):** Nice-to-have features, documentation enhancements, refactoring

---

## P0 - Critical Priority

### Security & Data Integrity

1. **Security Audit Compliance** ⚠️
   - **Status:** Ongoing monitoring required
   - **Issue:** Continuous security scanning for vulnerabilities in dependencies and code
   - **Action:** Run `openclaw security audit --deep` regularly
   - **Impact:** Prevents potential security breaches and data leaks
   - **Owner:** Security team
   - **References:** `src/security/audit.ts`

2. **LFI Prevention in Media Parser** ✅
   - **Status:** Recently fixed (v2026.1.30)
   - **Issue:** Local File Inclusion vulnerability in media path extraction
   - **Action:** Verify fix is comprehensive and add regression tests
   - **Impact:** Prevents unauthorized file access
   - **References:** CHANGELOG.md #4880

3. **Gateway Authentication Enforcement** ⚠️
   - **Status:** Warning systems in place
   - **Issue:** Gateway exposure without proper authentication
   - **Action:** Strengthen auth validation and add fail-safe defaults
   - **Impact:** Prevents unauthorized access to control interfaces
   - **References:** `src/commands/doctor-workspace-status.ts`, CHANGELOG.md #2016, #2248

---

## P1 - High Priority

### Stability & Core Functionality

4. **Channel Connection Stability** 🔄
   - **Status:** Active development area (per CONTRIBUTING.md)
   - **Issue:** Edge cases in WhatsApp/Telegram connections causing disconnects
   - **Action:** 
     - Improve connection recovery logic
     - Add comprehensive connection state monitoring
     - Enhance error handling for network interruptions
   - **Impact:** Core functionality for message delivery
   - **Files to Review:**
     - `src/whatsapp/` - WhatsApp connection handling
     - `src/telegram/` - Telegram bot management
     - `src/channels/` - Channel abstraction layer
   - **References:** CONTRIBUTING.md priorities

5. **Token Usage & Compaction Logic** 🔄
   - **Status:** Active optimization area (per CONTRIBUTING.md)
   - **Issue:** Inefficient token usage leading to higher costs
   - **Action:**
     - Optimize compaction safeguard logic
     - Improve message summarization during compaction
     - Add token usage tracking and alerts
   - **Impact:** Reduces operational costs and improves performance
   - **Files:**
     - `src/agents/compaction.ts`
     - `src/agents/pi-extensions/compaction-safeguard.ts`
     - `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`
   - **References:** CONTRIBUTING.md priorities, CHANGELOG.md #2509

6. **Onboarding Wizard UX** 🔄
   - **Status:** Active improvement area (per CONTRIBUTING.md)
   - **Issue:** Complex setup process for new users
   - **Action:**
     - Simplify credential flow
     - Add more helpful error messages
     - Improve wizard navigation and state recovery
   - **Impact:** Improves user adoption and reduces support burden
   - **Files:**
     - `src/wizard/` - Onboarding wizard logic
     - `src/commands/onboarding/` - Onboarding commands
   - **References:** CONTRIBUTING.md priorities

7. **Multi-Account Session Isolation** ⚠️
   - **Status:** Implementation complete, needs validation
   - **Issue:** Session state bleeding between accounts
   - **Action:** Verify isolation guarantees across all channels
   - **Impact:** Prevents cross-account data leaks
   - **References:** CHANGELOG.md #3095, `src/routing/`

### Extension & Plugin System

8. **Plugin SDK Stability** 🔄
   - **Status:** Recent changes to discovery system
   - **Issue:** Plugin discovery and loading reliability
   - **Action:**
     - Stabilize embedded extension discovery
     - Improve plugin error handling and reporting
     - Add plugin health checks
   - **Impact:** Ensures third-party extensions work reliably
   - **Files:**
     - `src/plugins/` - Core plugin system
     - `src/plugin-sdk/` - Plugin SDK API
     - `extensions/` - Built-in extensions
   - **References:** CHANGELOG.md, `docs/refactor/plugin-sdk.md`

---

## P2 - Medium Priority

### Performance & Optimization

9. **Memory Embedding Performance** 🔄
   - **Status:** Batch processing implemented, needs optimization
   - **Issue:** Slow memory indexing for large datasets
   - **Action:**
     - Optimize Gemini/OpenAI batch processing
     - Add progress tracking for long operations
     - Implement incremental indexing
   - **Impact:** Faster memory search and reduced API costs
   - **Files:**
     - `src/memory/batch-gemini.ts`
     - `src/memory/batch-openai.ts`
     - `src/memory/manager.ts`
     - `src/memory/sync-memory-files.ts`

10. **Browser Control Performance** 🔄
    - **Status:** Recent refactor to gateway/node routing
    - **Issue:** Browser control latency and reliability
    - **Action:**
      - Optimize CDP communication
      - Improve tab management
      - Add connection pooling
    - **Impact:** Faster browser automation for users
    - **Files:**
      - `src/browser/server.ts`
      - `src/browser/server-context.ts`
      - `src/browser/cdp.ts`
      - `src/browser/chrome.ts`

11. **Build Performance** ✅
    - **Status:** Recently improved with tsdown/tsgo
    - **Issue:** Slow TypeScript builds
    - **Action:** Monitor build times and optimize as needed
    - **Impact:** Faster developer iteration
    - **References:** CHANGELOG.md #2808

### Code Quality & Technical Debt

12. **Test Coverage Gaps** ⚠️
    - **Status:** Ongoing effort
    - **Issue:** Some areas lack comprehensive tests
    - **Action:**
      - Add tests for critical paths
      - Improve E2E test coverage
      - Add more live integration tests
    - **Impact:** Reduces regression risk
    - **Coverage Target:** 70% lines/branches/functions/statements (per vitest config)
    - **Test Files:** All `*.test.ts` files

13. **Logging & Diagnostic Improvements** 🔄
    - **Status:** Foundation in place, needs enhancement
    - **Issue:** Inconsistent logging levels and formats
    - **Action:**
      - Standardize log levels across subsystems
      - Add structured logging for easier parsing
      - Improve diagnostic output for `openclaw doctor`
    - **Impact:** Easier troubleshooting and debugging
    - **Files:**
      - `src/logging/` - Logging infrastructure
      - `src/logger.ts` - Legacy logger
      - `src/commands/doctor-ui.ts`

14. **Error Message Quality** 🔄
    - **Status:** Active improvement area (per CONTRIBUTING.md)
    - **Issue:** Cryptic error messages confuse users
    - **Action:**
      - Add contextual error information
      - Provide actionable remediation steps
      - Link to relevant documentation
    - **Impact:** Reduces support burden and improves UX
    - **References:** CONTRIBUTING.md priorities

15. **Code Organization & Module Size** 📋
    - **Status:** Guideline in place (~500 LOC per file)
    - **Issue:** Some files exceed recommended size
    - **Action:**
      - Refactor large modules
      - Extract reusable utilities
      - Improve code cohesion
    - **Impact:** Improves maintainability
    - **Tool:** `pnpm check:loc` checks for files >500 LOC
    - **Files to Review:**
      - `src/memory/manager.ts` - Memory management (likely large)
      - `src/gateway/` - Gateway server components
      - `src/browser/server.ts` - Browser server

---

## P3 - Low Priority

### Skills & Features

16. **Skills Library Expansion** 🔄
    - **Status:** Active development area (per CONTRIBUTING.md)
    - **Issue:** Limited bundled skills available
    - **Action:**
      - Add more pre-built skills
      - Improve skill creation documentation
      - Create skill templates
    - **Impact:** Increases out-of-box value
    - **Files:**
      - `skills/` - Bundled skills
      - `src/agents/skills/` - Skill infrastructure
      - `src/hooks/bundled/` - Bundled hooks
    - **References:** CONTRIBUTING.md priorities

17. **Multi-Platform Mobile Support** 📋
    - **Status:** iOS/Android apps exist
    - **Issue:** Feature parity across platforms
    - **Action:**
      - Align features between iOS and Android
      - Improve mobile UI/UX
      - Add mobile-specific capabilities
    - **Impact:** Better mobile experience
    - **Files:**
      - `apps/ios/` - iOS app
      - `apps/android/` - Android app
      - `apps/shared/` - Shared mobile code

18. **Documentation Enhancements** 📋
    - **Status:** Comprehensive docs exist
    - **Issue:** Some areas need more examples and clarification
    - **Action:**
      - Add more code examples
      - Create video tutorials
      - Improve API reference
    - **Impact:** Easier for new contributors
    - **Files:**
      - `docs/` - Documentation root
      - `*.md` - Various markdown docs

### Developer Experience

19. **CLI Completion Support** ✅
    - **Status:** Recently added (v2026.1.30)
    - **Issue:** Tab completion for CLI commands
    - **Action:** Verify completion works across all shells
    - **Impact:** Improves developer workflow
    - **References:** CHANGELOG.md (completion command added)

20. **Development Hot Reload** 🔄
    - **Status:** Partial support via watch mode
    - **Issue:** Slow iteration during development
    - **Action:**
      - Improve hot reload reliability
      - Add better error recovery
      - Optimize rebuild times
    - **Impact:** Faster development cycles
    - **Scripts:** `pnpm gateway:watch`

---

## Refactoring & Architecture

### Planned Refactors (from docs/refactor/)

21. **Strict Config Validation** 📋
    - **Status:** Design document exists
    - **Issue:** Runtime config errors hard to debug
    - **Action:** Implement strict schema validation
    - **Impact:** Catches config errors early
    - **References:** `docs/refactor/strict-config.md`

22. **Plugin SDK Enhancement** 📋
    - **Status:** Design document exists
    - **Issue:** Plugin API needs improvement
    - **Action:** Refine plugin interfaces and capabilities
    - **Impact:** Better third-party extensions
    - **References:** `docs/refactor/plugin-sdk.md`

23. **ClawNet Architecture** 📋
    - **Status:** Design document exists
    - **Issue:** Network abstraction needs improvement
    - **Action:** Implement cleaner network layer
    - **Impact:** Better connection management
    - **References:** `docs/refactor/clawnet.md`

24. **Exec Host Isolation** 📋
    - **Status:** Design document exists
    - **Issue:** Command execution security
    - **Action:** Improve exec isolation and sandboxing
    - **Impact:** Enhanced security posture
    - **References:** `docs/refactor/exec-host.md`

---

## Maintenance Tasks

### Regular Operations

25. **Dependency Updates** 🔄
    - **Status:** Ongoing maintenance
    - **Action:**
      - Review and update dependencies monthly
      - Test for breaking changes
      - Update patches as needed
    - **Impact:** Security and compatibility
    - **Files:**
      - `package.json`
      - `patches/` - Dependency patches

26. **Platform Support** 🔄
    - **Status:** macOS, Linux, Windows (WSL2) supported
    - **Action:**
      - Test on all supported platforms
      - Fix platform-specific issues
      - Update platform guides
    - **Impact:** Ensures cross-platform compatibility
    - **Files:**
      - `docs/platforms/` - Platform-specific docs
      - `scripts/` - Platform-specific scripts

27. **CI/CD Pipeline** 🔄
    - **Status:** GitHub Actions workflow exists
    - **Action:**
      - Optimize CI runtime
      - Add more automated checks
      - Improve Docker test coverage
    - **Impact:** Faster, more reliable deployments
    - **Files:**
      - `.github/workflows/` - CI definitions

---

## How to Use This Agenda

### For Contributors

1. **Pick a task** from the appropriate priority level
2. **Check the references** to understand the context
3. **Review related code** in the specified files
4. **Open a discussion** for major changes (per CONTRIBUTING.md)
5. **Submit a PR** with focused changes

### For Maintainers

1. **Review this agenda** quarterly
2. **Update priorities** based on user feedback and community needs
3. **Close completed items** and add new ones as they arise
4. **Link to this doc** from relevant issues and PRs

### Status Indicators

- ⚠️ **Requires attention** - Active issue that needs work
- 🔄 **In progress** - Currently being worked on
- ✅ **Recently completed** - Finished in recent release
- 📋 **Planned** - Design exists, waiting for implementation

---

## Related Resources

- **Contributing Guide:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Security Policy:** [SECURITY.md](SECURITY.md)
- **Documentation:** https://docs.openclaw.ai
- **Discord:** https://discord.gg/qkhbAGHRBT

---

## Feedback & Updates

This agenda is a living document. If you believe something should be reprioritized or added, please:

1. **Open a GitHub Discussion** in the appropriate category
2. **Join the Discord** and discuss in #development
3. **Submit a PR** updating this document with your rationale

**Remember:** The best code is code that ships. Focus on completing one task well rather than starting many.

🦞 **EXFOLIATE! EXFOLIATE!** 🦞
