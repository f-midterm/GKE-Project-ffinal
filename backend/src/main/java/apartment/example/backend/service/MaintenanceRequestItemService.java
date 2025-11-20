package apartment.example.backend.service;

import apartment.example.backend.entity.MaintenanceRequestItem;
import apartment.example.backend.entity.MaintenanceStock;
import apartment.example.backend.repository.MaintenanceRequestItemRepository;
import apartment.example.backend.repository.MaintenanceStockRepository;
import apartment.example.backend.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing maintenance request items (stock usage)
 */
@Service
@Slf4j
public class MaintenanceRequestItemService {

    @Autowired
    private MaintenanceRequestItemRepository itemRepository;

    @Autowired
    private MaintenanceStockRepository stockRepository;

    @Autowired
    private MaintenanceStockService stockService;

    /**
     * Get all items for a maintenance request
     */
    public List<MaintenanceRequestItem> getItemsByRequestId(Long requestId) {
        log.info("Fetching items for maintenance request ID: {}", requestId);
        List<MaintenanceRequestItem> items = itemRepository.findByMaintenanceRequestId(requestId);
        
        // Populate transient fields with stock data
        items.forEach(item -> {
            stockRepository.findById(item.getStockId()).ifPresent(stock -> {
                item.setItemName(stock.getItemName());
                item.setUnit(stock.getUnit());
                item.setUnitPrice(stock.getUnitPrice());
            });
        });
        
        return items;
    }

    /**
     * Add a single item to a maintenance request
     */
    @Transactional
    public MaintenanceRequestItem addItemToRequest(Long requestId, Long stockId, Integer quantity, String notes) {
        log.info("Adding item to request {}: stockId={}, quantity={}", requestId, stockId, quantity);
        
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        // Verify stock exists and has enough quantity
        MaintenanceStock stock = stockRepository.findById(stockId)
            .orElseThrow(() -> new ResourceNotFoundException("Stock item not found with ID: " + stockId));

        if (stock.getQuantity() < quantity) {
            throw new IllegalArgumentException(
                String.format("Insufficient stock. Available: %d %s, Requested: %d %s", 
                    stock.getQuantity(), stock.getUnit(), quantity, stock.getUnit())
            );
        }

        // Create the item record
        MaintenanceRequestItem item = new MaintenanceRequestItem();
        item.setMaintenanceRequestId(requestId);
        item.setStockId(stockId);
        item.setQuantityUsed(quantity);
        item.setNotes(notes);
        item.setCreatedAt(LocalDateTime.now());

        MaintenanceRequestItem savedItem = itemRepository.save(item);

        // Reduce stock quantity
        stockService.reduceStock(stockId, quantity);

        log.info("Item added successfully and stock reduced");
        return savedItem;
    }

    /**
     * Add multiple items to a maintenance request
     */
    @Transactional
    public List<MaintenanceRequestItem> addItemsToRequest(Long requestId, List<MaintenanceRequestItem> items) {
        log.info("Adding {} items to maintenance request ID: {}", items.size(), requestId);
        
        return items.stream()
            .map(item -> addItemToRequest(
                requestId, 
                item.getStockId(), 
                item.getQuantityUsed(), 
                item.getNotes()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Update item quantity
     */
    @Transactional
    public MaintenanceRequestItem updateItemQuantity(Long itemId, Integer newQuantity) {
        log.info("Updating item ID {} to quantity {}", itemId, newQuantity);
        
        if (newQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        MaintenanceRequestItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Request item not found with ID: " + itemId));

        int quantityDifference = newQuantity - item.getQuantityUsed();
        
        if (quantityDifference != 0) {
            // Verify stock availability if increasing quantity
            if (quantityDifference > 0) {
                MaintenanceStock stock = stockRepository.findById(item.getStockId())
                    .orElseThrow(() -> new ResourceNotFoundException("Stock not found"));
                
                if (stock.getQuantity() < quantityDifference) {
                    throw new IllegalArgumentException("Insufficient stock for quantity increase");
                }
            }
            
            // Update stock quantity
            stockService.updateStockQuantity(item.getStockId(), -quantityDifference);
            
            // Update item quantity
            item.setQuantityUsed(newQuantity);
            itemRepository.save(item);
        }

        return item;
    }

    /**
     * Remove item from request and restore stock
     */
    @Transactional
    public void removeItem(Long itemId) {
        log.info("Removing item ID: {}", itemId);
        
        MaintenanceRequestItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Request item not found with ID: " + itemId));

        // Restore stock quantity
        stockService.addStock(item.getStockId(), item.getQuantityUsed());

        // Delete the item
        itemRepository.deleteById(itemId);
        
        log.info("Item removed and stock restored");
    }

    /**
     * Remove all items for a maintenance request
     */
    @Transactional
    public void removeAllItemsForRequest(Long requestId) {
        log.info("Removing all items for request ID: {}", requestId);
        
        List<MaintenanceRequestItem> items = itemRepository.findByMaintenanceRequestId(requestId);
        
        // Restore stock for each item
        items.forEach(item -> {
            try {
                stockService.addStock(item.getStockId(), item.getQuantityUsed());
            } catch (Exception e) {
                log.error("Failed to restore stock for item {}: {}", item.getId(), e.getMessage());
            }
        });

        // Delete all items
        itemRepository.deleteByMaintenanceRequestId(requestId);
        
        log.info("All items removed and stock restored for request ID: {}", requestId);
    }

    /**
     * Get total cost for items used in a request
     */
    public java.math.BigDecimal calculateTotalCost(Long requestId) {
        log.info("Calculating total cost for request ID: {}", requestId);
        
        List<MaintenanceRequestItem> items = getItemsByRequestId(requestId);
        
        return items.stream()
            .map(item -> {
                if (item.getUnitPrice() != null) {
                    return item.getUnitPrice().multiply(
                        new java.math.BigDecimal(item.getQuantityUsed())
                    );
                }
                return java.math.BigDecimal.ZERO;
            })
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }
}
