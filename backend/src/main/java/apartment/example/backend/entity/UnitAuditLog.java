package apartment.example.backend.entity;

import apartment.example.backend.entity.enums.UnitAuditActionType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Entity class for unit_audit_logs table
 * Complete audit trail of all changes made to units
 */
@Entity
@Table(name = "unit_audit_logs")
@Data
public class UnitAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonBackReference("unit-audit-log")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Unit unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private UnitAuditActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_values", columnDefinition = "json")
    private String oldValues;  // JSON string

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_values", columnDefinition = "json")
    private String newValues;  // JSON string

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    @JsonBackReference("user-audit-log")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
