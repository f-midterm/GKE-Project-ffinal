package apartment.example.backend.service;

import apartment.example.backend.entity.*;
import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.entity.enums.RentalRequestStatus;
import apartment.example.backend.entity.enums.TenantStatus;
import apartment.example.backend.entity.enums.UnitStatus;
import apartment.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RentalRequestService {

    @Autowired
    private RentalRequestRepository rentalRequestRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private UnitRepository unitRepository;
    
    @Autowired
    private LeaseRepository leaseRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<RentalRequest> getAllRentalRequests() {
        return rentalRequestRepository.findAllWithUnit();
    }

    public List<RentalRequest> getPendingRequests() {
        try {
            return rentalRequestRepository.findByStatusWithUnit(RentalRequestStatus.PENDING);
        } catch (Exception e) {
            // Log the error and return empty list for now
            System.out.println("Error getting pending requests: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<RentalRequest> getRequestsByUnitId(Long unitId) {
        return rentalRequestRepository.findByUnitId(unitId);
    }

    public List<RentalRequest> getPendingRequestsByUnitId(Long unitId) {
        return rentalRequestRepository.findPendingRequestsByUnitId(unitId);
    }

    public List<RentalRequest> getRequestsByEmail(String email) {
        return rentalRequestRepository.findByEmail(email);
    }

    public Optional<RentalRequest> getRequestById(Long id) {
        return rentalRequestRepository.findByIdWithUnit(id);
    }

    public RentalRequest createRentalRequest(RentalRequest rentalRequest) {
        // Check user role restrictions
        Optional<User> optionalUser = userRepository.findByEmail(rentalRequest.getEmail());
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            
            // VILLAGER users cannot make new bookings (one booking per person rule)
            if (user.getRole() == User.Role.VILLAGER) {
                throw new IllegalArgumentException("You are already an approved tenant and cannot submit new rental requests. You can access your dashboard to view your lease information.");
            }
            
            // Implement strict 1-to-1 rule: USER can only have ONE request at a time
            if (user.getRole() == User.Role.USER) {
                List<RentalRequest> existingRequests = rentalRequestRepository.findByEmail(rentalRequest.getEmail());
                
                // Check for any PENDING or APPROVED requests (exclude COMPLETED and REJECTED)
                boolean hasActiveRequest = existingRequests.stream()
                    .anyMatch(req -> req.getStatus() == RentalRequestStatus.PENDING || 
                                   req.getStatus() == RentalRequestStatus.APPROVED);
                
                if (hasActiveRequest) {
                    throw new IllegalArgumentException("You already have an active rental request. Each person can only submit one request at a time. Please wait for admin decision or check your status.");
                }
                
                // Only allow new request if all previous requests were REJECTED or COMPLETED
                boolean hasOnlyCompletedOrRejected = existingRequests.stream()
                    .allMatch(req -> req.getStatus() == RentalRequestStatus.REJECTED || 
                                   req.getStatus() == RentalRequestStatus.COMPLETED);
                
                if (!existingRequests.isEmpty() && !hasOnlyCompletedOrRejected) {
                    throw new IllegalArgumentException("You can only submit a new rental request if your previous request was rejected or completed.");
                }
            }
        }
        
        // Check that the unit is available
        Optional<Unit> unitOptional = unitRepository.findById(rentalRequest.getUnitId());
        Unit unit;
        if (unitOptional.isPresent()) {
            unit = unitOptional.get();
            if (unit.getStatus() != UnitStatus.AVAILABLE) {
                throw new IllegalArgumentException("Selected unit is not available for rent. Please choose an available unit.");
            }
        } else {
            throw new IllegalArgumentException("Selected unit does not exist.");
        }
        
        // Set the Unit entity reference (required for @ManyToOne relationship)
        rentalRequest.setUnit(unit);
        
        // Set default values
        rentalRequest.setStatus(RentalRequestStatus.PENDING);
        if (rentalRequest.getRequestDate() == null) {
            rentalRequest.setRequestDate(LocalDateTime.now());
        }
        
        return rentalRequestRepository.save(rentalRequest);
    }

    public RentalRequest approveRequest(Long id, Long approvedByUserId) {
        Optional<RentalRequest> optionalRequest = rentalRequestRepository.findById(id);
        if (optionalRequest.isPresent()) {
            RentalRequest request = optionalRequest.get();
            request.setStatus(RentalRequestStatus.APPROVED);
            request.setApprovedByUserId(approvedByUserId);
            request.setApprovedDate(LocalDateTime.now());
            request.setRejectionReason(null); // Clear rejection reason if previously rejected
            return rentalRequestRepository.save(request);
        }
        throw new RuntimeException("Rental request not found with id: " + id);
    }

    public RentalRequest approveRequest(Long id, Long approvedByUserId, LocalDate startDate, LocalDate endDate) {
        // Validate start date is not in the past
        if (startDate.isBefore(LocalDate.now())) {
            throw new IllegalStateException("Cannot approve rental request with start date in the past. Start date: " + startDate + ", Current date: " + LocalDate.now());
        }
        
        Optional<RentalRequest> optionalRequest = rentalRequestRepository.findById(id);
        if (optionalRequest.isPresent()) {
            RentalRequest request = optionalRequest.get();
            
            // Validate end date matches the lease duration
            LocalDate expectedEndDate = startDate.plusMonths(request.getLeaseDurationMonths());
            if (!endDate.isEqual(expectedEndDate)) {
                throw new IllegalStateException(
                    String.format("End date does not match lease duration. Duration: %d months, Start date: %s, Expected end date: %s, Provided end date: %s", 
                        request.getLeaseDurationMonths(), startDate, expectedEndDate, endDate)
                );
            }
            
            // Approve the rental request
            request.setStatus(RentalRequestStatus.APPROVED);
            request.setApprovedByUserId(approvedByUserId);
            request.setApprovedDate(LocalDateTime.now());
            request.setRejectionReason(null);
            
            // Create/Update Tenant
            Tenant tenant = createOrUpdateTenant(request);
            
            // Get Unit and update status
            Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit not found"));
            unit.setStatus(UnitStatus.OCCUPIED);
            unitRepository.save(unit);
            
            // Create Lease
            createLease(tenant, unit, request, startDate, endDate);
            
            // Update user role to VILLAGER
            updateUserRoleToVillager(request.getEmail());
            
            return rentalRequestRepository.save(request);
        }
        throw new RuntimeException("Rental request not found with id: " + id);
    }
    
    private Tenant createOrUpdateTenant(RentalRequest request) {
        // Check if tenant already exists by email
        Optional<Tenant> existingTenant = tenantRepository.findByEmail(request.getEmail());
        
        Tenant tenant;
        if (existingTenant.isPresent()) {
            // Update existing tenant
            tenant = existingTenant.get();
        } else {
            // Create new tenant
            tenant = new Tenant();
        }
        
        // Update tenant information
        tenant.setFirstName(request.getFirstName());
        tenant.setLastName(request.getLastName());
        tenant.setEmail(request.getEmail());
        tenant.setPhone(request.getPhone());
        tenant.setOccupation(request.getOccupation());
        tenant.setEmergencyContact(request.getEmergencyContact());
        tenant.setEmergencyPhone(request.getEmergencyPhone());
        tenant.setStatus(TenantStatus.ACTIVE);  // Set status to ACTIVE when approved
        // Note: Unit, move-in date, and rent are now managed through Lease entity
        return tenantRepository.save(tenant);
    }
    
    private void createLease(Tenant tenant, Unit unit, RentalRequest request, LocalDate startDate, LocalDate endDate) {
        Lease lease = new Lease();
        lease.setTenant(tenant);
        lease.setUnit(unit);
        lease.setStartDate(startDate);
        lease.setEndDate(endDate);
        lease.setRentAmount(unit.getRentAmount());  // Get rent from unit, not request
        lease.setStatus(LeaseStatus.ACTIVE);
        leaseRepository.save(lease);
    }
    
    private void updateUserRoleToVillager(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            // Update existing user role to VILLAGER
            User user = optionalUser.get();
            user.setRole(User.Role.VILLAGER);
            userRepository.save(user);
        } else {
            // Create new user account with VILLAGER role for approved rental applicant
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email); // Use email as username
            newUser.setPassword(passwordEncoder.encode("defaultPassword123")); // Set a default password
            newUser.setRole(User.Role.VILLAGER);
            userRepository.save(newUser);
        }
    }

    public RentalRequest rejectRequest(Long id, String rejectionReason, Long rejectedByUserId) {
        Optional<RentalRequest> optionalRequest = rentalRequestRepository.findById(id);
        if (optionalRequest.isPresent()) {
            RentalRequest request = optionalRequest.get();
            request.setStatus(RentalRequestStatus.REJECTED);
            request.setRejectionReason(rejectionReason);
            request.setApprovedByUserId(rejectedByUserId); // Track who rejected it
            request.setApprovedDate(LocalDateTime.now()); // Use this field for rejection date too
            return rentalRequestRepository.save(request);
        }
        throw new RuntimeException("Rental request not found with id: " + id);
    }

    public RentalRequest updateRentalRequest(Long id, RentalRequest updatedRequest) {
        Optional<RentalRequest> optionalRequest = rentalRequestRepository.findById(id);
        if (optionalRequest.isPresent()) {
            RentalRequest existingRequest = optionalRequest.get();
            
            // Update fields (excluding ID and system fields)
            existingRequest.setFirstName(updatedRequest.getFirstName());
            existingRequest.setLastName(updatedRequest.getLastName());
            existingRequest.setEmail(updatedRequest.getEmail());
            existingRequest.setPhone(updatedRequest.getPhone());
            existingRequest.setOccupation(updatedRequest.getOccupation());
            existingRequest.setEmergencyContact(updatedRequest.getEmergencyContact());
            existingRequest.setEmergencyPhone(updatedRequest.getEmergencyPhone());
            existingRequest.setLeaseDurationMonths(updatedRequest.getLeaseDurationMonths());
            // Note: monthlyRent and totalAmount are now calculated from unit, not stored
            existingRequest.setNotes(updatedRequest.getNotes());
            
            return rentalRequestRepository.save(existingRequest);
        }
        throw new RuntimeException("Rental request not found with id: " + id);
    }

    public void deleteRentalRequest(Long id) {
        if (rentalRequestRepository.existsById(id)) {
            rentalRequestRepository.deleteById(id);
        } else {
            throw new RuntimeException("Rental request not found with id: " + id);
        }
    }

    // ============================================
    // NEW METHODS FOR USER-BASED BOOKING FLOW
    // ============================================

    /**
     * Get the latest rental request for a specific user with status flags
     * Used by frontend to determine booking flow (pending, approved, rejected, etc.)
     * 
     * @param userId The authenticated user's ID
     * @return MyLatestRequestDto with status flags or null if no requests found
     */
    public apartment.example.backend.dto.MyLatestRequestDto getMyLatestRequest(Long userId) {
        if (userId == null) {
            return null; // No authenticated user
        }

        // Get user's latest rental request
        Optional<RentalRequest> latestRequest = rentalRequestRepository.findLatestByUserId(userId);
        
        if (latestRequest.isEmpty()) {
            // No rental requests found - user can create new request
            return apartment.example.backend.dto.MyLatestRequestDto.builder()
                .canCreateNewRequest(true)
                .isPending(false)
                .isApproved(false)
                .isRejected(false)
                .requiresAcknowledgement(false)
                .hasActiveLease(false)
                .statusMessage("You can submit a new booking request")
                .build();
        }

        RentalRequest request = latestRequest.get();
        
        // Check if user has active lease (becomes VILLAGER after approval)
        boolean hasActiveLease = hasActiveLeaseForUser(userId);
        
        // Determine status flags
        boolean isPending = request.getStatus() == RentalRequestStatus.PENDING;
        boolean isApproved = request.getStatus() == RentalRequestStatus.APPROVED || hasActiveLease;
        boolean isRejected = request.getStatus() == RentalRequestStatus.REJECTED;
        boolean requiresAcknowledgement = isRejected && !request.isRejectionAcknowledged();
        
        // Determine if user can create new request
        boolean canCreateNewRequest = !isPending && !isApproved && !requiresAcknowledgement;
        
        // Build status message
        String statusMessage;
        if (isPending) {
            statusMessage = "Your booking request is pending approval";
        } else if (isApproved || hasActiveLease) {
            statusMessage = "You already have an approved booking";
        } else if (requiresAcknowledgement) {
            statusMessage = "Please acknowledge your previous rejection before submitting a new request";
        } else {
            statusMessage = "You can submit a new booking request";
        }
        
        // Get active lease information if user is approved
        Long leaseId = null;
        String roomNumber = null;
        String leaseEndDate = null;
        
        if (isApproved || hasActiveLease) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Optional<Tenant> tenant = tenantRepository.findByEmail(user.getEmail());
                if (tenant.isPresent()) {
                    List<Lease> activeLeases = leaseRepository.findByTenantIdAndStatus(
                        tenant.get().getId(), 
                        LeaseStatus.ACTIVE
                    );
                    if (!activeLeases.isEmpty()) {
                        Lease activeLease = activeLeases.get(0);
                        leaseId = activeLease.getId();
                        roomNumber = activeLease.getUnit() != null ? activeLease.getUnit().getRoomNumber() : null;
                        leaseEndDate = activeLease.getEndDate() != null ? activeLease.getEndDate().toString() : null;
                    }
                }
            }
        }
        
        return apartment.example.backend.dto.MyLatestRequestDto.builder()
            .id(request.getId())
            .userId(request.getUserId())
            .unitId(request.getUnitId())
            .unitRoomNumber(request.getUnit() != null ? request.getUnit().getRoomNumber() : null)
            .status(request.getStatus())
            .requestDate(request.getRequestDate())
            .rejectionReason(request.getRejectionReason())
            .rejectionAcknowledgedAt(request.getRejectionAcknowledgedAt())
            .leaseId(leaseId)
            .roomNumber(roomNumber)
            .leaseEndDate(leaseEndDate)
            .isPending(isPending)
            .isApproved(isApproved)
            .isRejected(isRejected)
            .requiresAcknowledgement(requiresAcknowledgement)
            .hasActiveLease(hasActiveLease)
            .canCreateNewRequest(canCreateNewRequest)
            .statusMessage(statusMessage)
            .build();
    }

    /**
     * Check if user has an active lease (is a VILLAGER)
     * 
     * @param userId The user's ID
     * @return true if user has active lease
     */
    private boolean hasActiveLeaseForUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        
        // If user is VILLAGER, they have an active lease
        if (user.getRole() == User.Role.VILLAGER) {
            return true;
        }
        
        // Double-check by looking for active leases linked to user's email
        Optional<Tenant> tenant = tenantRepository.findByEmail(user.getEmail());
        if (tenant.isPresent()) {
            List<Lease> activeLeases = leaseRepository.findByTenantIdAndStatus(
                tenant.get().getId(), 
                LeaseStatus.ACTIVE
            );
            return !activeLeases.isEmpty();
        }
        
        return false;
    }

    /**
     * Acknowledge a rejected rental request
     * Allows user to dismiss rejection notification and create new booking
     * 
     * @param requestId The rental request ID to acknowledge
     * @param userId The authenticated user's ID
     * @return AcknowledgeResponseDto with confirmation
     * @throws IllegalArgumentException if validation fails
     */
    public apartment.example.backend.dto.AcknowledgeResponseDto acknowledgeRejection(Long requestId, Long userId) {
        // Find the rental request
        Optional<RentalRequest> requestOpt = rentalRequestRepository.findById(requestId);
        if (requestOpt.isEmpty()) {
            throw new IllegalArgumentException("Rental request not found with id: " + requestId);
        }
        
        RentalRequest request = requestOpt.get();
        
        // Validate ownership: request must belong to the authenticated user
        if (request.getUserId() == null || !request.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to acknowledge this request");
        }
        
        // Validate status: must be REJECTED
        if (request.getStatus() != RentalRequestStatus.REJECTED) {
            throw new IllegalArgumentException("Only rejected requests can be acknowledged. Current status: " + request.getStatus());
        }
        
        // Validate not already acknowledged
        if (request.isRejectionAcknowledged()) {
            throw new IllegalArgumentException("This rejection has already been acknowledged");
        }
        
        // Set acknowledgement timestamp
        request.setRejectionAcknowledgedAt(LocalDateTime.now());
        rentalRequestRepository.save(request);
        
        return apartment.example.backend.dto.AcknowledgeResponseDto.builder()
            .requestId(requestId)
            .acknowledgedAt(request.getRejectionAcknowledgedAt())
            .message("Rejection acknowledged successfully. You can now submit a new booking request.")
            .canCreateNewRequest(true)
            .build();
    }

    /**
     * Enhanced validation for creating rental request with user authentication
     * This method will be called from controller with userId from JWT token
     * 
     * @param rentalRequest The rental request to create
     * @param userId The authenticated user's ID from JWT
     * @return Created rental request
     * @throws IllegalArgumentException if validation fails
     */
    public RentalRequest createRentalRequestWithUser(RentalRequest rentalRequest, Long userId) {
        // Get authenticated user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found with id: " + userId);
        }
        
        User user = userOpt.get();
        
        // VILLAGER users cannot make new bookings (one booking per person rule)
        if (user.getRole() == User.Role.VILLAGER) {
            throw new IllegalArgumentException("You are already an approved tenant and cannot submit new rental requests. You can access your dashboard to view your lease information.");
        }
        
        // Check for existing active or unacknowledged requests
        List<RentalRequest> existingRequests = rentalRequestRepository.findByUserId(userId);
        
        for (RentalRequest existing : existingRequests) {
            // Block if user has PENDING request
            if (existing.getStatus() == RentalRequestStatus.PENDING) {
                throw new IllegalArgumentException("You already have a pending rental request. Please wait for admin decision before submitting a new request.");
            }
            
            // Block if user has APPROVED request (not COMPLETED yet)
            if (existing.getStatus() == RentalRequestStatus.APPROVED) {
                throw new IllegalArgumentException("You already have an approved booking. Each person can only have one active booking at a time.");
            }
            
            // Block if user has unacknowledged REJECTED request
            if (existing.getStatus() == RentalRequestStatus.REJECTED && !existing.isRejectionAcknowledged()) {
                throw new IllegalArgumentException("Please acknowledge your previous rejection before submitting a new request. Check the booking page for details.");
            }
            
            // COMPLETED requests are OK - user can book again!
        }
        
        // Validate email matches user's email
        if (!rentalRequest.getEmail().equals(user.getEmail())) {
            throw new IllegalArgumentException("Email in request must match your account email: " + user.getEmail());
        }
        
        // Check that the unit is available
        Optional<Unit> unitOptional = unitRepository.findById(rentalRequest.getUnitId());
        Unit unit;
        if (unitOptional.isPresent()) {
            unit = unitOptional.get();
            if (unit.getStatus() != UnitStatus.AVAILABLE) {
                throw new IllegalArgumentException("Selected unit is not available for rent. Please choose an available unit.");
            }
        } else {
            throw new IllegalArgumentException("Selected unit does not exist.");
        }
        
        // Set the Unit entity reference (required for @ManyToOne relationship)
        rentalRequest.setUnit(unit);
        
        // Set the User entity reference (NEW - links request to authenticated user)
        rentalRequest.setUser(user);
        
        // Set default values
        rentalRequest.setStatus(RentalRequestStatus.PENDING);
        if (rentalRequest.getRequestDate() == null) {
            rentalRequest.setRequestDate(LocalDateTime.now());
        }
        
        return rentalRequestRepository.save(rentalRequest);
    }
}