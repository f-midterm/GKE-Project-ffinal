package apartment.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Schedule Info
    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category = Category.OTHER;

    // Recurrence Settings
    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false, length = 20)
    private RecurrenceType recurrenceType = RecurrenceType.ONE_TIME;

    @Column(name = "recurrence_interval")
    private Integer recurrenceInterval = 1;

    @Column(name = "recurrence_day_of_week")
    private Integer recurrenceDayOfWeek;  // 0-6 (Sunday-Saturday)

    @Column(name = "recurrence_day_of_month")
    private Integer recurrenceDayOfMonth;  // 1-31

    // Target Settings
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private TargetType targetType = TargetType.ALL_UNITS;

    @Column(name = "target_units", columnDefinition = "JSON")
    private String targetUnits;  // JSON string storing unit IDs, floor, or type

    // Timing
    @Column(name = "start_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @Column(name = "end_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    @Column(name = "next_trigger_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate nextTriggerDate;

    @Column(name = "last_triggered_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastTriggeredDate;

    // Notification Settings
    @Column(name = "notify_days_before")
    private Integer notifyDaysBefore = 3;

    @Column(name = "notify_users", columnDefinition = "JSON")
    private String notifyUsers;  // JSON array of user IDs

    // Template Settings
    @Column(name = "estimated_cost", precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priority priority = Priority.MEDIUM;

    // Status
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_paused")
    private Boolean isPaused = false;

    // Metadata
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    // Enums
    public enum Category {
        PLUMBING, ELECTRICAL, HVAC, APPLIANCE, STRUCTURAL, CLEANING, OTHER
    }

    public enum RecurrenceType {
        ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
    }

    public enum TargetType {
        ALL_UNITS, SPECIFIC_UNITS, FLOOR, UNIT_TYPE
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }

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
