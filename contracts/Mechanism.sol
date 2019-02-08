pragma solidity ^0.5.0;

import "./LTCR.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Mechanism is LTCR {
    mapping (uint => uint) _payouts;

    function setPayout(uint action, uint payout) public onlyOwner returns (bool) {
        _payouts[action] = payout;
        return true;
    }
}
