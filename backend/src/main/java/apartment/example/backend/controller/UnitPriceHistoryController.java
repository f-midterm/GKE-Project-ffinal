package apartment.example.backend.controller;

import apartment.example.backend.dto.*;
import apartment.example.backend.entity.UnitPriceHistory;
import apartment.example.backend.entity.UnitAuditLog;
import apartment.example.backend.entity.enums.UnitAuditActionType;
import apartment.example.backend.service.UnitPriceHistoryService;
import apartment.example.backend.service.UnitAuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for Unit Price History and Audit Log endpoints
 */
@RestController
@RequestMapping("/api/unit-price-history")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UnitPriceHistoryController {

    private final UnitPriceHistoryService priceHistoryService;
    private final UnitAuditLogService auditLogService;

    // ============================================
    // PRICE HISTORY ENDPOINTS
    // ============================================

    /**
     * GET /api/units/{unitId}/price-history
     * Get all price history for a specific unit
     */
    @GetMapping("/{unitId}/price-history")
    public ResponseEntity<List<UnitPriceHistoryDto>> getPriceHistory(@PathVariable Long unitId) {
        log.info("Fetching price history for unit ID: {}", unitId);
        
        List<UnitPriceHistory> priceHistory = priceHistoryService.getPriceHistoryByUnitId(unitId);
        
        List<UnitPriceHistoryDto> dtos = priceHistory.stream()
                .map(this::convertToPriceHistoryDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/units/{unitId}/price-history/current
     * Get current price for a unit
     */
    @GetMapping("/{unitId}/price-history/current")
    public ResponseEntity<UnitPriceHistoryDto> getCurrentPrice(@PathVariable Long unitId) {
        log.info("Fetching current price for unit ID: {}", unitId);
        
        return priceHistoryService.getCurrentPrice(unitId)
                .map(this::convertToPriceHistoryDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/units/{unitId}/price-history/at-date
     * Get price effective on a specific date
     */
    @GetMapping("/{unitId}/price-history/at-date")
    public ResponseEntity<UnitPriceHistoryDto> getPriceAtDate(
            @PathVariable Long unitId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Fetching price for unit ID: {} at date: {}", unitId, date);
        
        return priceHistoryService.getPriceAtDate(unitId, date)
                .map(this::convertToPriceHistoryDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/units/{unitId}/price-history/range
     * Get price history within a date range
     */
    @GetMapping("/{unitId}/price-history/range")
    public ResponseEntity<List<UnitPriceHistoryDto>> getPriceHistoryInRange(
            @PathVariable Long unitId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("Fetching price history for unit ID: {} from {} to {}", unitId, startDate, endDate);
        
        List<UnitPriceHistory> priceHistory = priceHistoryService.getPriceHistoryInRange(unitId, startDate, endDate);
        
        List<UnitPriceHistoryDto> dtos = priceHistory.stream()
                .map(this::convertToPriceHistoryDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/units/price-history/all-current
     * Get all current prices for all units (admin only)
     */
    @GetMapping("/price-history/all-current")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitPriceHistoryDto>> getAllCurrentPrices() {
        log.info("Fetching all current prices");
        
        List<UnitPriceHistory> priceHistory = priceHistoryService.getAllCurrentPrices();
        
        List<UnitPriceHistoryDto> dtos = priceHistory.stream()
                .map(this::convertToPriceHistoryDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    // ============================================
    // AUDIT LOG ENDPOINTS
    // ============================================

    /**
     * GET /api/units/{unitId}/audit-logs
     * Get audit logs for a specific unit
     */
    @GetMapping("/{unitId}/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UnitAuditLogDto>> getAuditLogs(
            @PathVariable Long unitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching audit logs for unit ID: {}", unitId);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UnitAuditLog> auditLogs = auditLogService.getAuditLogsByUnitId(unitId, pageable);
        
        Page<UnitAuditLogDto> dtos = auditLogs.map(this::convertToAuditLogDto);
        
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/units/{unitId}/audit-logs/recent
     * Get recent audit logs for a unit (top 10)
     */
    @GetMapping("/{unitId}/audit-logs/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitAuditLogDto>> getRecentAuditLogs(@PathVariable Long unitId) {
        log.info("Fetching recent audit logs for unit ID: {}", unitId);
        
        List<UnitAuditLog> auditLogs = auditLogService.getRecentAuditLogs(unitId);
        
        List<UnitAuditLogDto> dtos = auditLogs.stream()
                .map(this::convertToAuditLogDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/units/audit-logs/filter
     * Get audit logs with multiple filters (admin only)
     */
    @GetMapping("/audit-logs/filter")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UnitAuditLogDto>> getAuditLogsWithFilters(
            @RequestParam(required = false) Long unitId,
            @RequestParam(required = false) UnitAuditActionType actionType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching audit logs with filters");
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UnitAuditLog> auditLogs = auditLogService.getAuditLogsWithFilters(
                unitId, actionType, userId, startDate, endDate, pageable);
        
        Page<UnitAuditLogDto> dtos = auditLogs.map(this::convertToAuditLogDto);
        
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/units/{unitId}/audit-logs/price-changes
     * Get price change logs for a unit
     */
    @GetMapping("/{unitId}/audit-logs/price-changes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UnitAuditLogDto>> getPriceChangeLogs(@PathVariable Long unitId) {
        log.info("Fetching price change logs for unit ID: {}", unitId);
        
        List<UnitAuditLog> auditLogs = auditLogService.getPriceChangeLogs(unitId);
        
        List<UnitAuditLogDto> dtos = auditLogs.stream()
                .map(this::convertToAuditLogDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private UnitPriceHistoryDto convertToPriceHistoryDto(UnitPriceHistory priceHistory) {
        return UnitPriceHistoryDto.builder()
                .id(priceHistory.getId())
                .unitId(priceHistory.getUnit().getId())
                .roomNumber(priceHistory.getUnit().getRoomNumber())
                .rentAmount(priceHistory.getRentAmount())
                .effectiveFrom(priceHistory.getEffectiveFrom().toLocalDate())
                .effectiveTo(priceHistory.getEffectiveTo() != null ? priceHistory.getEffectiveTo().toLocalDate() : null)
                .changeReason(priceHistory.getChangeReason())
                .notes(priceHistory.getNotes())
                .createdAt(priceHistory.getCreatedAt())
                .createdByUsername(priceHistory.getCreatedBy() != null ? 
                        priceHistory.getCreatedBy().getUsername() : null)
                .isCurrent(priceHistory.isCurrent())
                .daysActive(priceHistory.getEffectiveTo() != null ?
                        (int) java.time.temporal.ChronoUnit.DAYS.between(
                                priceHistory.getEffectiveFrom(), 
                                priceHistory.getEffectiveTo()) : null)
                .build();
    }

    private UnitAuditLogDto convertToAuditLogDto(UnitAuditLog auditLog) {
        return UnitAuditLogDto.builder()
                .id(auditLog.getId())
                .unitId(auditLog.getUnit().getId())
                .roomNumber(auditLog.getUnit().getRoomNumber())
                .actionType(auditLog.getActionType())
                .oldValues(auditLog.getOldValues())
                .newValues(auditLog.getNewValues())
                .description(auditLog.getDescription())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .createdAt(auditLog.getCreatedAt())
                .performedByUsername(auditLog.getCreatedBy() != null ? 
                        auditLog.getCreatedBy().getUsername() : null)
                .build();
    }
}
