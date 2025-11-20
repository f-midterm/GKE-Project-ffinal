package apartment.example.backend.service;

import apartment.example.backend.entity.UnitAuditLog;
import apartment.example.backend.entity.enums.UnitAuditActionType;
import apartment.example.backend.repository.UnitAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitAuditLogService {

    private final UnitAuditLogRepository auditLogRepository;

    /**
     * Get all audit logs with pagination
     */
    public Page<UnitAuditLog> getAllAuditLogs(Pageable pageable) {
        log.debug("Fetching all audit logs");
        return auditLogRepository.findAll(pageable);
    }

    /**
     * Get all audit logs for a specific unit with pagination
     */
    public Page<UnitAuditLog> getAuditLogsByUnitId(Long unitId, Pageable pageable) {
        log.debug("Fetching audit logs for unit ID: {}", unitId);
        return auditLogRepository.findByUnitIdOrderByCreatedAtDesc(unitId, pageable);
    }

    /**
     * Get audit logs by action type
     */
    public Page<UnitAuditLog> getAuditLogsByActionType(UnitAuditActionType actionType, Pageable pageable) {
        log.debug("Fetching audit logs for action type: {}", actionType);
        return auditLogRepository.findByActionTypeOrderByCreatedAtDesc(actionType, pageable);
    }

    /**
     * Get audit logs by user
     */
    public Page<UnitAuditLog> getAuditLogsByUserId(Long userId, Pageable pageable) {
        log.debug("Fetching audit logs for user ID: {}", userId);
        return auditLogRepository.findByCreatedByIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Get audit logs for a unit within a date range
     */
    public List<UnitAuditLog> getAuditLogsByUnitAndDateRange(Long unitId, LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Fetching audit logs for unit ID: {} from {} to {}", unitId, startDate, endDate);
        return auditLogRepository.findByUnitAndDateRange(unitId, startDate, endDate);
    }

    /**
     * Get recent audit logs for a unit (top 10)
     */
    public List<UnitAuditLog> getRecentAuditLogs(Long unitId) {
        log.debug("Fetching recent audit logs for unit ID: {}", unitId);
        return auditLogRepository.findTop10ByUnitIdOrderByCreatedAtDesc(unitId);
    }

    /**
     * Get audit logs with multiple filters
     */
    public Page<UnitAuditLog> getAuditLogsWithFilters(
            Long unitId,
            UnitAuditActionType actionType,
            Long userId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        log.debug("Fetching audit logs with filters - unit: {}, action: {}, user: {}", unitId, actionType, userId);
        return auditLogRepository.findWithFilters(unitId, actionType, userId, startDate, endDate, pageable);
    }

    /**
     * Count audit logs by action type for a unit
     */
    public long countAuditLogsByActionType(Long unitId, UnitAuditActionType actionType) {
        log.debug("Counting audit logs for unit ID: {} with action type: {}", unitId, actionType);
        return auditLogRepository.countByUnitIdAndActionType(unitId, actionType);
    }

    /**
     * Get price change logs for a unit
     */
    public List<UnitAuditLog> getPriceChangeLogs(Long unitId) {
        log.debug("Fetching price change logs for unit ID: {}", unitId);
        return auditLogRepository.findByUnitIdAndActionTypeOrderByCreatedAtDesc(unitId, UnitAuditActionType.PRICE_CHANGED);
    }

    /**
     * Create a new audit log record (used internally)
     * Note: Audit logs are usually created automatically by triggers
     * This method is for manual logging when needed
     */
    protected UnitAuditLog createAuditLog(UnitAuditLog auditLog) {
        log.info("Creating audit log for unit ID: {} with action: {}", 
                auditLog.getUnit().getId(), auditLog.getActionType());
        return auditLogRepository.save(auditLog);
    }

    /**
     * Get audit log by ID
     */
    public Optional<UnitAuditLog> getAuditLogById(Long id) {
        return auditLogRepository.findById(id);
    }

    /**
     * Check if a unit has any audit logs
     */
    public boolean hasAuditLogs(Long unitId) {
        return auditLogRepository.countByUnitIdAndActionType(unitId, null) > 0;
    }
}
