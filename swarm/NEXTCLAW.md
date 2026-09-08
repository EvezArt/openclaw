# NextClaw

NextClaw is the proposed next runtime layer for EVEZ/OpenClaw: a phone-first swarm where one prompt becomes a dependency graph, independent workers run when their prerequisites are satisfied, dissent is preserved, and only evidence-backed results cross the verification gate.

## What changes

OpenClaw-style execution is treated as a mesh instead of a single agent loop.

`prompt → mission graph → parallel workers → evidence → contradiction → synthesis → witness → verified memory → next mission`

The first implementation is deliberately offline. No model provider, cloud account, paid token, shell executor, deployment credential, or remote queue is required to exercise the orchestration logic.

## Swarm mechanics

- DAG scheduling prevents workers from starting before dependencies are complete.
- Independent branches become ready simultaneously, enabling parallel execution.
- Bounded retries prevent one broken worker from creating immortal zombie work.
- CAIN-style dissent is retained as first-class evidence rather than discarded.
- WITNESS-style verification requires evidence and independent workers before a result is marked verified.
- SPINE remains the coordinator, but does not become the sole source of truth for evidence.
- Model adapters are optional workers. They do not own task state.

## Phone-first constraint

The runtime should degrade gracefully from many workers to one local worker. SQLite remains the durable local state layer. Workers can be local processes, remote devices, GitHub Actions jobs, or optional model adapters, provided they speak the same task/evidence contract.

The goal is not to pretend a phone has infinite compute. The goal is to make the coordination layer cheap enough that a phone can command a swarm without becoming the swarm's bottleneck.

## Safety boundary

NextClaw does not grant autonomous authority merely because a worker produced an answer. Code changes, secrets, deployment, merges, and other privileged actions remain explicit capabilities behind verification gates.

## Offline demo

`swarm/nextclaw_demo.py` exercises a six-node mission graph and an evidence-weighted verdict without network access or paid APIs.
