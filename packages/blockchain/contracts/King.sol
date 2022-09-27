// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "./presets/OwnablePausableUpgradeable.sol";
import "./interface/IKing.sol";
import "hardhat/console.sol";

contract King is
    UUPSUpgradeable,
    OwnablePausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IKing
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
    mapping(address => address) king;
    mapping(address => uint256) price;
    EnumerableSetUpgradeable.AddressSet gameMode;
    uint16 public ratio;

    modifier noRepeat(address token) {
        require(msg.sender != king[token], "King: You are already king!");
        _;
    }

    modifier onlyValidMode(address mode) {
        require(gameMode.contains(mode), "King: Unsupported mode!");
        _;
    }

    function initialize(uint16 defeatRatio) external initializer {
        __OwnablePausableUpgradeable_init(msg.sender);
        ratio = defeatRatio;
        gameMode.add(address(0));
    }

    function _authorizeUpgrade(address) internal override onlyAdmin {}

    function depositETH()
        external
        payable
        nonReentrant
        noRepeat(address(0))
        whenNotPaused
    {
        if (king[address(0)] == address(0) && msg.value > 0) {
            king[address(0)] = payable(msg.sender);
            price[address(0)] = msg.value;
        } else {
            require(
                msg.value >= (price[address(0)] * ratio) / 100,
                "King: Not enough fund!"
            );
            payable(address(king[address(0)])).transfer(msg.value);
            king[address(0)] = payable(msg.sender);
            price[address(0)] = msg.value;
        }
        emit NewKing(address(0), king[address(0)], price[address(0)]);
    }

    function depositERC20(address token, uint256 amount)
        external
        nonReentrant
        noRepeat(token)
        whenNotPaused
    {
        require(token != address(0), "King: this token is not supported!");
        if (king[token] == address(0) && amount > 0) {
            _safeTransfrom(token, msg.sender, address(this), amount);
            king[token] = payable(msg.sender);
            price[token] = amount;
        } else {
            require(
                amount >= (ratio * price[token]) / 100,
                "King: Not enough fund!"
            );
            _safeTransfrom(token, msg.sender, address(this), amount);
            _safeTransferERC20(token, king[token], amount);
            king[token] = payable(msg.sender);
            price[token] = amount;
        }
        if (!gameMode.contains(token)) gameMode.add(token);
        emit NewKing(token, king[token], price[token]);
    }

    function _safeTransfrom(
        address token,
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        IERC20Upgradeable _erc20Token = IERC20Upgradeable(token);
        uint256 allowance = _erc20Token.allowance(msg.sender, address(this));
        require(allowance >= _amount, "King: Token tranfer is not approved!");
        require(
            _erc20Token.transferFrom(_from, _to, _amount),
            "King: ERC20 token transfer failed"
        );
    }

    function _safeTransferERC20(
        address token,
        address to,
        uint256 amount
    ) internal {
        IERC20Upgradeable _erc20Token = IERC20Upgradeable(token);
        require(
            _erc20Token.transfer(to, amount),
            "King: failed send token to previous King"
        );
    }

    function addGameMode(address mode) external {
        require(!gameMode.contains(mode), "Already added this game");
        gameMode.add(mode);
    }

    function getCurrentKing(address mode)
        public
        view
        onlyValidMode(mode)
        returns (
            address,
            uint256,
            uint16
        )
    {
        return (king[mode], price[mode], ratio);
    }

    function getGameMode() external view returns (address[] memory) {
        return gameMode.values();
    }
}
