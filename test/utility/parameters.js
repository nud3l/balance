var PD = require("probability-distributions");
var param_helpers = require("../parameter-helpers");

module.exports = {
    // CSV PARAMETERS
    csvTestHeading: [
        ["period", "agent_id", "behaviour", "layer", "rewards", "utility"]
    ],
    test_file: "test.csv",

    // LVCR PARAMETERs
    min_collateral: 1,
    // possible lost interest on collateral due to trading etc.
    interest_on_collateral: 110,

    periods: 10,

    num_layers: param_helpers.num_layers(1, 4, 1),
    layer_ids: param_helpers.layer_ids,
    layers: param_helpers.layers,
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
    // performed_actions: [
    //     PD.rint(1000, 1, num_agents), // sample order of 1000 actions from agent 1 to num_agents
    //     PD.rint(1000, 1, 1), // sample which action in performed
    // ],

    // COST PARAMETERS
    eth_usd: 106, // 
    gas_price: "9", // gwei
}