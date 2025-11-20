package apartment.example.backend.controller;

import apartment.example.backend.dto.UnitAuditLogDto;
import apartment.example.backend.entity.UnitAuditLog;
import apartment.example.backend.entity.enums.UnitAuditActionType;
import apartment.example.backend.service.UnitAuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Unit Audit Log operations
 * Provides endpoints for querying and filtering audit logs
 */
@RestController
@RequestMapping("/api/unit-audit-logs")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UnitAuditLogController {

    private final UnitAuditLogService auditLogService;

    /**
     * Get all audit logs (with pagination)
     * GET /unit-audit-logs
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitAuditLogDto>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<UnitAuditLog> logsPage = auditLogService.getAllAuditLogs(pageable);
            
            List<UnitAuditLogDto> dtos = logsPage.getContent().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            log.info("Fetched {} audit logs", dtos.size());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching all audit logs", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get audit logs for a specific unit
     * GET /unit-audit-logs/unit/{unitId}
     */
    @GetMapping("/unit/{unitId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitAuditLogDto>> getAuditLogsByUnit(
            @PathVariable Long unitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<UnitAuditLog> logsPage = auditLogService.getAuditLogsByUnitId(unitId, pageable);
            
            List<UnitAuditLogDto> dtos = logsPage.getContent().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching audit logs for unit {}", unitId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get audit logs by action type
     * GET /unit-audit-logs/action-type/{actionType}
     */
    @GetMapping("/action-type/{actionType}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitAuditLogDto>> getAuditLogsByActionType(
            @PathVariable UnitAuditActionType actionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<UnitAuditLog> logsPage = auditLogService.getAuditLogsByActionType(actionType, pageable);
            
            List<UnitAuditLogDto> dtos = logsPage.getContent().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching audit logs by action type {}", actionType, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Search audit logs with filters
     * GET /unit-audit-logs/search
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitAuditLogDto>> searchAuditLogs(
            @RequestParam(required = false) Long unitId,
            @RequestParam(required = false) UnitAuditActionType actionType,
            @RequestParam(required = false) String changedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size
    ) {
        try {
            LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
            LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59) : null;
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            
            // Convert changedBy username to userId if needed
            Long userId = null; // For now, we'll use the filters we have
            
            Page<UnitAuditLog> logsPage = auditLogService.getAuditLogsWithFilters(
                    unitId, actionType, userId, startDateTime, endDateTime, pageable
            );
            
            List<UnitAuditLogDto> dtos = logsPage.getContent().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error searching audit logs", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get recent audit logs (last 50)
     * GET /unit-audit-logs/recent
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitAuditLogDto>> getRecentAuditLogs() {
        try {
            Pageable pageable = PageRequest.of(0, 50, Sort.by("createdAt").descending());
            
            // Get recent logs from any action type
            Page<UnitAuditLog> logsPage = auditLogService.getAuditLogsByActionType(
                    UnitAuditActionType.PRICE_CHANGED, pageable
            );
            
            List<UnitAuditLogDto> dtos = logsPage.getContent().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching recent audit logs", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Convert UnitAuditLog entity to DTO
     */
    private UnitAuditLogDto convertToDto(UnitAuditLog log) {
        return UnitAuditLogDto.builder()
                .id(log.getId())
                .unitId(log.getUnit() != null ? log.getUnit().getId() : null)
                .roomNumber(log.getUnit() != null ? log.getUnit().getRoomNumber() : null)
                .actionType(log.getActionType())
                .oldValues(log.getOldValues())
                .newValues(log.getNewValues())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .performedByUsername(log.getCreatedBy() != null ? log.getCreatedBy().getUsername() : "System")
                .build();
    }
}
