// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./staking.sol";

contract GRYD is ERC20, ERC20Burnable {

    address owner;

    struct Create {
        address user;
    }

    event InsertDataSuccess(address User, string QueryType);

    mapping(uint256 => Create) buyers;
    uint256 totalUsers;

    modifier onlyOwner() {
        require(owner == _msgSender(), "Not authorized");
        _;
    }

    constructor(address _owner)
    ERC20("GRYD Token", "GRYD")
    {
        owner = _owner;
        _mint(msg.sender, 100000000 * 10 ** 18);
        uint256 _totalUsers = 0;
        totalUsers = _totalUsers;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function create() external {
        totalUsers += 1;

        Create memory _create;
        _create.user = _msgSender();

        buyers[totalUsers] = _create;

        emit InsertDataSuccess(_msgSender(), "create");
    }
}
