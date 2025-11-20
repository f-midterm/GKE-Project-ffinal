package apartment.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // References
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private MaintenanceSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private MaintenanceRequest request;

    // Action Info
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private ActionType actionType;

    @Column(name = "action_description", columnDefinition = "TEXT")
    private String actionDescription;

    // Change Tracking
    @Column(name = "field_name", length = 100)
    private String fieldName;

    @Column(name = "previous_value", columnDefinition = "JSON")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "JSON")
    private String newValue;

    // Metadata
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    // Enums
    public enum ActionType {
        SCHEDULE_CREATED,
        SCHEDULE_UPDATED,
        SCHEDULE_DELETED,
        SCHEDULE_ACTIVATED,
        SCHEDULE_DEACTIVATED,
        SCHEDULE_PAUSED,
        SCHEDULE_RESUMED,
        SCHEDULE_TRIGGERED,
        REQUEST_CREATED_FROM_SCHEDULE,
        REQUEST_UPDATED,
        REQUEST_STATUS_CHANGED,
        REQUEST_ASSIGNED,
        REQUEST_COMPLETED,
        NOTIFICATION_SENT
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
