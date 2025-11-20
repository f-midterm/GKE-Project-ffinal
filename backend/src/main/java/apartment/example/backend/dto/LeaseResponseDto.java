package apartment.example.backend.dto;

import apartment.example.backend.entity.enums.BillingCycle;
import apartment.example.backend.entity.enums.LeaseStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LeaseResponseDto {
    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentAmount;
    private BillingCycle billingCycle;
    private BigDecimal securityDeposit;
    private LeaseStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Unit information
    private UnitDto unit;
    
    @Data
    public static class UnitDto {
        private Long id;
        private String roomNumber;
        private Integer floor;
        private String status;
        private String type;
        private BigDecimal rentAmount;
        private BigDecimal sizeSqm;
        private String description;
    }
}