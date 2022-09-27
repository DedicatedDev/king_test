// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./King.sol";

contract KingV2 is King {
    event UpdateDefeatRatio(address indexed, uint16 ratio);

    function updateDefeatRatio(uint16 defeatRatio) external onlyAdmin {
        require(defeatRatio > 0, "KingV2: invalid ratio!");
        ratio = defeatRatio;
        emit UpdateDefeatRatio(msg.sender, defeatRatio);
    }
}
