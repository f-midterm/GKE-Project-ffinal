package apartment.example.backend.service;

import apartment.example.backend.dto.MaintenanceNotificationDTO;
import apartment.example.backend.entity.*;
import apartment.example.backend.repository.MaintenanceNotificationRepository;
import apartment.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceNotificationService {

    private final MaintenanceNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Get all notifications for a user
     */
    public List<MaintenanceNotificationDTO> getNotificationsByUserId(Long userId) {
        log.info("Fetching notifications for user: {}", userId);
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications for a user
     */
    public List<MaintenanceNotificationDTO> getUnreadNotificationsByUserId(Long userId) {
        log.info("Fetching unread notifications for user: {}", userId);
        return notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Count unread notifications
     */
    public Long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        log.info("Marking notification as read: {}", notificationId);
        notificationRepository.markAsRead(notificationId);
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        notificationRepository.markAllAsReadByUserId(userId);
    }

    /**
     * Notify schedule created
     */
    @Transactional
    public void notifyScheduleCreated(MaintenanceSchedule schedule, List<Long> userIds) {
        log.info("Sending schedule created notifications to {} users", userIds.size());
        
        String title = "New Maintenance Schedule";
        String message = String.format("A new maintenance schedule has been created: %s", schedule.getTitle());
        
        for (Long userId : userIds) {
            createNotification(userId, MaintenanceNotification.NotificationType.SCHEDULE_REMINDER, 
                    title, message, schedule, null);
        }
    }

    /**
     * Notify upcoming maintenance
     */
    @Transactional
    public void notifyUpcomingMaintenance(MaintenanceSchedule schedule, List<Long> userIds, int daysUntil) {
        log.info("Sending upcoming maintenance notifications");
        
        String title = "Upcoming Maintenance";
        String message = String.format("Maintenance '%s' is scheduled in %d days", schedule.getTitle(), daysUntil);
        
        for (Long userId : userIds) {
            createNotification(userId, MaintenanceNotification.NotificationType.UPCOMING_MAINTENANCE, 
                    title, message, schedule, null);
        }
    }

    /**
     * Notify maintenance assigned
     */
    @Transactional
    public void notifyMaintenanceAssigned(MaintenanceRequest request, Long userId) {
        log.info("Sending maintenance assigned notification to user: {}", userId);
        
        String title = "Maintenance Request Assigned";
        String message = String.format("You have been assigned to maintenance request: %s", request.getTitle());
        
        createNotification(userId, MaintenanceNotification.NotificationType.ASSIGNED, 
                title, message, null, request);
    }

    /**
     * Notify status changed
     */
    @Transactional
    public void notifyStatusChanged(MaintenanceRequest request, Long userId, String newStatus) {
        log.info("Sending status change notification");
        
        String title = "Maintenance Status Updated";
        String message = String.format("Maintenance request '%s' status changed to %s", request.getTitle(), newStatus);
        
        createNotification(userId, MaintenanceNotification.NotificationType.STATUS_CHANGE, 
                title, message, null, request);
    }

    /**
     * Notify maintenance completed
     */
    @Transactional
    public void notifyMaintenanceCompleted(MaintenanceRequest request, Long userId) {
        log.info("Sending maintenance completed notification");
        
        String title = "Maintenance Completed";
        String message = String.format("Maintenance request '%s' has been completed", request.getTitle());
        
        createNotification(userId, MaintenanceNotification.NotificationType.COMPLETED, 
                title, message, null, request);
    }

    /**
     * Notify scheduled maintenance created (for tenants)
     */
    @Transactional
    public void notifyScheduledMaintenanceCreated(MaintenanceRequest request, Long userId, 
                                                  Tenant tenant, Unit unit, MaintenanceSchedule schedule) {
        log.info("Sending scheduled maintenance created notification to user: {}", userId);
        
        String title = "Scheduled Maintenance Notice";
        
        // Format date and time
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        String scheduledDate = schedule.getNextTriggerDate() != null 
            ? schedule.getNextTriggerDate().format(dateFormatter) 
            : "To be confirmed";
        
        // Build detailed message
        StringBuilder message = new StringBuilder();
        message.append(String.format("Dear %s %s,\n\n", 
            tenant.getFirstName(), 
            tenant.getLastName()));
        
        message.append(String.format("We would like to inform you that scheduled maintenance has been planned for your unit.\n\n"));
        
        message.append("Maintenance Details:\n");
        message.append(String.format("• Type: %s\n", request.getTitle()));
        message.append(String.format("• Category: %s\n", request.getCategory()));
        message.append(String.format("• Your Unit: Room %s (Floor %d)\n", 
            unit.getRoomNumber(), 
            unit.getFloor()));
        message.append(String.format("• Scheduled Date: %s\n", scheduledDate));
        message.append(String.format("• Priority: %s\n", request.getPriority()));
        
        if (request.getDescription() != null && !request.getDescription().isEmpty()) {
            message.append(String.format("• Description: %s\n", request.getDescription()));
        }
        
        if (request.getEstimatedCost() != null) {
            message.append(String.format("• Estimated Cost: ฿%.2f\n", request.getEstimatedCost()));
        }
        
        message.append("\n⏰ ACTION REQUIRED:\n");
        message.append("Please select your preferred time slot for this maintenance work.\n");
        message.append("Visit the Maintenance section in your dashboard to choose an available time.\n");
        message.append("The maintenance will be scheduled based on your selected time slot.\n\n");
        message.append("If you have any questions, please contact the management office.\n\n");
        message.append("Thank you for your cooperation.\n");
        message.append("Management Team");
        
        createNotification(userId, MaintenanceNotification.NotificationType.SCHEDULE_REMINDER, 
                title, message.toString(), schedule, request);
    }

    /**
     * Notify overdue maintenance
     */
    @Transactional
    public void notifyOverdueMaintenance(MaintenanceSchedule schedule, List<Long> userIds) {
        log.info("Sending overdue maintenance notifications");
        
        String title = "Overdue Maintenance";
        String message = String.format("Maintenance '%s' is overdue", schedule.getTitle());
        
        for (Long userId : userIds) {
            createNotification(userId, MaintenanceNotification.NotificationType.OVERDUE, 
                    title, message, schedule, null);
        }
    }

    /**
     * Create notification
     */
    private void createNotification(Long userId, MaintenanceNotification.NotificationType type,
                                   String title, String message,
                                   MaintenanceSchedule schedule, MaintenanceRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("User not found: {}", userId);
            return;
        }

        MaintenanceNotification notification = new MaintenanceNotification();
        notification.setUser(user);
        notification.setNotificationType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setSchedule(schedule);
        notification.setRequest(request);
        notification.setIsRead(false);

        notificationRepository.save(notification);
        log.info("Created notification for user: {}", userId);
    }

    /**
     * Delete old read notifications (cleanup)
     */
    @Transactional
    public void deleteOldReadNotifications(int daysOld) {
        log.info("Deleting read notifications older than {} days", daysOld);
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        notificationRepository.deleteOldReadNotifications(cutoffDate);
    }

    /**
     * Delete a specific notification (only if it belongs to the user)
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        log.info("Deleting notification {} for user {}", notificationId, userId);
        
        MaintenanceNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Verify that the notification belongs to the user
        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Notification does not belong to user");
        }
        
        notificationRepository.delete(notification);
        log.info("Successfully deleted notification {}", notificationId);
    }

    /**
     * Convert entity to DTO
     */
    private MaintenanceNotificationDTO convertToDTO(MaintenanceNotification notification) {
        MaintenanceNotificationDTO dto = new MaintenanceNotificationDTO();
        dto.setId(notification.getId());
        
        if (notification.getUser() != null) {
            dto.setUserId(notification.getUser().getId());
            dto.setUserName(notification.getUser().getUsername());
        }
        
        dto.setNotificationType(notification.getNotificationType() != null ? 
                notification.getNotificationType().name() : null);
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        
        if (notification.getSchedule() != null) {
            dto.setScheduleId(notification.getSchedule().getId());
            dto.setScheduleTitle(notification.getSchedule().getTitle());
        }
        
        if (notification.getRequest() != null) {
            dto.setRequestId(notification.getRequest().getId());
            dto.setRequestTitle(notification.getRequest().getTitle());
        }
        
        dto.setIsRead(notification.getIsRead());
        dto.setReadAt(notification.getReadAt());
        dto.setCreatedAt(notification.getCreatedAt());
        
        return dto;
    }
}
