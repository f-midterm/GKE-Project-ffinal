package apartment.example.backend.repository;

import apartment.example.backend.entity.MaintenanceRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRequestItemRepository extends JpaRepository<MaintenanceRequestItem, Long> {
    
    /**
     * Find all items for a specific maintenance request
     */
    List<MaintenanceRequestItem> findByMaintenanceRequestId(Long maintenanceRequestId);
    
    /**
     * Find all requests that used a specific stock item
     */
    List<MaintenanceRequestItem> findByStockId(Long stockId);
    
    /**
     * Get items with stock details joined
     */
    @Query("SELECT mri FROM MaintenanceRequestItem mri WHERE mri.maintenanceRequestId = :requestId")
    List<MaintenanceRequestItem> findItemsWithStockByRequestId(@Param("requestId") Long requestId);
    
    /**
     * Delete all items for a maintenance request
     */
    void deleteByMaintenanceRequestId(Long maintenanceRequestId);
}
