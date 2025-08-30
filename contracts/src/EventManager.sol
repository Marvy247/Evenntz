// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ERC20.sol";
import "./EventNFT.sol";

/**
 * @title EventManager
 * @dev Decentralized event ticketing platform for EvenntZ using custom ERC20 and ERC721 contracts
 */
contract EventManager is Ownable, ReentrancyGuard, Pausable {
    // Platform fee recipient
    address public constant PLATFORM_ADDRESS = 0xdeAFa17D50dBa6224177FFA396395A7E096f250E;
    
    // Custom token and NFT contracts
    EvenntZToken public immutable paymentToken;
    EvenntZNFT public immutable ticketNFT;
    
    // Platform listing fee (1 token unit)
    uint256 public constant LISTING_FEE = 1 ether;
    
    // Custom counters
    uint256 private _eventIdCounter;
    uint256 private _ticketIdCounter;

    enum EventStatus { UPCOMING, LIVE, ENDED, CANCELLED }

    struct TicketTier {
        string name;
        uint256 pricePerPerson;
        uint256 maxSupply;
        uint256 currentSupply;
        bool active;
    }

    struct Event {
        uint256 id;
        address organizer;
        string title;
        string description;
        string location;
        uint256 startDate;
        uint256 endDate;
        string metadataURI;
        EventStatus status;
        mapping(uint256 => TicketTier) tiers;
        uint256 tierCount;
    }

    struct Ticket {
        uint256 id;
        uint256 eventId;
        uint256 tierId;
        address purchaser;
        uint256 attendeeCount;
        uint256 totalAmountPaid;
        uint256 purchaseTimestamp;
        bool used;
        bool refunded;
        EventStatus eventStatusAtPurchase;
    }

    // Struct to return ticket information
    struct TicketInfo {
        uint256 id;
        uint256 eventId;
        uint256 tierId;
        address purchaser;
        uint256 attendeeCount;
        uint256 totalAmountPaid;
        uint256 purchaseTimestamp;
        bool used;
        bool refunded;
        EventStatus eventStatusAtPurchase;
        EventStatus currentEventStatus;
        bool valid;
        string reason;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256[]) public eventTickets; // eventId => ticketIds[]
    mapping(address => uint256[]) public userTickets; // user => ticketIds[]

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string title,
        uint256 startDate,
        uint256 endDate
    );

    event EventCancelled(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 timestamp
    );

    event TicketPurchased(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        uint256 indexed tierId,
        address purchaser,
        uint256 attendeeCount,
        uint256 totalAmount,
        uint256 timestamp
    );

    event TicketUsed(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed organizer
    );

    event TicketRefunded(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed purchaser,
        uint256 amount
    );

    event TierUpdated(
        uint256 indexed eventId,
        uint256 indexed tierId,
        string name,
        uint256 pricePerPerson,
        uint256 maxSupply,
        bool active
    );

    constructor(address _paymentToken, address _ticketNFT) Ownable(msg.sender) {
        paymentToken = EvenntZToken(_paymentToken);
        ticketNFT = EvenntZNFT(_ticketNFT);
        _eventIdCounter = 0;
        _ticketIdCounter = 0;
    }

    /**
     * @dev Create a new event (organizer pays listing fee)
     */
    function createEvent(
        string memory title,
        string memory description,
        string memory location,
        uint256 startDate,
        uint256 endDate,
        string memory metadataURI
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(startDate > block.timestamp + 1 hours, "Start date must be at least 1 hour in future");
        require(endDate > startDate, "End date must be after start date");
        require(bytes(title).length > 0 && bytes(title).length <= 100, "Title length invalid");
        require(bytes(description).length <= 1000, "Description too long");
        require(bytes(location).length > 0 && bytes(location).length <= 200, "Location length invalid");

        // Collect listing fee
        require(paymentToken.transferFrom(msg.sender, PLATFORM_ADDRESS, LISTING_FEE), "Fee transfer failed");

        uint256 newEventId = _eventIdCounter++;
        
        Event storage newEvent = events[newEventId];
        newEvent.id = newEventId;
        newEvent.organizer = msg.sender;
        newEvent.title = title;
        newEvent.description = description;
        newEvent.location = location;
        newEvent.startDate = startDate;
        newEvent.endDate = endDate;
        newEvent.metadataURI = metadataURI;
        newEvent.status = EventStatus.UPCOMING;
        newEvent.tierCount = 0;

        emit EventCreated(newEventId, msg.sender, title, startDate, endDate);
        return newEventId;
    }

    /**
     * @dev Add ticket tier to an event
     */
    function addTicketTier(
        uint256 eventId,
        string memory tierName,
        uint256 pricePerPerson,
        uint256 maxSupply
    ) external whenNotPaused {
        Event storage eventInfo = events[eventId];
        require(eventInfo.organizer == msg.sender, "Only organizer");
        require(eventInfo.status == EventStatus.UPCOMING, "Event not upcoming");
        require(bytes(tierName).length > 0 && bytes(tierName).length <= 50, "Invalid tier name length");
        require(maxSupply > 0 && maxSupply <= 10000, "Invalid max supply");
        require(pricePerPerson > 0, "Price must be greater than 0");

        uint256 tierId = eventInfo.tierCount++;
        eventInfo.tiers[tierId] = TicketTier({
            name: tierName,
            pricePerPerson: pricePerPerson,
            maxSupply: maxSupply,
            currentSupply: 0,
            active: true
        });

        emit TierUpdated(eventId, tierId, tierName, pricePerPerson, maxSupply, true);
    }

    /**
     * @dev Update existing ticket tier
     */
    function updateTicketTier(
        uint256 eventId,
        uint256 tierId,
        string memory tierName,
        uint256 pricePerPerson,
        uint256 maxSupply,
        bool active
    ) external whenNotPaused {
        Event storage eventInfo = events[eventId];
        require(eventInfo.organizer == msg.sender, "Only organizer");
        require(eventInfo.status == EventStatus.UPCOMING, "Event not upcoming");
        require(tierId < eventInfo.tierCount, "Invalid tier ID");
        require(bytes(tierName).length > 0 && bytes(tierName).length <= 50, "Invalid tier name length");
        require(maxSupply >= eventInfo.tiers[tierId].currentSupply, "Cannot reduce below current supply");
        require(maxSupply <= 10000, "Max supply too high");
        require(pricePerPerson > 0, "Price must be greater than 0");

        TicketTier storage tier = eventInfo.tiers[tierId];
        tier.name = tierName;
        tier.pricePerPerson = pricePerPerson;
        tier.maxSupply = maxSupply;
        tier.active = active;

        emit TierUpdated(eventId, tierId, tierName, pricePerPerson, maxSupply, active);
    }

    /**
     * @dev Purchase a multi-person ticket for an event
     */
    function buyTicket(
        uint256 eventId,
        uint256 tierId,
        uint256 attendeeCount,
        string memory ticketMetadataURI
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(attendeeCount > 0 && attendeeCount <= 10, "Invalid attendee count");
        
        Event storage eventInfo = events[eventId];
        require(eventInfo.status == EventStatus.UPCOMING, "Event not upcoming");
        require(tierId < eventInfo.tierCount, "Invalid tier ID");

        TicketTier storage tier = eventInfo.tiers[tierId];
        require(tier.active, "Tier not active");
        require(tier.currentSupply + attendeeCount <= tier.maxSupply, "Not enough tickets");

        // Calculate total payment
        uint256 totalAmount = tier.pricePerPerson * attendeeCount;

        // Collect payment
        require(paymentToken.transferFrom(msg.sender, eventInfo.organizer, totalAmount), "Payment transfer failed");

        // Mint ticket NFT
        uint256 newTicketId = ticketNFT.safeMint(msg.sender, ticketMetadataURI);
        
        // Store ticket data
        tickets[newTicketId] = Ticket({
            id: newTicketId,
            eventId: eventId,
            tierId: tierId,
            purchaser: msg.sender,
            attendeeCount: attendeeCount,
            totalAmountPaid: totalAmount,
            purchaseTimestamp: block.timestamp,
            used: false,
            refunded: false,
            eventStatusAtPurchase: EventStatus.UPCOMING
        });

        eventTickets[eventId].push(newTicketId);
        userTickets[msg.sender].push(newTicketId);
        tier.currentSupply += attendeeCount;

        emit TicketPurchased(
            newTicketId, 
            eventId, 
            tierId, 
            msg.sender, 
            attendeeCount, 
            totalAmount,
            block.timestamp
        );
        
        return newTicketId;
    }

    /**
     * @dev Verify and use a ticket (for entry)
     */
    function verifyAndUseTicket(uint256 ticketId) external nonReentrant whenNotPaused returns (bool) {
        require(ticketNFT.ownerOf(ticketId) != address(0), "Ticket does not exist");
        
        Ticket storage ticket = tickets[ticketId];
        Event storage eventInfo = events[ticket.eventId];
        
        require(msg.sender == eventInfo.organizer, "Only organizer");
        require(!ticket.used, "Ticket already used");
        require(!ticket.refunded, "Ticket refunded");
        require(_getEventStatus(eventInfo.startDate, eventInfo.endDate, eventInfo.status) == EventStatus.LIVE, "Event not live");

        ticket.used = true;
        emit TicketUsed(ticketId, ticket.eventId, msg.sender);
        return true;
    }

    /**
     * @dev Cancel an event and process refunds
     */
    function cancelEvent(uint256 eventId) external nonReentrant whenNotPaused {
        Event storage eventInfo = events[eventId];
        require(eventInfo.organizer == msg.sender, "Only organizer");
        require(eventInfo.status == EventStatus.UPCOMING, "Event not upcoming");

        eventInfo.status = EventStatus.CANCELLED;
        
        // Process refunds for all tickets
        uint256[] memory ticketIds = eventTickets[eventId];
        for (uint256 i = 0; i < ticketIds.length; i++) {
            Ticket storage ticket = tickets[ticketIds[i]];
            if (!ticket.refunded && !ticket.used) {
                _processRefund(ticketIds[i]);
            }
        }

        emit EventCancelled(eventId, msg.sender, block.timestamp);
    }

    /**
     * @dev Refund a specific ticket
     */
    function refundTicket(uint256 ticketId) external nonReentrant whenNotPaused {
        require(ticketNFT.ownerOf(ticketId) != address(0), "Ticket does not exist");
        
        Ticket storage ticket = tickets[ticketId];
        Event storage eventInfo = events[ticket.eventId];
        
        require(msg.sender == ticket.purchaser || msg.sender == eventInfo.organizer, "Not authorized");
        require(!ticket.used, "Ticket already used");
        require(!ticket.refunded, "Already refunded");
        require(eventInfo.status == EventStatus.UPCOMING || eventInfo.status == EventStatus.CANCELLED, "Invalid event status");

        _processRefund(ticketId);
    }

    /**
     * @dev Emergency pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev View function to get complete ticket information
     */
    function getTicketInfo(uint256 ticketId) external view returns (TicketInfo memory) {
        require(ticketNFT.ownerOf(ticketId) != address(0), "Ticket does not exist");
        
        Ticket storage ticket = tickets[ticketId];
        Event storage eventInfo = events[ticket.eventId];
        
        EventStatus currentStatus = _getEventStatus(eventInfo.startDate, eventInfo.endDate, eventInfo.status);
        (bool isValid, string memory validationReason) = _validateTicket(ticketId);
        
        return TicketInfo({
            id: ticket.id,
            eventId: ticket.eventId,
            tierId: ticket.tierId,
            purchaser: ticket.purchaser,
            attendeeCount: ticket.attendeeCount,
            totalAmountPaid: ticket.totalAmountPaid,
            purchaseTimestamp: ticket.purchaseTimestamp,
            used: ticket.used,
            refunded: ticket.refunded,
            eventStatusAtPurchase: ticket.eventStatusAtPurchase,
            currentEventStatus: currentStatus,
            valid: isValid,
            reason: validationReason
        });
    }

    /**
     * @dev Get user's tickets
     */
    function getUserTickets(address user) external view returns (uint256[] memory) {
        return userTickets[user];
    }

    /**
     * @dev View function to check ticket validity without modifying state
     */
    function verifyTicket(uint256 ticketId) external view returns (bool valid, string memory reason) {
        return _validateTicket(ticketId);
    }

    /**
     * @dev Get event details
     */
    function getEvent(uint256 eventId) external view returns (
        uint256 id,
        address organizer,
        string memory title,
        string memory description,
        string memory location,
        uint256 startDate,
        uint256 endDate,
        string memory metadataURI,
        EventStatus status,
        uint256 tierCount
    ) {
        Event storage eventInfo = events[eventId];
        return (
            eventInfo.id,
            eventInfo.organizer,
            eventInfo.title,
            eventInfo.description,
            eventInfo.location,
            eventInfo.startDate,
            eventInfo.endDate,
            eventInfo.metadataURI,
            eventInfo.status,
            eventInfo.tierCount
        );
    }

    /**
     * @dev Get ticket tier details
     */
    function getTicketTier(uint256 eventId, uint256 tierId) external view returns (
        string memory name,
        uint256 pricePerPerson,
        uint256 maxSupply,
        uint256 currentSupply,
        bool active
    ) {
        require(tierId < events[eventId].tierCount, "Invalid tier ID");
        TicketTier storage tier = events[eventId].tiers[tierId];
        return (tier.name, tier.pricePerPerson, tier.maxSupply, tier.currentSupply, tier.active);
    }

    // Internal functions
    function _validateTicket(uint256 ticketId) internal view returns (bool valid, string memory reason) {
        if (ticketNFT.ownerOf(ticketId) == address(0)) {
            return (false, "Ticket does not exist");
        }

        Ticket storage ticket = tickets[ticketId];
        Event storage eventInfo = events[ticket.eventId];

        if (ticket.used) {
            return (false, "Ticket already used");
        }

        if (ticket.refunded) {
            return (false, "Ticket refunded");
        }

        if (eventInfo.status == EventStatus.CANCELLED) {
            return (false, "Event cancelled");
        }

        if (block.timestamp < eventInfo.startDate) {
            return (false, "Event not started");
        }

        if (block.timestamp > eventInfo.endDate) {
            return (false, "Event ended");
        }

        return (true, "Valid ticket");
    }

    function _getEventStatus(uint256 startDate, uint256 endDate, EventStatus storedStatus) 
        internal view returns (EventStatus) {
        if (storedStatus == EventStatus.CANCELLED) return EventStatus.CANCELLED;
        if (block.timestamp < startDate) return EventStatus.UPCOMING;
        if (block.timestamp <= endDate) return EventStatus.LIVE;
        return EventStatus.ENDED;
    }

    function _processRefund(uint256 ticketId) private {
        Ticket storage ticket = tickets[ticketId];
        require(!ticket.refunded, "Already refunded");
        
        ticket.refunded = true;
        Event storage eventInfo = events[ticket.eventId];
        TicketTier storage tier = eventInfo.tiers[ticket.tierId];
        tier.currentSupply -= ticket.attendeeCount;

        require(paymentToken.transferFrom(eventInfo.organizer, ticket.purchaser, ticket.totalAmountPaid), 
            "Refund transfer failed");

        ticketNFT.burn(ticketId);
        emit TicketRefunded(ticketId, ticket.eventId, ticket.purchaser, ticket.totalAmountPaid);
    }
}