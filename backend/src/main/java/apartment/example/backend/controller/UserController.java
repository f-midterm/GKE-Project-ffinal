package apartment.example.backend.controller;

import apartment.example.backend.entity.User;
import apartment.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    /**
     * Get all users
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            log.info("GET /api/users - Fetching all users");
            
            List<User> users = userRepository.findAll();
            log.info("Found {} users in database", users.size());
            
            List<UserDTO> userDTOs = users.stream()
                    .filter(user -> user.getDeletedAt() == null) // Only active users
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            log.info("Returning {} active users", userDTOs.size());
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            log.error("Error fetching users: ", e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            log.info("GET /api/users/{} - Fetching user", id);
            
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
            
            return ResponseEntity.ok(convertToDTO(user));
        } catch (Exception e) {
            log.error("Error fetching user {}: ", id, e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Convert User entity to DTO (excluding sensitive data)
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().name() : "USER");
        return dto;
    }

    /**
     * Simple DTO class for User data (without password)
     */
    public static class UserDTO {
        private Long id;
        private String username;
        private String email;
        private String role;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}
