const LTCR = artifacts.require("LTCR");
const BN = web3.utils.BN;
const truffleAssert = require('truffle-assertions');
var helpers = require('./helpers');
var generateBlocksGanache = helpers.generateBlocksGanache;

contract("LTCR: experiments", async (accounts) => {
    let owner = accounts[0];
    let agents = [accounts[1], accounts[2]];

    let factors = [
        {layer: 1, factor: "1750"}, 
        {layer: 2, factor: "1500"}, 
        {layer: 3, factor: "1250"}, 
        {layer: 4, factor: "1000"}
    ]

    let rewards = [
        {action: 0, reward: "100"},
        {action: 1, reward: "200"},
        {action: 2, reward: "300"},
        {action: 3, reward: "2000"}
    ]

    let bounds = [
        {layer: 1, bound: ["100", "200"]},
        {layer: 2, bound: ["200", "400"]},
        {layer: 3, bound: ["400", "600"]},
        {layer: 4, bound: ["600", "0"]}
    ]

    let min_collateral = 1;
    let period = 10;

    beforeEach("wait for deployed LTCR", async function() {
        ltcr = await LTCR.deployed();
    });

    factors.forEach(function(factor) {
        it("set factor for layer " + factor.layer, async function() {
            let this_factor;

            await ltcr.setFactor(factor.layer, factor.factor, {from: owner});

            let get_factor = await ltcr.getFactor.call(factor.layer);
            this_factor = get_factor.toString();

            assert.deepEqual(this_factor, factor.factor); 
        })
    });

    rewards.forEach(function(reward) {
        it("set rewards for action " + reward.action, async function() {
            let this_reward;

            await ltcr.setReward(reward.action, reward.reward, {from: owner});

            let get_reward = await ltcr.getReward.call(reward.action);
            this_reward = get_reward.toString();

            assert.deepEqual(this_reward, reward.reward);
        })
    });

    bounds.forEach(function(bound) {
        it("set bound for layer " + bound.layer, async function() {
            let this_bound = [];

            let set_bound = await ltcr.setBounds(bound.layer, bound.bound[0], bound.bound[1], {from: owner});
            truffleAssert.eventEmitted(set_bound, "NewBound");

            let get_bound = await ltcr.getBounds.call(bound.layer)
            this_bound.push(get_bound[0].words[0].toString(), get_bound[1].words[0].toString());
            assert.deepEqual(this_bound, bound.bound);
        })
    });

    agents.forEach(function(agent) {
        it("register agent " + agent, async function() {
            let register_agent  = await ltcr.registerAgent(agent, min_collateral * factors[0].factor, {from: agent});
    
            truffleAssert.eventEmitted(register_agent, "RegisterAgent", (event) => {
                return event.agent == agent && event.collateral == (min_collateral * factors[0].factor)
            });
        });
    });


    it("start the period", async function() {
        let start_tcr = await ltcr.startPeriod({from:owner});

        truffleAssert.eventEmitted(start_tcr, "StartedPeriod");
    });

    it("Update ranking after period ends", async function() {
        generateBlocksGanache(period);

        let update_ranking = await ltcr.updateRanking(agents, {from : owner});

        truffleAssert.eventEmitted(update_ranking, "UpdatedRanking");
    })
})