module.exports = {
    // META
    filename: "test.csv",
    // LVCR PARAMETERs
    layer_ids: [1, 2, 3, 4],
    layers: [{
            id: 1,
            factor: "1750",
            bound: ["0", "200"]
        },
        {
            id: 2,
            factor: "1500",
            bound: ["200", "400"]
        },
        {
            id: 3,
            factor: "1250",
            bound: ["400", "600"]
        },
        {
            id: 4,
            factor: "1000",
            bound: ["600", "0"]
        }
    ],
    num_agents: 3,
    actions: [{
            id: 0,
            reward: "200" // commit to protocol
        },
        {
            id: 1,
            reward: "10" // perform action
        },
        {
            id: 2,
            reward: "600" // update collateral event
        }
    ],
    min_collateral: 1,
    periods: 10,
    // possible lost interest on collateral due to trading etc.
    interest_on_collateral: 110,

    // COST PARAMETERS
    eth_usd: 106, // 
    gas_price: 9, // gwei

    // CSV PARAMETERS
    csvHeading: [
        ["period", "agent_id", "behaviour", "layer", "rewards", "utility"]
    ],
}