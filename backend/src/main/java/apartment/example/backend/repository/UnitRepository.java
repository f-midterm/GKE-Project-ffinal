package apartment.example.backend.repository;

import apartment.example.backend.entity.Unit;
import apartment.example.backend.entity.enums.UnitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {
    
    Optional<Unit> findByRoomNumber(String roomNumber);
    
    List<Unit> findByFloor(Integer floor);
    
    List<Unit> findByStatus(UnitStatus status);
    
    List<Unit> findByUnitType(String unitType);
    
    List<Unit> findByRentAmountBetween(BigDecimal minRent, BigDecimal maxRent);
    
    long countByStatus(UnitStatus status);
    
    long countByFloor(Integer floor);
    
    @Query("SELECT u FROM Unit u WHERE u.floor = :floor ORDER BY u.roomNumber")
    List<Unit> findByFloorOrderByRoomNumber(@Param("floor") Integer floor);
    
    @Query("SELECT u FROM Unit u ORDER BY u.floor, u.roomNumber")
    List<Unit> findAllOrderByFloorAndRoomNumber();
    
    boolean existsByRoomNumber(String roomNumber);
}