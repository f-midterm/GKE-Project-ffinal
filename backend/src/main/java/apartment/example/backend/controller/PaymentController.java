package apartment.example.backend.controller;

import apartment.example.backend.dto.PaymentResponseDto;
import apartment.example.backend.entity.Payment;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.Tenant;
import apartment.example.backend.entity.Unit;
import apartment.example.backend.entity.enums.PaymentStatus;
import apartment.example.backend.entity.enums.PaymentType;
import apartment.example.backend.entity.enums.UnitStatus;
import apartment.example.backend.service.PaymentService;
import apartment.example.backend.service.LeaseService;
import apartment.example.backend.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final LeaseService leaseService;
    private final TenantService tenantService;

    @GetMapping
    public ResponseEntity<List<PaymentResponseDto>> getAllPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/monthly-summary")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyPaymentSummary(
            @RequestParam(required = false) String month) {
        try {
            List<Payment> allPayments = paymentService.getAllPayments();
            
            // Filter payments for OCCUPIED units only
            List<Payment> occupiedUnitPayments = allPayments.stream()
                .filter(payment -> payment.getLease().getUnit().getStatus() == UnitStatus.OCCUPIED)
                .collect(Collectors.toList());
            
            // If month parameter is provided, filter by month
            if (month != null && !month.isEmpty()) {
                occupiedUnitPayments = occupiedUnitPayments.stream()
                    .filter(payment -> payment.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM")).equals(month))
                    .collect(Collectors.toList());
            }
            
            // Group payments by tenant and month
            Map<String, Map<String, List<Payment>>> groupedPayments = occupiedUnitPayments.stream()
                .collect(Collectors.groupingBy(
                    payment -> payment.getLease().getTenant().getEmail(),
                    Collectors.groupingBy(payment -> 
                        payment.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                    )
                ));
            
            List<Map<String, Object>> monthlySummaries = new ArrayList<>();
            
            for (Map.Entry<String, Map<String, List<Payment>>> tenantEntry : groupedPayments.entrySet()) {
                String tenantEmail = tenantEntry.getKey();
                
                for (Map.Entry<String, List<Payment>> monthEntry : tenantEntry.getValue().entrySet()) {
                    String monthKey = monthEntry.getKey();
                    List<Payment> monthPayments = monthEntry.getValue();
                    
                    BigDecimal totalAmount = monthPayments.stream()
                        .map(Payment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    boolean allPaid = monthPayments.stream()
                        .allMatch(p -> p.getStatus() == PaymentStatus.PAID);
                    
                    // Create breakdown for frontend
                    List<Map<String, Object>> breakdown = monthPayments.stream()
                        .map(payment -> {
                            Map<String, Object> paymentBreakdown = new HashMap<>();
                            paymentBreakdown.put("id", payment.getId());
                            paymentBreakdown.put("type", payment.getPaymentType().toString());
                            paymentBreakdown.put("amount", payment.getAmount());
                            paymentBreakdown.put("status", payment.getStatus().toString());
                            paymentBreakdown.put("dueDate", payment.getDueDate().toString());
                            return paymentBreakdown;
                        })
                        .collect(Collectors.toList());
                    
                    // Safely extract tenant information with null checks
                    Payment firstPayment = monthPayments.get(0);
                    Lease lease = firstPayment.getLease();
                    Tenant tenant = lease != null ? lease.getTenant() : null;
                    Unit unit = lease != null ? lease.getUnit() : null;
                    
                    String tenantName = "Unknown Tenant";
                    if (tenant != null) {
                        String firstName = Optional.ofNullable(tenant.getFirstName()).orElse("");
                        String lastName = Optional.ofNullable(tenant.getLastName()).orElse("");
                        tenantName = (firstName + " " + lastName).trim();
                        if (tenantName.isEmpty()) {
                            tenantName = "Unknown Tenant";
                        }
                    }
                    
                    String unitNumber = unit != null ? unit.getRoomNumber() : "N/A";
                    
                    Map<String, Object> summary = new HashMap<>();
                    summary.put("tenantEmail", tenantEmail);
                    summary.put("tenantName", tenantName);
                    summary.put("unitNumber", unitNumber);
                    summary.put("month", monthKey);
                    summary.put("totalAmount", totalAmount);
                    summary.put("paymentCount", monthPayments.size());
                    summary.put("allPaid", allPaid);
                    summary.put("status", allPaid ? "COMPLETED" : "PENDING");
                    summary.put("breakdown", breakdown);
                    
                    monthlySummaries.add(summary);
                }
            }
            
            // Sort by month descending
            monthlySummaries.sort((a, b) -> 
                ((String) b.get("month")).compareTo((String) a.get("month"))
            );
            
            return ResponseEntity.ok(monthlySummaries);
        } catch (Exception e) {
            log.error("Error getting monthly payment summary: {}", e.getMessage());
            return ResponseEntity.ok(new ArrayList<>()); // Return empty list on error
        }
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<PaymentResponseDto>> getAllPayments(Pageable pageable) {
        Page<Payment> payments = paymentService.getAllPayments(pageable);
        Page<PaymentResponseDto> paymentDtos = payments.map(this::convertToPaymentDto);
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/active-leases")
    public ResponseEntity<List<Map<String, Object>>> getActiveLeasesForBilling() {
        try {
            List<Lease> activeLeases = leaseService.getActiveLeases();
            
            // Filter leases for OCCUPIED units only
            List<Map<String, Object>> leaseData = activeLeases.stream()
                .filter(lease -> lease.getUnit().getStatus() == UnitStatus.OCCUPIED)
                .map(lease -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("leaseId", lease.getId());
                    data.put("tenantName", lease.getTenant().getFirstName() + " " + lease.getTenant().getLastName());
                    data.put("tenantEmail", lease.getTenant().getEmail());
                    data.put("unitNumber", lease.getUnit().getRoomNumber());
                    data.put("monthlyRent", lease.getRentAmount());
                    data.put("unitType", lease.getUnit().getUnitType());
                    
                    return data;
                }).collect(Collectors.toList());
            
            return ResponseEntity.ok(leaseData);
        } catch (Exception e) {
            log.error("Error getting active leases: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponseDto> getPaymentById(@PathVariable Long id) {
        return paymentService.getPaymentById(id)
                .map(payment -> ResponseEntity.ok(convertToPaymentDto(payment)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lease/{leaseId}")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByLease(@PathVariable Long leaseId) {
        List<Payment> payments = paymentService.getPaymentsByLease(leaseId);
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByStatus(@PathVariable PaymentStatus status) {
        List<Payment> payments = paymentService.getPaymentsByStatus(status);
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByType(@PathVariable PaymentType type) {
        List<Payment> payments = paymentService.getPaymentsByType(type);
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/unit/{unitId}")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByUnit(@PathVariable Long unitId) {
        List<Payment> payments = paymentService.getPaymentsByUnit(unitId);
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByTenant(@PathVariable Long tenantId) {
        List<Payment> payments = paymentService.getPaymentsByTenant(tenantId);
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<PaymentResponseDto>> getOverduePayments() {
        List<Payment> payments = paymentService.getOverduePayments();
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/due-between")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsDueBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Payment> payments = paymentService.getPaymentsDueBetween(startDate, endDate);
        List<PaymentResponseDto> paymentDtos = payments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDtos);
    }

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        BigDecimal totalRevenue = paymentService.getTotalRevenueByDateRange(startDate, endDate);
        Map<String, Object> response = Map.of(
            "startDate", startDate,
            "endDate", endDate,
            "totalRevenue", totalRevenue
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/monthly-delete")
    public ResponseEntity<Map<String, Object>> deleteMonthlyPayment(@RequestBody Map<String, Object> request) {
        try {
            String tenantEmail = (String) request.get("tenantEmail");
            String month = (String) request.get("month");
            String unitNumber = (String) request.get("unitNumber");
            
            log.info("Deleting monthly payment for tenant: {}, month: {}, unit: {}", tenantEmail, month, unitNumber);
            
            // Find all payments for this tenant and month
            List<Payment> allPayments = paymentService.getAllPayments();
            List<Payment> monthlyPayments = allPayments.stream()
                .filter(payment -> {
                    if (payment.getLease() == null || payment.getLease().getTenant() == null) {
                        return false;
                    }
                    String paymentMonth = payment.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                    String paymentTenantEmail = payment.getLease().getTenant().getEmail();
                    String paymentUnitNumber = payment.getLease().getUnit().getRoomNumber();
                    
                    return paymentMonth.equals(month) && 
                           paymentTenantEmail.equals(tenantEmail) &&
                           paymentUnitNumber.equals(unitNumber);
                })
                .collect(Collectors.toList());
            
            if (monthlyPayments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No payments found for the specified criteria"));
            }
            
            // Check if any payments are already paid
            boolean hasPaidPayments = monthlyPayments.stream()
                .anyMatch(payment -> payment.getStatus() == PaymentStatus.PAID);
            
            if (hasPaidPayments) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete paid payment"));
            }
            
            // Delete all payments
            for (Payment payment : monthlyPayments) {
                paymentService.deletePayment(payment.getId());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Monthly payments deleted successfully");
            response.put("tenantEmail", tenantEmail);
            response.put("month", month);
            response.put("unitNumber", unitNumber);
            response.put("deletedCount", monthlyPayments.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting monthly payment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to delete monthly payment: " + e.getMessage()));
        }
    }

    @PutMapping("/monthly/{tenantEmail}/{month}")
    public ResponseEntity<Map<String, Object>> updateMonthlyPayment(
            @PathVariable String tenantEmail,
            @PathVariable String month,
            @RequestBody Map<String, Object> request) {
        try {
            Double totalAmount = Double.valueOf(request.get("totalAmount").toString());
            String status = (String) request.get("status");
            String notes = (String) request.get("notes");
            
            log.info("Updating monthly payment for tenant: {}, month: {}", tenantEmail, month);
            
            // Find all payments for this tenant and month
            List<Payment> allPayments = paymentService.getAllPayments();
            List<Payment> monthlyPayments = allPayments.stream()
                .filter(payment -> {
                    if (payment.getLease() == null || payment.getLease().getTenant() == null) {
                        return false;
                    }
                    String paymentMonth = payment.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                    String paymentTenantEmail = payment.getLease().getTenant().getEmail();
                    
                    return paymentMonth.equals(month) && paymentTenantEmail.equals(tenantEmail);
                })
                .collect(Collectors.toList());
            
            if (monthlyPayments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No payments found for the specified criteria"));
            }
            
            // Update each payment with new status and notes, and distribute the total amount
            BigDecimal newTotal = BigDecimal.valueOf(totalAmount);
            BigDecimal amountPerPayment = newTotal.divide(BigDecimal.valueOf(monthlyPayments.size()), 2, RoundingMode.HALF_UP);
            
            PaymentStatus paymentStatus;
            try {
                paymentStatus = PaymentStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + status));
            }
            
            for (int i = 0; i < monthlyPayments.size(); i++) {
                Payment payment = monthlyPayments.get(i);
                
                // For the last payment, add any remainder to avoid rounding issues
                if (i == monthlyPayments.size() - 1) {
                    BigDecimal totalAssigned = amountPerPayment.multiply(BigDecimal.valueOf(i));
                    payment.setAmount(newTotal.subtract(totalAssigned));
                } else {
                    payment.setAmount(amountPerPayment);
                }
                
                payment.setStatus(paymentStatus);
                if (notes != null && !notes.trim().isEmpty()) {
                    payment.setNotes(notes);
                }
                
                // If marking as PAID, set payment date
                if (paymentStatus == PaymentStatus.PAID && payment.getPaidDate() == null) {
                    payment.setPaidDate(LocalDate.now());
                }
                
                paymentService.updatePayment(payment.getId(), payment);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Monthly payments updated successfully");
            response.put("tenantEmail", tenantEmail);
            response.put("month", month);
            response.put("updatedCount", monthlyPayments.size());
            response.put("newTotalAmount", totalAmount);
            response.put("newStatus", status);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating monthly payment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update monthly payment: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<PaymentResponseDto> createPayment(@RequestBody Payment payment) {
        try {
            Payment createdPayment = paymentService.createPayment(payment);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToPaymentDto(createdPayment));
        } catch (Exception e) {
            log.error("Error creating payment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/create-bill")
    public ResponseEntity<PaymentResponseDto> createBillByAdmin(
            @RequestParam Long leaseId,
            @RequestParam PaymentType paymentType,
            @RequestParam BigDecimal amount,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDate,
            @RequestParam(required = false) String description) {
        try {
            Payment bill = paymentService.createBillByAdmin(leaseId, paymentType, amount, dueDate, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToPaymentDto(bill));
        } catch (Exception e) {
            log.error("Error creating bill: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentResponseDto> updatePayment(@PathVariable Long id, @RequestBody Payment payment) {
        try {
            Payment updatedPayment = paymentService.updatePayment(id, payment);
            return ResponseEntity.ok(convertToPaymentDto(updatedPayment));
        } catch (IllegalArgumentException e) {
            log.error("Error updating payment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error updating payment: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/mark-paid")
    public ResponseEntity<PaymentResponseDto> markAsPaid(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> request) {
        try {
            LocalDate paidDate = request.get("paidDate") != null ? 
                LocalDate.parse(request.get("paidDate").toString()) : LocalDate.now();
            String paymentMethod = (String) request.get("paymentMethod");
            String notes = (String) request.get("notes");
            
            Payment paidPayment = paymentService.markAsPaid(id, paidDate, paymentMethod, notes);
            return ResponseEntity.ok(convertToPaymentDto(paidPayment));
        } catch (IllegalArgumentException e) {
            log.error("Error marking payment as paid: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error marking payment as paid: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/mark-partial")
    public ResponseEntity<PaymentResponseDto> markAsPartial(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> request) {
        try {
            BigDecimal paidAmount = new BigDecimal(request.get("paidAmount").toString());
            String notes = (String) request.get("notes");
            
            Payment partialPayment = paymentService.markAsPartial(id, paidAmount, notes);
            return ResponseEntity.ok(convertToPaymentDto(partialPayment));
        } catch (IllegalArgumentException e) {
            log.error("Error marking payment as partial: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error marking payment as partial: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/mark-overdue")
    public ResponseEntity<String> markOverduePayments() {
        try {
            paymentService.markOverduePayments();
            return ResponseEntity.ok("Overdue payments marked successfully");
        } catch (Exception e) {
            log.error("Error marking overdue payments: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Error marking overdue payments");
        }
    }

    @PostMapping("/mark-monthly-paid")
    public ResponseEntity<Map<String, Object>> markMonthlyPaymentAsPaid(@RequestBody Map<String, Object> request) {
        try {
            String tenantEmail = (String) request.get("tenantEmail");
            String month = (String) request.get("month");
            String unitNumber = (String) request.get("unitNumber");
            String transactionNumber = (String) request.get("transactionNumber");
            String transactionDate = (String) request.get("transactionDate");
            String transactionTime = (String) request.get("transactionTime");
            String notes = (String) request.get("notes");
            
            log.info("Marking monthly payment as paid for tenant: {}, month: {}, unit: {}, transaction: {}", 
                     tenantEmail, month, unitNumber, transactionNumber);
            
            // Find all payments for this tenant and month
            List<Payment> allPayments = paymentService.getAllPayments();
            List<Payment> monthlyPayments = allPayments.stream()
                .filter(payment -> {
                    if (payment.getLease() == null || payment.getLease().getTenant() == null) {
                        return false;
                    }
                    String paymentMonth = payment.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                    String paymentTenantEmail = payment.getLease().getTenant().getEmail();
                    String paymentUnitNumber = payment.getLease().getUnit().getRoomNumber();
                    
                    return paymentMonth.equals(month) && 
                           paymentTenantEmail.equals(tenantEmail) &&
                           paymentUnitNumber.equals(unitNumber);
                })
                .collect(Collectors.toList());
            
            if (monthlyPayments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No payments found for the specified criteria"));
            }
            
            // Create payment notes with transaction details
            String paymentNotes = String.format("Paid via bank transfer - Transaction #%s on %s at %s%s", 
                                               transactionNumber, 
                                               transactionDate, 
                                               transactionTime,
                                               notes != null && !notes.trim().isEmpty() ? "\nNotes: " + notes : "");
            
            // Mark all payments as paid
            List<Map<String, Object>> breakdown = new ArrayList<>();
            for (Payment payment : monthlyPayments) {
                Payment paidPayment = paymentService.markAsPaid(payment.getId(), LocalDate.now(), "BANK_TRANSFER", paymentNotes);
                
                Map<String, Object> paymentBreakdown = new HashMap<>();
                paymentBreakdown.put("id", paidPayment.getId());
                paymentBreakdown.put("type", paidPayment.getPaymentType().toString());
                paymentBreakdown.put("amount", paidPayment.getAmount());
                paymentBreakdown.put("status", paidPayment.getStatus().toString());
                paymentBreakdown.put("transactionNumber", transactionNumber);
                breakdown.add(paymentBreakdown);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Monthly payments marked as paid successfully");
            response.put("tenantEmail", tenantEmail);
            response.put("month", month);
            response.put("unitNumber", unitNumber);
            response.put("transactionNumber", transactionNumber);
            response.put("transactionDate", transactionDate);
            response.put("transactionTime", transactionTime);
            response.put("breakdown", breakdown);
            response.put("totalPayments", monthlyPayments.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking monthly payment as paid: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to mark monthly payment as paid: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error deleting payment: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error deleting payment: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> checkPaymentExists(@PathVariable Long id) {
        boolean exists = paymentService.existsById(id);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/villager/history/{email}")
    public ResponseEntity<List<Map<String, Object>>> getVillagerPaymentHistory(@PathVariable String email) {
        try {
            log.info("Getting payment history for villager email: {}", email);
            
            List<Payment> allPayments = paymentService.getAllPayments();
            
            // Filter payments for this specific tenant
            List<Payment> tenantPayments = allPayments.stream()
                .filter(payment -> {
                    if (payment.getLease() == null || payment.getLease().getTenant() == null) {
                        return false;
                    }
                    return payment.getLease().getTenant().getEmail().equals(email);
                })
                .sorted((a, b) -> b.getDueDate().compareTo(a.getDueDate())) // Most recent first
                .collect(Collectors.toList());
            
            // Group by month and create monthly summaries
            Map<String, List<Payment>> monthlyPayments = tenantPayments.stream()
                .collect(Collectors.groupingBy(payment -> 
                    payment.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                ));
            
            List<Map<String, Object>> paymentHistory = new ArrayList<>();
            
            for (Map.Entry<String, List<Payment>> entry : monthlyPayments.entrySet()) {
                String month = entry.getKey();
                List<Payment> monthPayments = entry.getValue();
                
                BigDecimal totalAmount = monthPayments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                boolean allPaid = monthPayments.stream()
                    .allMatch(p -> p.getStatus() == PaymentStatus.PAID);
                
                LocalDate paidDate = monthPayments.stream()
                    .filter(p -> p.getPaidDate() != null)
                    .map(Payment::getPaidDate)
                    .max(LocalDate::compareTo)
                    .orElse(null);
                
                Map<String, Object> monthlyRecord = new HashMap<>();
                monthlyRecord.put("month", month);
                monthlyRecord.put("monthDisplay", formatMonthDisplay(month));
                monthlyRecord.put("totalAmount", totalAmount);
                monthlyRecord.put("status", allPaid ? "PAID" : "PENDING");
                monthlyRecord.put("paidDate", paidDate);
                monthlyRecord.put("paidDateDisplay", paidDate != null ? formatDateDisplay(paidDate) : null);
                monthlyRecord.put("paymentCount", monthPayments.size());
                
                // Add breakdown details
                List<Map<String, Object>> breakdown = monthPayments.stream()
                    .map(payment -> {
                        Map<String, Object> paymentDetail = new HashMap<>();
                        paymentDetail.put("id", payment.getId());
                        paymentDetail.put("type", payment.getPaymentType().toString());
                        paymentDetail.put("amount", payment.getAmount());
                        paymentDetail.put("status", payment.getStatus().toString());
                        paymentDetail.put("dueDate", payment.getDueDate());
                        paymentDetail.put("paidDate", payment.getPaidDate());
                        return paymentDetail;
                    })
                    .collect(Collectors.toList());
                
                monthlyRecord.put("breakdown", breakdown);
                    // Include unit number and tenant email for frontend
                    monthlyRecord.put("unitNumber", monthPayments.get(0).getLease().getUnit().getRoomNumber());
                    monthlyRecord.put("tenantEmail", monthPayments.get(0).getLease().getTenant().getEmail());
                paymentHistory.add(monthlyRecord);
            }
            
            // Sort by month descending (most recent first)
            paymentHistory.sort((a, b) -> ((String) b.get("month")).compareTo((String) a.get("month")));
            
            return ResponseEntity.ok(paymentHistory);
        } catch (Exception e) {
            log.error("Error getting villager payment history: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ArrayList<>());
        }
    }

    private String formatMonthDisplay(String yearMonth) {
        try {
            LocalDate date = LocalDate.parse(yearMonth + "-01");
            return date.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
        } catch (Exception e) {
            return yearMonth;
        }
    }

    private String formatDateDisplay(LocalDate date) {
        return date.format(DateTimeFormatter.ofPattern("MMM d, yyyy"));
    }

    @PostMapping("/bulk-create")
    public ResponseEntity<Map<String, Object>> createBulkPayments(@RequestBody Map<String, Object> request) {
        try {
            List<Map<String, Object>> payments = (List<Map<String, Object>>) request.get("payments");
            String month = (String) request.get("month");
            
            List<Payment> createdPayments = new ArrayList<>();
            
            for (Map<String, Object> paymentData : payments) {
                Long leaseId = Long.valueOf(paymentData.get("leaseId").toString());
                String paymentType = (String) paymentData.get("paymentType");
                BigDecimal amount = new BigDecimal(paymentData.get("amount").toString());
                String dueDate = (String) paymentData.get("dueDate");
                String notes = (String) paymentData.getOrDefault("notes", "");
                
                Payment payment = new Payment();
                Lease lease = leaseService.getLeaseById(leaseId).orElseThrow(() -> 
                    new RuntimeException("Lease not found"));
                payment.setLease(lease);
                payment.setPaymentType(PaymentType.valueOf(paymentType));
                payment.setAmount(amount);
                payment.setDueDate(LocalDate.parse(dueDate));
                payment.setStatus(PaymentStatus.PENDING);
                payment.setNotes(notes);
                
                Payment savedPayment = paymentService.createPayment(payment);
                createdPayments.add(savedPayment);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bills created successfully for " + month);
            response.put("createdCount", createdPayments.size());
            response.put("payments", createdPayments.stream()
                .map(this::convertToPaymentDto)
                .collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating bulk payments: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to create bills: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private PaymentResponseDto convertToPaymentDto(Payment payment) {
        PaymentResponseDto dto = new PaymentResponseDto();
        dto.setId(payment.getId());
        dto.setAmount(payment.getAmount());
        dto.setPaidAmount(payment.getAmount()); // For now, assuming full amount is paid when status is PAID
        dto.setStatus(payment.getStatus());
        dto.setPaymentType(payment.getPaymentType());
        dto.setType(payment.getPaymentType()); // Set alias for frontend compatibility
        dto.setDueDate(payment.getDueDate());
        dto.setPaidDate(payment.getPaidDate());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setDescription(payment.getNotes()); // Set alias for frontend compatibility
        dto.setNotes(payment.getNotes());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedAt(payment.getUpdatedAt());

        // Get lease information
        if (payment.getLease() != null) {
            Lease lease = payment.getLease();
            dto.setLeaseId(lease.getId());

            // Get tenant information
            if (lease.getTenant() != null) {
                Tenant tenant = lease.getTenant();
                PaymentResponseDto.TenantDto tenantDto = new PaymentResponseDto.TenantDto();
                tenantDto.setId(tenant.getId());
                tenantDto.setFirstName(tenant.getFirstName());
                tenantDto.setLastName(tenant.getLastName());
                tenantDto.setEmail(tenant.getEmail());
                tenantDto.setPhone(tenant.getPhone());
                dto.setTenant(tenantDto);
            }

            // Get unit information
            if (lease.getUnit() != null) {
                Unit unit = lease.getUnit();
                PaymentResponseDto.UnitDto unitDto = new PaymentResponseDto.UnitDto();
                unitDto.setId(unit.getId());
                unitDto.setRoomNumber(unit.getRoomNumber());
                unitDto.setFloor(unit.getFloor());
                unitDto.setType(unit.getUnitType());
                dto.setUnit(unitDto);
            }
        }

        return dto;
    }
}