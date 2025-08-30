// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract EvenntZToken is ERC20, Ownable {
    constructor() ERC20("EvenntZ Token", "EVT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10**18); // Initial supply of 1M tokens
    }


    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
}
