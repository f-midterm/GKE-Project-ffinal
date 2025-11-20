package apartment.example.backend.entity;

import apartment.example.backend.entity.enums.TenantStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "tenants")
@Data
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "emergency_contact", nullable = false, length = 255)
    private String emergencyContact;

    @Column(name = "emergency_phone", nullable = false, length = 20)
    private String emergencyPhone;

    @Column(length = 100)
    private String occupation;

    // REMOVED: unitId (moved to Lease entity only - fixes data redundancy)
    // REMOVED: moveInDate (use leases.startDate)
    // REMOVED: leaseEndDate (use leases.endDate)
    // REMOVED: monthlyRent (use leases.monthlyRent)
    
    // Helper methods to get current lease info (from active lease)
    @Transient
    public Long getCurrentUnitId() {
        return leases != null ? leases.stream()
                .filter(l -> l.getStatus() == apartment.example.backend.entity.enums.LeaseStatus.ACTIVE)
                .findFirst()
                .map(Lease::getUnit)
                .map(Unit::getId)
                .orElse(null) : null;
    }
    
    @Transient
    public LocalDate getCurrentMoveInDate() {
        return leases != null ? leases.stream()
                .filter(l -> l.getStatus() == apartment.example.backend.entity.enums.LeaseStatus.ACTIVE)
                .findFirst()
                .map(Lease::getStartDate)
                .orElse(null) : null;
    }
    
    @Transient
    public LocalDate getCurrentLeaseEndDate() {
        return leases != null ? leases.stream()
                .filter(l -> l.getStatus() == apartment.example.backend.entity.enums.LeaseStatus.ACTIVE)
                .findFirst()
                .map(Lease::getEndDate)
                .orElse(null) : null;
    }
    
    @Transient
    public BigDecimal getCurrentMonthlyRent() {
        return leases != null ? leases.stream()
                .filter(l -> l.getStatus() == apartment.example.backend.entity.enums.LeaseStatus.ACTIVE)
                .findFirst()
                .map(Lease::getRentAmount)
                .orElse(null) : null;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantStatus status = TenantStatus.ACTIVE;

    // Relationships
    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Lease> leases;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;  // Soft delete support

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}