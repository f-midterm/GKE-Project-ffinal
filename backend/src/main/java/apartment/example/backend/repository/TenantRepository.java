package apartment.example.backend.repository;

import apartment.example.backend.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    
    @Query("SELECT t FROM Tenant t WHERE CONCAT(t.firstName, ' ', t.lastName) LIKE %:name%")
    List<Tenant> findByNameContainingIgnoreCase(@Param("name") String name);
    
    List<Tenant> findByPhoneContaining(String phone);
    
    List<Tenant> findByEmailContainingIgnoreCase(String email);
    
    Optional<Tenant> findByEmail(String email);
    
    // Removed: findByUnitId - tenants no longer have direct unit_id field
    // Use LeaseRepository to find tenants by unit instead
}