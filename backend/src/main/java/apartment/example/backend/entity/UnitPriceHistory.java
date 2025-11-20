package apartment.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity class for unit_price_history table
 * Tracks historical rent prices for each unit with effective date ranges
 */
@Entity
@Table(name = "unit_price_history")
@Data
public class UnitPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonBackReference("unit-price-history")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Unit unit;

    @Column(name = "rent_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal rentAmount;

    @Column(name = "effective_from", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;  // NULL = current price

    @Column(name = "change_reason")
    private String changeReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    @JsonBackReference("user-price-history")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Check if this price record is currently active
     */
    @Transient
    public boolean isCurrent() {
        return effectiveTo == null;
    }

    /**
     * Check if a specific date falls within this price's effective range
     */
    @Transient
    public boolean isEffectiveOn(LocalDateTime dateTime) {
        boolean afterStart = !dateTime.isBefore(effectiveFrom);
        boolean beforeEnd = effectiveTo == null || !dateTime.isAfter(effectiveTo);
        return afterStart && beforeEnd;
    }
}
