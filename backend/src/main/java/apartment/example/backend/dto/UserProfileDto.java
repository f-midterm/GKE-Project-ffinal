package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user profile information returned to frontend
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDto {
    private Long id;
    private String username;
    private String email;
    private String role;
    
    // Tenant/Lease linking
    private Long tenantId;  // Links to tenants table
    private Long unitId;    // Current unit from active lease
    
    // Tenant profile fields (if available)
    private String firstName;
    private String lastName;
    private String phone;
    private String occupation;
    private String emergencyContact;
    private String emergencyPhone;
}
