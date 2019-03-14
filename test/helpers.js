var fs = require('fs');

var parameters = require('./utility/parameters');

module.exports = {
    getUtility: function getUtility(collateral, interest) {
        // utility assume to be 0 -> do not account for payments of protocol
        let utility = (0 - (collateral * interest / 100) / 1000);
        return utility;
    },
    getCollateral: function getCollateral(base_collateral, factor) {
        let collateral = base_collateral * factor;
        return collateral;
    },
    convertToUsd: convertToUsd,
    writeToCSV: writeToCSV,
    generateBlocksGanache: generateBlocksGanache,
    performAction: performAction,
};

// COST
function convertToUsd(gasCost) {
    // gas price conversion
    const gas_price = web3.utils.toWei(parameters.gas_price, "gwei");
    return gasCost * web3.utils.fromWei(gas_price, "ether") * parameters.eth_usd;
}

// GANACHE
function generateBlocksGanache(number) {
    return new Promise((resolve, reject) => {
        // ganache uses evm_mine method to generate new blocks
        for (var i = 0; i < number; i++) {
            web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_mine",
                id: 123
            }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                const newBlockHash = web3.eth.getBlock('latest').hash;

                return resolve(newBlockHash);
            });
        }
    });
}

// CSV
function writeToCSV(file, data) {
    let path = "./experiments/results/" + file;
    data_string = prepareCSV(data);
    try {
        // fd = fs.openSync(path, 'a');
        var stream = fs.createWriteStream(path, {
            flags: 'a'
        });
        stream.write(data_string, 'utf8');
    } catch (err) {
        console.log(err);
    } finally {
        stream.end();
    }
}

function prepareCSV(data) {
    // format: period | agent_id | behaviour | layer | rewards | utility
    // period: int
    // behaviour: honest = 0 | malicious = 1
    // layer: int
    // rewards: int
    // utility: float
    var data_string = "";
    for (i = 0; i < data.length; i++) {
        let agent = data[i];
        for (j = 0; j < agent.length; j++) {
            if (j != agent.length - 1) {
                data_string += agent[j] + ",";
            } else {
                data_string += agent[j];
            }
        }
        data_string += "\n"
    }

    return data_string;
}

function performAction(agent, type, valuation, locked_collateral, base_factor, interest) {
    let action = "";
    action.agent = agent;
    if (type == "benevolent") {
        // ALWAYS act in the interest of the protocol
        action = "comply";
    } else if (agents[i].type == "rational") {
        // ALWAYS maximise utility with respect to multiple rounds
        if (valuation > locked_collateral) {
            // expected future return
            if ()
                action = "cheat"
        } else if () {}

    } else if (agents[i].type == "malicious") {
        // ALWAYS try to sabotage the protocol if it is now rational
        if (valuation >= locked_collateral) {
            action = "cheat";
        } else {
            action = "comply";
        }
    }
    return action;
}