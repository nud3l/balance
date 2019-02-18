var fs = require('fs');

function prepareCSV(data) {
    // format: period | agent_id | behaviour | layer | rewards
    // period: int
    // behaviour: honest = 0 | malicious = 1
    // layer: int
    // rewards: int
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

module.exports = {
    convertToUsd: function (gasCost) {
        // gas price conversion
        const gas_price = web3.utils.toWei(9, "gwei");
        const eth_usd = 106; // USD

        return gasCost * web3.utils.fromWei(gas_price, "ether") * eth_usd;
    },
    generateBlocksGanache: function (number) {
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

                    return resolve(newBlockHash)
                });
            }
        });
    },
    writeToCSV: function (file, data) {
        let path = "./experiments/results/" + file;
        data_string = prepareCSV(data);
        try {
            // fd = fs.openSync(path, 'a');
            var stream = fs.createWriteStream(path, {
                flags: 'w'
            });
            stream.write(data_string, 'utf8');
        } catch (err) {
            console.log(err);
        } finally {
            stream.end();
        }
    },
};