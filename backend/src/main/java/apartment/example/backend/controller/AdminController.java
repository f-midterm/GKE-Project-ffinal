package apartment.example.backend.controller;

import apartment.example.backend.dto.AdminDashboardDto;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.MaintenanceRequest;
import apartment.example.backend.entity.Unit;
import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.entity.enums.RentalRequestStatus;
import apartment.example.backend.entity.enums.UnitStatus;
import apartment.example.backend.repository.LeaseRepository;
import apartment.example.backend.repository.MaintenanceRequestRepository;
import apartment.example.backend.repository.RentalRequestRepository;
import apartment.example.backend.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Controller for dashboard and admin-specific operations
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminController {

    private final UnitRepository unitRepository;
    private final LeaseRepository leaseRepository;
    private final RentalRequestRepository rentalRequestRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;

    /**
     * Get admin dashboard data
     * GET /api/admin/dashboard
     * 
     * @return AdminDashboardDto with statistics and expiring leases
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardDto> getDashboardData() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String adminUsername = authentication.getName();
        
        log.info("Fetching dashboard data for admin: {}", adminUsername);
        
        // Get all units and count by status
        List<Unit> allUnits = unitRepository.findAll();
        long totalUnits = allUnits.size();
        long occupiedUnits = allUnits.stream()
                .filter(u -> u.getStatus() == UnitStatus.OCCUPIED)
                .count();
        long availableUnits = allUnits.stream()
                .filter(u -> u.getStatus() == UnitStatus.AVAILABLE)
                .count();
        long maintenanceUnits = allUnits.stream()
                .filter(u -> u.getStatus() == UnitStatus.MAINTENANCE)
                .count();
        
        // Count pending rental requests
        long pendingRentalRequests = rentalRequestRepository.countByStatus(RentalRequestStatus.PENDING);
        
        // Count active maintenance requests (SUBMITTED, APPROVED, IN_PROGRESS)
        long maintenanceRequests = maintenanceRequestRepository.countByStatusIn(
                List.of(
                    MaintenanceRequest.RequestStatus.SUBMITTED,
                    MaintenanceRequest.RequestStatus.APPROVED,
                    MaintenanceRequest.RequestStatus.IN_PROGRESS
                )
        );
        
        // Find leases expiring in next 30 days
        LocalDate today = LocalDate.now();
        LocalDate in30Days = today.plusDays(30);
        List<Lease> expiringLeases = leaseRepository.findLeasesEndingBetween(
                today, in30Days, LeaseStatus.ACTIVE
        );
        
        // Build expiring lease info list
        List<AdminDashboardDto.ExpiringLeaseInfo> expiringLeaseInfoList = expiringLeases.stream()
                .map(lease -> {
                    long daysLeft = ChronoUnit.DAYS.between(today, lease.getEndDate());
                    String warningLevel;
                    
                    if (daysLeft <= 7) {
                        warningLevel = "URGENT";
                    } else if (daysLeft <= 14) {
                        warningLevel = "WARNING";
                    } else {
                        warningLevel = "NOTICE";
                    }
                    
                    String tenantName = lease.getTenant().getFirstName() + " " + 
                                       lease.getTenant().getLastName();
                    
                    return AdminDashboardDto.ExpiringLeaseInfo.builder()
                            .leaseId(lease.getId())
                            .unitId(lease.getUnit().getId())
                            .unitRoomNumber(lease.getUnit().getRoomNumber())
                            .tenantName(tenantName)
                            .tenantEmail(lease.getTenant().getEmail())
                            .endDate(lease.getEndDate())
                            .daysUntilExpiry(daysLeft)
                            .warningLevel(warningLevel)
                            .build();
                })
                .sorted((a, b) -> Long.compare(a.getDaysUntilExpiry(), b.getDaysUntilExpiry()))
                .collect(Collectors.toList());
        
        // Build dashboard DTO
        AdminDashboardDto dashboardDto = AdminDashboardDto.builder()
                .adminName(adminUsername)
                .totalUnits((int) totalUnits)
                .occupiedUnits((int) occupiedUnits)
                .availableUnits((int) availableUnits)
                .maintenanceUnits((int) maintenanceUnits)
                .pendingRentalRequests((int) pendingRentalRequests)
                .maintenanceRequests((int) maintenanceRequests)
                .leasesExpiringSoon(expiringLeaseInfoList.size())
                .expiringLeases(expiringLeaseInfoList)
                .build();
        
        log.info("Dashboard data: {} total units, {} occupied, {} expiring soon", 
                totalUnits, occupiedUnits, expiringLeaseInfoList.size());
        
        return ResponseEntity.ok(dashboardDto);
    }
}
