package apartment.example.backend.entity;

import apartment.example.backend.entity.enums.RentalRequestStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rental_requests")
@Data
public class RentalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    // Link to authenticated user who created the request
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;

    @Column(name = "unit_id", nullable = false, insertable = false, updatable = false)
    private Long unitId;

    // Fetch the unit for calculating monthlyRent and totalAmount
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Unit unit;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String occupation;

    @Column(name = "emergency_contact", length = 255)
    private String emergencyContact;

    @Column(name = "emergency_phone", length = 20)
    private String emergencyPhone;

    @Column(name = "lease_duration_months", nullable = false)
    private Integer leaseDurationMonths;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalRequestStatus status = RentalRequestStatus.PENDING;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "rejection_acknowledged_at")
    private LocalDateTime rejectionAcknowledgedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Calculated fields for API compatibility
    @Transient
    public BigDecimal getMonthlyRent() {
        return unit != null ? unit.getRentAmount() : null;
    }

    @Transient
    public BigDecimal getTotalAmount() {
        if (unit != null && leaseDurationMonths != null) {
            return unit.getRentAmount().multiply(BigDecimal.valueOf(leaseDurationMonths));
        }
        return null;
    }

    /**
     * Check if rejection has been acknowledged by the user
     * @return true if rejection was acknowledged, false otherwise
     */
    @Transient
    public boolean isRejectionAcknowledged() {
        return rejectionAcknowledgedAt != null;
    }

    /**
     * Check if user needs to acknowledge rejection before making new booking
     * @return true if status is REJECTED and not yet acknowledged
     */
    @Transient
    public boolean requiresAcknowledgement() {
        return status == RentalRequestStatus.REJECTED && !isRejectionAcknowledged();
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (requestDate == null) {
            requestDate = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}