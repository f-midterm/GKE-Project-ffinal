package apartment.example.backend.service;

import apartment.example.backend.entity.MaintenanceSchedule;
import apartment.example.backend.repository.MaintenanceScheduleRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled Task Service
 * 
 * Handles automatic maintenance schedule triggers and notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledTaskService {

    private final MaintenanceScheduleRepository scheduleRepository;
    private final MaintenanceScheduleService scheduleService;
    private final MaintenanceNotificationService notificationService;
    private final ObjectMapper objectMapper;

    /**
     * Check and trigger due maintenance schedules
     * 
     * Runs daily at 6:00 AM
     */
    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    public void checkAndTriggerSchedules() {
        log.info("=== Starting scheduled maintenance check ===");
        
        try {
            LocalDate today = LocalDate.now();
            
            // Find schedules that need to be triggered today or earlier
            List<MaintenanceSchedule> schedulesToTrigger = scheduleRepository.findSchedulesToTrigger(today);
            
            log.info("Found {} schedules to trigger", schedulesToTrigger.size());
            
            for (MaintenanceSchedule schedule : schedulesToTrigger) {
                try {
                    log.info("Triggering schedule: {} (ID: {})", schedule.getTitle(), schedule.getId());
                    scheduleService.triggerSchedule(schedule.getId());
                } catch (Exception e) {
                    log.error("Error triggering schedule ID: {}", schedule.getId(), e);
                }
            }
            
            log.info("=== Completed scheduled maintenance check ===");
        } catch (Exception e) {
            log.error("Error in scheduled maintenance check", e);
        }
    }

    /**
     * Send upcoming maintenance notifications
     * 
     * Runs daily at 8:00 AM
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendUpcomingMaintenanceNotifications() {
        log.info("=== Starting upcoming maintenance notifications ===");
        
        try {
            LocalDate today = LocalDate.now();
            
            // Check for schedules with notification settings
            List<MaintenanceSchedule> activeSchedules = scheduleRepository.findByIsActiveTrueOrderByNextTriggerDateAsc();
            
            for (MaintenanceSchedule schedule : activeSchedules) {
                if (schedule.getNotifyDaysBefore() != null && schedule.getNotifyDaysBefore() > 0) {
                    LocalDate notificationDate = schedule.getNextTriggerDate().minusDays(schedule.getNotifyDaysBefore());
                    
                    if (notificationDate.equals(today)) {
                        try {
                            // Parse notify users from JSON
                            List<Long> notifyUsers = parseUserIds(schedule.getNotifyUsers());
                            
                            if (notifyUsers != null && !notifyUsers.isEmpty()) {
                                int daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, schedule.getNextTriggerDate());
                                log.info("Sending upcoming maintenance notification for: {} (in {} days)", 
                                        schedule.getTitle(), daysUntil);
                                
                                notificationService.notifyUpcomingMaintenance(schedule, notifyUsers, daysUntil);
                            }
                        } catch (Exception e) {
                            log.error("Error sending notification for schedule ID: {}", schedule.getId(), e);
                        }
                    }
                }
            }
            
            log.info("=== Completed upcoming maintenance notifications ===");
        } catch (Exception e) {
            log.error("Error sending upcoming maintenance notifications", e);
        }
    }

    /**
     * Check for overdue maintenance schedules
     * 
     * Runs daily at 10:00 AM
     */
    @Scheduled(cron = "0 0 10 * * *")
    @Transactional
    public void checkOverdueSchedules() {
        log.info("=== Starting overdue maintenance check ===");
        
        try {
            LocalDate today = LocalDate.now();
            
            // Find active schedules that are overdue
            List<MaintenanceSchedule> activeSchedules = scheduleRepository.findByIsActiveTrueOrderByNextTriggerDateAsc();
            
            for (MaintenanceSchedule schedule : activeSchedules) {
                if (schedule.getNextTriggerDate().isBefore(today) && !schedule.getIsPaused()) {
                    try {
                        // Parse notify users from JSON
                        List<Long> notifyUsers = parseUserIds(schedule.getNotifyUsers());
                        
                        if (notifyUsers != null && !notifyUsers.isEmpty()) {
                            log.info("Sending overdue notification for: {}", schedule.getTitle());
                            notificationService.notifyOverdueMaintenance(schedule, notifyUsers);
                        }
                    } catch (Exception e) {
                        log.error("Error sending overdue notification for schedule ID: {}", schedule.getId(), e);
                    }
                }
            }
            
            log.info("=== Completed overdue maintenance check ===");
        } catch (Exception e) {
            log.error("Error checking overdue schedules", e);
        }
    }

    /**
     * Clean up old read notifications
     * 
     * Runs weekly on Sunday at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    @Transactional
    public void cleanupOldNotifications() {
        log.info("=== Starting notification cleanup ===");
        
        try {
            // Delete notifications that were read more than 30 days ago
            notificationService.deleteOldReadNotifications(30);
            
            log.info("=== Completed notification cleanup ===");
        } catch (Exception e) {
            log.error("Error cleaning up old notifications", e);
        }
    }

    /**
     * Parse user IDs from JSON string
     */
    private List<Long> parseUserIds(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        
        try {
            return objectMapper.readValue(json, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
        } catch (JsonProcessingException e) {
            log.error("Error parsing user IDs from JSON", e);
            return null;
        }
    }
}
