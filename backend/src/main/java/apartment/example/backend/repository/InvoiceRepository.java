package apartment.example.backend.repository;

import apartment.example.backend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Invoice Repository
 * 
 * Handles database operations for Invoice entities
 */
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    /**
     * Find invoice by ID with all relationships eagerly fetched
     */
    @Query("SELECT i FROM Invoice i " +
           "LEFT JOIN FETCH i.lease l " +
           "LEFT JOIN FETCH l.tenant t " +
           "LEFT JOIN FETCH l.unit u " +
           "LEFT JOIN FETCH i.payments p " +
           "WHERE i.id = :id")
    Optional<Invoice> findByIdWithDetails(@Param("id") Long id);

    /**
     * Find invoice by invoice number
     */
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    /**
     * Find all invoices for a specific lease
     */
    List<Invoice> findByLeaseId(Long leaseId);

    /**
     * Count invoices by invoice date (for generating unique invoice numbers)
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.invoiceDate = :invoiceDate")
    long countByInvoiceDate(@Param("invoiceDate") LocalDate invoiceDate);

    /**
     * Find latest invoice number for a specific date (for generating next invoice number)
     */
    @Query("SELECT i FROM Invoice i WHERE i.invoiceDate = :invoiceDate ORDER BY i.createdAt DESC")
    List<Invoice> findByInvoiceDateOrderByCreatedAtDesc(@Param("invoiceDate") LocalDate invoiceDate);

    /**
     * Check if invoice number already exists
     */
    boolean existsByInvoiceNumber(String invoiceNumber);

    /**
     * Find all invoices for a specific tenant by email
     * Joins through Lease -> Tenant with eager fetching to avoid LazyInitializationException
     */
    @Query("SELECT DISTINCT i FROM Invoice i " +
           "LEFT JOIN FETCH i.lease l " +
           "LEFT JOIN FETCH l.tenant t " +
           "LEFT JOIN FETCH l.unit u " +
           "LEFT JOIN FETCH i.payments p " +
           "WHERE t.email = :tenantEmail " +
           "ORDER BY i.invoiceDate DESC")
    List<Invoice> findByTenantEmail(@Param("tenantEmail") String tenantEmail);
    
    /**
     * Find all invoices by status
     */
    @Query("SELECT DISTINCT i FROM Invoice i " +
           "LEFT JOIN FETCH i.lease l " +
           "LEFT JOIN FETCH l.tenant t " +
           "LEFT JOIN FETCH l.unit u " +
           "LEFT JOIN FETCH i.payments p " +
           "WHERE i.status = :status " +
           "ORDER BY i.slipUploadedAt DESC")
    List<Invoice> findByStatus(@Param("status") Invoice.InvoiceStatus status);

    /**
     * Find all installment invoices for a parent invoice
     */
    @Query("SELECT DISTINCT i FROM Invoice i " +
           "LEFT JOIN FETCH i.lease l " +
           "LEFT JOIN FETCH i.payments p " +
           "WHERE i.parentInvoiceId = :parentInvoiceId " +
           "ORDER BY i.installmentNumber ASC")
    List<Invoice> findByParentInvoiceId(@Param("parentInvoiceId") Long parentInvoiceId);
}
