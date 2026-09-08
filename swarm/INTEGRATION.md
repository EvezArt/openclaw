# EVEZ repository-wide integration contract

The swarm treats the EvezArt repository fleet as a graph of typed capabilities rather than as one executable blob.

## Flow

`source → ControlPlane task → worker → evidence → CAIN → WITNESS → event/memory → next task`

## Adapters

- `event_source`: produces observations/events; read-first.
- `evidence_source`: produces research or telemetry evidence.
- `task_worker`: consumes explicitly leased tasks.
- `verification_gate`: can reject or verify evidence/tasks.
- `skill_registry`: describes available capabilities.
- `gateway`: routes requests but does not gain autonomous authority.
- `privileged_worker`: requires verification before privileged action.
- `orchestrator`: proposes work; ControlPlane remains authoritative.
- `observer`: read-only operational surface.
- `runtime`: hosts autonomous execution loops behind leases.

## Demonstration

Run `python swarm/demo.py` in an environment with Python 3.11+. The demo is intentionally non-privileged: it creates a local SQLite task, registers the canonical agents, samples typed repository sources from `ecosystem_manifest.json`, attaches evidence, performs a contradiction-check record, passes the verification gate, and prints the resulting completion record.

It does not execute shell commands, deploy infrastructure, merge pull requests, access secrets, or mutate the 35 source repositories.

## Migration rule

Existing runtimes should first become adapters to `ControlPlane`. They should not create a second authoritative queue. AgentNet/OODA remains the worker intelligence; the control plane owns durable task state and leases; EVEZ event-spine and ledger systems become historical sources; verified outcomes become eligible memory inputs.
