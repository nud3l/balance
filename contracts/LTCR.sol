pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract LTCR is Ownable {
    uint256 _minCollateral; // minimum collateral
    uint256 _decimals; // decimals to calculate collateral factor

    // Implementation of L = (lower, upper, factor)
    uint8[] _layers; // array of layers, e.g. {1,2,3,4}
    mapping (uint8 => uint256) _lower; // lower bound of layer
    mapping (uint8 => uint256) _upper; // upper bound of layer
    mapping (uint8 => uint256) _factors; // factor of layer

    // Implementation of the relevant agreement parameters A = (phi, payment, score, deposits) 
    mapping (uint256 => uint256) _rewards; // reward (score) for performing an action
    mapping (address => uint256) _deposits; // amount of deposit

    // Implementation of the registry
    mapping (uint256 => mapping (address => uint8)) _assignments; // layer assignment by round and agent
    mapping (uint256 => mapping (address => uint256)) _scores; // score by round and agent
    uint256 _round; // current round in the protocol
    
    mapping (address => bool) _agents; // track all agents

    uint256 _blockperiod; // block period until curation
    uint256 _start; // start of period
    uint256 _end; // end of period

    constructor() public {
        _decimals = 3; // e.g. a factor of 1500 is equal to 1.5 times the collateral
        _round = 0; // init rounds
        
        _blockperiod = 1; // wait for 10 blocks to curate
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
        uint8 assignment = getAssignment(agent);

        require(assignment > 0, "agent not assigned to layer");

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

    function getAssignment(address agent) public view returns(uint8 assignment) {
        // check if agent is registered
        if (_agents[agent]) {
            // check if agent is assigned to a layer in the current round        
            if (_assignments[_round][agent] == 0) {
                // check if the agent was assigned to a layer in previous rounds
                for (uint8 i = 1; i < _layers.length && i < _round; i++) {
                    if (_assignments[_round - i][agent] > i) {
                        return _assignments[_round - i][agent] - i;
                    }
                }
                return 1;
            } else {
                return _assignments[_round][agent];
            }
        } else {
            return 0;
        }
    }

    function getAgentCollateral(address agent) public view returns (uint256) {
        uint8 assignment = getAssignment(agent);

        require(assignment > 0, "agent not assigned to layer");

        return _deposits[agent];
    }

    function getScore(address agent) public view returns (uint256) {
        uint8 assignment = getAssignment(agent);

        require(assignment > 0, "agent not assigned to layer");

        return _scores[_round][agent];
    }

    function registerAgent(address agent, uint256 collateral) public returns (bool) {
        require(collateral >= _minCollateral * (_factors[_layers[0]] / (10 ** _decimals)), "too little collateral");
        
        // register agent
        _agents[agent] = true;
        // asign agent to lowest layer
        _assignments[_round][agent] = _layers[0];
        // track the deposit
        _deposits[agent] = collateral;
        // update the score of the agent
        _scores[_round][agent] += _rewards[0];
        
        emit RegisterAgent(agent, collateral);
        
        return true;
    }

    event RegisterAgent(address agent, uint256 collateral);

    // ####################
    // ### TCR CONTROLS ###
    // ####################

    function update(address agent, uint256 action) public returns (bool) {
        _scores[_round][agent] += _rewards[action];

        // asignment in the current round
        uint8 assignment = getAssignment(agent);

        require(assignment > 0, "agent not assigned to layer");

        // promote the agent to the next layer
        if (_scores[_round][agent] >= _upper[assignment] && assignment != _layers.length) {
            // asignment in the next round
            _assignments[_round + 1][agent] = assignment + 1;
        // demote the agent to the previous layer
        } else if (_scores[_round][agent] <= _lower[assignment] && assignment > 1) {
            // asignment in the next round
            _assignments[_round + 1][agent] = assignment - 1;
        // agent layer remans the same
        } else {
            _assignments[_round + 1][agent] = assignment;
        }
        // 
        
        emit Update(agent, _rewards[action], _scores[_round][agent]);

        return true;
    }

    event Update(address agent, uint256 reward, uint256 score);

    function curate() public onlyOwner returns (bool) {
        require(_start != 0, "period not started");
        require(block.number >= _end, "period not ended");

        // update start and end times for next round
        _start = block.number;
        _end = block.number + _blockperiod;

        // switch to the next round
        _round++;

        emit Curate(_round, _start, _end);
        return true;
    }

    event Curate(uint256 round, uint256 start, uint256 end);
}