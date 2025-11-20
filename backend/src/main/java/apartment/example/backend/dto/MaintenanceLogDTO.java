package apartment.example.backend.dto;

import apartment.example.backend.entity.MaintenanceLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceLogDTO {
    private Long id;
    
    // References
    private Long scheduleId;
    private String scheduleTitle;
    private Long requestId;
    private String requestTitle;
    
    // Action Info
    private String actionType;
    private String actionDescription;
    
    // Change Tracking
    private String fieldName;
    private String previousValue;
    private String newValue;
    
    // Metadata
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private String createdByName;
    private String ipAddress;
}
