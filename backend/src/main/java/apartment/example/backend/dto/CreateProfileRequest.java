package apartment.example.backend.dto;

import lombok.Data;

/**
 * Request DTO for creating a tenant profile
 * Email is extracted from JWT token, not from request body
 */
@Data
public class CreateProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String occupation;
    private String emergencyContact;
    private String emergencyPhone;
}
