package apartment.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_request_items")
public class MaintenanceRequestItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "maintenance_request_id", nullable = false)
    private Long maintenanceRequestId;

    @Column(name = "stock_id", nullable = false)
    private Long stockId;

    @Column(name = "quantity_used", nullable = false)
    private Integer quantityUsed;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // For convenience, we can add transient fields for joined data
    @Transient
    private String itemName;

    @Transient
    private String unit;

    @Transient
    private java.math.BigDecimal unitPrice;

    // Constructors
    public MaintenanceRequestItem() {}

    public MaintenanceRequestItem(Long maintenanceRequestId, Long stockId, Integer quantityUsed) {
        this.maintenanceRequestId = maintenanceRequestId;
        this.stockId = stockId;
        this.quantityUsed = quantityUsed;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMaintenanceRequestId() {
        return maintenanceRequestId;
    }

    public void setMaintenanceRequestId(Long maintenanceRequestId) {
        this.maintenanceRequestId = maintenanceRequestId;
    }

    public Long getStockId() {
        return stockId;
    }

    public void setStockId(Long stockId) {
        this.stockId = stockId;
    }

    public Integer getQuantityUsed() {
        return quantityUsed;
    }

    public void setQuantityUsed(Integer quantityUsed) {
        this.quantityUsed = quantityUsed;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Transient getters and setters
    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public java.math.BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(java.math.BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}
