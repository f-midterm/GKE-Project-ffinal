package apartment.example.backend.service;

import apartment.example.backend.dto.MaintenanceLogDTO;
import apartment.example.backend.entity.MaintenanceLog;
import apartment.example.backend.entity.MaintenanceRequest;
import apartment.example.backend.entity.MaintenanceSchedule;
import apartment.example.backend.entity.User;
import apartment.example.backend.repository.MaintenanceLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceLogService {

    private final MaintenanceLogRepository logRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get logs by schedule ID
     */
    public List<MaintenanceLogDTO> getLogsByScheduleId(Long scheduleId) {
        log.info("Fetching logs for schedule: {}", scheduleId);
        return logRepository.findByScheduleIdOrderByCreatedAtDesc(scheduleId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get logs by request ID
     */
    public List<MaintenanceLogDTO> getLogsByRequestId(Long requestId) {
        log.info("Fetching logs for request: {}", requestId);
        return logRepository.findByRequestIdOrderByCreatedAtDesc(requestId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recent logs
     */
    public List<MaintenanceLogDTO> getRecentLogs() {
        log.info("Fetching recent logs");
        return logRepository.findTop100ByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Log schedule created
     */
    @Transactional
    public void logScheduleCreated(MaintenanceSchedule schedule, User createdBy) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_CREATED);
        logEntry.setActionDescription("Maintenance schedule created: " + schedule.getTitle());
        logEntry.setCreatedBy(createdBy);
        logRepository.save(logEntry);
        log.info("Logged schedule creation: {}", schedule.getId());
    }

    /**
     * Log schedule updated
     */
    @Transactional
    public void logScheduleUpdated(MaintenanceSchedule newSchedule, MaintenanceSchedule oldSchedule, User updatedBy) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(newSchedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_UPDATED);
        logEntry.setActionDescription("Maintenance schedule updated: " + newSchedule.getTitle());
        logEntry.setCreatedBy(updatedBy);

        // Track what changed
        Map<String, Object> changes = new HashMap<>();
        if (!oldSchedule.getTitle().equals(newSchedule.getTitle())) {
            changes.put("title", Map.of("old", oldSchedule.getTitle(), "new", newSchedule.getTitle()));
        }
        if (oldSchedule.getCategory() != newSchedule.getCategory()) {
            changes.put("category", Map.of("old", oldSchedule.getCategory(), "new", newSchedule.getCategory()));
        }
        if (oldSchedule.getIsActive() != newSchedule.getIsActive()) {
            changes.put("isActive", Map.of("old", oldSchedule.getIsActive(), "new", newSchedule.getIsActive()));
        }

        try {
            if (!changes.isEmpty()) {
                logEntry.setPreviousValue(objectMapper.writeValueAsString(oldSchedule));
                logEntry.setNewValue(objectMapper.writeValueAsString(newSchedule));
            }
        } catch (JsonProcessingException e) {
            log.error("Error serializing schedule changes", e);
        }

        logRepository.save(logEntry);
        log.info("Logged schedule update: {}", newSchedule.getId());
    }

    /**
     * Log schedule deleted
     */
    @Transactional
    public void logScheduleDeleted(MaintenanceSchedule schedule, User deletedBy) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_DELETED);
        logEntry.setActionDescription("Maintenance schedule deleted: " + schedule.getTitle());
        logEntry.setCreatedBy(deletedBy);
        logRepository.save(logEntry);
        log.info("Logged schedule deletion: {}", schedule.getId());
    }

    /**
     * Log schedule activated
     */
    @Transactional
    public void logScheduleActivated(MaintenanceSchedule schedule, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_ACTIVATED);
        logEntry.setActionDescription("Schedule activated: " + schedule.getTitle());
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Log schedule deactivated
     */
    @Transactional
    public void logScheduleDeactivated(MaintenanceSchedule schedule, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_DEACTIVATED);
        logEntry.setActionDescription("Schedule deactivated: " + schedule.getTitle());
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Log schedule paused
     */
    @Transactional
    public void logSchedulePaused(MaintenanceSchedule schedule, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_PAUSED);
        logEntry.setActionDescription("Schedule paused: " + schedule.getTitle());
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Log schedule resumed
     */
    @Transactional
    public void logScheduleResumed(MaintenanceSchedule schedule, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_RESUMED);
        logEntry.setActionDescription("Schedule resumed: " + schedule.getTitle());
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Log schedule triggered
     */
    @Transactional
    public void logScheduleTriggered(MaintenanceSchedule schedule, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setActionType(MaintenanceLog.ActionType.SCHEDULE_TRIGGERED);
        logEntry.setActionDescription("Schedule triggered: " + schedule.getTitle());
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Log request created from schedule
     */
    @Transactional
    public void logRequestCreatedFromSchedule(MaintenanceRequest request, MaintenanceSchedule schedule, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setRequest(request);
        logEntry.setActionType(MaintenanceLog.ActionType.REQUEST_CREATED_FROM_SCHEDULE);
        logEntry.setActionDescription("Maintenance request created from schedule: " + request.getTitle());
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Log request status changed
     */
    @Transactional
    public void logRequestStatusChanged(MaintenanceRequest request, String oldStatus, String newStatus, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setRequest(request);
        logEntry.setActionType(MaintenanceLog.ActionType.REQUEST_STATUS_CHANGED);
        logEntry.setActionDescription(String.format("Request status changed from %s to %s", oldStatus, newStatus));
        logEntry.setFieldName("status");
        
        try {
            logEntry.setPreviousValue(objectMapper.writeValueAsString(oldStatus));
            logEntry.setNewValue(objectMapper.writeValueAsString(newStatus));
        } catch (JsonProcessingException e) {
            log.error("Error serializing status change", e);
        }
        
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Log notification sent
     */
    @Transactional
    public void logNotificationSent(MaintenanceSchedule schedule, MaintenanceRequest request, String notificationType, User user) {
        MaintenanceLog logEntry = new MaintenanceLog();
        logEntry.setSchedule(schedule);
        logEntry.setRequest(request);
        logEntry.setActionType(MaintenanceLog.ActionType.NOTIFICATION_SENT);
        logEntry.setActionDescription("Notification sent: " + notificationType);
        logEntry.setCreatedBy(user);
        logRepository.save(logEntry);
    }

    /**
     * Convert log entity to DTO
     */
    private MaintenanceLogDTO convertToDTO(MaintenanceLog log) {
        MaintenanceLogDTO dto = new MaintenanceLogDTO();
        dto.setId(log.getId());
        
        if (log.getSchedule() != null) {
            dto.setScheduleId(log.getSchedule().getId());
            dto.setScheduleTitle(log.getSchedule().getTitle());
        }
        
        if (log.getRequest() != null) {
            dto.setRequestId(log.getRequest().getId());
            dto.setRequestTitle(log.getRequest().getTitle());
        }
        
        dto.setActionType(log.getActionType() != null ? log.getActionType().name() : null);
        dto.setActionDescription(log.getActionDescription());
        dto.setFieldName(log.getFieldName());
        dto.setPreviousValue(log.getPreviousValue());
        dto.setNewValue(log.getNewValue());
        dto.setCreatedAt(log.getCreatedAt());
        
        if (log.getCreatedBy() != null) {
            dto.setCreatedByUserId(log.getCreatedBy().getId());
            dto.setCreatedByName(log.getCreatedBy().getUsername());
        }
        
        dto.setIpAddress(log.getIpAddress());
        
        return dto;
    }
}
