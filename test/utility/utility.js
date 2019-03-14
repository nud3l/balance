const LTCR = artifacts.require("LTCR");

const truffleAssert = require('truffle-assertions');
var helpers = require('../helpers');
var parameters = require('./parameters');


contract("LTCR: utility experiments", async (accounts) => {
    let owner = accounts[0];

    let num_layers_array = parameters.num_layers;

    helpers.writeToCSV(parameters.test_file, parameters.csvTestHeading);

    for (var j = 0; j < num_layers_array.length; j++) {
        let ltcr;

        let agents = accounts.slice(1, parameters.num_agents + 1);

        // parameters
        let layer_ids = parameters.layer_ids(num_layers_array[j]);
        let layers = parameters.layers(num_layers_array[j]);
        let actions = parameters.actions;
        let min_collateral = parameters.min_collateral;
        // let periods = parameters.periods;
        let period_counter = 0;

        // array of agent records
        // format: period | agent_id | behaviour | layer | rewards | utility
        let experiment_record = [];

        before("set csv heading and wait for deployed ltcr", async function () {
            ltcr = await LTCR.new();
        });

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

        it("start the period", async function () {
            let start_tcr = await ltcr.startPeriod({
                from: owner
            });

            truffleAssert.eventEmitted(start_tcr, "StartedPeriod");
        });

        agents.forEach(function (agent) {
            it("register agent " + agent, async function () {
                let register_agent = await ltcr.registerAgent(agent, helpers.getCollateral(min_collateral, layers[0].factor), {
                    from: agent
                });

                truffleAssert.eventEmitted(register_agent, "RegisterAgent", (event) => {
                    return event.agent == agent && event.collateral == (helpers.getCollateral(min_collateral, layers[0].factor))
                });

                let get_assignment = await ltcr.getAssignment.call(agent);
                this_assignment = get_assignment.toString();
                assert.equal(this_assignment, "1");
            });
        });

        agents.forEach(function (agent) {
            it("get initial assignment " + agent, async function () {
                let agent_id = agents.indexOf(agent);
                let get_assignment = await ltcr.getAssignment.call(agent);
                let get_score = await ltcr.getScore.call(agent);
                this_assignment = get_assignment.toString();
                assert.equal(this_assignment, "1");
                // format: [periods | agent_id | behaviour | layer | rewards | utility ]
                experiment_record[agent_id] = [
                    period_counter, // period
                    agent_id, // agent_id
                    0, // behaviour
                    Number(this_assignment), // layer
                    get_score, // rewards
                    helpers.getUtility(helpers.getCollateral(Number(this_assignment))) // utility
                ];
            });
        });

        it("write initial records to csv", async function () {
            helpers.writeToCSV(parameters.test_file, experiment_record);
        })

        it("Update assignments", async function () {
            // helpers.generateBlocksGanache(periods);

            let update_ranking = await ltcr.updateRanking({
                from: owner
            });

            truffleAssert.eventEmitted(update_ranking, "UpdatedRanking");
        })

        // parameters.periods.forEach(function () {
        //     agents.forEach(function (agent) {
        //         it("perform actions" + agent, async function () {
        //             let agent_id = agents.indexOf(agent);
        //             let get_assignment = await ltcr.getAssignment.call(agent);
        //             let get_score = await ltcr.getScore.call(agent);
        //             this_assignment = get_assignment.toString();
        //             assert.equal(this_assignment, "1");
        //             // format: [periods | agent_id | behaviour | layer | rewards | utility ]
        //             experiment_record[agent_id] = [
        //                 period_counter, // period
        //                 agent_id, // agent_id
        //                 0, // behaviour
        //                 Number(this_assignment), // layer
        //                 get_score, // rewards
        //                 helpers.getUtility(helpers.getCollateral(Number(this_assignment))) // utility
        //             ];
        //         });
        //     });

        //     it("write records to csv", async function () {
        //         helpers.writeToCSV(parameters.test_file, experiment_record);
        //     })
        // })
    }
})