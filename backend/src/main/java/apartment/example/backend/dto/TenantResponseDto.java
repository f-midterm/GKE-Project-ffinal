package apartment.example.backend.dto;

import apartment.example.backend.entity.enums.TenantStatus;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class TenantResponseDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String emergencyContact;
    private String emergencyPhone;
    private String occupation;
    private Long unitId;
    private LocalDate moveInDate;
    private LocalDate leaseEndDate;
    private BigDecimal monthlyRent;
    private TenantStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Note: Deliberately excluding leases field to break circular reference
}