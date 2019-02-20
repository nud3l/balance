module.exports = {
    // CSV PARAMETERS
    csvCostHeading: [
        ["agents", "layers", "gas_update", "usd_update", "gas_register", "usd_register"]
    ],
    cost_file: "cost.csv",

    // LVCR PARAMETERs
    min_collateral: 1,
    // possible lost interest on collateral due to trading etc.
    interest_on_collateral: 110,

    periods: 10,

    num_layers: num_layers(),
    layer_ids: layer_ids,
    layers: layers,
    num_agents: num_agents(), // max around 1000
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

function num_layers() {
    let step = 10;
    let max = 101;
    let layers = [];
    for (i = 1; i <= max; i += step) {
        layers.push(i);
    }
    return layers;
}

function num_agents() {
    let step = 50;
    let max = 1001;
    let agents = [];
    for (i = 1; i <= max; i += step) {
        agents.push(i);
    }
    return agents;
}


function layer_ids(number) {
    let ids = [];
    for (i = 1; i <= number; i++) {
        ids.push(i);
    }
    return ids;
}

function layers(number) {
    let layers = [];
    let counter = 200;
    let lower = 0;
    let upper = 200;
    let factor = "1750" // does not matter for cost experiment
    for (i = 1; i <= number; i++) {
        layers.push({
            id: i,
            factor: factor,
            bound: [lower.toString(), upper.toString()]
        });
        lower += counter;
        upper += counter;
    }
    return layers;
}