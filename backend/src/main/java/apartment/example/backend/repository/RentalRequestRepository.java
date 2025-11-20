package apartment.example.backend.repository;

import apartment.example.backend.entity.RentalRequest;
import apartment.example.backend.entity.enums.RentalRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalRequestRepository extends JpaRepository<RentalRequest, Long> {
    
    List<RentalRequest> findByStatus(RentalRequestStatus status);
    
    long countByStatus(RentalRequestStatus status);
    
    List<RentalRequest> findByUnitId(Long unitId);
    
    @Query("SELECT r FROM RentalRequest r WHERE r.status = 'PENDING' ORDER BY r.requestDate ASC")
    List<RentalRequest> findPendingRequests();
    
    @Query("SELECT r FROM RentalRequest r WHERE r.unitId = :unitId AND r.status = 'PENDING'")
    List<RentalRequest> findPendingRequestsByUnitId(@Param("unitId") Long unitId);
    
    @Query("SELECT r FROM RentalRequest r WHERE r.email = :email")
    List<RentalRequest> findByEmail(@Param("email") String email);
    
    // User-based queries (new - for authenticated users)
    @Query("SELECT r FROM RentalRequest r WHERE r.userId = :userId ORDER BY r.requestDate DESC")
    List<RentalRequest> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT r FROM RentalRequest r LEFT JOIN FETCH r.unit WHERE r.userId = :userId ORDER BY r.requestDate DESC")
    List<RentalRequest> findByUserIdWithUnit(@Param("userId") Long userId);
    
    @Query("SELECT r FROM RentalRequest r WHERE r.userId = :userId AND r.status = :status")
    List<RentalRequest> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") RentalRequestStatus status);
    
    @Query("SELECT r FROM RentalRequest r LEFT JOIN FETCH r.unit WHERE r.userId = :userId ORDER BY r.requestDate DESC LIMIT 1")
    Optional<RentalRequest> findLatestByUserId(@Param("userId") Long userId);
    
    // Fetch RentalRequest with Unit data (JOIN FETCH to avoid lazy loading issues)
    @Query("SELECT r FROM RentalRequest r LEFT JOIN FETCH r.unit WHERE r.id = :id")
    Optional<RentalRequest> findByIdWithUnit(@Param("id") Long id);
    
    // Fetch all RentalRequests with Unit data
    @Query("SELECT r FROM RentalRequest r LEFT JOIN FETCH r.unit ORDER BY r.requestDate DESC")
    List<RentalRequest> findAllWithUnit();
    
    // Fetch pending RentalRequests with Unit data
    @Query("SELECT r FROM RentalRequest r LEFT JOIN FETCH r.unit WHERE r.status = :status ORDER BY r.requestDate DESC")
    List<RentalRequest> findByStatusWithUnit(@Param("status") RentalRequestStatus status);
}