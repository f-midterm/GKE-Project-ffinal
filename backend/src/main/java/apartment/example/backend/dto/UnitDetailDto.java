package apartment.example.backend.dto;

import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.entity.enums.TenantStatus;
import apartment.example.backend.entity.enums.UnitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for Unit Detail Page (Admin view)
 * Contains complete unit information including tenant, lease, and maintenance
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitDetailDto {
    
    // Unit Information
    private Long unitId;
    private String roomNumber;
    private Integer floor;
    private String type;
    private BigDecimal rentAmount;
    private BigDecimal sizeSquareMeters;
    private String description;
    private UnitStatus status;
    
    // Current Tenant Information (null if vacant)
    private TenantInfo currentTenant;
    
    // Active Lease Information (null if vacant)
    private LeaseInfo activeLease;
    
    // Maintenance History
    private List<MaintenanceInfo> maintenanceHistory;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantInfo {
        private Long tenantId;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String occupation;
        private String emergencyContact;
        private String emergencyPhone;
        private TenantStatus status;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaseInfo {
        private Long leaseId;
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal monthlyRent;
        private BigDecimal depositAmount;
        private String billingCycle;
        private LeaseStatus status;
        private long daysUntilExpiry;  // Negative if expired
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceInfo {
        private Long maintenanceId;
        private String title;
        private String description;
        private String category;
        private String priority;
        private String status;
        private LocalDate submittedDate;
        private LocalDate completedDate;
        private BigDecimal estimatedCost;
        private BigDecimal actualCost;
    }
}
