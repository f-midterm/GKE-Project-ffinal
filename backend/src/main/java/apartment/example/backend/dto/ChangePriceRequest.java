package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for changing unit price
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePriceRequest {
    
    private BigDecimal newPrice;
    private LocalDate effectiveFrom;
    private String reason;
    private String notes;
}
