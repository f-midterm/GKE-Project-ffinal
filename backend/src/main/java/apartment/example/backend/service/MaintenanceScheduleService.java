package apartment.example.backend.service;

import apartment.example.backend.dto.MaintenanceScheduleDTO;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.MaintenanceSchedule;
import apartment.example.backend.entity.MaintenanceRequest;
import apartment.example.backend.entity.User;
import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.repository.LeaseRepository;
import apartment.example.backend.repository.MaintenanceScheduleRepository;
import apartment.example.backend.repository.MaintenanceRequestRepository;
import apartment.example.backend.repository.UnitRepository;
import apartment.example.backend.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceScheduleService {

    private final MaintenanceScheduleRepository scheduleRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final LeaseRepository leaseRepository;
    private final UnitRepository unitRepository;
    private final MaintenanceLogService logService;
    private final MaintenanceNotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;

    /**
     * Get all active schedules
     */
    public List<MaintenanceScheduleDTO> getAllActiveSchedules() {
        log.info("Fetching all active schedules");
        List<MaintenanceSchedule> schedules = scheduleRepository.findByIsActiveTrueOrderByNextTriggerDateAsc();
        return schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get schedule by ID
     */
    public MaintenanceScheduleDTO getScheduleById(Long id) {
        log.info("Fetching schedule with id: {}", id);
        MaintenanceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + id));
        return convertToDTO(schedule);
    }

    /**
     * Create new maintenance schedule
     */
    @Transactional
    public MaintenanceScheduleDTO createSchedule(MaintenanceScheduleDTO dto, Long createdByUserId) {
        log.info("Creating new maintenance schedule: {}", dto.getTitle());

        MaintenanceSchedule schedule = new MaintenanceSchedule();
        updateScheduleFromDTO(schedule, dto);

        // Set creator
        User creator = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        schedule.setCreatedBy(creator);

        // Calculate next trigger date
        schedule.setNextTriggerDate(calculateNextTriggerDate(schedule));

        MaintenanceSchedule saved = scheduleRepository.save(schedule);
        log.info("Created schedule with id: {}", saved.getId());

        // Log the action
        logService.logScheduleCreated(saved, creator);

        // Send notifications to assigned users
        if (dto.getNotifyUsers() != null && !dto.getNotifyUsers().isEmpty()) {
            try {
                List<Long> userIds = parseTargetUnits(dto.getNotifyUsers());
                notificationService.notifyScheduleCreated(saved, userIds);
            } catch (Exception e) {
                log.error("Failed to send schedule created notifications", e);
            }
        }

        // Auto-trigger if nextTriggerDate is today or in the past
        if (saved.getNextTriggerDate() != null && 
            !saved.getNextTriggerDate().isAfter(LocalDate.now()) &&
            saved.getIsActive() && !saved.getIsPaused()) {
            log.info("Auto-triggering schedule {} as nextTriggerDate is today or in the past", saved.getId());
            try {
                triggerSchedule(saved.getId());
            } catch (Exception e) {
                log.error("Failed to auto-trigger schedule {}: {}", saved.getId(), e.getMessage());
            }
        }

        return convertToDTO(saved);
    }

    /**
     * Update existing schedule
     */
    @Transactional
    public MaintenanceScheduleDTO updateSchedule(Long id, MaintenanceScheduleDTO dto, Long updatedByUserId) {
        log.info("Updating schedule with id: {}", id);

        MaintenanceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        MaintenanceSchedule oldSchedule = cloneSchedule(schedule);
        updateScheduleFromDTO(schedule, dto);

        // Recalculate next trigger date if recurrence settings changed
        schedule.setNextTriggerDate(calculateNextTriggerDate(schedule));

        MaintenanceSchedule updated = scheduleRepository.save(schedule);

        // Log changes
        User updater = userRepository.findById(updatedByUserId).orElse(null);
        logService.logScheduleUpdated(updated, oldSchedule, updater);

        return convertToDTO(updated);
    }

    /**
     * Delete schedule
     */
    @Transactional
    public void deleteSchedule(Long id, Long deletedByUserId) {
        log.info("Deleting schedule with id: {}", id);

        MaintenanceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        // Log deletion BEFORE deleting the schedule
        User deleter = userRepository.findById(deletedByUserId).orElse(null);
        logService.logScheduleDeleted(schedule, deleter);
        
        // Flush and clear to persist logs and detach entities
        // This ensures the logs are saved with schedule reference before deletion
        entityManager.flush();
        entityManager.clear();

        // Now delete the schedule (foreign key will set logs' schedule_id to NULL)
        scheduleRepository.deleteById(id);
    }

    /**
     * Activate schedule
     */
    @Transactional
    public void activateSchedule(Long id, Long userId) {
        log.info("Activating schedule with id: {}", id);

        MaintenanceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        schedule.setIsActive(true);
        scheduleRepository.save(schedule);

        User user = userRepository.findById(userId).orElse(null);
        logService.logScheduleActivated(schedule, user);
    }

    /**
     * Deactivate schedule
     */
    @Transactional
    public void deactivateSchedule(Long id, Long userId) {
        log.info("Deactivating schedule with id: {}", id);

        MaintenanceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        schedule.setIsActive(false);
        scheduleRepository.save(schedule);

        User user = userRepository.findById(userId).orElse(null);
        logService.logScheduleDeactivated(schedule, user);
    }

    /**
     * Pause schedule
     */
    @Transactional
    public void pauseSchedule(Long id, Long userId) {
        log.info("Pausing schedule with id: {}", id);

        MaintenanceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        schedule.setIsPaused(true);
        scheduleRepository.save(schedule);

        User user = userRepository.findById(userId).orElse(null);
        logService.logSchedulePaused(schedule, user);
    }

    /**
     * Resume schedule
     */
    @Transactional
    public void resumeSchedule(Long id, Long userId) {
        log.info("Resuming schedule with id: {}", id);

        MaintenanceSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        schedule.setIsPaused(false);
        scheduleRepository.save(schedule);

        User user = userRepository.findById(userId).orElse(null);
        logService.logScheduleResumed(schedule, user);
    }

    /**
     * Trigger schedule and create maintenance requests
     */
    @Transactional
    public void triggerSchedule(Long scheduleId) {
        log.info("Triggering schedule with id: {}", scheduleId);

        MaintenanceSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (!schedule.getIsActive() || schedule.getIsPaused()) {
            log.warn("Cannot trigger inactive or paused schedule");
            return;
        }

        // Create maintenance requests based on target type
        List<Long> targetUnitIds = resolveTargetUnits(schedule);
        
        log.info("Resolved {} target units for schedule {}", targetUnitIds.size(), schedule.getTitle());
        
        for (Long unitId : targetUnitIds) {
            createMaintenanceRequestFromSchedule(schedule, unitId);
        }

        // Update schedule
        schedule.setLastTriggeredDate(LocalDate.now());
        schedule.setNextTriggerDate(calculateNextTriggerDate(schedule));
        scheduleRepository.save(schedule);

        // Log trigger
        logService.logScheduleTriggered(schedule, null);
    }

    /**
     * Create maintenance request from schedule
     */
    private void createMaintenanceRequestFromSchedule(MaintenanceSchedule schedule, Long unitId) {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setUnitId(unitId);
        request.setTitle(schedule.getTitle());
        request.setDescription(schedule.getDescription());
        request.setCategory(MaintenanceRequest.Category.valueOf(schedule.getCategory().name()));
        request.setPriority(MaintenanceRequest.Priority.valueOf(schedule.getPriority().name()));
        request.setStatus(MaintenanceRequest.RequestStatus.PENDING_TENANT_CONFIRMATION); // Wait for tenant to select time
        request.setEstimatedCost(schedule.getEstimatedCost());
        request.setScheduleId(schedule.getId());
        request.setIsFromSchedule(true);

        if (schedule.getAssignedTo() != null) {
            request.setAssignedToUserId(schedule.getAssignedTo().getId());
        }
        
        // Set createdByUserId to tenant user ID for proper tenant display
        try {
            Optional<Lease> activeLease = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
            if (activeLease.isPresent()) {
                Lease lease = activeLease.get();
                if (lease.getTenant() != null && lease.getTenant().getEmail() != null) {
                    String tenantEmail = lease.getTenant().getEmail();
                    Optional<User> tenantUser = userRepository.findByEmail(tenantEmail);
                    if (tenantUser.isPresent()) {
                        request.setCreatedByUserId(tenantUser.get().getId());
                        log.info("Set createdByUserId to tenant user: {}", tenantUser.get().getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to set tenant user for unit {}: {}", unitId, e.getMessage());
        }

        MaintenanceRequest saved = requestRepository.save(request);
        log.info("Created maintenance request from schedule: {}", saved.getId());

        // Log and notify
        logService.logRequestCreatedFromSchedule(saved, schedule, null);
        
        // Notify assigned user (admin/staff)
        if (schedule.getAssignedTo() != null) {
            notificationService.notifyMaintenanceAssigned(saved, schedule.getAssignedTo().getId());
        }
        
        // Notify tenant of the unit
        try {
            Optional<Lease> activeLease = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
            if (activeLease.isPresent()) {
                Lease lease = activeLease.get();
                if (lease.getTenant() != null && lease.getTenant().getEmail() != null) {
                    String tenantEmail = lease.getTenant().getEmail();
                    // Find user by tenant's email
                    Optional<User> tenantUser = userRepository.findByEmail(tenantEmail);
                    if (tenantUser.isPresent()) {
                        Long tenantUserId = tenantUser.get().getId();
                        // Send notification about new scheduled maintenance with full details
                        notificationService.notifyScheduledMaintenanceCreated(
                            saved, 
                            tenantUserId, 
                            lease.getTenant(),
                            unitRepository.findById(unitId).orElse(null),
                            schedule
                        );
                        log.info("Sent scheduled maintenance notification to tenant user: {}", tenantUserId);
                    } else {
                        log.warn("No user found for tenant email: {}", tenantEmail);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to notify tenant for unit {}: {}", unitId, e.getMessage());
        }
    }

    /**
     * Calculate next trigger date based on recurrence settings
     */
    private LocalDate calculateNextTriggerDate(MaintenanceSchedule schedule) {
        LocalDate baseDate = schedule.getLastTriggeredDate() != null 
                ? schedule.getLastTriggeredDate() 
                : schedule.getStartDate();

        if (baseDate == null) {
            baseDate = LocalDate.now();
        }

        LocalDate nextDate;

        switch (schedule.getRecurrenceType()) {
            case ONE_TIME:
                nextDate = schedule.getStartDate();
                break;
            case DAILY:
                nextDate = baseDate.plusDays(schedule.getRecurrenceInterval());
                break;
            case WEEKLY:
                nextDate = baseDate.plusWeeks(schedule.getRecurrenceInterval());
                break;
            case MONTHLY:
                nextDate = baseDate.plusMonths(schedule.getRecurrenceInterval());
                if (schedule.getRecurrenceDayOfMonth() != null) {
                    nextDate = nextDate.withDayOfMonth(
                            Math.min(schedule.getRecurrenceDayOfMonth(), nextDate.lengthOfMonth())
                    );
                }
                break;
            case QUARTERLY:
                nextDate = baseDate.plusMonths(3L * schedule.getRecurrenceInterval());
                break;
            case YEARLY:
                nextDate = baseDate.plusYears(schedule.getRecurrenceInterval());
                break;
            default:
                nextDate = baseDate.plusDays(1);
        }

        // Check if next date exceeds end date
        if (schedule.getEndDate() != null && nextDate.isAfter(schedule.getEndDate())) {
            return schedule.getEndDate();
        }

        return nextDate;
    }

    /**
     * Resolve target units based on TargetType
     */
    private List<Long> resolveTargetUnits(MaintenanceSchedule schedule) {
        List<Long> unitIds = new ArrayList<>();
        
        switch (schedule.getTargetType()) {
            case ALL_UNITS:
                // Get all unit IDs
                unitIds = unitRepository.findAll().stream()
                        .map(unit -> unit.getId())
                        .collect(Collectors.toList());
                log.info("Target: ALL_UNITS - Found {} units", unitIds.size());
                break;
                
            case FLOOR:
                // Parse floor number and get all units on that floor
                try {
                    Integer floor = Integer.parseInt(schedule.getTargetUnits());
                    unitIds = unitRepository.findByFloor(floor).stream()
                            .map(unit -> unit.getId())
                            .collect(Collectors.toList());
                    log.info("Target: FLOOR {} - Found {} units", floor, unitIds.size());
                } catch (NumberFormatException e) {
                    log.error("Invalid floor number: {}", schedule.getTargetUnits());
                }
                break;
                
            case UNIT_TYPE:
                // Parse unit type and get all units of that type
                String unitType = schedule.getTargetUnits().replace("\"", "").trim();
                unitIds = unitRepository.findByUnitType(unitType).stream()
                        .map(unit -> unit.getId())
                        .collect(Collectors.toList());
                log.info("Target: UNIT_TYPE {} - Found {} units", unitType, unitIds.size());
                break;
                
            case SPECIFIC_UNITS:
                // Parse JSON array of unit IDs
                unitIds = parseTargetUnits(schedule.getTargetUnits());
                log.info("Target: SPECIFIC_UNITS - {} units specified", unitIds.size());
                break;
                
            default:
                log.warn("Unknown target type: {}", schedule.getTargetType());
        }
        
        // Filter to only occupied units (units with active leases)
        List<Long> occupiedUnitIds = unitIds.stream()
                .filter(unitId -> {
                    Optional<Lease> activeLease = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
                    return activeLease.isPresent();
                })
                .collect(Collectors.toList());
        
        log.info("Filtered to {} occupied units (from {} total units)", occupiedUnitIds.size(), unitIds.size());
        return occupiedUnitIds;
    }
    
    /**
     * Parse target units from JSON string
     */
    private List<Long> parseTargetUnits(String targetUnitsJson) {
        if (targetUnitsJson == null || targetUnitsJson.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            return objectMapper.readValue(targetUnitsJson, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
        } catch (JsonProcessingException e) {
            log.error("Error parsing target units JSON", e);
            return new ArrayList<>();
        }
    }

    /**
     * Convert entity to DTO
     */
    private MaintenanceScheduleDTO convertToDTO(MaintenanceSchedule schedule) {
        MaintenanceScheduleDTO dto = new MaintenanceScheduleDTO();
        dto.setId(schedule.getId());
        dto.setTitle(schedule.getTitle());
        dto.setDescription(schedule.getDescription());
        dto.setCategory(schedule.getCategory() != null ? schedule.getCategory().name() : null);
        dto.setRecurrenceType(schedule.getRecurrenceType() != null ? schedule.getRecurrenceType().name() : null);
        dto.setRecurrenceInterval(schedule.getRecurrenceInterval());
        dto.setRecurrenceDayOfWeek(schedule.getRecurrenceDayOfWeek());
        dto.setRecurrenceDayOfMonth(schedule.getRecurrenceDayOfMonth());
        dto.setTargetType(schedule.getTargetType() != null ? schedule.getTargetType().name() : null);
        dto.setTargetUnits(schedule.getTargetUnits());  // Keep as JSON string
        dto.setStartDate(schedule.getStartDate());
        dto.setEndDate(schedule.getEndDate());
        dto.setNextTriggerDate(schedule.getNextTriggerDate());
        dto.setLastTriggeredDate(schedule.getLastTriggeredDate());
        dto.setNotifyDaysBefore(schedule.getNotifyDaysBefore());
        dto.setNotifyUsers(schedule.getNotifyUsers());  // Keep as JSON string
        dto.setEstimatedCost(schedule.getEstimatedCost());
        dto.setPriority(schedule.getPriority() != null ? schedule.getPriority().name() : null);
        dto.setIsActive(schedule.getIsActive());
        dto.setIsPaused(schedule.getIsPaused());
        dto.setCreatedAt(schedule.getCreatedAt());
        dto.setUpdatedAt(schedule.getUpdatedAt());

        if (schedule.getAssignedTo() != null) {
            dto.setAssignedToUserId(schedule.getAssignedTo().getId());
            dto.setAssignedToName(schedule.getAssignedTo().getUsername());
        }

        if (schedule.getCreatedBy() != null) {
            dto.setCreatedByUserId(schedule.getCreatedBy().getId());
            dto.setCreatedByName(schedule.getCreatedBy().getUsername());
        }

        return dto;
    }

    /**
     * Update schedule entity from DTO
     */
    private void updateScheduleFromDTO(MaintenanceSchedule schedule, MaintenanceScheduleDTO dto) {
        schedule.setTitle(dto.getTitle());
        schedule.setDescription(dto.getDescription());
        
        if (dto.getCategory() != null) {
            schedule.setCategory(MaintenanceSchedule.Category.valueOf(dto.getCategory()));
        }
        
        if (dto.getRecurrenceType() != null) {
            schedule.setRecurrenceType(MaintenanceSchedule.RecurrenceType.valueOf(dto.getRecurrenceType()));
        }
        
        schedule.setRecurrenceInterval(dto.getRecurrenceInterval());
        schedule.setRecurrenceDayOfWeek(dto.getRecurrenceDayOfWeek());
        schedule.setRecurrenceDayOfMonth(dto.getRecurrenceDayOfMonth());
        
        if (dto.getTargetType() != null) {
            schedule.setTargetType(MaintenanceSchedule.TargetType.valueOf(dto.getTargetType()));
        }
        
        // Target units already in correct format (string or JSON)
        if (dto.getTargetUnits() != null) {
            schedule.setTargetUnits(dto.getTargetUnits());
        }
        
        schedule.setStartDate(dto.getStartDate());
        schedule.setEndDate(dto.getEndDate());
        schedule.setNotifyDaysBefore(dto.getNotifyDaysBefore());
        
        // Notify users already in correct format
        if (dto.getNotifyUsers() != null) {
            schedule.setNotifyUsers(dto.getNotifyUsers());
        }
        
        schedule.setEstimatedCost(dto.getEstimatedCost());
        
        if (dto.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(dto.getAssignedToUserId()).orElse(null);
            schedule.setAssignedTo(assignedUser);
        }
        
        if (dto.getPriority() != null) {
            schedule.setPriority(MaintenanceSchedule.Priority.valueOf(dto.getPriority()));
        }
        
        if (dto.getIsActive() != null) {
            schedule.setIsActive(dto.getIsActive());
        }
        
        if (dto.getIsPaused() != null) {
            schedule.setIsPaused(dto.getIsPaused());
        }
    }

    /**
     * Clone schedule for comparison
     */
    private MaintenanceSchedule cloneSchedule(MaintenanceSchedule schedule) {
        MaintenanceSchedule clone = new MaintenanceSchedule();
        clone.setTitle(schedule.getTitle());
        clone.setDescription(schedule.getDescription());
        clone.setCategory(schedule.getCategory());
        clone.setRecurrenceType(schedule.getRecurrenceType());
        clone.setRecurrenceInterval(schedule.getRecurrenceInterval());
        clone.setTargetType(schedule.getTargetType());
        clone.setTargetUnits(schedule.getTargetUnits());
        clone.setPriority(schedule.getPriority());
        clone.setIsActive(schedule.getIsActive());
        clone.setIsPaused(schedule.getIsPaused());
        return clone;
    }

    /**
     * Get affected units with auto-generated time slots
     */
    public List<apartment.example.backend.dto.ScheduleAffectedUnitDTO> getAffectedUnitsWithTimeSlots(Long scheduleId) {
        log.info("Fetching affected units for schedule: {}", scheduleId);
        
        MaintenanceSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        
        List<Long> targetUnitIds = resolveTargetUnits(schedule);
        List<apartment.example.backend.dto.ScheduleAffectedUnitDTO> affectedUnits = new ArrayList<>();
        
        for (Long unitId : targetUnitIds) {
            apartment.example.backend.entity.Unit unit = unitRepository.findById(unitId).orElse(null);
            if (unit == null) continue;
            
            // Check if unit is occupied
            Optional<Lease> activeLease = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
            boolean isOccupied = activeLease.isPresent();
            
            String tenantName = null;
            String tenantEmail = null;
            
            if (isOccupied && activeLease.get().getTenant() != null) {
                tenantName = activeLease.get().getTenant().getFirstName() + " " + 
                            activeLease.get().getTenant().getLastName();
                tenantEmail = activeLease.get().getTenant().getEmail();
            }
            
            // Auto-generate time slot (9 AM - 5 PM, avoiding booked slots)
            String preferredDateTime = generateAvailableTimeSlot(unitId, schedule.getNextTriggerDate());
            
            // Check for conflicts
            boolean hasConflict = checkTimeSlotConflict(unitId, preferredDateTime);
            
            apartment.example.backend.dto.ScheduleAffectedUnitDTO dto = new apartment.example.backend.dto.ScheduleAffectedUnitDTO();
            dto.setUnitId(unitId);
            dto.setRoomNumber(unit.getRoomNumber());
            dto.setTenantName(tenantName);
            dto.setTenantEmail(tenantEmail);
            dto.setPreferredDateTime(preferredDateTime);
            dto.setIsOccupied(isOccupied);
            dto.setHasConflict(hasConflict);
            
            // Only include occupied units
            if (isOccupied) {
                affectedUnits.add(dto);
            }
        }
        
        log.info("Found {} occupied units for schedule {}", affectedUnits.size(), scheduleId);
        return affectedUnits;
    }

    /**
     * Generate available time slot for unit
     */
    private String generateAvailableTimeSlot(Long unitId, LocalDate targetDate) {
        // Available time slots (9 AM to 5 PM, every hour)
        String[] timeSlots = {
            "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
        };
        
        // Get all existing bookings for this unit on target date
        List<MaintenanceRequest> existingRequests = requestRepository
            .findByUnitIdAndPreferredTimeContaining(unitId, targetDate.toString());
        
        // Find first available slot
        for (String slot : timeSlots) {
            String dateTime = targetDate + "T" + slot + ":00";
            boolean isBooked = existingRequests.stream()
                .anyMatch(req -> req.getPreferredTime() != null && 
                         req.getPreferredTime().contains(slot));
            
            if (!isBooked) {
                return dateTime;
            }
        }
        
        // Default to 9 AM if all slots are booked (should be rare)
        return targetDate + "T09:00:00";
    }

    /**
     * Check if time slot has conflict
     */
    private boolean checkTimeSlotConflict(Long unitId, String preferredDateTime) {
        if (preferredDateTime == null) return false;
        
        List<MaintenanceRequest> existingRequests = requestRepository
            .findByUnitId(unitId);
        
        return existingRequests.stream()
            .anyMatch(req -> req.getPreferredTime() != null && 
                     req.getPreferredTime().equals(preferredDateTime) &&
                     (req.getStatus() == MaintenanceRequest.RequestStatus.SUBMITTED ||
                      req.getStatus() == MaintenanceRequest.RequestStatus.IN_PROGRESS));
    }

    /**
     * Trigger schedule for specific unit only
     */
    @Transactional
    public void triggerScheduleForUnit(Long scheduleId, Long unitId, String preferredDateTime) {
        log.info("Triggering schedule {} for unit {}", scheduleId, unitId);
        
        MaintenanceSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        
        if (!schedule.getIsActive()) {
            throw new RuntimeException("Cannot trigger inactive schedule");
        }
        
        // Create maintenance request for this unit with custom time
        createMaintenanceRequestForUnitWithTime(schedule, unitId, preferredDateTime);
        
        log.info("Successfully triggered schedule {} for unit {}", scheduleId, unitId);
    }

    /**
     * Create maintenance request for unit with custom time
     */
    private void createMaintenanceRequestForUnitWithTime(MaintenanceSchedule schedule, Long unitId, String preferredDateTime) {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setUnitId(unitId);
        request.setTitle(schedule.getTitle());
        request.setDescription(schedule.getDescription());
        request.setCategory(MaintenanceRequest.Category.valueOf(schedule.getCategory().name()));
        request.setPriority(MaintenanceRequest.Priority.valueOf(schedule.getPriority().name()));
        request.setStatus(MaintenanceRequest.RequestStatus.IN_PROGRESS);
        request.setEstimatedCost(schedule.getEstimatedCost());
        request.setScheduleId(schedule.getId());
        request.setIsFromSchedule(true);
        request.setPreferredTime(preferredDateTime != null ? preferredDateTime : schedule.getNextTriggerDate().toString() + "T09:00:00");

        if (schedule.getAssignedTo() != null) {
            request.setAssignedToUserId(schedule.getAssignedTo().getId());
        }
        
        // Set createdByUserId to tenant user ID
        try {
            Optional<Lease> activeLease = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
            if (activeLease.isPresent()) {
                Lease lease = activeLease.get();
                if (lease.getTenant() != null && lease.getTenant().getEmail() != null) {
                    String tenantEmail = lease.getTenant().getEmail();
                    Optional<User> tenantUser = userRepository.findByEmail(tenantEmail);
                    if (tenantUser.isPresent()) {
                        request.setCreatedByUserId(tenantUser.get().getId());
                        log.info("Set createdByUserId to tenant user: {}", tenantUser.get().getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error setting createdByUserId", e);
        }

        MaintenanceRequest savedRequest = requestRepository.save(request);
        log.info("Created maintenance request #{} for unit {}", savedRequest.getId(), unitId);

        // Send notification
        try {
            apartment.example.backend.entity.Unit unit = unitRepository.findById(unitId).orElse(null);
            if (unit != null) {
                Optional<Lease> activeLease = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
                if (activeLease.isPresent() && activeLease.get().getTenant() != null) {
                    String tenantEmail = activeLease.get().getTenant().getEmail();
                    Optional<User> tenantUser = userRepository.findByEmail(tenantEmail);
                    if (tenantUser.isPresent()) {
                        notificationService.notifyScheduledMaintenanceCreated(
                            savedRequest,
                            tenantUser.get().getId(),
                            activeLease.get().getTenant(),
                            unit,
                            schedule
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error sending notification for unit {}", unitId, e);
        }
    }
}

