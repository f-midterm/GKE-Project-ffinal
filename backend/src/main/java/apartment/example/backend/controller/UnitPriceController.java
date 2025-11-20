package apartment.example.backend.controller;

import apartment.example.backend.dto.ChangePriceRequest;
import apartment.example.backend.dto.ChangePriceResponse;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.Unit;
import apartment.example.backend.service.LeaseService;
import apartment.example.backend.service.UnitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for unit price management (separated for clarity)
 */
@RestController
@RequestMapping("/api/units")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UnitPriceController {

    private final UnitService unitService;
    private final LeaseService leaseService;

    /**
     * POST /api/units/{id}/change-price
     * Change unit rent price (Admin only)
     * Database triggers will automatically handle price history and audit logging
     */
    @PostMapping("/{id}/change-price")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeUnitPrice(
            @PathVariable Long id,
            @RequestBody ChangePriceRequest request) {
        try {
            log.info("Admin changing price for unit ID: {} to {}", id, request.getNewPrice());
            
            // Get current unit
            Unit unit = unitService.getUnitById(id)
                    .orElseThrow(() -> new RuntimeException("Unit not found with id: " + id));
            
            BigDecimal oldPrice = unit.getRentAmount();
            
            // Check if there are active leases
            Optional<Lease> activeLease = leaseService.getActiveLeaseByUnit(id);
            boolean hasActiveLeases = activeLease.isPresent();
            
            if (hasActiveLeases) {
                log.warn("Unit {} has active lease. Price change will affect new leases only.", 
                        unit.getRoomNumber());
            }
            
            // Update price - database trigger will handle:
            // 1. Close old price history record (set effective_to)
            // 2. Create new price history record
            // 3. Create audit log entry
            Unit updatedUnit = unitService.updateUnitPrice(id, request.getNewPrice(), request.getReason());
            
            // Build response
            ChangePriceResponse response = ChangePriceResponse.builder()
                    .unitId(updatedUnit.getId())
                    .roomNumber(updatedUnit.getRoomNumber())
                    .oldPrice(oldPrice)
                    .newPrice(updatedUnit.getRentAmount())
                    .effectiveFrom(request.getEffectiveFrom())
                    .message(hasActiveLeases ? 
                            "Price changed successfully. Note: Current tenant will continue with old price (" + oldPrice + " THB). New price will apply to new leases." :
                            "Price changed successfully. New price: " + updatedUnit.getRentAmount() + " THB")
                    .hasActiveLeases(hasActiveLeases)
                    .build();
            
            log.info("Successfully changed price for unit {} from {} to {}", 
                    unit.getRoomNumber(), oldPrice, updatedUnit.getRentAmount());
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("Error changing unit price: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error changing unit price: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to change price: " + e.getMessage()));
        }
    }

    /**
     * GET /api/units/{id}/price-info
     * Get current price info including whether there are active leases
     */
    @GetMapping("/{id}/price-info")
    public ResponseEntity<?> getPriceInfo(@PathVariable Long id) {
        try {
            Unit unit = unitService.getUnitById(id)
                    .orElseThrow(() -> new RuntimeException("Unit not found"));
            
            Optional<Lease> activeLease = leaseService.getActiveLeaseByUnit(id);
            
            Map<String, Object> priceInfo = Map.of(
                    "unitId", unit.getId(),
                    "roomNumber", unit.getRoomNumber(),
                    "currentPrice", unit.getRentAmount(),
                    "hasActiveLeases", activeLease.isPresent(),
                    "activeLease", activeLease.map(lease -> Map.of(
                            "tenantName", lease.getTenant().getFirstName() + " " + lease.getTenant().getLastName(),
                            "startDate", lease.getStartDate(),
                            "endDate", lease.getEndDate(),
                            "monthlyRent", lease.getRentAmount()
                    )).orElse(null)
            );
            
            return ResponseEntity.ok(priceInfo);
            
        } catch (Exception e) {
            log.error("Error getting price info: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
