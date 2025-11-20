package apartment.example.backend.controller;

import apartment.example.backend.entity.Tenant;
import apartment.example.backend.dto.TenantResponseDto;
import apartment.example.backend.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping
    public ResponseEntity<List<TenantResponseDto>> getAllTenants() {
        List<Tenant> tenants = tenantService.getAllTenants();
        List<TenantResponseDto> tenantDtos = tenants.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tenantDtos);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<TenantResponseDto>> getAllTenants(Pageable pageable) {
        Page<Tenant> tenants = tenantService.getAllTenants(pageable);
        Page<TenantResponseDto> tenantDtos = tenants.map(this::convertToDto);
        return ResponseEntity.ok(tenantDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantResponseDto> getTenantById(@PathVariable Long id) {
        return tenantService.getTenantById(id)
                .map(tenant -> ResponseEntity.ok(convertToDto(tenant)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<TenantResponseDto>> searchTenants(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String idCard) {
        
        List<Tenant> tenants;
        if (name != null) {
            tenants = tenantService.searchTenantsByName(name);
        } else if (phone != null) {
            tenants = tenantService.getTenantsByPhone(phone);
        } else if (email != null) {
            tenants = tenantService.getTenantsByEmail(email);
        } else if (idCard != null) {
            // Fixed: Use proper method for ID card search (or email if that's the intent)
            tenants = tenantService.getTenantByEmail(idCard)
                    .map(List::of)
                    .orElse(Collections.emptyList());
        } else {
            return ResponseEntity.badRequest().build();
        }
        
        List<TenantResponseDto> tenantDtos = tenants.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tenantDtos);
    }

    @PostMapping
    public ResponseEntity<TenantResponseDto> createTenant(@RequestBody Tenant tenant) {
        try {
            Tenant createdTenant = tenantService.createTenant(tenant);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(createdTenant));
        } catch (IllegalArgumentException e) {
            log.error("Error creating tenant: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TenantResponseDto> updateTenant(@PathVariable Long id, @RequestBody Tenant tenant) {
        try {
            Tenant updatedTenant = tenantService.updateTenant(id, tenant);
            return ResponseEntity.ok(convertToDto(updatedTenant));
        } catch (IllegalArgumentException e) {
            log.error("Error updating tenant: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error updating tenant: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTenant(@PathVariable Long id) {
        try {
            tenantService.deleteTenant(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting tenant: {}", e.getMessage());
            // Return error message to frontend
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to delete tenant",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> checkTenantExists(@PathVariable Long id) {
        boolean exists = tenantService.existsById(id);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/email/{email}/exists")
    public ResponseEntity<Boolean> checkEmailExists(@PathVariable String email) {
        boolean exists = tenantService.getTenantByEmail(email).isPresent();
        return ResponseEntity.ok(exists);
    }

    private TenantResponseDto convertToDto(Tenant tenant) {
        TenantResponseDto dto = new TenantResponseDto();
        dto.setId(tenant.getId());
        dto.setFirstName(tenant.getFirstName());
        dto.setLastName(tenant.getLastName());
        dto.setPhone(tenant.getPhone());
        dto.setEmail(tenant.getEmail());
        dto.setEmergencyContact(tenant.getEmergencyContact());
        dto.setEmergencyPhone(tenant.getEmergencyPhone());
        dto.setOccupation(tenant.getOccupation());
        // Use @Transient helper methods to get current lease info
        dto.setUnitId(tenant.getCurrentUnitId());
        dto.setMoveInDate(tenant.getCurrentMoveInDate());
        dto.setLeaseEndDate(tenant.getCurrentLeaseEndDate());
        dto.setMonthlyRent(tenant.getCurrentMonthlyRent());
        dto.setStatus(tenant.getStatus());
        dto.setCreatedAt(tenant.getCreatedAt());
        dto.setUpdatedAt(tenant.getUpdatedAt());
        return dto;
    }
}