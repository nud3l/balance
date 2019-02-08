# Experiments

The goal of the experiments is to explore different parameter settings of the mechanism and how that affects the utility of agents.

## Parameters

Meta parameters:

- Interest rate for locked collateral
- Wealth distribution

Mechanism parameters:

- Payout function
- Amount of collateral
- Valuation of receiving an action
- Valuation of performing an action

TCR parameters:

- Boundaries of layers
- Score for each action
- Collateral factor

## Experiments

We want to execute the following experiments:

1. Run a sample mechanism without the TCR
2. Run a mechanism with the TCR with the highest factor set to the collateral of the mechanism, subsequent factors are lower
3. Run a mechanism with the TCR with the lowest factor set to the collateral of the mechanism, previous factors are higher

## Observations

We want to observe the following results:

- Utility of each agent per round (payout - interest of locked collateral)
- Social welfare

Further, we want to collect the following data from the smart contracts:

- Cost of recording an action
- Cost of updating the ranking