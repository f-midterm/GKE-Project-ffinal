package apartment.example.backend.repository;

import apartment.example.backend.entity.ApartmentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApartmentSettingsRepository extends JpaRepository<ApartmentSettings, Long> {
    Optional<ApartmentSettings> findBySettingKey(String settingKey);
    boolean existsBySettingKey(String settingKey);
}
