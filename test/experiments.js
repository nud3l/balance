const Mechanism = artifacts.require("Mechanism");

const truffleAssert = require('truffle-assertions');
var helpers = require('./helpers');

const BN = web3.utils.BN;

contract("Mechanism: test setup", async (accounts) => {
    let owner = accounts[0];
    let num_agents = 10;
    let agents = accounts.slice(1, num_agents + 1);

    let layers = [
        {id: 1, factor: "1750", bound: ["100", "200"]}, 
        {id: 2, factor: "1500", bound: ["200", "400"]}, 
        {id: 3, factor: "1250", bound: ["400", "600"]}, 
        {id: 4, factor: "1000", bound: ["600", "0"]}
    ]

    let actions = [
        {id: 0, reward: "100"},
        {id: 1, reward: "200"},
        {id: 2, reward: "300"},
        {id: 3, reward: "2000"}
    ]

    let min_collateral = 1;
    let period = 10;

    // payout vector for each agent
    let payout = new Array(num_agents);

    // possible lost interest on collateral due to trading etc.
    let interest_on_collateral = "110";

    beforeEach("wait for deployed mechanism", async function() {
        mechanism = await Mechanism.deployed();
    });

    it("set min_collateral", async function() {
        let set_collateral = await mechanism.setCollateral(min_collateral, {from: owner});
        assert.isOk(set_collateral);
    });

    layers.forEach(function(layer) {
        it("set factor for layer " + layer.id, async function() {
            let this_factor;

            await mechanism.setFactor(layer.id, layer.factor, {from: owner});

            let get_factor = await mechanism.getFactor.call(layer.id);
            this_factor = get_factor.toString();

            assert.deepEqual(this_factor, layer.factor); 
        })
    });

    layers.forEach(function(layer) {
        it("set bound for layer " + layer.id, async function() {
            let this_bound = [];

            let set_bound = await mechanism.setBounds(layer.id, layer.bound[0], layer.bound[1], {from: owner});
            truffleAssert.eventEmitted(set_bound, "NewBound");

            let get_bound = await mechanism.getBounds.call(layer.id)
            this_bound.push(get_bound[0].words[0].toString(), get_bound[1].words[0].toString());
            assert.deepEqual(this_bound, layer.bound);
        })
    });

    actions.forEach(function(action) {
        it("set rewards for action " + action.id, async function() {
            let this_reward;

            await mechanism.setReward(action.id, action.reward, {from: owner});

            let get_reward = await mechanism.getReward.call(action.id);
            this_reward = get_reward.toString();

            assert.deepEqual(this_reward, action.reward);
        })
    });

    agents.forEach(function(agent) {
        it("register agent " + agent, async function() {
            let register_agent  = await mechanism.registerAgent(agent, min_collateral * layers[0].factor, {from: agent});
    
            truffleAssert.eventEmitted(register_agent, "RegisterAgent", (event) => {
                return event.agent == agent && event.collateral == (min_collateral * layers[0].factor)
            });
        });
    });

    it("start the period", async function() {
        let start_tcr = await mechanism.startPeriod({from:owner});

        truffleAssert.eventEmitted(start_tcr, "StartedPeriod");
    });

    it("Update ranking after period ends", async function() {
        helpers.generateBlocksGanache(period);

        let update_ranking = await mechanism.updateRanking(agents, {from : owner});

        truffleAssert.eventEmitted(update_ranking, "UpdatedRanking");
    })
})