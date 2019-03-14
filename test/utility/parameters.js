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
    agent_types: [{
        id: 0,
        type: "benevolent"
    }, {
        id: 1,
        type: "rational"
    }, {
        id: 2,
        type: "malicious"
    }],
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
    performed_actions: param_helpers.performed_actions,

    // COST PARAMETERS
    eth_usd: 106, // 
    gas_price: "9", // gwei
}