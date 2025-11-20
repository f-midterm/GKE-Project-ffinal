package apartment.example.backend.service;

import apartment.example.backend.entity.MaintenanceStock;
import apartment.example.backend.entity.MaintenanceStock.Category;
import apartment.example.backend.repository.MaintenanceStockRepository;
import apartment.example.backend.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing maintenance stock items
 */
@Service
@Slf4j
public class MaintenanceStockService {

    @Autowired
    private MaintenanceStockRepository stockRepository;

    /**
     * Get all stocks (excluding deleted)
     */
    public List<MaintenanceStock> getAllStocks() {
        log.info("Fetching all maintenance stocks");
        return stockRepository.findByDeletedAtIsNull();
    }

    /**
     * Get stock by ID
     */
    public MaintenanceStock getStockById(Long id) {
        log.info("Fetching stock by ID: {}", id);
        return stockRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Stock item not found with ID: " + id));
    }

    /**
     * Get stocks by category
     */
    public List<MaintenanceStock> getStocksByCategory(Category category) {
        log.info("Fetching stocks by category: {}", category);
        return stockRepository.findByCategoryAndDeletedAtIsNull(category);
    }

    /**
     * Search stocks by item name
     */
    public List<MaintenanceStock> searchStocks(String keyword) {
        log.info("Searching stocks with keyword: {}", keyword);
        return stockRepository.findByItemNameContainingIgnoreCaseAndDeletedAtIsNull(keyword);
    }

    /**
     * Get low stock items (quantity less than threshold)
     */
    public List<MaintenanceStock> getLowStockItems(Integer threshold) {
        log.info("Fetching low stock items (threshold: {})", threshold);
        return stockRepository.findByQuantityLessThanAndDeletedAtIsNull(threshold);
    }

    /**
     * Create new stock item
     */
    @Transactional
    public MaintenanceStock createStock(MaintenanceStock stock) {
        log.info("Creating new stock item: {}", stock.getItemName());
        stock.setCreatedAt(LocalDateTime.now());
        stock.setUpdatedAt(LocalDateTime.now());
        return stockRepository.save(stock);
    }

    /**
     * Update existing stock item
     */
    @Transactional
    public MaintenanceStock updateStock(Long id, MaintenanceStock stockDetails) {
        log.info("Updating stock item ID: {}", id);
        MaintenanceStock stock = getStockById(id);
        
        if (stockDetails.getItemName() != null) {
            stock.setItemName(stockDetails.getItemName());
        }
        if (stockDetails.getCategory() != null) {
            stock.setCategory(stockDetails.getCategory());
        }
        if (stockDetails.getQuantity() != null) {
            stock.setQuantity(stockDetails.getQuantity());
        }
        if (stockDetails.getUnit() != null) {
            stock.setUnit(stockDetails.getUnit());
        }
        if (stockDetails.getUnitPrice() != null) {
            stock.setUnitPrice(stockDetails.getUnitPrice());
        }
        if (stockDetails.getDescription() != null) {
            stock.setDescription(stockDetails.getDescription());
        }
        
        stock.setUpdatedAt(LocalDateTime.now());
        return stockRepository.save(stock);
    }

    /**
     * Update stock quantity (for adding or reducing stock)
     */
    @Transactional
    public MaintenanceStock updateStockQuantity(Long id, Integer quantityChange) {
        log.info("Updating stock quantity for ID: {}, change: {}", id, quantityChange);
        MaintenanceStock stock = getStockById(id);
        
        int newQuantity = stock.getQuantity() + quantityChange;
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative. Current: " + 
                stock.getQuantity() + ", Change: " + quantityChange);
        }
        
        stock.setQuantity(newQuantity);
        stock.setUpdatedAt(LocalDateTime.now());
        return stockRepository.save(stock);
    }

    /**
     * Reduce stock quantity (for maintenance usage)
     */
    @Transactional
    public MaintenanceStock reduceStock(Long id, Integer quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        return updateStockQuantity(id, -quantity);
    }

    /**
     * Add stock quantity (for restocking)
     */
    @Transactional
    public MaintenanceStock addStock(Long id, Integer quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        return updateStockQuantity(id, quantity);
    }

    /**
     * Soft delete stock item
     */
    @Transactional
    public void deleteStock(Long id) {
        log.info("Soft deleting stock item ID: {}", id);
        MaintenanceStock stock = getStockById(id);
        stock.setDeletedAt(LocalDateTime.now());
        stockRepository.save(stock);
    }

    /**
     * Hard delete stock item (permanent)
     */
    @Transactional
    public void hardDeleteStock(Long id) {
        log.warn("Hard deleting stock item ID: {}", id);
        stockRepository.deleteById(id);
    }
}
