var LTCR = artifacts.require("./LTCR.sol");

module.exports = function(deployer) {
    let minCollateral = 1;
    deployer.deploy(LTCR, minCollateral);
};
