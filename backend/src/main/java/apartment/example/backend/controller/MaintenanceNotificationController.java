package apartment.example.backend.controller;

import apartment.example.backend.dto.MaintenanceNotificationDTO;
import apartment.example.backend.service.MaintenanceNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Maintenance Notification Controller
 * 
 * REST API endpoints for maintenance notification management
 */
@RestController
@RequestMapping("/api/maintenance/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class MaintenanceNotificationController {

    private final MaintenanceNotificationService notificationService;

    /**
     * Get all notifications for current user
     * 
     * GET /maintenance/notifications
     * 
     * Response: List of notifications
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MaintenanceNotificationDTO>> getNotifications(Authentication authentication) {
        log.info("GET /maintenance/notifications - Fetching notifications");
        try {
            Long userId = getUserIdFromAuth(authentication);
            List<MaintenanceNotificationDTO> notifications = notificationService.getNotificationsByUserId(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error fetching notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get unread notifications for current user
     * 
     * GET /maintenance/notifications/unread
     * 
     * Response: List of unread notifications
     */
    @GetMapping("/unread")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MaintenanceNotificationDTO>> getUnreadNotifications(Authentication authentication) {
        log.info("GET /maintenance/notifications/unread - Fetching unread notifications");
        try {
            Long userId = getUserIdFromAuth(authentication);
            List<MaintenanceNotificationDTO> notifications = notificationService.getUnreadNotificationsByUserId(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error fetching unread notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get unread notification count
     * 
     * GET /maintenance/notifications/unread/count
     * 
     * Response: { "count": 5 }
     */
    @GetMapping("/unread/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        log.info("GET /maintenance/notifications/unread/count");
        try {
            Long userId = getUserIdFromAuth(authentication);
            Long count = notificationService.countUnreadNotifications(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Error counting unread notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark notification as read
     * 
     * PUT /maintenance/notifications/{id}/read
     * 
     * Response: 200 OK
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        log.info("PUT /maintenance/notifications/{}/read - Marking as read", id);
        try {
            notificationService.markAsRead(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark all notifications as read
     * 
     * PUT /maintenance/notifications/read-all
     * 
     * Response: 200 OK
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        log.info("PUT /maintenance/notifications/read-all - Marking all as read");
        try {
            Long userId = getUserIdFromAuth(authentication);
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a notification
     * 
     * DELETE /maintenance/notifications/{id}
     * 
     * Response: 200 OK
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, Authentication authentication) {
        log.info("DELETE /maintenance/notifications/{} - Deleting notification", id);
        try {
            Long userId = getUserIdFromAuth(authentication);
            notificationService.deleteNotification(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Extract user ID from authentication
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof apartment.example.backend.entity.User) {
            apartment.example.backend.entity.User user = (apartment.example.backend.entity.User) authentication.getPrincipal();
            return user.getId();
        }
        throw new RuntimeException("User not authenticated");
    }
}
