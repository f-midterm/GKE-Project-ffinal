package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for Admin Dashboard data
 * Contains summary statistics and expiring leases information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    
    private String adminName;
    private int totalUnits;
    private int occupiedUnits;
    private int availableUnits;
    private int maintenanceUnits;
    private int pendingRentalRequests;
    private int maintenanceRequests;
    private int leasesExpiringSoon;  // Count of leases expiring in next 30 days
    
    private List<ExpiringLeaseInfo> expiringLeases;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpiringLeaseInfo {
        private Long leaseId;
        private Long unitId;
        private String unitRoomNumber;
        private String tenantName;  // "FirstName LastName"
        private String tenantEmail;
        private LocalDate endDate;
        private long daysUntilExpiry;
        private String warningLevel;  // "URGENT" (<= 7 days), "WARNING" (<= 14 days), "NOTICE" (<= 30 days)
    }
}
