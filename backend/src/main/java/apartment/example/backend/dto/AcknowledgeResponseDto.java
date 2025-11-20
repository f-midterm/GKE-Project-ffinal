package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for rejection acknowledgement
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcknowledgeResponseDto {
    
    private Long requestId;
    private LocalDateTime acknowledgedAt;
    private String message;
    private Boolean canCreateNewRequest;
}
