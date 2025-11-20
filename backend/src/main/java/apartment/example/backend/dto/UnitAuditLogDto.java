package apartment.example.backend.dto;

import apartment.example.backend.entity.enums.UnitAuditActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Unit Audit Log responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitAuditLogDto {
    
    private Long id;
    private Long unitId;
    private String roomNumber;
    private UnitAuditActionType actionType;
    private String oldValues;  // JSON string
    private String newValues;  // JSON string
    private String description;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
    private String performedByUsername;
}
