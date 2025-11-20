package apartment.example.backend.controller;

import apartment.example.backend.dto.LoginRequest;
import apartment.example.backend.dto.LoginResponse;
import apartment.example.backend.dto.RegisterRequest;
import apartment.example.backend.dto.RegisterResponse;
import apartment.example.backend.dto.CreateProfileRequest;
import apartment.example.backend.dto.CreateProfileResponse;
import apartment.example.backend.dto.UserProfileDto;
import apartment.example.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for authentication endpoints.
 * Handles user login, registration, and profile creation.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    /**
     * Login endpoint - authenticates user and returns JWT token
     * @param loginRequest Contains username and password
     * @return JWT token with user information
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        log.info("Login request received for user: {}", loginRequest.getUsername());
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Registration endpoint - creates new user account
     * @param registerRequest Contains username, email, and password
     * @return Success message with username
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest registerRequest) {
        log.info("Registration request received for username: {}", registerRequest.getUsername());
        RegisterResponse response = authService.register(registerRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Create Profile endpoint - creates tenant profile for authenticated user
     * @param request Contains profile information (firstName, lastName, phone, etc.)
     * @param authHeader Authorization header containing JWT token
     * @return Created profile information
     */
    @PostMapping("/create-profile")
    public ResponseEntity<CreateProfileResponse> createProfile(
            @RequestBody CreateProfileRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            log.info("Create profile request received");
            log.info("Authorization header: {}", authHeader != null ? "Present" : "Missing");
            
            // Extract username from JWT token
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("Create profile failed: No authentication token provided or invalid format");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            log.info("Token extracted, length: {}", token.length());
            
            CreateProfileResponse response = authService.createProfileWithToken(request, token);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Error creating profile: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error creating profile: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get current user endpoint - returns authenticated user's profile information
     * @param authHeader Authorization header containing JWT token
     * @return UserProfileDto with user and tenant information
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            log.info("Get current user request received");
            
            // Check for authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("Get current user failed: No authentication token provided or invalid format");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            log.info("Token extracted for getCurrentUser");
            
            UserProfileDto profile = authService.getCurrentUserProfile(token);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            log.error("Error getting current user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("Unexpected error getting current user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}