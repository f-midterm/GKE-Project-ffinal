package apartment.example.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ApprovalRequest {
    private Long approvedByUserId;
    private LocalDate startDate;
    private LocalDate endDate;
}