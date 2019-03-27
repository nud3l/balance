const LTCR = artifacts.require("LTCR");

const truffleAssert = require('truffle-assertions');
var helpers = require('../helpers');
var parameters = require('./parameters');

contract("LVCR: cost experiments", (accounts) => {
    let owner = accounts[0];

    let num_agents_array = parameters.num_agents;
    let num_layers_array = parameters.num_layers;

    helpers.writeToCSV(parameters.cost_file, parameters.csvCostHeading);

    for (var i = 0; i < num_agents_array.length; i++) {
        for (var j = 0; j < num_layers_array.length; j++) {
            let ltcr;

            let num_agents = num_agents_array[i];
            let agents = accounts.slice(1, num_agents + 1);

            // parameters
            let layer_ids = parameters.layer_ids(num_layers_array[j]);
            let layers = parameters.layers(num_layers_array[j]);
            let actions = parameters.actions;
            let min_collateral = parameters.min_collateral;

            // agents, layers, gas_update, usd_update, gas_register, usd_register
            let cost_record = [];
            let gas_update = 0;
            let gas_register = 0;

            before("wait for deployed ltcr", async function () {
                ltcr = await LTCR.new();
            })

            after("write costs to csv", async function () {
                cost_record[0] = [
                    num_agents,
                    layer_ids.length,
                    gas_update,
                    helpers.convertToUsd(gas_update.toString()),
                    gas_register,
                    helpers.convertToUsd(gas_register.toString())
                ]
                helpers.writeToCSV(parameters.cost_file, cost_record);
            })

            it("set layers", async function () {
                let set_layers = await ltcr.setLayers(layer_ids, {
                    from: owner
                });
                assert.isOk(set_layers);
            });

            it("set min_collateral", async function () {
                let set_collateral = await ltcr.setCollateral(min_collateral, {
                    from: owner
                });
                assert.isOk(set_collateral);
            });

            layers.forEach(function (layer) {
                it("set factor for layer " + layer.id, async function () {
                    let this_factor;

                    await ltcr.setFactor(layer.id, layer.factor, {
                        from: owner
                    });

                    let get_factor = await ltcr.getFactor.call(layer.id);
                    this_factor = get_factor.toString();

                    assert.equal(this_factor, layer.factor);
                })
            });

            layers.forEach(function (layer) {
                it("set bound for layer " + layer.id, async function () {
                    let this_bound = [];

                    let set_bound = await ltcr.setBounds(layer.id, layer.bound[0], layer.bound[1], {
                        from: owner
                    });
                    truffleAssert.eventEmitted(set_bound, "NewBound");

                    let get_bound = await ltcr.getBounds.call(layer.id)
                    this_bound.push(get_bound[0].words[0].toString(), get_bound[1].words[0].toString());
                    assert.deepEqual(this_bound, layer.bound);
                })
            });

            actions.forEach(function (action) {
                it("set rewards for action " + action.id, async function () {
                    let this_reward;

                    await ltcr.setReward(action.id, action.reward, {
                        from: owner
                    });

                    let get_reward = await ltcr.getReward.call(action.id);
                    this_reward = get_reward.toString();

                    assert.equal(this_reward, action.reward);
                })
            });

            agents.forEach(function (agent) {
                it("register agent " + agent, async function () {
                    let register_agent = await ltcr.registerAgent(agent, helpers.getCollateral(min_collateral, layers[0].factor), {
                        from: agent
                    });

                    truffleAssert.eventEmitted(register_agent, "RegisterAgent", (event) => {
                        return event.agent == agent && event.collateral == (helpers.getCollateral(min_collateral, layers[0].factor));
                    });

                    let get_assignment = await ltcr.getAssignment.call(agent);
                    this_assignment = get_assignment.toString();
                    assert.equal(this_assignment, "1");
                });
            });

            agents.forEach(function (agent) {
                it("Perform actions", async function () {
                    let get_assignment = await ltcr.getAssignment.call(agent);
                    if (get_assignment != (layer_ids[layer_ids.length - 1])) {
                        let record_action = await ltcr.update(agent, 1);

                        if (gas_register < record_action.receipt.gasUsed) {
                            gas_register = record_action.receipt.gasUsed;
                        }
                    }
                    let get_score = await ltcr.getScore.call(agent);
                    let this_score = get_score.toString();
                    assert.equal(Number(this_score), Number(actions[0].reward) + Number(actions[1].reward), "did not update the score");
                })
            })

            it("Update assignments", async function () {
                let update_ranking = await ltcr.curate({
                    from: owner,
                    gas: 6721975
                });

                truffleAssert.eventEmitted(update_ranking, "Curate");

                gas_update = update_ranking.receipt.gasUsed;
            })
        }
    }
})