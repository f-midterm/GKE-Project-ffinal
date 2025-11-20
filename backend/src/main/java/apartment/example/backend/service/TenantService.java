package apartment.example.backend.service;

import apartment.example.backend.entity.Tenant;
import apartment.example.backend.entity.User;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.repository.TenantRepository;
import apartment.example.backend.repository.UserRepository;
import apartment.example.backend.repository.LeaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final LeaseRepository leaseRepository;

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    public Page<Tenant> getAllTenants(Pageable pageable) {
        return tenantRepository.findAll(pageable);
    }

    public Optional<Tenant> getTenantById(Long id) {
        return tenantRepository.findById(id);
    }

    public Optional<Tenant> getTenantByEmail(String email) {
        return tenantRepository.findByEmail(email);
    }

    public Optional<Tenant> findByEmail(String email) {
        return tenantRepository.findByEmail(email);
    }

    public List<Tenant> searchTenantsByName(String name) {
        return tenantRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Tenant> getTenantsByPhone(String phone) {
        return tenantRepository.findByPhoneContaining(phone);
    }

    public List<Tenant> getTenantsByEmail(String email) {
        return tenantRepository.findByEmailContainingIgnoreCase(email);
    }

    // Removed: getTenantsByUnitId - tenants no longer have direct unitId field
    // To find tenants by unit, use LeaseService.getLeasesByUnitId() instead

    public Tenant createTenant(Tenant tenant) {
        log.info("Creating new tenant: {} {}", tenant.getFirstName(), tenant.getLastName());
        return tenantRepository.save(tenant);
    }

    public Tenant updateTenant(Long id, Tenant tenantDetails) {
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tenant not found with id: " + id));

        tenant.setFirstName(tenantDetails.getFirstName());
        tenant.setLastName(tenantDetails.getLastName());
        tenant.setPhone(tenantDetails.getPhone());
        tenant.setEmail(tenantDetails.getEmail());
        tenant.setEmergencyContact(tenantDetails.getEmergencyContact());
        tenant.setEmergencyPhone(tenantDetails.getEmergencyPhone());
        tenant.setOccupation(tenantDetails.getOccupation());
        tenant.setStatus(tenantDetails.getStatus());
        // Note: Unit, move-in date, lease end date, and rent are now managed through Lease entity

        log.info("Updating tenant: {} {}", tenant.getFirstName(), tenant.getLastName());
        return tenantRepository.save(tenant);
    }

    public void deleteTenant(Long id) {
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tenant not found with id: " + id));
        
        String tenantEmail = tenant.getEmail();
        log.info("Deleting tenant: {} {} ({})", tenant.getFirstName(), tenant.getLastName(), tenantEmail);
        
        // CRITICAL: Check if tenant has active leases before deletion
        List<Lease> activeLeases = leaseRepository.findByTenantIdAndStatus(id, LeaseStatus.ACTIVE);
        if (!activeLeases.isEmpty()) {
            throw new RuntimeException("Cannot delete tenant with active leases. Please terminate the lease first.");
        }
        
        // Delete the tenant
        tenantRepository.delete(tenant);
        log.info("Successfully deleted tenant: {} {}", tenant.getFirstName(), tenant.getLastName());
        
        // CRITICAL FIX: Downgrade user role from VILLAGER to USER after tenant deletion
        Optional<User> userOptional = userRepository.findByEmail(tenantEmail);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Check if user has any other active leases (in case of multiple tenants with same email)
            List<Lease> otherActiveLeases = leaseRepository.findByStatusAndTenantEmail(LeaseStatus.ACTIVE, tenantEmail);
            
            if (otherActiveLeases.isEmpty() && user.getRole() == User.Role.VILLAGER) {
                user.setRole(User.Role.USER);
                userRepository.save(user);
                log.info("✅ CRITICAL FIX: Downgraded user {} from VILLAGER to USER (can book again!)", tenantEmail);
            } else if (!otherActiveLeases.isEmpty()) {
                log.info("User {} still has {} active lease(s), keeping VILLAGER role", 
                    tenantEmail, otherActiveLeases.size());
            }
        } else {
            log.warn("No user account found for deleted tenant email: {}", tenantEmail);
        }
    }

    public boolean existsById(Long id) {
        return tenantRepository.existsById(id);
    }
}