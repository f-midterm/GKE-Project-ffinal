package apartment.example.backend.dto;

import apartment.example.backend.entity.enums.PaymentStatus;
import apartment.example.backend.entity.enums.PaymentType;
import apartment.example.backend.entity.enums.PaymentMethod;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PaymentResponseDto {
    private Long id;
    private Long leaseId;
    private PaymentType paymentType;
    private PaymentType type; // Alias for paymentType for frontend compatibility
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String receiptNumber;
    private String description; // Alias for notes for frontend compatibility
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Tenant information
    private TenantDto tenant;
    
    // Unit information  
    private UnitDto unit;
    
    @Data
    public static class TenantDto {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
    }
    
    @Data
    public static class UnitDto {
        private Long id;
        private String roomNumber;
        private Integer floor;
        private String type;
    }
}