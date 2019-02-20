const LTCR = artifacts.require("LTCR");

const truffleAssert = require('truffle-assertions');
var helpers = require('../helpers');
var parameters = require('./parameters');

contract("LVCR: cost experiments", async (accounts) => {
    let owner = accounts[0];
    let agents = accounts.slice(1, parameters.num_agents + 1);

    // parameters
    let layer_ids = parameters.layer_ids;
    let layers = parameters.layers;
    let actions = parameters.actions;
    let min_collateral = parameters.min_collateral;
    let periods = parameters.periods;
    let period_counter = 0;

    // agents, layers, gas_update, usd_update, gas_register, usd_register
    let cost_record = [];
    let gas_update;
    let gas_register;

    before("set csv heading", async function () {
        gas_update = 0;
        gas_register = 0;

        helpers.writeToCSV(parameters.cost_file, parameters.csvCostHeading);
    })

    beforeEach("wait for deployed ltcr", async function () {
        ltcr = await LTCR.deployed();
        let set_layers = await ltcr.setLayers(layer_ids, {
            from: owner
        });
        assert.isOk(set_layers);
    });

    after("write costs to csv", async function () {
        cost_record[0] = [
            parameters.num_agents,
            parameters.layer_ids.length,
            gas_update,
            helpers.convertToUsd(gas_update.toString()),
            gas_register,
            helpers.convertToUsd(gas_register.toString())
        ]
        helpers.writeToCSV(parameters.cost_file, cost_record);
    })

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
            let register_agent = await ltcr.registerAgent(agent, helpers.getCollateral(layer_ids[0]), {
                from: agent
            });

            truffleAssert.eventEmitted(register_agent, "RegisterAgent", (event) => {
                return event.agent == agent && event.collateral == (helpers.getCollateral(layer_ids[0]))
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

    it("Check that agents are assigned to the lowest layer", async function () {
        helpers.generateBlocksGanache(periods);

        let update_ranking = await ltcr.updateRanking({
            from: owner
        });

        truffleAssert.eventEmitted(update_ranking, "UpdatedRanking");

        gas_update += update_ranking.receipt.gasUsed;
        gas_register = 0;
    })
})