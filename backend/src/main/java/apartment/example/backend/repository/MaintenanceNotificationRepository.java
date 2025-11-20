package apartment.example.backend.repository;

import apartment.example.backend.entity.MaintenanceNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceNotificationRepository extends JpaRepository<MaintenanceNotification, Long> {

    // Find notifications by user ID
    List<MaintenanceNotification> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // Find unread notifications by user ID
    List<MaintenanceNotification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // Count unread notifications
    Long countByUser_IdAndIsReadFalse(Long userId);

    // Find notifications by type
    List<MaintenanceNotification> findByNotificationTypeAndUser_IdOrderByCreatedAtDesc(
            MaintenanceNotification.NotificationType notificationType, Long userId);

    // Find notifications by schedule
    List<MaintenanceNotification> findBySchedule_IdOrderByCreatedAtDesc(Long scheduleId);

    // Find notifications by request
    List<MaintenanceNotification> findByRequest_IdOrderByCreatedAtDesc(Long requestId);

    // Mark notification as read
    @Modifying
    @Query("UPDATE MaintenanceNotification mn SET mn.isRead = true, mn.readAt = CURRENT_TIMESTAMP WHERE mn.id = :id")
    void markAsRead(@Param("id") Long id);

    // Mark all notifications as read for a user
    @Modifying
    @Query("UPDATE MaintenanceNotification mn SET mn.isRead = true, mn.readAt = CURRENT_TIMESTAMP WHERE mn.user.id = :userId AND mn.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);

    // Delete old read notifications (for cleanup)
    @Modifying
    @Query("DELETE FROM MaintenanceNotification mn WHERE mn.isRead = true AND mn.readAt < :cutoffDate")
    void deleteOldReadNotifications(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}
