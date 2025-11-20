package apartment.example.backend.dto;

import apartment.example.backend.entity.MaintenanceRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequestDTO {
    private Long id;
    private Long tenantId;
    private Long unitId;
    private String title;
    private String description;
    private String priority;
    private String category;
    private String urgency;
    private String preferredTime;
    private String preferredDate;
    private String status;
    private Long assignedToUserId;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private String completionNotes;
    private String attachmentUrls;  // Add attachment URLs
    private LocalDateTime submittedDate;
    private LocalDateTime completedDate;
    
    // Additional fields
    private String roomNumber;
    private String tenantName;
    private String unitType;
    private Boolean isFromSchedule;
    private Long scheduleId;
    private String scheduleStartDate;  // Schedule's start date for date range restriction
    private String scheduleEndDate;    // Schedule's end date for date range restriction
    
    public static MaintenanceRequestDTO fromEntity(MaintenanceRequest request, String roomNumber, String tenantName, String unitType) {
        MaintenanceRequestDTO dto = new MaintenanceRequestDTO();
        dto.setId(request.getId());
        dto.setTenantId(request.getTenantId());
        dto.setUnitId(request.getUnitId());
        dto.setTitle(request.getTitle());
        dto.setDescription(request.getDescription());
        dto.setPriority(request.getPriority() != null ? request.getPriority().name() : null);
        dto.setCategory(request.getCategory() != null ? request.getCategory().name() : null);
        dto.setUrgency(request.getUrgency() != null ? request.getUrgency().name() : null);
        
        // Split preferredTime "2025-11-20 08:00" into date and time
        String preferredTimeStr = request.getPreferredTime();
        if (preferredTimeStr != null && preferredTimeStr.contains(" ")) {
            String[] parts = preferredTimeStr.split(" ", 2);
            dto.setPreferredDate(parts[0]);  // "2025-11-20"
            dto.setPreferredTime(parts[1]);  // "08:00"
        } else {
            dto.setPreferredTime(preferredTimeStr);
            dto.setPreferredDate(null);
        }
        
        dto.setStatus(request.getStatus() != null ? request.getStatus().name() : null);
        dto.setAssignedToUserId(request.getAssignedToUserId());
    dto.setEstimatedCost(request.getEstimatedCost());
    dto.setActualCost(request.getActualCost());
        dto.setCompletionNotes(request.getCompletionNotes());
        dto.setAttachmentUrls(request.getAttachmentUrls());  // Add attachment URLs
        dto.setSubmittedDate(request.getSubmittedDate());
        dto.setCompletedDate(request.getCompletedDate());
        dto.setRoomNumber(roomNumber);
        dto.setTenantName(tenantName);
        dto.setUnitType(unitType);
        dto.setIsFromSchedule(request.getIsFromSchedule());
        dto.setScheduleId(request.getScheduleId());
        return dto;
    }
}
