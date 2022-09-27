// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract MockUSDC is ERC20, ERC20PresetMinterPauser {
    constructor(string memory name, string memory symbol)
        ERC20PresetMinterPauser(name, symbol)
    {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20PresetMinterPauser) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function testMint(address to, uint256 amount) external virtual {
        _mint(to, amount);
    }
}
