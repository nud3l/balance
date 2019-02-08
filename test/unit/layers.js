const Mechanism = artifacts.require("Mechanism");
const BN = web3.utils.BN;

contract("Mechanism: layers", async (accounts) => {


    beforeEach("wait for deployed Mechanism", async () => {
        mechanism = await Mechanism.deployed();
    })

    it("query available layers", async () => {
        let layers = await mechanism.getLayers.call();
        assert.isArray(layers);

        for (i = 0; i < 4; i++) {
            // let test_value = new BN(i+1);
            // this seems to be an issue with BN and web3js
            // web3js produces BN objects like: words: [ 3, <1 empty item> ],
            // they should be: words: [ 3 ],
            assert.equal(layers[i].words[0], i+1);
        }
    }) 
})