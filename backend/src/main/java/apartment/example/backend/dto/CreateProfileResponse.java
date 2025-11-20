package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for profile creation
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateProfileResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String message;
}
