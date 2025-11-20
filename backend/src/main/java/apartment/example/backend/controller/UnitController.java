package apartment.example.backend.controller;

import apartment.example.backend.entity.Unit;
import apartment.example.backend.entity.Tenant;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.enums.UnitStatus;
import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.service.UnitService;
import apartment.example.backend.service.TenantService;
import apartment.example.backend.service.LeaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/units")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UnitController {

    private final UnitService unitService;
    private final TenantService tenantService;
    private final LeaseService leaseService;

    @GetMapping
    public ResponseEntity<List<Unit>> getAllUnits() {
        List<Unit> units = unitService.getAllUnits();
        return ResponseEntity.ok(units);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<Unit>> getAllUnits(Pageable pageable) {
        Page<Unit> units = unitService.getAllUnits(pageable);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Unit> getUnitById(@PathVariable Long id) {
        return unitService.getUnitById(id)
                .map(unit -> ResponseEntity.ok(unit))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/room/{roomNumber}")
    public ResponseEntity<Unit> getUnitByRoomNumber(@PathVariable String roomNumber) {
        return unitService.getUnitByRoomNumber(roomNumber)
                .map(unit -> ResponseEntity.ok(unit))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/floor/{floor}")
    public ResponseEntity<List<Unit>> getUnitsByFloor(@PathVariable Integer floor) {
        List<Unit> units = unitService.getUnitsByFloor(floor);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Unit>> getUnitsByStatus(@PathVariable UnitStatus status) {
        List<Unit> units = unitService.getUnitsByStatus(status);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Unit>> getUnitsByType(@PathVariable String type) {
        List<Unit> units = unitService.getUnitsByType(type);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/available")
    public ResponseEntity<List<Unit>> getAvailableUnits() {
        List<Unit> units = unitService.getAvailableUnits();
        return ResponseEntity.ok(units);
    }

    @GetMapping("/rent-range")
    public ResponseEntity<List<Unit>> getUnitsByRentRange(
            @RequestParam BigDecimal minRent,
            @RequestParam BigDecimal maxRent) {
        List<Unit> units = unitService.getUnitsByRentRange(minRent, maxRent);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> dashboard = Map.of(
            "totalUnits", unitService.getAllUnits().size(),
            "availableUnits", unitService.countUnitsByStatus(UnitStatus.AVAILABLE),
            "occupiedUnits", unitService.countUnitsByStatus(UnitStatus.OCCUPIED),
            "maintenanceUnits", unitService.countUnitsByStatus(UnitStatus.MAINTENANCE),
            "reservedUnits", unitService.countUnitsByStatus(UnitStatus.RESERVED),
            "floor1Units", unitService.countUnitsByFloor(1),
            "floor2Units", unitService.countUnitsByFloor(2)
        );
        return ResponseEntity.ok(dashboard);
    }

    @PostMapping
    public ResponseEntity<Unit> createUnit(@RequestBody Unit unit) {
        try {
            Unit createdUnit = unitService.createUnit(unit);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUnit);
        } catch (IllegalArgumentException e) {
            log.error("Error creating unit: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Unit> updateUnit(@PathVariable Long id, @RequestBody Unit unit) {
        try {
            Unit updatedUnit = unitService.updateUnit(id, unit);
            return ResponseEntity.ok(updatedUnit);
        } catch (IllegalArgumentException e) {
            log.error("Error updating unit: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error updating unit: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Unit> updateUnitStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            UnitStatus status = UnitStatus.valueOf(request.get("status"));
            unitService.updateUnitStatus(id, status);
            return unitService.getUnitById(id)
                    .map(unit -> ResponseEntity.ok(unit))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            log.error("Invalid status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error updating unit status: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Long id) {
        try {
            unitService.deleteUnit(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting unit: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> checkUnitExists(@PathVariable Long id) {
        boolean exists = unitService.existsById(id);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/room/{roomNumber}/exists")
    public ResponseEntity<Boolean> checkRoomNumberExists(@PathVariable String roomNumber) {
        boolean exists = unitService.existsByRoomNumber(roomNumber);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/detailed")
    public ResponseEntity<List<Map<String, Object>>> getUnitsWithDetails() {
        try {
            List<Unit> units = unitService.getAllUnits();
            List<Map<String, Object>> detailedUnits = new java.util.ArrayList<>();
            
            for (Unit unit : units) {
                Map<String, Object> unitDetails = new HashMap<>();
                unitDetails.put("unit", unit);
                
                // Get current tenant info if occupied
                if (unit.getStatus() == UnitStatus.OCCUPIED) {
                    try {
                        // Get all leases and filter by unit and status manually
                        List<Lease> allLeases = leaseService.getAllLeases();
                        log.info("Total leases in database: {}", allLeases.size());
                        
                        for (Lease lease : allLeases) {
                            log.info("Lease ID: {}, Unit ID: {}, Status: {}, Unit Object: {}", 
                                   lease.getId(), 
                                   lease.getUnit() != null ? lease.getUnit().getId() : "NULL", 
                                   lease.getStatus(),
                                   lease.getUnit() != null ? "exists" : "NULL");
                        }
                        
                        Optional<Lease> activeLease = allLeases.stream()
                            .filter(lease -> lease.getUnit() != null && 
                                           lease.getUnit().getId().equals(unit.getId()) && 
                                           lease.getStatus() == LeaseStatus.ACTIVE)
                            .findFirst();
                        
                        if (activeLease.isPresent()) {
                            Lease lease = activeLease.get();
                            unitDetails.put("lease", lease);
                            unitDetails.put("tenant", lease.getTenant());
                            log.info("Found lease for unit {}: tenant {}", unit.getRoomNumber(), 
                                   lease.getTenant() != null ? lease.getTenant().getFirstName() : "null");
                        } else {
                            log.info("No active lease found for occupied unit {} (ID: {})", unit.getRoomNumber(), unit.getId());
                        }
                    } catch (Exception e) {
                        log.error("Error getting lease for unit {}: {}", unit.getRoomNumber(), e.getMessage());
                    }
                }
                
                detailedUnits.add(unitDetails);
            }
            
            return ResponseEntity.ok(detailedUnits);
        } catch (Exception e) {
            log.error("Error getting detailed units: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<Map<String, Object>> getUnitDetails(@PathVariable Long id) {
        try {
            Optional<Unit> unitOpt = unitService.getUnitById(id);
            if (!unitOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Unit unit = unitOpt.get();
            Map<String, Object> details = new HashMap<>();
            details.put("unit", unit);
            
            // Get current tenant and lease info
            Optional<Lease> activeLease = leaseService.getActiveLeaseByUnit(unit.getId());
            if (activeLease.isPresent()) {
                Lease lease = activeLease.get();
                details.put("lease", lease);
                details.put("tenant", lease.getTenant());
            }
            
            // TODO: Add maintenance history, rental history, etc.
            
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            log.error("Error getting unit details: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Temporary maintenance requests endpoint for testing
    @GetMapping("/maintenance-test")
    public ResponseEntity<String> maintenanceTest() {
        log.info("Maintenance test endpoint called");
        return ResponseEntity.ok("Maintenance functionality test - working!");
    }
}