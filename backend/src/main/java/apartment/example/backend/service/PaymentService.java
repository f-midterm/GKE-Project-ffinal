package apartment.example.backend.service;

import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.Payment;
import apartment.example.backend.entity.enums.PaymentStatus;
import apartment.example.backend.entity.enums.PaymentType;
import apartment.example.backend.repository.LeaseRepository;
import apartment.example.backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final LeaseRepository leaseRepository;

    /**
     * Get all payments with optimized query to prevent N+1 problem
     * Uses JOIN FETCH to eagerly load lease, tenant, and unit relationships
     */
    public List<Payment> getAllPayments() {
        return paymentRepository.findAllWithRelations();
    }

    public Page<Payment> getAllPayments(Pageable pageable) {
        return paymentRepository.findAll(pageable);
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    public List<Payment> getPaymentsByLease(Long leaseId) {
        return paymentRepository.findByLeaseId(leaseId);
    }

    public List<Payment> getPaymentsByStatus(PaymentStatus status) {
        return paymentRepository.findByStatus(status);
    }

    public List<Payment> getPaymentsByType(PaymentType paymentType) {
        return paymentRepository.findByPaymentType(paymentType);
    }

    public List<Payment> getPaymentsByUnit(Long unitId) {
        return paymentRepository.findByUnitId(unitId);
    }

    public List<Payment> getPaymentsByTenant(Long tenantId) {
        return paymentRepository.findByTenantId(tenantId);
    }

    public List<Payment> getOverduePayments() {
        return paymentRepository.findOverduePayments(LocalDate.now());
    }

    public List<Payment> getPaymentsDueBetween(LocalDate startDate, LocalDate endDate) {
        return paymentRepository.findPaymentsDueBetween(startDate, endDate);
    }

    public BigDecimal getTotalRevenueByDateRange(LocalDate startDate, LocalDate endDate) {
        Double revenue = paymentRepository.getTotalRevenueByDateRange(startDate, endDate);
        return revenue != null ? BigDecimal.valueOf(revenue) : BigDecimal.ZERO;
    }

    public Payment createPayment(Payment payment) {
        // Generate receipt number if not provided
        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isEmpty()) {
            payment.setReceiptNumber(generateReceiptNumber(payment.getPaymentType()));
        }

        log.info("Creating new payment: {} for lease ID: {}", 
                payment.getPaymentType(), payment.getLease().getId());
        return paymentRepository.save(payment);
    }

    public Payment createBillByAdmin(Long leaseId, PaymentType paymentType, BigDecimal amount, LocalDate dueDate, String description) {
        // Find the lease
        Lease lease = leaseRepository.findById(leaseId)
            .orElseThrow(() -> new RuntimeException("Lease not found with id: " + leaseId));

        // Create new payment/bill
        Payment payment = new Payment();
        payment.setLease(lease);
        payment.setPaymentType(paymentType);
        payment.setAmount(amount);
        payment.setDueDate(dueDate);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setNotes(description);

        // Generate receipt number
        payment.setReceiptNumber(generateReceiptNumber(paymentType));

        log.info("Admin creating {} bill of {} for lease ID: {}", paymentType, amount, leaseId);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment markAsPaid(Long paymentId, LocalDate paidDate, String paymentMethod, String notes) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("Payment is already marked as paid");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidDate(paidDate);
        if (paymentMethod != null) {
            payment.setPaymentMethod(
                apartment.example.backend.entity.enums.PaymentMethod.valueOf(paymentMethod.toUpperCase())
            );
        }
        if (notes != null) {
            payment.setNotes(payment.getNotes() + "\nPayment Notes: " + notes);
        }

        // Generate receipt number if not exists
        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isEmpty()) {
            payment.setReceiptNumber(generateReceiptNumber(payment.getPaymentType()));
        }

        log.info("Marked payment as paid: {} for lease ID: {}", 
                payment.getPaymentType(), payment.getLease().getId());
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment markAsPartial(Long paymentId, BigDecimal paidAmount, String notes) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("Payment is already marked as paid");
        }

        if (paidAmount.compareTo(payment.getAmount()) >= 0) {
            throw new IllegalArgumentException("Paid amount should be less than total amount for partial payment");
        }

        payment.setStatus(PaymentStatus.PARTIAL);
        if (notes != null) {
            payment.setNotes(payment.getNotes() + "\nPartial Payment: " + paidAmount + " - " + notes);
        }

        log.info("Marked payment as partial: {} for lease ID: {}", 
                payment.getPaymentType(), payment.getLease().getId());
        return paymentRepository.save(payment);
    }

    @Transactional
    public void markOverduePayments() {
        List<Payment> overduePayments = getOverduePayments();
        for (Payment payment : overduePayments) {
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.OVERDUE);
                log.info("Marked payment as overdue: {} for lease ID: {}", 
                        payment.getPaymentType(), payment.getLease().getId());
            }
        }
        paymentRepository.saveAll(overduePayments);
    }

    public Payment updatePayment(Long id, Payment paymentDetails) {
        Payment payment = paymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));

        // Allow updates to paid payments for administrative purposes
        // Business logic validation should be handled at the controller level
        
        payment.setPaymentType(paymentDetails.getPaymentType());
        payment.setAmount(paymentDetails.getAmount());
        payment.setDueDate(paymentDetails.getDueDate());
        payment.setNotes(paymentDetails.getNotes());
        
        // Allow status updates
        if (paymentDetails.getStatus() != null) {
            payment.setStatus(paymentDetails.getStatus());
        }

        log.info("Updating payment: {} for lease ID: {}", 
                payment.getPaymentType(), payment.getLease().getId());
        return paymentRepository.save(payment);
    }

    public void deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
        
        // Business logic validation (like checking paid status) should be handled at controller level
        
        log.info("Deleting payment: {} for lease ID: {}", 
                payment.getPaymentType(), payment.getLease().getId());
        paymentRepository.delete(payment);
    }

    public String generateReceiptNumber(PaymentType paymentType) {
        String prefix = switch (paymentType) {
            case RENT -> "RENT";
            case ELECTRICITY -> "ELEC";
            case WATER -> "WATER";
            case MAINTENANCE -> "MAINT";
            case SECURITY_DEPOSIT -> "DEP";
            case OTHER -> "OTHER";
        };
        
        long timestamp = System.currentTimeMillis();
        return prefix + "-" + timestamp;
    }

    public boolean existsById(Long id) {
        return paymentRepository.existsById(id);
    }
}