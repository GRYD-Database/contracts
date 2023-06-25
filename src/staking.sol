// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Staking is ERC20, ERC20Burnable, ReentrancyGuard {
    address owner;

    modifier onlyOwner() {
        require(owner == _msgSender(), "Not authorized");
        _;
    }


    struct Staker {
        uint256 deposited;
    }

    // Mapping of address to Staker info
    mapping(address => Staker) internal stakers;

    constructor(address _owner, string memory _name, string memory _symbol)
    ERC20(_name, _symbol)
    {
        owner = _owner;
    }

    function deposit(uint256 _amount) external nonReentrant {
        require(
            balanceOf(msg.sender) >= _amount,
            "Can't stake more than you own"
        );

        stakers[msg.sender].deposited = _amount;
        _burn(msg.sender, _amount);
    }

    function hasStaked(address _user)
    public
    view
    returns (bool)
    {
        uint256 _stake = stakers[_user].deposited;
        if (_stake == 0) {
            return false;
        }
        return true;
    }
}
