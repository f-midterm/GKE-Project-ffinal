package apartment.example.backend.entity;

import apartment.example.backend.entity.enums.UnitStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "units")
@Data
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", unique = true, nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    private Integer floor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UnitStatus status = UnitStatus.AVAILABLE;

    @Column(name = "type", nullable = false)
    private String unitType;

    @Column(name = "rent_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal rentAmount;

    @Column(name = "size_sqm", precision = 8, scale = 2)
    private BigDecimal sizeSqm;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonBackReference("unit-lease")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Lease> leases;

    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonBackReference("unit-price-history")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<UnitPriceHistory> priceHistory;

    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonBackReference("unit-audit-log")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<UnitAuditLog> auditLogs;

    // Temporarily commented out due to JPA entity scanning issue
    // @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // @JsonManagedReference("unit-maintenance")
    // @ToString.Exclude
    // @EqualsAndHashCode.Exclude
    // private List<MaintenanceTask> maintenanceTasks;

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