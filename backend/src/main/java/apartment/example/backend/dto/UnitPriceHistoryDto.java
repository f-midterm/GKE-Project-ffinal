package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Unit Price History responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitPriceHistoryDto {
    
    private Long id;
    private Long unitId;
    private String roomNumber;
    private BigDecimal rentAmount;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String changeReason;
    private String notes;
    private LocalDateTime createdAt;
    private String createdByUsername;
    private Boolean isCurrent;
    private Integer daysActive;
}
