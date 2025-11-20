package apartment.example.backend.service;

import apartment.example.backend.entity.ApartmentSettings;
import apartment.example.backend.repository.ApartmentSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApartmentSettingsService {

    private final ApartmentSettingsRepository settingsRepository;

    /**
     * Get all settings
     */
    public List<ApartmentSettings> getAllSettings() {
        return settingsRepository.findAll();
    }

    /**
     * Get setting by key
     */
    public Optional<ApartmentSettings> getSettingByKey(String key) {
        return settingsRepository.findBySettingKey(key);
    }

    /**
     * Get setting value as BigDecimal
     */
    public BigDecimal getSettingValueAsDecimal(String key, BigDecimal defaultValue) {
        return settingsRepository.findBySettingKey(key)
                .map(setting -> {
                    try {
                        return new BigDecimal(setting.getSettingValue());
                    } catch (NumberFormatException e) {
                        log.error("Invalid decimal value for setting {}: {}", key, setting.getSettingValue());
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    /**
     * Get electricity rate
     */
    public BigDecimal getElectricityRate() {
        return getSettingValueAsDecimal("ELECTRICITY_RATE", new BigDecimal("4.00"));
    }

    /**
     * Get water rate
     */
    public BigDecimal getWaterRate() {
        return getSettingValueAsDecimal("WATER_RATE", new BigDecimal("20.00"));
    }

    /**
     * Update setting value
     */
    @Transactional
    public ApartmentSettings updateSetting(String key, String value, Long updatedByUserId) {
        ApartmentSettings setting = settingsRepository.findBySettingKey(key)
                .orElseThrow(() -> new RuntimeException("Setting not found: " + key));
        
        setting.setSettingValue(value);
        setting.setUpdatedByUserId(updatedByUserId);
        
        log.info("Updated setting {} to value: {}", key, value);
        return settingsRepository.save(setting);
    }

    /**
     * Create or update setting
     */
    @Transactional
    public ApartmentSettings createOrUpdateSetting(String key, String value, String description, Long updatedByUserId) {
        Optional<ApartmentSettings> existing = settingsRepository.findBySettingKey(key);
        
        if (existing.isPresent()) {
            ApartmentSettings setting = existing.get();
            setting.setSettingValue(value);
            setting.setUpdatedByUserId(updatedByUserId);
            if (description != null) {
                setting.setDescription(description);
            }
            return settingsRepository.save(setting);
        } else {
            ApartmentSettings setting = new ApartmentSettings();
            setting.setSettingKey(key);
            setting.setSettingValue(value);
            setting.setDescription(description);
            setting.setUpdatedByUserId(updatedByUserId);
            return settingsRepository.save(setting);
        }
    }
}
