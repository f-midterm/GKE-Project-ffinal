package apartment.example.backend.service;

import apartment.example.backend.entity.MaintenanceRequest;
import apartment.example.backend.entity.MaintenanceRequest.Priority;
import apartment.example.backend.entity.MaintenanceRequest.Category;
import apartment.example.backend.entity.MaintenanceRequest.RequestStatus;
import apartment.example.backend.entity.MaintenanceLog;
import apartment.example.backend.repository.MaintenanceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.transaction.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class MaintenanceRequestService {

    @Autowired
    private MaintenanceRequestRepository maintenanceRequestRepository;

    @Autowired
    private MaintenanceLogService logService;

    @Autowired
    private MaintenanceNotificationService notificationService;

    @Value("${file.maintenance-upload-dir:uploads/maintenance-attachments}")
    private String uploadDir;

    // Create a new maintenance request
    public MaintenanceRequest createMaintenanceRequest(MaintenanceRequest request) {
        request.setSubmittedDate(LocalDateTime.now());
        request.setStatus(RequestStatus.SUBMITTED);
        return maintenanceRequestRepository.save(request);
    }

    // Get all maintenance requests
    public List<MaintenanceRequest> getAllMaintenanceRequests() {
        return maintenanceRequestRepository.findAll();
    }

    // Get maintenance request by ID
    public Optional<MaintenanceRequest> getMaintenanceRequestById(Long id) {
        return maintenanceRequestRepository.findById(id);
    }

    // Get requests by tenant ID
    public List<MaintenanceRequest> getRequestsByTenantId(Long tenantId) {
        return maintenanceRequestRepository.findByTenantId(tenantId);
    }

    // Get requests by created user ID
    public List<MaintenanceRequest> getRequestsByCreatedByUserId(Long userId) {
        return maintenanceRequestRepository.findByCreatedByUserId(userId);
    }

    // Get requests by unit ID
    public List<MaintenanceRequest> getRequestsByUnitId(Long unitId) {
        return maintenanceRequestRepository.findByUnitId(unitId);
    }

    // Get requests by status
    public List<MaintenanceRequest> getRequestsByStatus(RequestStatus status) {
        return maintenanceRequestRepository.findByStatus(status);
    }

    // Get requests by priority
    public List<MaintenanceRequest> getRequestsByPriority(Priority priority) {
        return maintenanceRequestRepository.findByPriority(priority);
    }

    // Get requests by category
    public List<MaintenanceRequest> getRequestsByCategory(Category category) {
        return maintenanceRequestRepository.findByCategory(category);
    }

    // Get open requests
    public List<MaintenanceRequest> getOpenRequests() {
        return maintenanceRequestRepository.findOpenRequests();
    }

    // Get high priority requests
    public List<MaintenanceRequest> getHighPriorityRequests() {
        return maintenanceRequestRepository.findByPriorityOrderBySubmittedDateDesc(Priority.HIGH);
    }

    // Update maintenance request
    // public MaintenanceRequest updateMaintenanceRequest(Long id, MaintenanceRequest updatedRequest) {
    //     return maintenanceRequestRepository.findById(id)
    //             .map(request -> {
    //                 request.setTitle(updatedRequest.getTitle());
    //                 request.setDescription(updatedRequest.getDescription());
    //                 request.setPriority(updatedRequest.getPriority());
    //                 request.setCategory(updatedRequest.getCategory());
    //                 request.setPreferredTime(updatedRequest.getPreferredTime());
    //                 request.setUrgency(updatedRequest.getUrgency());
    //                 request.setUnitId(updatedRequest.getUnitId());
    //                 return maintenanceRequestRepository.save(request);
    //             })
    //             .orElseThrow(() -> new RuntimeException("Maintenance request not found"));
    // }
    // ในไฟล์ MaintenanceRequestService.java

public MaintenanceRequest updateMaintenanceRequest(Long id, MaintenanceRequest requestDetailsFromFrontend) {
    
    // 1. ดึงข้อมูลเก่าที่มีอยู่จาก Database ขึ้นมาก่อน
    MaintenanceRequest existingRequest = maintenanceRequestRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Request not found with id: " + id));

    // เก็บ status เดิมเพื่อตรวจสอบการเปลี่ยนแปลง
    RequestStatus oldStatus = existingRequest.getStatus();
    
    // 2. อัปเดตเฉพาะ field ที่ได้รับมาจากฟอร์มเท่านั้น
    // ใช้ if ตรวจสอบเพื่อป้องกันการเขียนทับ field สำคัญด้วยค่า null
    if (requestDetailsFromFrontend.getTitle() != null) {
        existingRequest.setTitle(requestDetailsFromFrontend.getTitle());
    }
    if (requestDetailsFromFrontend.getDescription() != null) {
        existingRequest.setDescription(requestDetailsFromFrontend.getDescription());
    }
    if (requestDetailsFromFrontend.getPriority() != null) {
        existingRequest.setPriority(requestDetailsFromFrontend.getPriority());
    }
    if (requestDetailsFromFrontend.getCategory() != null) {
        existingRequest.setCategory(requestDetailsFromFrontend.getCategory());
    }
    if (requestDetailsFromFrontend.getStatus() != null) {
        existingRequest.setStatus(requestDetailsFromFrontend.getStatus());
        
        // ถ้า status เปลี่ยนเป็น COMPLETED ให้บันทึกวันที่เสร็จสิ้น
        if (requestDetailsFromFrontend.getStatus() == RequestStatus.COMPLETED && oldStatus != RequestStatus.COMPLETED) {
            existingRequest.setCompletedDate(LocalDateTime.now());
        }
    }
    if (requestDetailsFromFrontend.getPreferredTime() != null) {
        existingRequest.setPreferredTime(requestDetailsFromFrontend.getPreferredTime());
    }
    // เพิ่ม field อื่นๆ ที่คุณอนุญาตให้แก้ไขได้จากฟอร์ม...

    // 3. บันทึกอ็อบเจกต์ที่อัปเดตแล้วกลับลง Database
    MaintenanceRequest saved = maintenanceRequestRepository.save(existingRequest);
    
    // 4. ถ้ามีการเปลี่ยน status ให้ส่ง notification และบันทึก log
    if (requestDetailsFromFrontend.getStatus() != null && oldStatus != requestDetailsFromFrontend.getStatus()) {
        RequestStatus newStatus = requestDetailsFromFrontend.getStatus();
        
        // Log status change
        try {
            logService.logRequestStatusChanged(saved, oldStatus.toString(), newStatus.toString(), null);
        } catch (Exception e) {
            System.err.println("Failed to log status change: " + e.getMessage());
        }
        
        // Send notification to user
        try {
            Long userId = saved.getCreatedByUserId();
            
            if (userId != null) {
                if (newStatus == RequestStatus.COMPLETED) {
                    notificationService.notifyMaintenanceCompleted(saved, userId);
                } else if (newStatus == RequestStatus.APPROVED || newStatus == RequestStatus.IN_PROGRESS) {
                    notificationService.notifyStatusChanged(saved, userId, newStatus.toString());
                } else if (newStatus == RequestStatus.CANCELLED) {
                    notificationService.notifyStatusChanged(saved, userId, "CANCELLED");
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send status change notification: " + e.getMessage());
        }
    }
    
    return saved;
}

    // Assign maintenance request to a user
    public MaintenanceRequest assignMaintenanceRequest(Long id, Long assignedToUserId) {
        return maintenanceRequestRepository.findById(id)
                .map(request -> {
                    request.setAssignedToUserId(assignedToUserId);
                    request.setStatus(RequestStatus.IN_PROGRESS);
                    return maintenanceRequestRepository.save(request);
                })
                .orElseThrow(() -> new RuntimeException("Maintenance request not found"));
    }

    // Update status of maintenance request
    public MaintenanceRequest updateRequestStatus(Long id, RequestStatus status, String notes) {
        return maintenanceRequestRepository.findById(id)
                .map(request -> {
                    RequestStatus oldStatus = request.getStatus();
                    request.setStatus(status);
                    if (notes != null && !notes.trim().isEmpty()) {
                        request.setCompletionNotes(notes);
                    }
                    if (status == RequestStatus.COMPLETED) {
                        request.setCompletedDate(LocalDateTime.now());
                    }
                    MaintenanceRequest saved = maintenanceRequestRepository.save(request);
                    
                    // Log status change (pass null for user since we don't have security context here)
                    try {
                        logService.logRequestStatusChanged(saved, oldStatus.toString(), status.toString(), null);
                    } catch (Exception e) {
                        // Log error but don't fail the operation
                        System.err.println("Failed to log status change: " + e.getMessage());
                    }
                    
                    // Send notification to user on status change
                    try {
                        Long userId = saved.getCreatedByUserId();
                        
                        if (userId != null) {
                            // Send different notification based on status
                            if (status == RequestStatus.COMPLETED) {
                                notificationService.notifyMaintenanceCompleted(saved, userId);
                            } else if (status == RequestStatus.APPROVED || status == RequestStatus.IN_PROGRESS) {
                                notificationService.notifyStatusChanged(saved, userId, status.toString());
                            } else if (status == RequestStatus.CANCELLED) {
                                notificationService.notifyStatusChanged(saved, userId, "CANCELLED");
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to send status change notification: " + e.getMessage());
                    }
                    
                    return saved;
                })
                .orElseThrow(() -> new RuntimeException("Maintenance request not found"));
    }

    // Update priority of maintenance request
    public MaintenanceRequest updateRequestPriority(Long id, Priority priority) {
        return maintenanceRequestRepository.findById(id)
                .map(request -> {
                    request.setPriority(priority);
                    return maintenanceRequestRepository.save(request);
                })
                .orElseThrow(() -> new RuntimeException("Maintenance request not found"));
    }

    // Complete maintenance request
    public MaintenanceRequest completeMaintenanceRequest(Long id, String completionNotes) {
        return maintenanceRequestRepository.findById(id)
                .map(request -> {
                    RequestStatus oldStatus = request.getStatus();
                    request.setStatus(RequestStatus.COMPLETED);
                    request.setCompletedDate(LocalDateTime.now());
                    request.setCompletionNotes(completionNotes);
                    MaintenanceRequest saved = maintenanceRequestRepository.save(request);
                    
                    // Log completion (pass null for user since we don't have security context here)
                    try {
                        logService.logRequestStatusChanged(saved, oldStatus.toString(), "COMPLETED", null);
                    } catch (Exception e) {
                        // Log error but don't fail the operation
                        System.err.println("Failed to log completion: " + e.getMessage());
                    }
                    
                    // Send notification to user (creator)
                    try {
                        Long userId = saved.getCreatedByUserId();
                        
                        if (userId != null) {
                            notificationService.notifyMaintenanceCompleted(saved, userId);
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to send completion notification: " + e.getMessage());
                    }
                    
                    return saved;
                })
                .orElseThrow(() -> new RuntimeException("Maintenance request not found"));
    }

    // Reject maintenance request
    public MaintenanceRequest rejectMaintenanceRequest(Long id, String rejectionReason) {
        return maintenanceRequestRepository.findById(id)
                .map(request -> {
                    request.setStatus(RequestStatus.CANCELLED);
                    request.setCompletionNotes(rejectionReason);
                    return maintenanceRequestRepository.save(request);
                })
                .orElseThrow(() -> new RuntimeException("Maintenance request not found"));
    }

    // Delete maintenance request
    public void deleteMaintenanceRequest(Long id) {
        maintenanceRequestRepository.deleteById(id);
    }

    // Get maintenance request statistics
    public Map<String, Long> getMaintenanceRequestStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("TOTAL", (long) maintenanceRequestRepository.findAll().size());
        stats.put("NOT_SUBMITTED", maintenanceRequestRepository.countByStatus(RequestStatus.NOT_SUBMITTED));
        stats.put("SUBMITTED", maintenanceRequestRepository.countByStatus(RequestStatus.SUBMITTED));
        stats.put("WAITING_FOR_REPAIR", maintenanceRequestRepository.countByStatus(RequestStatus.WAITING_FOR_REPAIR));
        stats.put("APPROVED", maintenanceRequestRepository.countByStatus(RequestStatus.APPROVED));
        stats.put("IN_PROGRESS", maintenanceRequestRepository.countByStatus(RequestStatus.IN_PROGRESS));
        stats.put("COMPLETED", maintenanceRequestRepository.countByStatus(RequestStatus.COMPLETED));
        stats.put("CANCELLED", maintenanceRequestRepository.countByStatus(RequestStatus.CANCELLED));
        return stats;
    }

    /**
     * Upload attachments for a maintenance request
     */
    @Transactional
    public MaintenanceRequest uploadAttachments(Long requestId, MultipartFile[] files) {
        MaintenanceRequest request = getMaintenanceRequestById(requestId)
                .orElseThrow(() -> new RuntimeException("Maintenance request not found"));

        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<String> fileUrls = new ArrayList<>();

            // Save each file
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    // Generate unique filename
                    String originalFilename = file.getOriginalFilename();
                    String extension = originalFilename != null && originalFilename.contains(".")
                            ? originalFilename.substring(originalFilename.lastIndexOf("."))
                            : "";
                    String filename = String.format("maintenance_%s_%s%s",
                            requestId,
                            UUID.randomUUID().toString(),
                            extension);

                    // Save file
                    Path filePath = uploadPath.resolve(filename);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                    // Add URL to list
                    fileUrls.add("/uploads/maintenance-attachments/" + filename);
                }
            }

            // Update request with file URLs
            if (!fileUrls.isEmpty()) {
                String existingUrls = request.getAttachmentUrls();
                if (existingUrls != null && !existingUrls.isEmpty()) {
                    fileUrls.add(0, existingUrls);
                }
                request.setAttachmentUrls(String.join(",", fileUrls));
            }

            return maintenanceRequestRepository.save(request);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload attachments: " + e.getMessage());
        }
    }

    // Get statistics by priority
    public Map<String, Long> getStatsByPriority() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("LOW", maintenanceRequestRepository.countByPriority(Priority.LOW));
        stats.put("MEDIUM", maintenanceRequestRepository.countByPriority(Priority.MEDIUM));
        stats.put("HIGH", maintenanceRequestRepository.countByPriority(Priority.HIGH));
        stats.put("URGENT", maintenanceRequestRepository.countByPriority(Priority.URGENT));
        return stats;
    }

    // Get statistics by category
    public Map<String, Long> getStatsByCategory() {
        Map<String, Long> stats = new HashMap<>();
        for (Category category : Category.values()) {
            stats.put(category.name(), maintenanceRequestRepository.countByCategory(category));
        }
        return stats;
    }
}