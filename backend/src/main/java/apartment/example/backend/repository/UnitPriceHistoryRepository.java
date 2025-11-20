package apartment.example.backend.repository;

import apartment.example.backend.entity.UnitPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UnitPriceHistoryRepository extends JpaRepository<UnitPriceHistory, Long> {

    /**
     * Find all price history for a specific unit, ordered by effective date descending
     */
    List<UnitPriceHistory> findByUnitIdOrderByEffectiveFromDesc(Long unitId);

    /**
     * Find current price for a unit (where effective_to is NULL)
     */
    Optional<UnitPriceHistory> findByUnitIdAndEffectiveToIsNull(Long unitId);

    /**
     * Find price effective on a specific date
     */
    @Query("SELECT uph FROM UnitPriceHistory uph WHERE uph.unit.id = :unitId " +
           "AND uph.effectiveFrom <= :date " +
           "AND (uph.effectiveTo IS NULL OR uph.effectiveTo >= :date)")
    Optional<UnitPriceHistory> findPriceAtDate(@Param("unitId") Long unitId, @Param("date") LocalDate date);

    /**
     * Find price history within a date range
     */
    @Query("SELECT uph FROM UnitPriceHistory uph WHERE uph.unit.id = :unitId " +
           "AND ((uph.effectiveFrom <= :endDate AND (uph.effectiveTo IS NULL OR uph.effectiveTo >= :startDate)))")
    List<UnitPriceHistory> findPriceHistoryInRange(@Param("unitId") Long unitId, 
                                                     @Param("startDate") LocalDate startDate, 
                                                     @Param("endDate") LocalDate endDate);

    /**
     * Find all current prices (active prices for all units)
     */
    @Query("SELECT uph FROM UnitPriceHistory uph WHERE uph.effectiveTo IS NULL")
    List<UnitPriceHistory> findAllCurrentPrices();

    /**
     * Count price changes for a specific unit
     */
    long countByUnitId(Long unitId);

    /**
     * Find price history by unit and date range
     */
    List<UnitPriceHistory> findByUnitIdAndEffectiveFromBetween(Long unitId, LocalDate startDate, LocalDate endDate);

    /**
     * Find historical prices (not current) for a unit
     */
    List<UnitPriceHistory> findByUnitIdAndEffectiveToIsNotNullOrderByEffectiveFromDesc(Long unitId);
}
