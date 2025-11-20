package apartment.example.backend.repository;

import apartment.example.backend.entity.Payment;
import apartment.example.backend.entity.enums.PaymentStatus;
import apartment.example.backend.entity.enums.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    // Optimized query with JOIN FETCH to prevent N+1 problem
    @Query("SELECT DISTINCT p FROM Payment p " +
           "LEFT JOIN FETCH p.lease l " +
           "LEFT JOIN FETCH l.tenant t " +
           "LEFT JOIN FETCH l.unit u")
    List<Payment> findAllWithRelations();
    
    List<Payment> findByLeaseId(Long leaseId);
    
    List<Payment> findByInvoiceId(Long invoiceId);
    
    List<Payment> findByStatus(PaymentStatus status);
    
    List<Payment> findByPaymentType(PaymentType paymentType);
    
    @Query("SELECT p FROM Payment p WHERE p.dueDate <= :date AND p.status != 'PAID'")
    List<Payment> findOverduePayments(@Param("date") LocalDate date);
    
    @Query("SELECT p FROM Payment p WHERE p.dueDate BETWEEN :startDate AND :endDate")
    List<Payment> findPaymentsDueBetween(@Param("startDate") LocalDate startDate, 
                                        @Param("endDate") LocalDate endDate);
    
    @Query("SELECT p FROM Payment p JOIN p.lease l JOIN l.unit u WHERE u.id = :unitId")
    List<Payment> findByUnitId(@Param("unitId") Long unitId);
    
    @Query("SELECT p FROM Payment p JOIN p.lease l JOIN l.tenant t WHERE t.id = :tenantId")
    List<Payment> findByTenantId(@Param("tenantId") Long tenantId);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'PAID' AND p.paidDate BETWEEN :startDate AND :endDate")
    Double getTotalRevenueByDateRange(@Param("startDate") LocalDate startDate, 
                                     @Param("endDate") LocalDate endDate);
}