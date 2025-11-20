package apartment.example.backend.repository;

import apartment.example.backend.entity.UnitAuditLog;
import apartment.example.backend.entity.enums.UnitAuditActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UnitAuditLogRepository extends JpaRepository<UnitAuditLog, Long> {

    /**
     * Find all audit logs for a specific unit with pagination
     */
    Page<UnitAuditLog> findByUnitIdOrderByCreatedAtDesc(Long unitId, Pageable pageable);

    /**
     * Find audit logs by action type
     */
    Page<UnitAuditLog> findByActionTypeOrderByCreatedAtDesc(UnitAuditActionType actionType, Pageable pageable);

    /**
     * Find audit logs by user
     */
    Page<UnitAuditLog> findByCreatedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find audit logs for a unit within a date range
     */
    @Query("SELECT ual FROM UnitAuditLog ual WHERE ual.unit.id = :unitId " +
           "AND ual.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY ual.createdAt DESC")
    List<UnitAuditLog> findByUnitAndDateRange(@Param("unitId") Long unitId,
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    /**
     * Find recent audit logs (last N records)
     */
    List<UnitAuditLog> findTop10ByUnitIdOrderByCreatedAtDesc(Long unitId);

    /**
     * Find all audit logs with filters
     */
    @Query("SELECT ual FROM UnitAuditLog ual WHERE " +
           "(:unitId IS NULL OR ual.unit.id = :unitId) AND " +
           "(:actionType IS NULL OR ual.actionType = :actionType) AND " +
           "(:userId IS NULL OR ual.createdBy.id = :userId) AND " +
           "(:startDate IS NULL OR ual.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR ual.createdAt <= :endDate) " +
           "ORDER BY ual.createdAt DESC")
    Page<UnitAuditLog> findWithFilters(@Param("unitId") Long unitId,
                                        @Param("actionType") UnitAuditActionType actionType,
                                        @Param("userId") Long userId,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate,
                                        Pageable pageable);

    /**
     * Count audit logs by action type for a unit
     */
    long countByUnitIdAndActionType(Long unitId, UnitAuditActionType actionType);

    /**
     * Find price change logs for a unit
     */
    List<UnitAuditLog> findByUnitIdAndActionTypeOrderByCreatedAtDesc(Long unitId, UnitAuditActionType actionType);
}
