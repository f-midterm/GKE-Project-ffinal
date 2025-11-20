package apartment.example.backend.dto;

import apartment.example.backend.entity.MaintenanceSchedule;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceScheduleDTO {
    private Long id;
    
    // Schedule Info
    private String title;
    private String description;
    private String category;
    
    // Recurrence Settings
    private String recurrenceType;
    private Integer recurrenceInterval;
    private Integer recurrenceDayOfWeek;
    private Integer recurrenceDayOfMonth;
    
    // Target Settings
    private String targetType;
    private String targetUnits;  // JSON string - will be parsed based on targetType
    
    // Timing
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate nextTriggerDate;
    private LocalDate lastTriggeredDate;
    
    // Notification Settings
    private Integer notifyDaysBefore;
    private String notifyUsers;  // JSON string
    
    // Template Settings
    private BigDecimal estimatedCost;
    private Long assignedToUserId;
    private String assignedToName;
    private String priority;
    
    // Status
    private Boolean isActive;
    private Boolean isPaused;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdByUserId;
    private String createdByName;
    
    // Statistics (optional)
    private Integer totalTriggered;
    private LocalDate lastCompletedDate;
}
