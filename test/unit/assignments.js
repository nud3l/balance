const LTCR = artifacts.require("LTCR");

contract("LTCR: assignments", async (accounts) => {


    beforeEach("wait for deployed LTCR", async () => {
        ltcr = await LTCR.deployed();
    })
})