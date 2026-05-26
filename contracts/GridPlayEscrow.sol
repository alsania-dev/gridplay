// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title GridPlayEscrow
 * @dev Escrow contract for GridPlay token payments
 * Handles entry fees and payouts for game boards
 */
contract GridPlayEscrow {
    // ===========================================
    // Events
    // ===========================================
    
    event BoardCreated(
        bytes32 indexed boardId,
        address indexed creator,
        address token,
        uint256 entryFee,
        uint256 totalPrizePool,
        uint256 startTime
    );
    
    event PaymentReceived(
        bytes32 indexed boardId,
        address indexed player,
        uint256 amount
    );
    
    event PayoutDistributed(
        bytes32 indexed boardId,
        address indexed winner,
        uint256 amount
    );
    
    event BoardCompleted(
        bytes32 indexed boardId,
        uint256 totalPaidOut
    );
    
    // ===========================================
    // Structs
    // ===========================================
    
    struct Board {
        address creator;
        address token;
        uint256 entryFee;
        uint256 totalPrizePool;
        uint256 totalCollected;
        uint256 startTime;
        bool completed;
        uint8 houseFeeBps; // Basis points (e.g., 250 = 2.5%)
    }
    
    struct Payment {
        address player;
        uint256 amount;
        bool paid;
        uint256 timestamp;
    }
    
    // ===========================================
    // State
    // ===========================================
    
    mapping(bytes32 => Board) public boards;
    mapping(bytes32 => mapping(address => Payment)) public payments;
    mapping(bytes32 => address[]) public players;
    
    address public owner;
    uint8 public defaultHouseFeeBps = 250; // 2.5%
    
    // ===========================================
    // Modifiers
    // ===========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier boardExists(bytes32 boardId) {
        require(boards[boardId].creator != address(0), "Board does not exist");
        _;
    }
    
    modifier boardActive(bytes32 boardId) {
        require(!boards[boardId].completed, "Board already completed");
        require(block.timestamp >= boards[boardId].startTime, "Game not started");
        _;
    }
    
    // ===========================================
    // Constructor
    // ===========================================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ===========================================
    // External Functions
    // ===========================================
    
    /**
     * @dev Create a new game board
     * @param boardId Unique identifier for the board
     * @param token Token address for entry fees
     * @param entryFee Fee per player
     * @param startTime Game start time (timestamp)
     * @param houseFeeBps Optional house fee (default if 0)
     */
    function createBoard(
        bytes32 boardId,
        address token,
        uint256 entryFee,
        uint256 startTime,
        uint8 houseFeeBps
    ) external {
        require(boards[boardId].creator == address(0), "Board already exists");
        require(token != address(0), "Invalid token address");
        require(entryFee > 0, "Entry fee must be > 0");
        require(startTime > block.timestamp, "Start time must be in future");
        
        uint8 finalFee = houseFeeBps > 0 ? houseFeeBps : defaultHouseFeeBps;
        require(finalFee <= 1000, "House fee too high (max 10%)");
        
        boards[boardId] = Board({
            creator: msg.sender,
            token: token,
            entryFee: entryFee,
            totalPrizePool: 0,
            totalCollected: 0,
            startTime: startTime,
            completed: false,
            houseFeeBps: finalFee
        });
        
        emit BoardCreated(
            boardId,
            msg.sender,
            token,
            entryFee,
            0,
            startTime
        );
    }
    
    /**
     * @dev Pay entry fee for a board
     * @param boardId Board identifier
     */
    function payEntryFee(bytes32 boardId) external {
        Board storage board = boards[boardId];
        require(board.creator != address(0), "Board does not exist");
        require(!board.completed, "Board completed");
        require(block.timestamp < board.startTime, "Game already started");
        require(!payments[boardId][msg.sender].paid, "Already paid");
        
        uint256 amount = board.entryFee;
        
        // Transfer tokens
        IERC20 token = IERC20(board.token);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Record payment
        payments[boardId][msg.sender] = Payment({
            player: msg.sender,
            amount: amount,
            paid: true,
            timestamp: block.timestamp
        });
        
        players[boardId].push(msg.sender);
        
        board.totalCollected += amount;
        
        emit PaymentReceived(boardId, msg.sender, amount);
    }
    
    /**
     * @dev Distribute payouts after game completion
     * @param boardId Board identifier
     * @param winners Array of winner addresses
     * @param payoutAmounts Array of payout amounts (in same order)
     */
    function distributePayouts(
        bytes32 boardId,
        address[] calldata winners,
        uint256[] calldata payoutAmounts
    ) external boardExists(boardId) boardActive(boardId) {
        Board storage board = boards[boardId];
        require(!board.completed, "Already completed");
        require(winners.length == payoutAmounts.length, "Arrays length mismatch");
        require(msg.sender == board.creator, "Only board creator can distribute");
        
        uint256 totalPayouts = 0;
        
        // Calculate house fee
        uint256 houseFee = (board.totalCollected * board.houseFeeBps) / 10000;
        uint256 prizePool = board.totalCollected - houseFee;
        
        for (uint256 i = 0; i < winners.length; i++) {
            totalPayouts += payoutAmounts[i];
        }
        
        require(totalPayouts <= prizePool, "Payouts exceed prize pool");
        
        // Distribute payouts
        IERC20 token = IERC20(board.token);
        
        for (uint256 i = 0; i < winners.length; i++) {
            require(payoutAmounts[i] > 0, "Invalid payout amount");
            require(token.transfer(winners[i], payoutAmounts[i]), "Payout transfer failed");
            emit PayoutDistributed(boardId, winners[i], payoutAmounts[i]);
        }
        
        // Send house fee to creator
        if (houseFee > 0) {
            require(token.transfer(board.creator, houseFee), "House fee transfer failed");
        }
        
        board.completed = true;
        board.totalPrizePool = prizePool;
        
        emit BoardCompleted(boardId, totalPayouts);
    }
    
    /**
     * @dev Refund all players if game is cancelled
     * @param boardId Board identifier
     */
    function refundPlayers(bytes32 boardId) external boardExists(boardId) {
        Board storage board = boards[boardId];
        require(block.timestamp < board.startTime, "Game already started");
        require(!board.completed, "Game already completed");
        require(msg.sender == board.creator, "Only board creator can refund");
        
        IERC20 token = IERC20(board.token);
        
        address[] memory playerList = players[boardId];
        for (uint256 i = 0; i < playerList.length; i++) {
            address player = playerList[i];
            Payment storage payment = payments[boardId][player];
            if (payment.paid) {
                require(token.transfer(player, payment.amount), "Refund failed");
                payment.paid = false;
            }
        }
        
        board.completed = true;
    }
    
    /**
     * @dev Get board information
     * @param boardId Board identifier
     */
    function getBoard(bytes32 boardId) external view returns (
        address creator,
        address token,
        uint256 entryFee,
        uint256 totalCollected,
        uint256 totalPrizePool,
        uint256 startTime,
        bool completed,
        uint8 houseFeeBps
    ) {
        Board storage board = boards[boardId];
        return (
            board.creator,
            board.token,
            board.entryFee,
            board.totalCollected,
            board.totalPrizePool,
            board.startTime,
            board.completed,
            board.houseFeeBps
        );
    }
    
    /**
     * @dev Check if player has paid for a board
     * @param boardId Board identifier
     * @param player Player address
     */
    function hasPaid(bytes32 boardId, address player) external view returns (bool) {
        return payments[boardId][player].paid;
    }
    
    /**
     * @dev Get all players for a board
     * @param boardId Board identifier
     */
    function getPlayers(bytes32 boardId) external view returns (address[] memory) {
        return players[boardId];
    }
    
    /**
     * @dev Set default house fee (owner only)
     * @param newFeeBps New house fee in basis points
     */
    function setDefaultHouseFee(uint8 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high (max 10%)");
        defaultHouseFeeBps = newFeeBps;
    }
    
    /**
     * @dev Withdraw ERC20 tokens sent by mistake
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdrawERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }
}

// ===========================================
// IERC20 Interface
// ===========================================

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}
