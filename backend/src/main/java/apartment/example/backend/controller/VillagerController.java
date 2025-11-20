package apartment.example.backend.controller;

import apartment.example.backend.entity.*;
import apartment.example.backend.dto.LeaseResponseDto;
import apartment.example.backend.dto.PaymentResponseDto;
import apartment.example.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/villager")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class VillagerController {

    private final TenantService tenantService;
    private final LeaseService leaseService;
    private final PaymentService paymentService;
    private final MaintenanceRequestService maintenanceRequestService;

    @GetMapping("/dashboard/{email}")
    public ResponseEntity<Map<String, Object>> getVillagerDashboard(@PathVariable String email) {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            
            // Get tenant information
            Optional<Tenant> tenant = tenantService.findByEmail(email);
            if (tenant.isPresent()) {
                dashboard.put("tenant", tenant.get());
                
                // Get lease information
                List<Lease> leases = leaseService.getLeasesByTenant(tenant.get().getId());
                dashboard.put("leases", leases);
                
                // Get active lease if exists
                if (!leases.isEmpty()) {
                    Lease activeLease = leases.get(0); // Assuming most recent lease
                    dashboard.put("activeLease", activeLease);
                    
                    // Get payments for the lease
                    List<Payment> payments = paymentService.getPaymentsByLease(activeLease.getId());
                    dashboard.put("payments", payments);
                }
            }
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            log.error("Error retrieving villager dashboard for email: {}", email, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/lease/{email}")
    public ResponseEntity<LeaseResponseDto> getActiveLeaseByEmail(@PathVariable String email) {
        try {
            Optional<Tenant> tenant = tenantService.findByEmail(email);
            if (tenant.isPresent()) {
                List<Lease> leases = leaseService.getLeasesByTenant(tenant.get().getId());
                if (!leases.isEmpty()) {
                    Lease lease = leases.get(0); // Return most recent lease
                    LeaseResponseDto dto = convertToLeaseDto(lease);
                    return ResponseEntity.ok(dto);
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error retrieving lease for email: {}", email, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/payments/{email}")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByEmail(@PathVariable String email) {
        try {
            Optional<Tenant> tenant = tenantService.findByEmail(email);
            if (tenant.isPresent()) {
                List<Lease> leases = leaseService.getLeasesByTenant(tenant.get().getId());
                if (!leases.isEmpty()) {
                    List<Payment> payments = paymentService.getPaymentsByLease(leases.get(0).getId());
                    List<PaymentResponseDto> paymentDtos = payments.stream()
                            .map(payment -> convertToPaymentDto(payment, tenant.get(), leases.get(0).getUnit()))
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(paymentDtos);
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error retrieving payments for email: {}", email, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private LeaseResponseDto convertToLeaseDto(Lease lease) {
        LeaseResponseDto dto = new LeaseResponseDto();
        dto.setId(lease.getId());
        dto.setStartDate(lease.getStartDate());
        dto.setEndDate(lease.getEndDate());
        dto.setRentAmount(lease.getRentAmount());
        dto.setBillingCycle(lease.getBillingCycle());
        dto.setSecurityDeposit(lease.getSecurityDeposit());
        dto.setStatus(lease.getStatus());
        dto.setCreatedAt(lease.getCreatedAt());
        dto.setUpdatedAt(lease.getUpdatedAt());
        
        // Include unit information
        if (lease.getUnit() != null) {
            LeaseResponseDto.UnitDto unitDto = new LeaseResponseDto.UnitDto();
            unitDto.setId(lease.getUnit().getId());
            unitDto.setRoomNumber(lease.getUnit().getRoomNumber());
            unitDto.setFloor(lease.getUnit().getFloor());
            unitDto.setStatus(lease.getUnit().getStatus().toString());
            unitDto.setType(lease.getUnit().getUnitType());
            unitDto.setRentAmount(lease.getUnit().getRentAmount());
            unitDto.setSizeSqm(lease.getUnit().getSizeSqm());
            unitDto.setDescription(lease.getUnit().getDescription());
            dto.setUnit(unitDto);
        }
        
        return dto;
    }
    
    private PaymentResponseDto convertToPaymentDto(Payment payment, Tenant tenant, Unit unit) {
        PaymentResponseDto dto = new PaymentResponseDto();
        dto.setId(payment.getId());
        dto.setPaymentType(payment.getPaymentType());
        dto.setAmount(payment.getAmount());
        dto.setDueDate(payment.getDueDate());
        dto.setPaidDate(payment.getPaidDate());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setStatus(payment.getStatus());
        dto.setReceiptNumber(payment.getReceiptNumber());
        dto.setNotes(payment.getNotes());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedAt(payment.getUpdatedAt());
        
        // Add tenant information
        PaymentResponseDto.TenantDto tenantDto = new PaymentResponseDto.TenantDto();
        tenantDto.setId(tenant.getId());
        tenantDto.setFirstName(tenant.getFirstName());
        tenantDto.setLastName(tenant.getLastName());
        tenantDto.setEmail(tenant.getEmail());
        tenantDto.setPhone(tenant.getPhone());
        dto.setTenant(tenantDto);
        
        // Add unit information
        PaymentResponseDto.UnitDto unitDto = new PaymentResponseDto.UnitDto();
        unitDto.setId(unit.getId());
        unitDto.setRoomNumber(unit.getRoomNumber());
        unitDto.setFloor(unit.getFloor());
        unitDto.setType(unit.getUnitType());
        dto.setUnit(unitDto);
        
        return dto;
    }

    // Get maintenance requests for a villager by email
    @GetMapping("/maintenance/{email}")
    public ResponseEntity<List<MaintenanceRequest>> getVillagerMaintenanceRequests(@PathVariable String email) {
        try {
            Optional<Tenant> tenant = tenantService.findByEmail(email);
            if (tenant.isPresent()) {
                List<MaintenanceRequest> requests = maintenanceRequestService.getRequestsByTenantId(tenant.get().getId());
                return ResponseEntity.ok(requests);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting maintenance requests for villager {}: ", email, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Create maintenance request for villager
    @PostMapping("/maintenance")
    public ResponseEntity<MaintenanceRequest> createMaintenanceRequest(@RequestBody Map<String, Object> requestData) {
        try {
            String email = (String) requestData.get("email");
            String title = (String) requestData.get("title");
            String description = (String) requestData.get("description");
            String priorityStr = (String) requestData.get("priority");
            String categoryStr = (String) requestData.get("category");
            String urgencyStr = (String) requestData.get("urgency");
            String preferredTime = (String) requestData.get("preferredTime");

            Optional<Tenant> tenant = tenantService.findByEmail(email);
            if (!tenant.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            // Get tenant's active lease to find unit
            List<Lease> leases = leaseService.getLeasesByTenant(tenant.get().getId());
            if (leases.isEmpty()) {
                return ResponseEntity.badRequest().build(); // No active lease
            }

            Lease activeLease = leases.get(0); // Get most recent lease
            
            MaintenanceRequest request = new MaintenanceRequest();
            request.setTenantId(tenant.get().getId());
            request.setUnitId(activeLease.getUnit().getId());
            request.setTitle(title);
            request.setDescription(description);
            request.setPriority(MaintenanceRequest.Priority.valueOf(priorityStr));
            request.setCategory(MaintenanceRequest.Category.valueOf(categoryStr));
            request.setUrgency(MaintenanceRequest.Urgency.valueOf(urgencyStr));
            request.setPreferredTime(preferredTime);
            request.setStatus(MaintenanceRequest.RequestStatus.SUBMITTED);

            MaintenanceRequest created = maintenanceRequestService.createMaintenanceRequest(request);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("Error creating maintenance request: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get maintenance request statistics for villager
    @GetMapping("/maintenance/stats/{email}")
    public ResponseEntity<Map<String, Object>> getVillagerMaintenanceStats(@PathVariable String email) {
        try {
            Optional<Tenant> tenant = tenantService.findByEmail(email);
            if (tenant.isPresent()) {
                List<MaintenanceRequest> requests = maintenanceRequestService.getRequestsByTenantId(tenant.get().getId());
                
                Map<String, Object> stats = new HashMap<>();
                stats.put("total", requests.size());
                stats.put("pending", requests.stream().filter(r -> r.getStatus() == MaintenanceRequest.RequestStatus.SUBMITTED).count());
                stats.put("inProgress", requests.stream().filter(r -> r.getStatus() == MaintenanceRequest.RequestStatus.IN_PROGRESS).count());
                stats.put("completed", requests.stream().filter(r -> r.getStatus() == MaintenanceRequest.RequestStatus.COMPLETED).count());
                stats.put("requests", requests);
                
                return ResponseEntity.ok(stats);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting maintenance stats for villager {}: ", email, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}