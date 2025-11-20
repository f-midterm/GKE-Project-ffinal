package apartment.example.backend.entity;

import apartment.example.backend.entity.enums.BillingCycle;
import apartment.example.backend.entity.enums.LeaseStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "leases", indexes = {
    @Index(name = "idx_tenant", columnList = "tenant_id"),
    @Index(name = "idx_unit", columnList = "unit_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_dates", columnList = "start_date, end_date")
})
@Data
public class Lease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Unit unit;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "monthly_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal rentAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false)
    private BillingCycle billingCycle = BillingCycle.MONTHLY;

    @Column(name = "deposit_amount", precision = 10, scale = 2)
    private BigDecimal securityDeposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaseStatus status = LeaseStatus.ACTIVE;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "lease", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("lease-payments")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Payment> payments;

    @OneToMany(mappedBy = "lease", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Invoice> invoices;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Convenience methods for LeaseService compatibility
    public LocalDate getLeaseStartDate() {
        return this.startDate;
    }

    public void setLeaseStartDate(LocalDate leaseStartDate) {
        this.startDate = leaseStartDate;
    }

    public LocalDate getLeaseEndDate() {
        return this.endDate;
    }

    public void setLeaseEndDate(LocalDate leaseEndDate) {
        this.endDate = leaseEndDate;
    }
}