package apartment.example.backend.controller;

import apartment.example.backend.dto.MaintenanceScheduleDTO;
import apartment.example.backend.service.MaintenanceScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Maintenance Schedule Controller
 * 
 * REST API endpoints for maintenance schedule management
 */
@RestController
@RequestMapping("/api/maintenance/schedules")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class MaintenanceScheduleController {

    private final MaintenanceScheduleService scheduleService;

    /**
     * Get all active schedules
     * 
     * GET /maintenance/schedules
     * 
     * Response: List of active maintenance schedules
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<List<MaintenanceScheduleDTO>> getAllActiveSchedules() {
        log.info("GET /maintenance/schedules - Fetching all active schedules");
        try {
            List<MaintenanceScheduleDTO> schedules = scheduleService.getAllActiveSchedules();
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Error fetching schedules", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get schedule by ID
     * 
     * GET /maintenance/schedules/{id}
     * 
     * Response: Maintenance schedule details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<MaintenanceScheduleDTO> getScheduleById(@PathVariable Long id) {
        log.info("GET /maintenance/schedules/{} - Fetching schedule", id);
        try {
            MaintenanceScheduleDTO schedule = scheduleService.getScheduleById(id);
            return ResponseEntity.ok(schedule);
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error fetching schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create new maintenance schedule
     * 
     * POST /maintenance/schedules
     * 
     * Request Body: MaintenanceScheduleDTO
     * Response: Created schedule with ID
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<MaintenanceScheduleDTO> createSchedule(
            @RequestBody MaintenanceScheduleDTO scheduleDTO,
            Authentication authentication) {
        log.info("POST /maintenance/schedules - Creating new schedule: {}", scheduleDTO.getTitle());
        try {
            Long userId = getUserIdFromAuth(authentication);
            MaintenanceScheduleDTO created = scheduleService.createSchedule(scheduleDTO, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update existing schedule
     * 
     * PUT /maintenance/schedules/{id}
     * 
     * Request Body: MaintenanceScheduleDTO
     * Response: Updated schedule
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<MaintenanceScheduleDTO> updateSchedule(
            @PathVariable Long id,
            @RequestBody MaintenanceScheduleDTO scheduleDTO,
            Authentication authentication) {
        log.info("PUT /maintenance/schedules/{} - Updating schedule", id);
        try {
            Long userId = getUserIdFromAuth(authentication);
            MaintenanceScheduleDTO updated = scheduleService.updateSchedule(id, scheduleDTO, userId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete schedule
     * 
     * DELETE /maintenance/schedules/{id}
     * 
     * Response: 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("DELETE /maintenance/schedules/{} - Deleting schedule", id);
        try {
            Long userId = getUserIdFromAuth(authentication);
            scheduleService.deleteSchedule(id, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Activate schedule
     * 
     * POST /maintenance/schedules/{id}/activate
     * 
     * Response: 200 OK
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> activateSchedule(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("POST /maintenance/schedules/{}/activate", id);
        try {
            Long userId = getUserIdFromAuth(authentication);
            scheduleService.activateSchedule(id, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error activating schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Deactivate schedule
     * 
     * POST /maintenance/schedules/{id}/deactivate
     * 
     * Response: 200 OK
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deactivateSchedule(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("POST /maintenance/schedules/{}/deactivate", id);
        try {
            Long userId = getUserIdFromAuth(authentication);
            scheduleService.deactivateSchedule(id, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deactivating schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Pause schedule
     * 
     * POST /maintenance/schedules/{id}/pause
     * 
     * Response: 200 OK
     */
    @PostMapping("/{id}/pause")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> pauseSchedule(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("POST /maintenance/schedules/{}/pause", id);
        try {
            Long userId = getUserIdFromAuth(authentication);
            scheduleService.pauseSchedule(id, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error pausing schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Resume schedule
     * 
     * POST /maintenance/schedules/{id}/resume
     * 
     * Response: 200 OK
     */
    @PostMapping("/{id}/resume")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> resumeSchedule(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("POST /maintenance/schedules/{}/resume", id);
        try {
            Long userId = getUserIdFromAuth(authentication);
            scheduleService.resumeSchedule(id, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error resuming schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Manually trigger schedule (create maintenance requests)
     * 
     * POST /maintenance/schedules/{id}/trigger
     * 
     * Response: 200 OK
     */
    @PostMapping("/{id}/trigger")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> triggerSchedule(@PathVariable Long id) {
        log.info("POST /maintenance/schedules/{}/trigger - Manually triggering schedule", id);
        try {
            scheduleService.triggerSchedule(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Schedule not found or cannot be triggered: {}", id, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error triggering schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get affected units for schedule with auto-generated time slots
     * 
     * GET /maintenance/schedules/{id}/affected-units
     * 
     * Response: List of units that will be affected by this schedule
     */
    @GetMapping("/{id}/affected-units")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<List<apartment.example.backend.dto.ScheduleAffectedUnitDTO>> getAffectedUnits(@PathVariable Long id) {
        log.info("GET /maintenance/schedules/{}/affected-units", id);
        try {
            List<apartment.example.backend.dto.ScheduleAffectedUnitDTO> affectedUnits = scheduleService.getAffectedUnitsWithTimeSlots(id);
            return ResponseEntity.ok(affectedUnits);
        } catch (RuntimeException e) {
            log.error("Schedule not found: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error fetching affected units", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Trigger schedule for specific unit only
     * 
     * POST /maintenance/schedules/{id}/trigger-unit
     * 
     * Request Body: { "unitId": 123, "preferredDateTime": "2025-11-20T14:00:00" }
     */
    @PostMapping("/{id}/trigger-unit")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> triggerScheduleForUnit(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> request) {
        log.info("POST /maintenance/schedules/{}/trigger-unit", id);
        try {
            Long unitId = Long.parseLong(request.get("unitId").toString());
            String preferredDateTime = request.get("preferredDateTime") != null ? request.get("preferredDateTime").toString() : null;
            scheduleService.triggerScheduleForUnit(id, unitId, preferredDateTime);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error triggering schedule for unit", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error triggering schedule for unit", e);
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
