---
name: temporal-experiment
description: Classical time-symmetric simulation orchestration for research and experimentation. This is a deterministic simulation only - not physical retrocausality.
metadata:
  {
    "openclaw":
      {
        "emoji": "⏱️",
        "requires": {},
      },
  }
---

# Temporal Experiment (Classical Simulation)

⚠️ **IMPORTANT DISCLAIMER**: This is a **classical simulation only**. It does not perform actual quantum operations or achieve physical retrocausality. This tool is designed for research-oriented exploration of time-symmetric algorithms and constraint satisfaction problems in a deterministic, reproducible manner.

## Safety and Ethics

- This tool simulates temporal constraints classically
- No quantum hardware or retrocausal effects are involved
- All outputs are deterministic given the same seed
- Designed for educational and research purposes only
- Results should not be interpreted as predictions or oracles

## Overview

The temporal experiment framework allows you to run classical time-symmetric simulations that explore constraint satisfaction between past and future states. This is useful for:

- Research into time-symmetric algorithms
- Exploring constraint propagation in both temporal directions
- Educational demonstrations of bidirectional state evolution
- Deterministic computational experiments

## Usage via CLI

```bash
# Run a basic temporal experiment with default parameters
openclaw temporal run

# Run with custom parameters
openclaw temporal run --seed 12345 --iterations 1000

# Specify past and future constraints
openclaw temporal run --past-state "initial" --future-constraint "target" --seed 42

# Get detailed output
openclaw temporal run --seed 42 --iterations 5000 --verbose
```

## Parameters

- `--seed <number>`: Random seed for deterministic simulation (default: based on timestamp)
- `--iterations <number>`: Number of simulation iterations (default: 1000)
- `--past-state <string>`: Description of initial state constraints (optional)
- `--future-constraint <string>`: Description of target state constraints (optional)
- `--verbose`: Enable detailed output showing intermediate steps

## Output Format

The simulation produces a deterministic summary including:

1. **Configuration**: Seed, iterations, and constraint descriptions
2. **Convergence Metrics**: How well the simulation satisfied both temporal constraints
3. **Final State**: The computed intermediate state that best satisfies both constraints
4. **Statistics**: Computation time, convergence rate, constraint satisfaction scores

## Example

```bash
openclaw temporal run --seed 42 --iterations 2000 --past-state "ordered" --future-constraint "chaotic"
```

Expected output:
```
Temporal Experiment Simulation
===============================
Seed: 42
Iterations: 2000
Past State: ordered
Future Constraint: chaotic

Running classical time-symmetric simulation...

Results:
- Convergence: 0.892
- Past satisfaction: 0.915
- Future satisfaction: 0.869
- Computation time: 12ms

Final state achieved satisfactory bidirectional constraint satisfaction.

NOTE: This is a classical simulation. Results are deterministic and reproducible with the same seed.
```

## Technical Details

The temporal experiment uses a classical constraint satisfaction algorithm that:

1. Initializes random state based on the provided seed
2. Iteratively propagates constraints both forward and backward in time
3. Computes a state that minimally violates both past and future constraints
4. Reports convergence metrics and final state characteristics

All operations are deterministic and purely computational. No quantum effects or actual temporal manipulation occurs.

## Research Applications

This framework can be used to explore:

- Classical analogs of quantum time-symmetric theories
- Constraint satisfaction in bidirectional search problems
- Educational demonstrations of temporal reasoning
- Benchmark problems for optimization algorithms

## Documentation

For more information, see:
- [Temporal Experiments Guide](../../docs/experiments/temporal.md)
- [CLI Reference](https://docs.openclaw.ai/tools)
- [Research Background](../../docs/experiments/research/)
