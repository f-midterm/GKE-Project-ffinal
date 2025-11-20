package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for unit price change response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePriceResponse {
    
    private Long unitId;
    private String roomNumber;
    private BigDecimal oldPrice;
    private BigDecimal newPrice;
    private LocalDate effectiveFrom;
    private String message;
    private Boolean hasActiveLeases;
}
