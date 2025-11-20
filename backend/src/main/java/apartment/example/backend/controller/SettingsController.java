package apartment.example.backend.controller;

import apartment.example.backend.entity.ApartmentSettings;
import apartment.example.backend.service.ApartmentSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SettingsController {

    private final ApartmentSettingsService settingsService;

    /**
     * Get all settings
     */
    @GetMapping
    public ResponseEntity<List<ApartmentSettings>> getAllSettings() {
        return ResponseEntity.ok(settingsService.getAllSettings());
    }

    /**
     * Get specific setting by key
     */
    @GetMapping("/{key}")
    public ResponseEntity<ApartmentSettings> getSettingByKey(@PathVariable String key) {
        return settingsService.getSettingByKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get utility rates (electricity and water)
     */
    @GetMapping("/utility-rates")
    public ResponseEntity<Map<String, Object>> getUtilityRates() {
        Map<String, Object> rates = Map.of(
            "electricityRate", settingsService.getElectricityRate(),
            "waterRate", settingsService.getWaterRate()
        );
        return ResponseEntity.ok(rates);
    }

    /**
     * Update setting value (Admin only)
     */
    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApartmentSettings> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> request) {
        try {
            String value = request.get("value");
            // TODO: Extract user ID from JWT token
            Long userId = null; // You can get this from SecurityContext
            
            ApartmentSettings updated = settingsService.updateSetting(key, value, userId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating setting: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Update utility rates (Admin only)
     */
    @PutMapping("/utility-rates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateUtilityRates(
            @RequestBody Map<String, String> request) {
        try {
            // TODO: Extract user ID from JWT token
            Long userId = null;
            
            if (request.containsKey("electricityRate")) {
                settingsService.updateSetting("ELECTRICITY_RATE", request.get("electricityRate"), userId);
            }
            
            if (request.containsKey("waterRate")) {
                settingsService.updateSetting("WATER_RATE", request.get("waterRate"), userId);
            }
            
            Map<String, Object> rates = Map.of(
                "electricityRate", settingsService.getElectricityRate(),
                "waterRate", settingsService.getWaterRate(),
                "message", "Utility rates updated successfully"
            );
            
            return ResponseEntity.ok(rates);
        } catch (RuntimeException e) {
            log.error("Error updating utility rates: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
