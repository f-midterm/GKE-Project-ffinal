package apartment.example.backend.service;

import apartment.example.backend.entity.UnitPriceHistory;
import apartment.example.backend.repository.UnitPriceHistoryRepository;
import apartment.example.backend.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitPriceHistoryService {

    private final UnitPriceHistoryRepository priceHistoryRepository;
    private final UnitRepository unitRepository;

    /**
     * Get all price history for a specific unit
     */
    public List<UnitPriceHistory> getPriceHistoryByUnitId(Long unitId) {
        log.debug("Fetching price history for unit ID: {}", unitId);
        return priceHistoryRepository.findByUnitIdOrderByEffectiveFromDesc(unitId);
    }

    /**
     * Get current price for a unit
     */
    public Optional<UnitPriceHistory> getCurrentPrice(Long unitId) {
        log.debug("Fetching current price for unit ID: {}", unitId);
        return priceHistoryRepository.findByUnitIdAndEffectiveToIsNull(unitId);
    }

    /**
     * Get price effective on a specific date
     */
    public Optional<UnitPriceHistory> getPriceAtDate(Long unitId, LocalDate date) {
        log.debug("Fetching price for unit ID: {} on date: {}", unitId, date);
        return priceHistoryRepository.findPriceAtDate(unitId, date);
    }

    /**
     * Get price history within a date range
     */
    public List<UnitPriceHistory> getPriceHistoryInRange(Long unitId, LocalDate startDate, LocalDate endDate) {
        log.debug("Fetching price history for unit ID: {} from {} to {}", unitId, startDate, endDate);
        return priceHistoryRepository.findPriceHistoryInRange(unitId, startDate, endDate);
    }

    /**
     * Get all current prices for all units
     */
    public List<UnitPriceHistory> getAllCurrentPrices() {
        log.debug("Fetching all current prices");
        return priceHistoryRepository.findAllCurrentPrices();
    }

    /**
     * Get historical prices (not current) for a unit
     */
    public List<UnitPriceHistory> getHistoricalPrices(Long unitId) {
        log.debug("Fetching historical prices for unit ID: {}", unitId);
        return priceHistoryRepository.findByUnitIdAndEffectiveToIsNotNullOrderByEffectiveFromDesc(unitId);
    }

    /**
     * Count price changes for a unit
     */
    public long countPriceChanges(Long unitId) {
        log.debug("Counting price changes for unit ID: {}", unitId);
        return priceHistoryRepository.countByUnitId(unitId);
    }

    /**
     * Create a new price history record (used internally)
     * Note: Price changes should be done through UnitService.updateUnitPrice()
     * which will handle triggers and audit logging
     */
    protected UnitPriceHistory createPriceHistory(UnitPriceHistory priceHistory) {
        log.info("Creating new price history record for unit ID: {}", priceHistory.getUnit().getId());
        return priceHistoryRepository.save(priceHistory);
    }

    /**
     * Check if a unit has had any price changes
     */
    public boolean hasPriceChanges(Long unitId) {
        return countPriceChanges(unitId) > 1;  // More than 1 means there were changes
    }

    /**
     * Get rent amount at a specific date (convenience method)
     */
    public BigDecimal getRentAmountAtDate(Long unitId, LocalDate date) {
        return getPriceAtDate(unitId, date)
                .map(UnitPriceHistory::getRentAmount)
                .orElseGet(() -> {
                    // Fallback to current unit rent if no history found
                    log.warn("No price history found for unit {} on date {}, using current rent", unitId, date);
                    return unitRepository.findById(unitId)
                            .map(unit -> unit.getRentAmount())
                            .orElse(BigDecimal.ZERO);
                });
    }

    /**
     * Get current rent amount (convenience method)
     */
    public BigDecimal getCurrentRentAmount(Long unitId) {
        return getCurrentPrice(unitId)
                .map(UnitPriceHistory::getRentAmount)
                .orElseGet(() -> {
                    log.warn("No current price found in history for unit {}, using unit rent", unitId);
                    return unitRepository.findById(unitId)
                            .map(unit -> unit.getRentAmount())
                            .orElse(BigDecimal.ZERO);
                });
    }
}
