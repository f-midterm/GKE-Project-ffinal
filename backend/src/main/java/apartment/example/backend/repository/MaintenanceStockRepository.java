package apartment.example.backend.repository;

import apartment.example.backend.entity.MaintenanceStock;
import apartment.example.backend.entity.MaintenanceStock.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceStockRepository extends JpaRepository<MaintenanceStock, Long> {
    
    /**
     * Find all stocks by category
     */
    List<MaintenanceStock> findByCategory(Category category);
    
    /**
     * Find all stocks that are not deleted
     */
    List<MaintenanceStock> findByDeletedAtIsNull();
    
    /**
     * Find stocks by category that are not deleted
     */
    List<MaintenanceStock> findByCategoryAndDeletedAtIsNull(Category category);
    
    /**
     * Search stocks by item name (case-insensitive)
     */
    List<MaintenanceStock> findByItemNameContainingIgnoreCaseAndDeletedAtIsNull(String itemName);
    
    /**
     * Find stocks with low quantity (less than threshold)
     */
    List<MaintenanceStock> findByQuantityLessThanAndDeletedAtIsNull(Integer threshold);
}
