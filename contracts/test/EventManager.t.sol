// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console2} from "forge-std/Test.sol";
import {EventManager} from "../src/EventManager.sol";
contract MockERC20 {
    mapping(address => uint256) public balances;

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balances[from] >= amount, "MockERC20: transfer amount exceeds balance");
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        // Mock approval, not strictly needed for transferFrom in this mock
        return true;
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    function mint(address to, uint256 amount) public {
        balances[to] += amount;
    }
}

contract MockERC721 {
    uint256 private _tokenIdCounter;
    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) public tokenURIs;

    constructor() {
        _tokenIdCounter = 0;
    }

    function safeMint(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        ownerOf[tokenId] = to;
        tokenURIs[tokenId] = uri;
        return tokenId;
    }

    function burn(uint256 tokenId) public {
        delete ownerOf[tokenId]; // Remove ownership
        delete tokenURIs[tokenId]; // Remove URI
    }
}

contract EventManagerTest is Test {
    EventManager eventManager;
    MockERC20 mockPaymentToken;
    MockERC721 mockTicketNFT;

    address deployer;
    address organizer1;
    address purchaser1;
    address platformAddress; // Should match the constant in EventManager

    function setUp() public {
        deployer = makeAddr("deployer");
        organizer1 = makeAddr("organizer1");
        purchaser1 = makeAddr("purchaser1");
        platformAddress = 0xdeAFa17D50dBa6224177FFA396395A7E096f250E; // Match EventManager constant

        vm.startPrank(deployer);
        mockPaymentToken = new MockERC20();
        mockTicketNFT = new MockERC721();
        eventManager = new EventManager(address(mockPaymentToken), address(mockTicketNFT));
        vm.stopPrank();

        // Fund organizer1 and purchaser1 with mock tokens
        mockPaymentToken.mint(organizer1, 1000 ether);
        mockPaymentToken.mint(purchaser1, 1000 ether);
    }

    // Test createEvent function
    function testCreateEvent() public {
        vm.startPrank(organizer1);
        // Approve EventManager to spend LISTING_FEE
        mockPaymentToken.approve(address(eventManager), eventManager.LISTING_FEE());

        uint256 _startDate = block.timestamp + 2 hours; // Renamed to avoid conflict
        uint256 _endDate = _startDate + 1 hours; // Renamed to avoid conflict

        uint256 eventId = eventManager.createEvent(
            "Test Event",
            "Description for test event",
            "Test Location",
            _startDate,
            _endDate,
            "ipfs://test-metadata"
        );

        assertEq(eventId, 0); // First event should have ID 0
        (
            uint256 id,
            address organizer,
            string memory title,
            string memory description,
            string memory location,
            uint256 startDateFromContract, // New variable name
            uint256 endDateFromContract,   // New variable name
            string memory metadataURI,
            EventManager.EventStatus status,
            uint256 tierCount
        ) = eventManager.events(eventId); // This is the getter for the public mapping

        assertEq(organizer, organizer1);
        assertEq(title, "Test Event");
        assertEq(uint8(status), uint8(EventManager.EventStatus.UPCOMING)); // Cast enum to uint8 for comparison
        assertEq(startDateFromContract, _startDate); // Assert against the original _startDate
        assertEq(endDateFromContract, _endDate);     // Assert against the original _endDate

        // Check if LISTING_FEE was transferred to PLATFORM_ADDRESS
        assertEq(mockPaymentToken.balanceOf(platformAddress), eventManager.LISTING_FEE());
        vm.stopPrank();
    }

    // Test addTicketTier function
    function testAddTicketTier() public {
        vm.startPrank(organizer1);
        mockPaymentToken.approve(address(eventManager), eventManager.LISTING_FEE());
        uint256 startDate = block.timestamp + 2 hours;
        uint256 endDate = startDate + 1 hours;
        uint256 eventId = eventManager.createEvent("Test Event", "Desc", "Loc", startDate, endDate, "uri");
        vm.stopPrank();

        vm.startPrank(organizer1);
        eventManager.addTicketTier(eventId, "VIP", 1 ether, 10);
        (string memory tierName, uint256 pricePerPerson, uint256 maxSupply, uint256 currentSupply, bool active) = eventManager.getTicketTier(eventId, 0);
        assertEq(tierName, "VIP");
        assertEq(pricePerPerson, 1 ether);
        assertEq(maxSupply, 10);
        assertEq(active, true);
        (,,,,,,,,,uint256 tierCountFromContract) = eventManager.events(eventId); // Destructure to get tierCount
        assertEq(tierCountFromContract, 1);
        vm.stopPrank();
    }

    // Test buyTicket function
    function testBuyTicket() public {
        vm.startPrank(organizer1);
        mockPaymentToken.approve(address(eventManager), eventManager.LISTING_FEE());
        uint256 startDate = block.timestamp + 2 hours;
        uint256 endDate = startDate + 1 hours;
        uint256 eventId = eventManager.createEvent("Test Event", "Desc", "Loc", startDate, endDate, "uri");
        eventManager.addTicketTier(eventId, "VIP", 1 ether, 10);
        vm.stopPrank();

        vm.startPrank(purchaser1);
        // Approve EventManager to spend ticket price
        mockPaymentToken.approve(address(eventManager), 1 ether);
        uint256 ticketId = eventManager.buyTicket(eventId, 0, 1, "ipfs://ticket-metadata");
        
        (uint256 id, uint256 eventIdFromTicket, uint256 tierIdFromTicket, address purchaserFromTicket, uint256 attendeeCountFromTicket, uint256 totalAmountPaidFromTicket, uint256 purchaseTimestampFromTicket, bool usedFromTicket, bool refundedFromTicket, EventManager.EventStatus eventStatusAtPurchaseFromTicket) = eventManager.tickets(ticketId);

        assertEq(purchaserFromTicket, purchaser1);
        assertEq(eventIdFromTicket, eventId);
        assertEq(tierIdFromTicket, 0);
        assertEq(attendeeCountFromTicket, 1);
        assertEq(totalAmountPaidFromTicket, 1 ether);
        assertEq(mockTicketNFT.ownerOf(ticketId), purchaser1);

        // Get currentSupply using getTicketTier
        (,,,uint256 currentSupply,) = eventManager.getTicketTier(eventId, 0);
        assertEq(currentSupply, 1);
        vm.stopPrank();
    }

    // Test verifyAndUseTicket function
    function testVerifyAndUseTicket() public {
        vm.startPrank(organizer1);
        mockPaymentToken.approve(address(eventManager), eventManager.LISTING_FEE());
        uint256 startDate = block.timestamp + 2 hours;
        uint256 endDate = startDate + 1 hours;
        uint256 eventId = eventManager.createEvent("Test Event", "Desc", "Loc", startDate, endDate, "uri");
        eventManager.addTicketTier(eventId, "VIP", 1 ether, 10);
        vm.stopPrank();

        vm.startPrank(purchaser1);
        mockPaymentToken.approve(address(eventManager), 1 ether);
        uint256 ticketId = eventManager.buyTicket(eventId, 0, 1, "ipfs://ticket-metadata");
        vm.stopPrank();

        // Advance time to make event LIVE
        vm.warp(startDate + 1 seconds);

        vm.startPrank(organizer1);
        assertTrue(eventManager.verifyAndUseTicket(ticketId));
        (,,,,,,,bool usedFromTicket,,) = eventManager.tickets(ticketId); // Destructure to get used status
        assertTrue(usedFromTicket);
        vm.stopPrank();
    }

    // Test cancelEvent function
    function testCancelEvent() public {
        vm.startPrank(organizer1);
        mockPaymentToken.approve(address(eventManager), eventManager.LISTING_FEE());
        uint256 startDate = block.timestamp + 2 hours;
        uint256 endDate = startDate + 1 hours;
        uint256 eventId = eventManager.createEvent("Test Event", "Desc", "Loc", startDate, endDate, "uri");
        eventManager.addTicketTier(eventId, "VIP", 1 ether, 10);
        vm.stopPrank();

        vm.startPrank(purchaser1);
        mockPaymentToken.approve(address(eventManager), 1 ether);
        uint256 ticketId = eventManager.buyTicket(eventId, 0, 1, "ipfs://ticket-metadata");
        vm.stopPrank();

        console2.log("Before cancelEvent - Purchaser1 balance:", mockPaymentToken.balanceOf(purchaser1));
        (,,,,,,,bool refundedBeforeCancel,,) = eventManager.tickets(ticketId);
        console2.log("Before cancelEvent - Ticket refunded status:", refundedBeforeCancel);

        vm.startPrank(organizer1);
        eventManager.cancelEvent(eventId);
        vm.stopPrank(); // Stop prank here to check balances from outside

        console2.log("After cancelEvent - Purchaser1 balance:", mockPaymentToken.balanceOf(purchaser1));
        (,,,,,,,bool refundedAfterCancel,,) = eventManager.tickets(ticketId);
        console2.log("After cancelEvent - Ticket refunded status:", refundedAfterCancel);

        (,,,,,,,,EventManager.EventStatus statusFromContract,) = eventManager.events(eventId);
        assertEq(uint8(statusFromContract), uint8(EventManager.EventStatus.CANCELLED));
        assertEq(mockPaymentToken.balanceOf(purchaser1), 1000 ether); // Refunded
        vm.stopPrank();
    }

    // Test refundTicket function
    function testRefundTicket() public {
        vm.startPrank(organizer1);
        mockPaymentToken.approve(address(eventManager), eventManager.LISTING_FEE());
        uint256 startDate = block.timestamp + 2 hours;
        uint256 endDate = startDate + 1 hours;
        uint256 eventId = eventManager.createEvent("Test Event", "Desc", "Loc", startDate, endDate, "uri");
        eventManager.addTicketTier(eventId, "VIP", 1 ether, 10);
        vm.stopPrank();

        vm.startPrank(purchaser1);
        mockPaymentToken.approve(address(eventManager), 1 ether);
        uint256 ticketId = eventManager.buyTicket(eventId, 0, 1, "ipfs://ticket-metadata");
        vm.stopPrank();

        console2.log("Before refundTicket - Purchaser1 balance:", mockPaymentToken.balanceOf(purchaser1));
        (,,,,,,,bool refundedBeforeRefund,,) = eventManager.tickets(ticketId);
        console2.log("Before refundTicket - Ticket refunded status:", refundedBeforeRefund);

        vm.startPrank(purchaser1);
        eventManager.refundTicket(ticketId);
        vm.stopPrank(); // Stop prank here

        console2.log("After refundTicket - Purchaser1 balance:", mockPaymentToken.balanceOf(purchaser1));
        (,,,,,,,bool refundedAfterRefund,,) = eventManager.tickets(ticketId);
        console2.log("After refundTicket - Ticket refunded status:", refundedAfterRefund);

        assertEq(mockPaymentToken.balanceOf(purchaser1), 1000 ether); // Refunded
        vm.stopPrank();
    }
}