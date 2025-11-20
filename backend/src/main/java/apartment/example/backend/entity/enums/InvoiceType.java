package apartment.example.backend.entity.enums;

/**
 * Invoice Type Enum
 * 
 * Defines different types of invoices that can be issued to tenants
 */
public enum InvoiceType {
    /**
     * Monthly recurring rent + utilities (default)
     */
    MONTHLY_RENT,
    
    /**
     * Security deposit (typically first-time move-in)
     */
    SECURITY_DEPOSIT,
    
    /**
     * Cleaning fee (move-in/move-out or periodic)
     */
    CLEANING_FEE,
    
    /**
     * Maintenance/repair charges
     */
    MAINTENANCE_FEE,
    
    /**
     * Installment payment (part of a larger invoice)
     */
    INSTALLMENT,
    
    /**
     * Utilities only (electricity and water)
     */
    UTILITIES,
    
    /**
     * Custom/other charges
     */
    CUSTOM
}
