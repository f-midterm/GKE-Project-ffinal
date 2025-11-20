package apartment.example.backend.entity;

import apartment.example.backend.entity.enums.InvoiceType;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Invoice Entity - Master invoice containing multiple payment line items
 * 
 * Represents a billing document with format: INV-YYYYMMDD-XXX
 * Example: INV-20251113-1
 * 
 * Each invoice can contain multiple payments (RENT, ELECTRICITY, WATER, etc.)
 * which act as line items under the master invoice number.
 */
@Entity
@Table(name = "invoices", indexes = {
    @Index(name = "idx_invoice_number", columnList = "invoice_number"),
    @Index(name = "idx_lease", columnList = "lease_id"),
    @Index(name = "idx_invoice_date", columnList = "invoice_date"),
    @Index(name = "idx_due_date", columnList = "due_date"),
    @Index(name = "idx_status", columnList = "status")
})
@Data
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", unique = true, nullable = false, length = 50)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Lease lease;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false)
    private InvoiceType invoiceType = InvoiceType.MONTHLY_RENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "slip_url", length = 500)
    private String slipUrl;

    @Column(name = "slip_uploaded_at")
    private LocalDateTime slipUploadedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by_user_id")
    private Long verifiedByUserId;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("invoice-payments")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Payment> payments = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    // Installment fields
    @Column(name = "parent_invoice_id")
    private Long parentInvoiceId;

    @Column(name = "installment_number")
    private Integer installmentNumber;

    @Column(name = "total_installments")
    private Integer totalInstallments;

    @Column(name = "can_pay")
    private Boolean canPay = true; // Only current installment can be paid

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper methods
    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setInvoice(this);
    }

    public void removePayment(Payment payment) {
        payments.remove(payment);
        payment.setInvoice(null);
    }

    // Enum for Invoice Status
    public enum InvoiceStatus {
        PENDING,              // รอชำระเงิน
        WAITING_VERIFICATION, // รอตรวจสอบสลิป
        PAID,                 // ชำระเงินสำเร็จ
        OVERDUE,              // เกินกำหนด
        PARTIAL,              // ชำระบางส่วน
        REJECTED,             // สลิปถูกปฏิเสธ
        CANCELLED             // ยกเลิก
    }
}
