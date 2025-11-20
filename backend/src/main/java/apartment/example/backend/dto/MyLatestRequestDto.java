package apartment.example.backend.dto;

import apartment.example.backend.entity.enums.RentalRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for returning the latest rental request status to frontend
 * Used by /rental-requests/me/latest endpoint for booking flow control
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyLatestRequestDto {
    
    private Long id;
    private Long userId;
    private Long unitId;
    private String unitRoomNumber;
    private RentalRequestStatus status;
    private LocalDateTime requestDate;
    private String rejectionReason;
    private LocalDateTime rejectionAcknowledgedAt;
    
    // Lease information for active leases
    private Long leaseId;
    private String roomNumber;
    private String leaseEndDate; // ISO format string for frontend
    
    // Computed flags for frontend convenience
    private Boolean isPending;
    private Boolean isApproved;
    private Boolean isRejected;
    private Boolean requiresAcknowledgement;
    private Boolean hasActiveLease;
    private Boolean canCreateNewRequest;
    
    // Helper message for frontend display
    private String statusMessage;
}
