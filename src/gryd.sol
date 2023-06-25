// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./staking.sol";

contract GRYD is ERC20, ERC20Burnable {

    address owner;

    struct BuyStorage {
        address buyer;
        string userName;
        uint256 size;
    }

    event StorageBought(address buyer, string userName, uint256 size);

    mapping(uint256 => BuyStorage) buyers;
    uint256 totalBuyers;

    modifier onlyOwner() {
        require(owner == _msgSender(), "Not authorized");
        _;
    }

    constructor(address _owner)
    ERC20("GRYD Token","GRYD")
    {
        owner = _owner;
        _mint(msg.sender, 100000000 * 10 ** 18);
        uint256 _totalBuyers = 0;
        totalBuyers = _totalBuyers;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function buyStorage(address buyer, string memory username, uint256 size) external {
        require(buyer != address(0), "buyer cannot be the zero address");
        require(size != 0, "_storage cannot be zero");
        bytes memory tempEmptyUsername = bytes(username);
        require(tempEmptyUsername.length != 0, "username cannot be empty");

        totalBuyers += 1;

        BuyStorage memory _buyStorage;
        _buyStorage.buyer = buyer;
        _buyStorage.userName = username;
        _buyStorage.size = size;

        buyers[totalBuyers] = _buyStorage;

        emit StorageBought(buyer, username, size);
    }
}
