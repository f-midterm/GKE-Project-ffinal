package apartment.example.backend.controller;

import apartment.example.backend.dto.AcknowledgeResponseDto;
import apartment.example.backend.dto.ApprovalRequest;
import apartment.example.backend.dto.MyLatestRequestDto;
import apartment.example.backend.entity.RentalRequest;
import apartment.example.backend.security.JwtUtil;
import apartment.example.backend.service.RentalRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rental-requests")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RentalRequestController {

    private final RentalRequestService rentalRequestService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<RentalRequest>> getAllRentalRequests() {
        try {
            List<RentalRequest> requests = rentalRequestService.getAllRentalRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<RentalRequest>> getPendingRequests() {
        try {
            System.out.println("=== Getting pending requests ===");
            List<RentalRequest> requests = rentalRequestService.getPendingRequests();
            System.out.println("=== Found " + requests.size() + " pending requests ===");
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            System.out.println("=== Error in getPendingRequests: " + e.getMessage() + " ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/unit/{unitId}")
    public ResponseEntity<List<RentalRequest>> getRequestsByUnitId(@PathVariable Long unitId) {
        try {
            List<RentalRequest> requests = rentalRequestService.getRequestsByUnitId(unitId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<RentalRequest>> getRequestsByUserEmail(@RequestParam String email) {
        try {
            List<RentalRequest> requests = rentalRequestService.getRequestsByEmail(email);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalRequest> getRequestById(@PathVariable Long id) {
        try {
            Optional<RentalRequest> request = rentalRequestService.getRequestById(id);
            return request.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<RentalRequest> createRentalRequest(@RequestBody RentalRequest rentalRequest) {
        try {
            log.info("Creating rental request for unit: {}, email: {}", rentalRequest.getUnitId(), rentalRequest.getEmail());
            RentalRequest savedRequest = rentalRequestService.createRentalRequest(rentalRequest);
            log.info("Rental request created successfully with ID: {}", savedRequest.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRequest);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating rental request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error creating rental request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/unit/{unitId}")
    public ResponseEntity<RentalRequest> createRentalRequestForUnit(
            @PathVariable Long unitId, 
            @RequestBody RentalRequest rentalRequest) {
        try {
            log.info("Creating rental request for unit ID: {}, email: {}", unitId, rentalRequest.getEmail());
            rentalRequest.setUnitId(unitId);
            RentalRequest savedRequest = rentalRequestService.createRentalRequest(rentalRequest);
            log.info("Rental request created successfully with ID: {}", savedRequest.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRequest);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating rental request for unit {}: {}", unitId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error creating rental request for unit " + unitId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long id,
            @RequestBody ApprovalRequest approvalRequest) {
        try {
            RentalRequest approvedRequest = rentalRequestService.approveRequest(
                id, 
                approvalRequest.getApprovedByUserId(),
                approvalRequest.getStartDate(),
                approvalRequest.getEndDate()
            );
            return ResponseEntity.ok(approvedRequest);
        } catch (IllegalStateException e) {
            // Return 400 Bad Request for validation errors (past date, duration mismatch, etc.)
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            // Return 404 Not Found if rental request doesn't exist
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<RentalRequest> rejectRequest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        try {
            String rejectionReason = (String) payload.get("reason");
            Long rejectedByUserId = null;
            if (payload.containsKey("rejectedByUserId")) {
                rejectedByUserId = Long.valueOf(payload.get("rejectedByUserId").toString());
            }
            
            RentalRequest rejectedRequest = rentalRequestService.rejectRequest(id, rejectionReason, rejectedByUserId);
            return ResponseEntity.ok(rejectedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<RentalRequest> updateRentalRequest(
            @PathVariable Long id,
            @RequestBody RentalRequest rentalRequest) {
        try {
            RentalRequest updatedRequest = rentalRequestService.updateRentalRequest(id, rentalRequest);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRentalRequest(@PathVariable Long id) {
        try {
            rentalRequestService.deleteRentalRequest(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============================================
    // NEW ENDPOINTS FOR USER-BASED BOOKING FLOW
    // ============================================

    /**
     * Get the latest rental request status for the authenticated user
     * Used by frontend booking flow to determine: pending, approved, rejected, etc.
     * 
     * @param authHeader Authorization header with JWT token
     * @return MyLatestRequestDto with status flags
     */
    @GetMapping("/me/latest")
    public ResponseEntity<?> getMyLatestRequest(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract and validate JWT token
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("Get my latest request failed: No authentication token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
            
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);
            
            if (username == null || !jwtUtil.validateToken(token, username)) {
                log.error("Get my latest request failed: Invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid authentication token"));
            }
            
            // Get userId from token
            Long userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                log.error("Get my latest request failed: Cannot extract userId from token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid user session"));
            }
            
            log.info("Getting latest request for user ID: {}", userId);
            MyLatestRequestDto latestRequest = rentalRequestService.getMyLatestRequest(userId);
            
            return ResponseEntity.ok(latestRequest);
        } catch (Exception e) {
            log.error("Unexpected error getting latest request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to retrieve booking status"));
        }
    }

    /**
     * Acknowledge a rejected rental request
     * Allows user to dismiss rejection notification and create new booking
     * 
     * @param id Rental request ID to acknowledge
     * @param authHeader Authorization header with JWT token
     * @return AcknowledgeResponseDto with confirmation
     */
    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeRejection(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract and validate JWT token
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("Acknowledge rejection failed: No authentication token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }
            
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);
            
            if (username == null || !jwtUtil.validateToken(token, username)) {
                log.error("Acknowledge rejection failed: Invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid authentication token"));
            }
            
            // Get userId from token
            Long userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                log.error("Acknowledge rejection failed: Cannot extract userId from token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid user session"));
            }
            
            log.info("User {} acknowledging rejection for request ID: {}", userId, id);
            AcknowledgeResponseDto response = rentalRequestService.acknowledgeRejection(id, userId);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error acknowledging rejection: {}", e.getMessage());
            
            // Return appropriate status code based on error message
            if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
            }
        } catch (Exception e) {
            log.error("Unexpected error acknowledging rejection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to acknowledge rejection"));
        }
    }

    /**
     * Create rental request with user authentication (UPDATED)
     * Now extracts userId from JWT and uses enhanced validation
     * 
     * @param rentalRequest Rental request data
     * @param authHeader Authorization header with JWT token
     * @return Created rental request
     */
    @PostMapping("/authenticated")
    public ResponseEntity<?> createAuthenticatedRentalRequest(
            @RequestBody RentalRequest rentalRequest,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Extract and validate JWT token
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("Create rental request failed: No authentication token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required to submit booking request"));
            }
            
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);
            
            if (username == null || !jwtUtil.validateToken(token, username)) {
                log.error("Create rental request failed: Invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid authentication token"));
            }
            
            // Get userId from token
            Long userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                log.error("Create rental request failed: Cannot extract userId from token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid user session"));
            }
            
            log.info("Creating authenticated rental request for user ID: {}, unit: {}", userId, rentalRequest.getUnitId());
            
            // Use new service method with userId validation
            RentalRequest savedRequest = rentalRequestService.createRentalRequestWithUser(rentalRequest, userId);
            
            log.info("Rental request created successfully with ID: {}", savedRequest.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRequest);
            
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating rental request: {}", e.getMessage());
            
            // Return 409 Conflict for duplicate booking scenarios
            if (e.getMessage().contains("already have") || 
                e.getMessage().contains("pending") || 
                e.getMessage().contains("approved") ||
                e.getMessage().contains("acknowledge")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
            }
            
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating rental request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create booking request"));
        }
    }
}