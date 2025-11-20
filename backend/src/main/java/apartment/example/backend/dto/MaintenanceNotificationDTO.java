package apartment.example.backend.dto;

import apartment.example.backend.entity.MaintenanceNotification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceNotificationDTO {
    private Long id;
    
    // User
    private Long userId;
    private String userName;
    
    // Notification Type
    private String notificationType;
    
    // Message Content
    private String title;
    private String message;
    
    // References
    private Long scheduleId;
    private String scheduleTitle;
    private Long requestId;
    private String requestTitle;
    
    // Status
    private Boolean isRead;
    private LocalDateTime readAt;
    
    // Metadata
    private LocalDateTime createdAt;
}
