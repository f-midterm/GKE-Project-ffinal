package apartment.example.backend.repository;

import apartment.example.backend.entity.MaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {

    // Find logs by schedule ID
    List<MaintenanceLog> findByScheduleIdOrderByCreatedAtDesc(Long scheduleId);

    // Find logs by request ID
    List<MaintenanceLog> findByRequestIdOrderByCreatedAtDesc(Long requestId);

    // Find logs by action type
    List<MaintenanceLog> findByActionTypeOrderByCreatedAtDesc(MaintenanceLog.ActionType actionType);

    // Find logs created by a user
    List<MaintenanceLog> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

    // Find logs within date range
    List<MaintenanceLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);

    // Find recent logs (for audit trail)
    List<MaintenanceLog> findTop100ByOrderByCreatedAtDesc();

    // Find logs by schedule and action type
    List<MaintenanceLog> findByScheduleIdAndActionTypeOrderByCreatedAtDesc(Long scheduleId, MaintenanceLog.ActionType actionType);
}
