var param_helpers = require("../parameter-helpers");

module.exports = {
    // CSV PARAMETERS
    csvCostHeading: [
        ["agents", "layers", "gas_curate", "usd_curate", "gas_update", "usd_update"]
    ],
    cost_file: "cost.2.csv",

    // LVCR PARAMETERs
    min_collateral: 1,
    // possible lost interest on collateral due to trading etc.
    interest_on_collateral: 110,

    periods: 10,

    num_layers: param_helpers.num_layers(4, 4, 1),
    layer_ids: param_helpers.layer_ids,
    layers: param_helpers.layers,
    //num_agents: param_helpers.num_agents(1, 10, 5),
    num_agents: param_helpers.num_agents(0, 1000, 100), // max around 1000
    actions: [{
            id: 0,
            reward: "100" // commit to protocol
        },
        {
            id: 1,
            reward: "200" // perform action
        },
        {
            id: 2,
            reward: "600" // update collateral event
        }
    ],

    // COST PARAMETERS
    eth_usd: 106, // 
    gas_price: "9", // gwei
}