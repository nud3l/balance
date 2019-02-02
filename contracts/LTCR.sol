pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract LTCR is Ownable {
    uint256 _minCollateral;
    uint8 _decimals;

    uint8[4] _layers = [1,2,3,4];
    mapping (uint8 => uint256[2]) _bounds;

    mapping (uint8 => uint256) _factors;
    mapping (address => uint8) _assignments;
    mapping (address => uint256) _scores;

    mapping (uint256 => uint256) _rewards;

    uint256 _blockperiod;
    uint256 _start;
    uint256 _end;

    constructor(uint256 mincollateral) public {
        _minCollateral = mincollateral;
        _decimals = 3; // e.g. a factor of 1500 is equal to 1.5 times the collateral
        // wait for 100 blocks to reorg
        _blockperiod = 100;
    }

    function getLayers() public view returns(uint8[4] memory) {
        return _layers;
    }

    function getAssignment(address agent) public view returns(uint8) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        return _assignments[agent];
    }

    function getCollateral(address agent) public view returns (uint256) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        uint8 assignment = _assignments[agent];
        return _factors[assignment];
    }

    function  setFactor(uint8 layer, uint256 factor) public onlyOwner returns (bool) {
        require(factor > 10^_decimals, "factor needs to be above 1.0");
        _factors[layer] = factor;
        return true;
    }

    function setRewards(uint256 action, uint256 reward) public onlyOwner returns (bool) {
        _rewards[action] = reward;
        return true;
    }

    function setBounds(uint8 layer, uint256 lower, uint256 upper) public onlyOwner returns (bool) {
        _bounds[layer] = [lower, upper];
        return true;
    }

    function registerAgent(address agent, uint256 collateral) public returns (bool) {
        require(collateral >= _minCollateral * (_factors[_layers[_layers.length - 1]] / 10^_decimals), "too little collateral");
        _assignments[agent] = _layers[_layers.length - 1];
        return true;
    }

    function recordAction(address agent, uint256 action) public returns (bool) {
        _scores[agent] += _rewards[action];
        return true;
    }

    function startPeriod() public returns (bool) {
        require(_start == 0, "only for initial setup");
        _start = block.number;
        _end = block.number + _blockperiod;
        return true;
    }

    function updateTCR(address[] memory agents) public returns (bool) {
        require(_start != 0, "period not started");
        for (uint256 i = 0; i < agents.length; i++) {
            // promote or demote
            uint256 score = _scores[agents[i]];
            uint8 layer = _assignments[agents[i]];
            
            if (layer > 0 && score < _bounds[layer][0]) { // lower bound check
                _assignments[agents[i]] -= 1;
            } else if (layer < (_layers.length - 1) && score > _bounds[layer][1]) { // upper bound check
                _assignments[agents[i]] += 1;
            }

            // reset score
            _scores[agents[i]] = 0;

        }
        return true;
    }
}