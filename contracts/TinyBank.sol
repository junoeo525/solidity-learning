// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MultiManagedAccess.sol";

interface IMyToken {
    function transfer(uint256 amount, address to) external;
    function transferFrom(address from, address to, uint256 amount) external;
    function mint(uint256 amount, address to) external;
}

contract TinyBank is MultiManagedAccess {
    IMyToken public stakingToken;

    mapping(address => uint256) public staked;
    mapping(address => uint256) public lastClaimedBlock;

    uint256 public totalStaked;
    uint256 public rewardPerBlock;

    event Staked(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor(
        IMyToken _stakingToken,
        address[MANAGER_NUMBERS] memory _managers
    ) MultiManagedAccess(msg.sender, _managers) {
        stakingToken = _stakingToken;
        rewardPerBlock = 1 ether;
    }

    modifier updateReward(address user) {
        if (staked[user] > 0) {
            uint256 blocksPassed = block.number - lastClaimedBlock[user];
            uint256 reward = (blocksPassed * rewardPerBlock * staked[user]) / totalStaked;
            stakingToken.mint(reward, user);
        }
        lastClaimedBlock[user] = block.number;
        _;
    }

    // 과제 포인트: onlyOwner 대신 onlyAllConfirmed 사용 + manager만 호출 가능
    function setRewardPerBlock(uint256 _amount)
        external
        onlyManager
        onlyAllConfirmed
    {
        rewardPerBlock = _amount;
    }

    function stake(uint256 amount)
        external
        updateReward(msg.sender)
    {
        require(amount > 0, "cannot stake zero");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount)
        external
        updateReward(msg.sender)
    {
        require(staked[msg.sender] >= amount, "insufficient stake");
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.transfer(amount, msg.sender);
        emit Withdraw(msg.sender, amount);
    }
}