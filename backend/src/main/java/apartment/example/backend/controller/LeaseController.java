package apartment.example.backend.controller;

import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.service.LeaseService;
import apartment.example.backend.service.PdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leases")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class LeaseController {

    private final LeaseService leaseService;
    private final PdfService pdfService;

    @GetMapping
    public ResponseEntity<List<Lease>> getAllLeases() {
        List<Lease> leases = leaseService.getAllLeases();
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<Lease>> getAllLeases(Pageable pageable) {
        Page<Lease> leases = leaseService.getAllLeases(pageable);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lease> getLeaseById(@PathVariable Long id) {
        return leaseService.getLeaseById(id)
                .map(lease -> ResponseEntity.ok(lease))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Lease>> getLeasesByStatus(@PathVariable LeaseStatus status) {
        List<Lease> leases = leaseService.getLeasesByStatus(status);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Lease>> getLeasesByTenant(@PathVariable Long tenantId) {
        List<Lease> leases = leaseService.getLeasesByTenant(tenantId);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/unit/{unitId}")
    public ResponseEntity<List<Lease>> getLeasesByUnit(@PathVariable Long unitId) {
        List<Lease> leases = leaseService.getLeasesByUnit(unitId);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/unit/{unitId}/active")
    public ResponseEntity<Lease> getActiveLeaseByUnit(@PathVariable Long unitId) {
        return leaseService.getActiveLeaseByUnit(unitId)
                .map(lease -> ResponseEntity.ok(lease))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Download Lease Agreement PDF
     * 
     * GET /leases/{id}/agreement
     */
    @GetMapping("/{id}/agreement")
    public ResponseEntity<byte[]> downloadLeaseAgreement(@PathVariable Long id) {
        try {
            Lease lease = leaseService.getLeaseById(id)
                    .orElseThrow(() -> new RuntimeException("Lease not found"));
            
            byte[] pdfBytes = pdfService.generateLeaseAgreementPdf(lease);
            
            // Generate filename: lease_agreement_Si101_TestCase.pdf
            String unitNumber = lease.getUnit().getRoomNumber();
            String tenantName = lease.getTenant().getFirstName() + lease.getTenant().getLastName();
            // Remove spaces and special characters
            tenantName = tenantName.replaceAll("[^a-zA-Z0-9]", "");
            String filename = "lease_agreement_Si" + unitNumber + "_" + tenantName + ".pdf";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.set("X-Filename", filename);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error generating lease agreement PDF: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ending-soon")
    public ResponseEntity<List<Lease>> getLeasesEndingSoon(@RequestParam(defaultValue = "30") int days) {
        List<Lease> leases = leaseService.getLeasesEndingSoon(days);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/expired")
    public ResponseEntity<List<Lease>> getExpiredLeases() {
        List<Lease> leases = leaseService.getExpiredLeases();
        return ResponseEntity.ok(leases);
    }

    @PostMapping
    public ResponseEntity<Lease> createLease(@RequestBody Lease lease) {
        try {
            Lease createdLease = leaseService.createLease(lease);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLease);
        } catch (IllegalArgumentException e) {
            log.error("Error creating lease: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lease> updateLease(@PathVariable Long id, @RequestBody Lease lease) {
        try {
            Lease updatedLease = leaseService.updateLease(id, lease);
            return ResponseEntity.ok(updatedLease);
        } catch (IllegalArgumentException e) {
            log.error("Error updating lease: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error updating lease: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Lease> activateLease(@PathVariable Long id) {
        try {
            Lease activatedLease = leaseService.activateLease(id);
            return ResponseEntity.ok(activatedLease);
        } catch (IllegalArgumentException e) {
            log.error("Error activating lease: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error activating lease: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/terminate")
    public ResponseEntity<Lease> terminateLease(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String reason = request.getOrDefault("reason", "No reason provided");
            Lease terminatedLease = leaseService.terminateLease(id, reason);
            return ResponseEntity.ok(terminatedLease);
        } catch (RuntimeException e) {
            log.error("Error terminating lease: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<Lease> terminateLeaseWithDate(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String checkoutDateStr = request.get("checkoutDate");
            if (checkoutDateStr == null || checkoutDateStr.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            Lease terminatedLease = leaseService.terminateLeaseWithCheckoutDate(id, checkoutDateStr);
            return ResponseEntity.ok(terminatedLease);
        } catch (IllegalArgumentException e) {
            log.error("Error terminating lease: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error terminating lease: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/expire-leases")
    public ResponseEntity<String> expireLeases() {
        try {
            leaseService.expireLeases();
            return ResponseEntity.ok("Expired leases processed successfully");
        } catch (Exception e) {
            log.error("Error expiring leases: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Error processing expired leases");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLease(@PathVariable Long id) {
        try {
            leaseService.deleteLease(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting lease: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> checkLeaseExists(@PathVariable Long id) {
        boolean exists = leaseService.existsById(id);
        return ResponseEntity.ok(exists);
    }

    /**
     * Generate Lease Agreement PDF
     * 
     * @param id Lease ID
     * @return PDF file as byte array
     */
    @GetMapping("/{id}/generate-pdf")
    public ResponseEntity<byte[]> generateLeaseAgreementPdf(@PathVariable Long id) {
        try {
            log.info("Generating PDF for lease ID: {}", id);
            
            // Get lease with tenant and unit information
            Lease lease = leaseService.getLeaseById(id)
                    .orElseThrow(() -> new RuntimeException("Lease not found with id: " + id));

            // Generate PDF
            byte[] pdfBytes = pdfService.generateLeaseAgreementPdf(lease);

            // Set headers for PDF download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "lease-agreement-" + id + ".pdf");
            headers.setContentLength(pdfBytes.length);

            log.info("PDF generated successfully for lease ID: {}", id);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
                    
        } catch (RuntimeException e) {
            log.error("Error generating PDF for lease ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error generating PDF for lease ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}