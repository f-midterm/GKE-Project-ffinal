package apartment.example.backend.service;

import apartment.example.backend.entity.Unit;
import apartment.example.backend.entity.enums.UnitStatus;
import apartment.example.backend.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitService {

    private final UnitRepository unitRepository;

    public List<Unit> getAllUnits() {
        return unitRepository.findAll();
    }

    public Page<Unit> getAllUnits(Pageable pageable) {
        return unitRepository.findAll(pageable);
    }

    public Optional<Unit> getUnitById(Long id) {
        return unitRepository.findById(id);
    }

    public Optional<Unit> getUnitByRoomNumber(String roomNumber) {
        return unitRepository.findByRoomNumber(roomNumber);
    }

    public List<Unit> getUnitsByFloor(Integer floor) {
        return unitRepository.findByFloor(floor);
    }

    public List<Unit> getUnitsByStatus(UnitStatus status) {
        return unitRepository.findByStatus(status);
    }

    public List<Unit> getUnitsByType(String type) {
        return unitRepository.findByUnitType(type);
    }

    public List<Unit> getAvailableUnits() {
        return unitRepository.findByStatus(UnitStatus.AVAILABLE);
    }

    public List<Unit> getUnitsByRentRange(BigDecimal minRent, BigDecimal maxRent) {
        return unitRepository.findByRentAmountBetween(minRent, maxRent);
    }

    public long countUnitsByStatus(UnitStatus status) {
        return unitRepository.countByStatus(status);
    }

    public long countUnitsByFloor(Integer floor) {
        return unitRepository.countByFloor(floor);
    }

    public Unit createUnit(Unit unit) {
        // Validate unique room number
        if (unitRepository.findByRoomNumber(unit.getRoomNumber()).isPresent()) {
            throw new IllegalArgumentException("Unit with room number already exists");
        }
        
        log.info("Creating new unit: {}", unit.getRoomNumber());
        return unitRepository.save(unit);
    }

    public Unit updateUnit(Long id, Unit unitDetails) {
        Unit unit = unitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Unit not found with id: " + id));

        // Check room number uniqueness if changed
        if (!unitDetails.getRoomNumber().equals(unit.getRoomNumber()) &&
            unitRepository.findByRoomNumber(unitDetails.getRoomNumber()).isPresent()) {
            throw new IllegalArgumentException("Unit with room number already exists");
        }

        unit.setRoomNumber(unitDetails.getRoomNumber());
        unit.setFloor(unitDetails.getFloor());
        unit.setStatus(unitDetails.getStatus());
        unit.setUnitType(unitDetails.getUnitType());
        unit.setRentAmount(unitDetails.getRentAmount());
        unit.setSizeSqm(unitDetails.getSizeSqm());
        unit.setDescription(unitDetails.getDescription());

        log.info("Updating unit: {}", unit.getRoomNumber());
        return unitRepository.save(unit);
    }

    public void deleteUnit(Long id) {
        Unit unit = unitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Unit not found with id: " + id));
        
        log.info("Deleting unit: {}", unit.getRoomNumber());
        unitRepository.delete(unit);
    }

    public void updateUnitStatus(Long id, UnitStatus status) {
        Unit unit = unitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Unit not found with id: " + id));
        
        unit.setStatus(status);
        unitRepository.save(unit);
        log.info("Updated unit {} status to {}", unit.getRoomNumber(), status);
    }

    public boolean existsByRoomNumber(String roomNumber) {
        return unitRepository.findByRoomNumber(roomNumber).isPresent();
    }

    public boolean existsById(Long id) {
        return unitRepository.existsById(id);
    }

    /**
     * Update unit price (for price change feature)
     * Note: The database trigger will automatically handle price history and audit logging
     */
    public Unit updateUnitPrice(Long id, BigDecimal newPrice, String changeReason) {
        Unit unit = unitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Unit not found with id: " + id));
        
        BigDecimal oldPrice = unit.getRentAmount();
        unit.setRentAmount(newPrice);
        
        log.info("Updating unit {} price from {} to {}", unit.getRoomNumber(), oldPrice, newPrice);
        
        // Note: Session variables for trigger would be set here in a real implementation
        // @current_user_id, @price_change_reason, @client_ip, @user_agent
        
        return unitRepository.save(unit);
    }
}
