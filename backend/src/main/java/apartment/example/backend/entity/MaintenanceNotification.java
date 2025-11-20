package apartment.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "maintenance_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Notification Type
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType notificationType;

    // Message Content
    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    // References
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private MaintenanceSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private MaintenanceRequest request;

    // Status
    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // Metadata
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = ZonedDateTime.now(ZoneId.of("Asia/Bangkok")).toLocalDateTime();

    // Enums
    public enum NotificationType {
        UPCOMING_MAINTENANCE,
        OVERDUE,
        STATUS_CHANGE,
        COMPLETED,
        SCHEDULE_REMINDER,
        ASSIGNED,
        GENERAL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = ZonedDateTime.now(ZoneId.of("Asia/Bangkok")).toLocalDateTime();
    }
}
