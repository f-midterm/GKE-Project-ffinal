package apartment.example.backend.repository;

import apartment.example.backend.entity.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {

    // Find active schedules
    List<MaintenanceSchedule> findByIsActiveTrueOrderByNextTriggerDateAsc();

    // Find schedules by recurrence type
    List<MaintenanceSchedule> findByRecurrenceTypeAndIsActiveTrue(MaintenanceSchedule.RecurrenceType recurrenceType);

    // Find schedules that need to be triggered
    @Query("SELECT ms FROM MaintenanceSchedule ms WHERE ms.isActive = true AND ms.isPaused = false AND ms.nextTriggerDate <= :date")
    List<MaintenanceSchedule> findSchedulesToTrigger(@Param("date") LocalDate date);

    // Find schedules by category
    List<MaintenanceSchedule> findByCategoryAndIsActiveTrue(MaintenanceSchedule.Category category);

    // Find schedules assigned to a user
    List<MaintenanceSchedule> findByAssignedToIdAndIsActiveTrue(Long userId);

    // Find schedules by target type
    List<MaintenanceSchedule> findByTargetTypeAndIsActiveTrue(MaintenanceSchedule.TargetType targetType);

    // Find schedules created by a user
    List<MaintenanceSchedule> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

    // Find upcoming schedules (for notifications)
    @Query("SELECT ms FROM MaintenanceSchedule ms WHERE ms.isActive = true AND ms.isPaused = false " +
           "AND ms.nextTriggerDate > :startDate AND ms.nextTriggerDate <= :endDate")
    List<MaintenanceSchedule> findUpcomingSchedules(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Find paused schedules
    List<MaintenanceSchedule> findByIsPausedTrueOrderByUpdatedAtDesc();

    // Find schedules by priority
    List<MaintenanceSchedule> findByPriorityAndIsActiveTrueOrderByNextTriggerDateAsc(MaintenanceSchedule.Priority priority);
}
