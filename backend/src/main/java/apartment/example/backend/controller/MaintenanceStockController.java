package apartment.example.backend.controller;

import apartment.example.backend.entity.MaintenanceStock;
import apartment.example.backend.entity.MaintenanceStock.Category;
import apartment.example.backend.service.MaintenanceStockService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for maintenance stock management
 */
@RestController
@RequestMapping("/api/maintenance/stocks")
@CrossOrigin(origins = "*")
@Slf4j
public class MaintenanceStockController {

    @Autowired
    private MaintenanceStockService stockService;

    /**
     * Get all stock items
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MaintenanceStock>> getAllStocks() {
        log.info("GET /maintenance/stocks - Get all stocks");
        List<MaintenanceStock> stocks = stockService.getAllStocks();
        return ResponseEntity.ok(stocks);
    }

    /**
     * Get stock by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceStock> getStockById(@PathVariable Long id) {
        log.info("GET /maintenance/stocks/{} - Get stock by ID", id);
        MaintenanceStock stock = stockService.getStockById(id);
        return ResponseEntity.ok(stock);
    }

    /**
     * Get stocks by category
     */
    @GetMapping("/category/{category}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MaintenanceStock>> getStocksByCategory(@PathVariable Category category) {
        log.info("GET /maintenance/stocks/category/{} - Get stocks by category", category);
        List<MaintenanceStock> stocks = stockService.getStocksByCategory(category);
        return ResponseEntity.ok(stocks);
    }

    /**
     * Search stocks by keyword
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MaintenanceStock>> searchStocks(@RequestParam String keyword) {
        log.info("GET /maintenance/stocks/search?keyword={}", keyword);
        List<MaintenanceStock> stocks = stockService.searchStocks(keyword);
        return ResponseEntity.ok(stocks);
    }

    /**
     * Get low stock items
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MaintenanceStock>> getLowStockItems(
            @RequestParam(defaultValue = "10") Integer threshold) {
        log.info("GET /maintenance/stocks/low-stock?threshold={}", threshold);
        List<MaintenanceStock> stocks = stockService.getLowStockItems(threshold);
        return ResponseEntity.ok(stocks);
    }

    /**
     * Create new stock item
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceStock> createStock(@RequestBody MaintenanceStock stock) {
        log.info("POST /maintenance/stocks - Create new stock: {}", stock.getItemName());
        MaintenanceStock createdStock = stockService.createStock(stock);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdStock);
    }

    /**
     * Update stock item
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceStock> updateStock(
            @PathVariable Long id,
            @RequestBody MaintenanceStock stock) {
        log.info("PUT /maintenance/stocks/{} - Update stock", id);
        MaintenanceStock updatedStock = stockService.updateStock(id, stock);
        return ResponseEntity.ok(updatedStock);
    }

    /**
     * Update stock quantity
     */
    @PatchMapping("/{id}/quantity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceStock> updateStockQuantity(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> payload) {
        log.info("PATCH /maintenance/stocks/{}/quantity", id);
        Integer quantityChange = payload.get("quantityChange");
        
        if (quantityChange == null) {
            return ResponseEntity.badRequest().build();
        }
        
        MaintenanceStock updatedStock = stockService.updateStockQuantity(id, quantityChange);
        return ResponseEntity.ok(updatedStock);
    }

    /**
     * Add stock quantity (restocking)
     */
    @PostMapping("/{id}/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceStock> addStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> payload) {
        log.info("POST /maintenance/stocks/{}/add", id);
        Integer quantity = payload.get("quantity");
        
        if (quantity == null || quantity <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        MaintenanceStock updatedStock = stockService.addStock(id, quantity);
        return ResponseEntity.ok(updatedStock);
    }

    /**
     * Delete stock item (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteStock(@PathVariable Long id) {
        log.info("DELETE /maintenance/stocks/{} - Soft delete stock", id);
        stockService.deleteStock(id);
        return ResponseEntity.ok(Map.of("message", "Stock item deleted successfully"));
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("MaintenanceStockController is working!");
    }
}
