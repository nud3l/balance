pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract LTCR is Ownable {
    uint256 _minCollateral;
    uint256 _decimals;

    uint8[] _layers;
    mapping (uint8 => uint256) _lower;
    mapping (uint8 => uint256) _upper;
    mapping (uint8 => uint256) _factors;

    mapping (address => uint8) _assignments;
    mapping (address => uint256) _scores;
    mapping (address => uint256) _deposits;
    mapping (uint256 => uint256) _rewards;
    address[] _agents; // track which agents need updating

    uint256 _blockperiod;
    uint256 _start;
    uint256 _end;

    constructor() public {
        _decimals = 3; // e.g. a factor of 1500 is equal to 1.5 times the collateral
        // wait for 10 blocks to reorg
        _blockperiod = 1;
    }
    
    // ##############
    // ### LAYERS ###
    // ##############

    function getLayers() public view returns(uint8[] memory) {
        return _layers;
    }

    function setLayers(uint8[] memory layers) public returns (bool) {
         // set layers
        _layers = layers;
        return true;
    }

    // ##################
    // ### Collateral ###
    // ##################

    function setCollateral(uint256 mincollateral) public onlyOwner returns (bool) {
        _minCollateral = mincollateral;
        return true;
    }

    // ##############
    // ### FACTOR ###
    // ##############

    function getAgentFactor(address agent) public view returns (uint256) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        uint8 assignment = _assignments[agent];
        return _factors[assignment];
    }

    function getFactor(uint8 layer) public view returns (uint256) {
        return _factors[layer];
    }

    function setFactor(uint8 layer, uint256 factor) public onlyOwner returns (bool) {
        require(factor >= (10 ** _decimals), "factor needs to be above or equal to 1.0");
        require(layer > 0, "layer 0 is reserved");
        _factors[layer] = factor;
        return true;
    }

    // ###############
    // ### REWARD ###
    // ###############

    function getReward(uint256 action) public view returns (uint256) {
        return _rewards[action];
    }

    function setReward(uint256 action, uint256 reward) public onlyOwner returns (bool) {
        _rewards[action] = reward;
        return true;
    }

    // ###############
    // ### BOUNDS ###
    // ###############

    function getBounds(uint8 layer) public view returns (uint256, uint256) {
        return (_lower[layer], _upper[layer]);
    }

    function setBounds(uint8 layer, uint256 lower, uint256 upper) public onlyOwner returns (bool) {
        _lower[layer] = lower;
        _upper[layer] = upper;

        emit NewBound(lower, upper);

        return true;
    }

    event NewBound(uint256 lower, uint256 upper);

    // ######################
    // ### AGENT REGISTRY ###
    // ######################

    function getAssignment(address agent) public view returns(uint8) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        return _assignments[agent];
    }

    function getAgentColalteral(address agent) public view returns (uint256) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        return _deposits[agent];
    }

    function getScore(address agent) public view returns (uint256) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        return _scores[agent];
    }

    function registerAgent(address agent, uint256 collateral) public returns (bool) {
        require(collateral >= _minCollateral * (_factors[_layers[0]] / (10 ** _decimals)), "too little collateral");
        _assignments[agent] = _layers[0];
        _deposits[agent] = collateral;
        recordAction(agent, 0);
        
        emit RegisterAgent(agent, collateral);
        
        return true;
    }

    event RegisterAgent(address agent, uint256 collateral);

    function recordAction(address agent, uint256 action) public returns (bool) {
        _scores[agent] += _rewards[action];

        if (_scores[agent] > _upper[_assignments[agent]]) {
            _agents.push(agent);
        }
        
        return true;
    }


    // ####################
    // ### TCR CONTROLS ###
    // ####################

    function startPeriod() public onlyOwner returns (bool) {
        require(_start == 0, "only for initial setup");
        _start = block.number;
        _end = block.number + _blockperiod;

        emit StartedPeriod(_start, _end);

        return true;
    }

    event StartedPeriod(uint256 start, uint end);

    function updateRanking() public onlyOwner returns (bool) {
        require(_start != 0, "period not started");
        require(block.number >= _end, "period not ended");

        // update start and end times for next round
        _start = block.number;
        _end = block.number + _blockperiod;

        emit UpdatedRanking(_agents, _start, _end);

        // promote or demote _agents
        while (_agents.length > 0) {
            uint i = _agents.length - 1;
            uint256 score = _scores[_agents[i]];
            uint8 layer = _assignments[_agents[i]];

            if (layer > 0 && score < _lower[layer]) { // lower bound check
                _assignments[_agents[i]] -= 1;
            } else if (layer < (_layers.length - 1) && score > _upper[layer]) { // upper bound check
                _assignments[_agents[i]] += 1;
            }

            // reset score
            _scores[_agents[i]] = 0;

            // pop the last element
            _agents.pop();
        }

        return true;
    }

    event UpdatedRanking(address[] _agents, uint256 start, uint256 end);
}