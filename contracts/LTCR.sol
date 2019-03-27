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
    
    address[] _agents; // track all agents
    mapping (address => bool) _remain; // default to false

    uint256 _blockperiod;
    uint256 _start;
    uint256 _end;

    constructor() public {
        _decimals = 3; // e.g. a factor of 1500 is equal to 1.5 times the collateral
        // wait for 10 blocks to reorg
        _blockperiod = 1;
        _start = block.number;
        _end = block.number + _blockperiod;
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

    function getAgentCollateral(address agent) public view returns (uint256) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        return _deposits[agent];
    }

    function getScore(address agent) public view returns (uint256) {
        require(_assignments[agent] > 0, "agent not assigned to layer");
        return _scores[agent];
    }

    function registerAgent(address agent, uint256 collateral) public returns (bool) {
        require(collateral >= _minCollateral * (_factors[_layers[0]] / (10 ** _decimals)), "too little collateral");
        
        // asign agent to lowest layer
        _assignments[agent] = _layers[0];
        // track the deposit
        _deposits[agent] = collateral;
        // add agent to list to change in next round
        _agents.push(agent);
        // update the score of the agent
        _scores[agent] += _rewards[0];
        
        emit RegisterAgent(agent, collateral);
        
        return true;
    }

    event RegisterAgent(address agent, uint256 collateral);

    // ####################
    // ### TCR CONTROLS ###
    // ####################

    function update(address agent, uint256 action) public returns (bool) {
        _scores[agent] += _rewards[action];

        if (_scores[agent] >= _lower[_assignments[agent]] && _scores[agent] <= _upper[_assignments[agent]]) {
            _remain[agent] = true;
        } else {
            _remain[agent] = false;
        }
        
        emit Update(agent, _rewards[action], _scores[agent]);

        return true;
    }

    event Update(address agent, uint256 reward, uint256 score);

    function curate() public onlyOwner returns (bool) {
        require(_start != 0, "period not started");
        require(block.number >= _end, "period not ended");

        // update start and end times for next round
        _start = block.number;
        _end = block.number + _blockperiod;

        emit Curate(_agents, _start, _end);

        // promote or demote _agents
        for (uint i = 0; i < _agents.length; i++) {
            if (_remain[_agents[i]] == false) {
                uint256 score = _scores[_agents[i]];
                uint8 layer = _assignments[_agents[i]];

                // lower bound check
                if (layer > 0 && score < _lower[layer]) { 
                    _assignments[_agents[i]] -= 1;
                // upper bound check
                } else if (layer < (_layers.length - 1) && score > _upper[layer]) {
                    _assignments[_agents[i]] += 1;
                }
            }
            // reset score
            _scores[_agents[i]] = 0;
        }

        return true;
    }

    event Curate(address[] _agents, uint256 start, uint256 end);
}