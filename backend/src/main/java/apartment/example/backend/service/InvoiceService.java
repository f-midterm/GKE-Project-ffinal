package apartment.example.backend.service;

import apartment.example.backend.entity.Invoice;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.Payment;
import apartment.example.backend.entity.enums.InvoiceType;
import apartment.example.backend.entity.enums.PaymentStatus;
import apartment.example.backend.entity.enums.PaymentType;
import apartment.example.backend.repository.InvoiceRepository;
import apartment.example.backend.repository.LeaseRepository;
import apartment.example.backend.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Invoice Service
 * 
 * Business logic for creating and managing invoices with payment line items
 */
@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private LeaseRepository leaseRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentService paymentService;
    
    @Value("${file.upload-dir:uploads/payment-slips}")
    private String uploadDir;

    /**
     * Create an invoice with multiple payment line items
     * 
     * @param leaseId Lease ID
     * @param invoiceDate Invoice date
     * @param dueDate Due date
     * @param paymentItems List of payment items (type and amount)
     * @param notes Optional notes
     * @return Created invoice with payments
     */
    @Transactional
    public Invoice createInvoiceWithPayments(
            Long leaseId, 
            LocalDate invoiceDate, 
            LocalDate dueDate,
            List<PaymentItem> paymentItems,
            String notes,
            InvoiceType invoiceType) {
        
        // Validate lease exists
        Lease lease = leaseRepository.findById(leaseId)
                .orElseThrow(() -> new RuntimeException("Lease not found with id: " + leaseId));

        // Calculate total amount
        BigDecimal totalAmount = paymentItems.stream()
                .map(PaymentItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Generate invoice number: INV-YYYYMMDD-XXX
        String invoiceNumber = generateInvoiceNumber(invoiceDate);

        // Create invoice
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setLease(lease);
        invoice.setInvoiceDate(invoiceDate);
        invoice.setDueDate(dueDate);
        invoice.setTotalAmount(totalAmount);
        invoice.setStatus(Invoice.InvoiceStatus.PENDING);
        invoice.setInvoiceType(invoiceType);
        invoice.setNotes(notes);

        // Save invoice first to get ID
        invoice = invoiceRepository.save(invoice);

        // Create payment line items
        for (PaymentItem item : paymentItems) {
            Payment payment = new Payment();
            payment.setInvoice(invoice);
            payment.setLease(lease);
            payment.setPaymentType(item.getPaymentType());
            payment.setAmount(item.getAmount());
            payment.setDueDate(dueDate);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setNotes(item.getDescription());
            
            // Generate receipt number for each payment (RENT-XXX, ELEC-XXX, etc.)
            String receiptNumber = paymentService.generateReceiptNumber(item.getPaymentType());
            payment.setReceiptNumber(receiptNumber);

            invoice.addPayment(payment);
        }

        // Save invoice with payments
        return invoiceRepository.save(invoice);
    }

    // Overloaded method for backward compatibility
    @Transactional
    public Invoice createInvoiceWithPayments(
            Long leaseId, 
            LocalDate invoiceDate, 
            LocalDate dueDate,
            List<PaymentItem> paymentItems,
            String notes) {
        return createInvoiceWithPayments(leaseId, invoiceDate, dueDate, paymentItems, notes, InvoiceType.MONTHLY_RENT);
    }

    /**
     * Generate unique invoice number in format: INV-YYYYMMDD-XXX
     * 
     * Example: INV-20251113-1, INV-20251113-2, etc.
     */
    private String generateInvoiceNumber(LocalDate invoiceDate) {
        // Format date as YYYYMMDD
        String dateStr = invoiceDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        
        // Get count of invoices for this date
        long count = invoiceRepository.countByInvoiceDate(invoiceDate);
        
        // Generate sequential number
        long sequenceNumber = count + 1;
        
        // Format: INV-YYYYMMDD-XXX
        String invoiceNumber = String.format("INV-%s-%d", dateStr, sequenceNumber);
        
        // Check if exists (race condition protection)
        while (invoiceRepository.existsByInvoiceNumber(invoiceNumber)) {
            sequenceNumber++;
            invoiceNumber = String.format("INV-%s-%d", dateStr, sequenceNumber);
        }
        
        return invoiceNumber;
    }

    /**
     * Get invoice by ID with all details
     */
    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }

    /**
     * Get invoice by invoice number
     */
    public Invoice getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new RuntimeException("Invoice not found with number: " + invoiceNumber));
    }

    /**
     * Get all invoices for a lease
     */
    public List<Invoice> getInvoicesByLeaseId(Long leaseId) {
        return invoiceRepository.findByLeaseId(leaseId);
    }

    /**
     * Get all invoices for a tenant by email
     */
    public List<Invoice> getInvoicesByTenantEmail(String tenantEmail) {
        return invoiceRepository.findByTenantEmail(tenantEmail);
    }
    
    /**
     * Upload payment slip for an invoice
     */
    @Transactional
    public Invoice uploadPaymentSlip(Long invoiceId, MultipartFile slipFile) {
        Invoice invoice = getInvoiceById(invoiceId);
        
        // Validate invoice status
        if (invoice.getStatus() != Invoice.InvoiceStatus.PENDING && 
            invoice.getStatus() != Invoice.InvoiceStatus.REJECTED) {
            throw new RuntimeException("Invoice is not in a state that accepts payment slip uploads");
        }
        
        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = slipFile.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = String.format("slip_%s_%s%s", 
                invoiceId, 
                UUID.randomUUID().toString(), 
                extension);
            
            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(slipFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Update invoice
            invoice.setSlipUrl("/uploads/payment-slips/" + filename);
            invoice.setSlipUploadedAt(LocalDateTime.now());
            invoice.setStatus(Invoice.InvoiceStatus.WAITING_VERIFICATION);
            
            return invoiceRepository.save(invoice);
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload payment slip: " + e.getMessage());
        }
    }
    
    /**
     * Verify payment slip (Admin only)
     */
    @Transactional
    public Invoice verifyPayment(Long invoiceId, boolean approved, String notes) {
        Invoice invoice = getInvoiceById(invoiceId);
        
        // Validate invoice status
        if (invoice.getStatus() != Invoice.InvoiceStatus.WAITING_VERIFICATION) {
            throw new RuntimeException("Invoice is not waiting for verification");
        }
        
        if (approved) {
            // Approve payment
            invoice.setStatus(Invoice.InvoiceStatus.PAID);
            invoice.setVerifiedAt(LocalDateTime.now());
            invoice.setVerificationNotes(notes);
            
            // Update all payment line items to PAID
            for (Payment payment : invoice.getPayments()) {
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaidDate(LocalDate.now());
            }
        } else {
            // Reject payment
            invoice.setStatus(Invoice.InvoiceStatus.REJECTED);
            invoice.setVerifiedAt(LocalDateTime.now());
            invoice.setVerificationNotes(notes);
        }
        
        return invoiceRepository.save(invoice);
    }
    
    /**
     * Get all invoices waiting for verification
     */
    public List<Invoice> getInvoicesWaitingVerification() {
        return invoiceRepository.findByStatus(Invoice.InvoiceStatus.WAITING_VERIFICATION);
    }
    
    /**
     * Get all paid invoices
     */
    public List<Invoice> getPaidInvoices() {
        return invoiceRepository.findByStatus(Invoice.InvoiceStatus.PAID);
    }
    
    /**
     * Delete an invoice
     */
    public void deleteInvoice(Long invoiceId) {
        invoiceRepository.deleteById(invoiceId);
    }

    /**
     * Create installment plan for an invoice
     * Separates fixed charges (rent) from utilities
     * 
     * @param invoiceId Parent invoice ID
     * @param installments Number of installments (2, 4, or 6)
     * @return List of created installment invoices
     */
    @Transactional
    public List<Invoice> createInstallmentPlan(Long invoiceId, int installments) {
        // Validate installment number
        if (installments != 2 && installments != 4 && installments != 6) {
            throw new RuntimeException("Invalid number of installments. Must be 2, 4, or 6");
        }

        // Get parent invoice
        Invoice parentInvoice = getInvoiceById(invoiceId);
        
        if (parentInvoice.getStatus() != Invoice.InvoiceStatus.PENDING) {
            throw new RuntimeException("Can only create installment plan for pending invoices");
        }

        // Separate fixed charges from utilities
        List<Payment> fixedPayments = parentInvoice.getPayments().stream()
                .filter(p -> p.getPaymentType() == PaymentType.RENT || 
                           p.getPaymentType() == PaymentType.SECURITY_DEPOSIT)
                .toList();
        
        List<Payment> utilityPayments = parentInvoice.getPayments().stream()
                .filter(p -> p.getPaymentType() == PaymentType.ELECTRICITY || 
                           p.getPaymentType() == PaymentType.WATER)
                .toList();

        if (fixedPayments.isEmpty()) {
            throw new RuntimeException("No fixed charges found in invoice to create installment plan");
        }

        // Calculate fixed total
        BigDecimal fixedTotal = fixedPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal installmentAmount = fixedTotal.divide(BigDecimal.valueOf(installments), 2, BigDecimal.ROUND_HALF_UP);

        // Calculate payment dates (1st and 16th of months)
        LocalDate paymentDate = calculateNextPaymentDate(LocalDate.now());
        
        // Create installment invoices
        List<Invoice> installmentInvoices = new java.util.ArrayList<>();
        
        for (int i = 0; i < installments; i++) {
            LocalDate dueDate = paymentDate.plusDays(3); // 3-day grace period
            
            Invoice installmentInvoice = new Invoice();
            installmentInvoice.setInvoiceNumber(generateInvoiceNumber(paymentDate));
            installmentInvoice.setLease(parentInvoice.getLease());
            installmentInvoice.setInvoiceDate(paymentDate);
            installmentInvoice.setDueDate(dueDate);
            installmentInvoice.setTotalAmount(installmentAmount);
            installmentInvoice.setStatus(Invoice.InvoiceStatus.PENDING);
            installmentInvoice.setInvoiceType(InvoiceType.INSTALLMENT);
            installmentInvoice.setNotes("Installment " + (i + 1) + "/" + installments + " of Invoice " + parentInvoice.getInvoiceNumber());
            installmentInvoice.setParentInvoiceId(parentInvoice.getId());
            installmentInvoice.setInstallmentNumber(i + 1);
            installmentInvoice.setTotalInstallments(installments);
            installmentInvoice.setCanPay(i == 0); // Only first installment can be paid initially
            
            installmentInvoice = invoiceRepository.save(installmentInvoice);
            
            // Create payment line item
            Payment payment = new Payment();
            payment.setInvoice(installmentInvoice);
            payment.setLease(parentInvoice.getLease());
            payment.setPaymentType(PaymentType.RENT);
            payment.setAmount(installmentAmount);
            payment.setDueDate(dueDate);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setNotes("Installment payment " + (i + 1) + "/" + installments);
            paymentRepository.save(payment);
            
            installmentInvoices.add(installmentInvoice);
            
            // Calculate next payment date
            paymentDate = calculateNextPaymentDate(paymentDate.plusDays(1));
        }

        // If there are utilities, create separate utilities invoice
        if (!utilityPayments.isEmpty()) {
            BigDecimal utilitiesTotal = utilityPayments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            LocalDate utilityDueDate = LocalDate.now().plusDays(7);
            
            Invoice utilitiesInvoice = new Invoice();
            utilitiesInvoice.setInvoiceNumber(generateInvoiceNumber(LocalDate.now()));
            utilitiesInvoice.setLease(parentInvoice.getLease());
            utilitiesInvoice.setInvoiceDate(LocalDate.now());
            utilitiesInvoice.setDueDate(utilityDueDate);
            utilitiesInvoice.setTotalAmount(utilitiesTotal);
            utilitiesInvoice.setStatus(Invoice.InvoiceStatus.PENDING);
            utilitiesInvoice.setInvoiceType(InvoiceType.UTILITIES);
            utilitiesInvoice.setNotes("Utilities for Invoice " + parentInvoice.getInvoiceNumber() + " - Must be paid in full");
            utilitiesInvoice.setParentInvoiceId(parentInvoice.getId());
            
            utilitiesInvoice = invoiceRepository.save(utilitiesInvoice);
            
            // Create utility payment line items
            for (Payment utilityPayment : utilityPayments) {
                Payment payment = new Payment();
                payment.setInvoice(utilitiesInvoice);
                payment.setLease(parentInvoice.getLease());
                payment.setPaymentType(utilityPayment.getPaymentType());
                payment.setAmount(utilityPayment.getAmount());
                payment.setDueDate(utilityDueDate);
                payment.setStatus(PaymentStatus.PENDING);
                payment.setNotes(utilityPayment.getNotes());
                paymentRepository.save(payment);
            }
            
            installmentInvoices.add(utilitiesInvoice);
        }

        // Cancel parent invoice
        parentInvoice.setStatus(Invoice.InvoiceStatus.CANCELLED);
        parentInvoice.setNotes((parentInvoice.getNotes() != null ? parentInvoice.getNotes() + " | " : "") + 
                              "Replaced by " + installments + " installment plan");
        invoiceRepository.save(parentInvoice);

        return installmentInvoices;
    }

    /**
     * Calculate next payment date (1st or 16th)
     */
    private LocalDate calculateNextPaymentDate(LocalDate fromDate) {
        int day = fromDate.getDayOfMonth();
        
        if (day < 1) {
            return fromDate.withDayOfMonth(1);
        } else if (day < 16) {
            return fromDate.withDayOfMonth(16);
        } else {
            return fromDate.plusMonths(1).withDayOfMonth(1);
        }
    }

    /**
     * Get installment invoices for a parent invoice
     */
    public List<Invoice> getInstallmentInvoices(Long parentInvoiceId) {
        return invoiceRepository.findByParentInvoiceId(parentInvoiceId);
    }

    /**
     * Payment Item DTO
     */
    public static class PaymentItem {
        private PaymentType paymentType;
        private BigDecimal amount;
        private String description;

        public PaymentItem() {
        }

        public PaymentItem(PaymentType paymentType, BigDecimal amount, String description) {
            this.paymentType = paymentType;
            this.amount = amount;
            this.description = description;
        }

        public PaymentType getPaymentType() {
            return paymentType;
        }

        public void setPaymentType(PaymentType paymentType) {
            this.paymentType = paymentType;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
