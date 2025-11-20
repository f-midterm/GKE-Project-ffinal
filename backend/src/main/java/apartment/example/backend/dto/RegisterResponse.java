package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegisterResponse {
    private String message;
    private String username;
    private String token;  // Add token for auto-login
    private String role;   // Add role for frontend
}