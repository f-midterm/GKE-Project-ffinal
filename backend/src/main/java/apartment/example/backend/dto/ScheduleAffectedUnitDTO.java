package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleAffectedUnitDTO {
    private Long unitId;
    private String roomNumber;
    private String tenantName;
    private String tenantEmail;
    private String preferredDateTime; // Auto-generated time slot
    private Boolean isOccupied;
    private Boolean hasConflict; // Check if time slot conflicts with existing bookings
}
