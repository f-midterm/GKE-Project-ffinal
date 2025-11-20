package apartment.example.backend.service;

import apartment.example.backend.dto.LoginRequest;
import apartment.example.backend.dto.LoginResponse;
import apartment.example.backend.dto.RegisterRequest;
import apartment.example.backend.dto.RegisterResponse;
import apartment.example.backend.dto.CreateProfileRequest;
import apartment.example.backend.dto.CreateProfileResponse;
import apartment.example.backend.dto.UserProfileDto;
import apartment.example.backend.entity.User;
import apartment.example.backend.entity.Tenant;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.enums.TenantStatus;
import apartment.example.backend.entity.enums.LeaseStatus;
import apartment.example.backend.repository.UserRepository;
import apartment.example.backend.repository.TenantRepository;
import apartment.example.backend.repository.LeaseRepository;
import apartment.example.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer for authentication and user management.
 * Handles login, registration, and JWT token generation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final LeaseRepository leaseRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Authenticate user and generate JWT token
     * @param loginRequest Contains username and password
     * @return LoginResponse with JWT token, role, and username
     * @throws org.springframework.security.authentication.BadCredentialsException if credentials are invalid
     */
    public LoginResponse login(LoginRequest loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getUsername());
        
        // Authenticate user credentials
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(), 
                loginRequest.getPassword()
            )
        );
        
        // Load user details
        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        final User user = (User) userDetails;
        
        // Generate JWT token
        final String token = jwtUtil.generateToken(userDetails);
        
        log.info("User logged in successfully: {}", user.getUsername());
        return new LoginResponse(token, user.getRole().toString(), user.getUsername());
    }

    /**
     * Register a new user in the system
     * @param registerRequest Contains username, email, and password
     * @return RegisterResponse with success message, username, and JWT token for auto-login
     * @throws IllegalArgumentException if username or email already exists
     */
    @Transactional
    public RegisterResponse register(RegisterRequest registerRequest) {
        log.info("Registration attempt for username: {}", registerRequest.getUsername());
        
        // Validate username uniqueness
        if (!userRepository.findByUsername(registerRequest.getUsername()).isEmpty()) {
            log.warn("Registration failed: Username already exists - {}", registerRequest.getUsername());
            throw new IllegalArgumentException("Username already exists");
        }
        
        // Validate email uniqueness
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            log.warn("Registration failed: Email already exists - {}", registerRequest.getEmail());
            throw new IllegalArgumentException("Email already exists");
        }
        
        // Create new user
        User newUser = new User();
        newUser.setUsername(registerRequest.getUsername());
        newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        newUser.setEmail(registerRequest.getEmail());
        newUser.setRole(User.Role.USER); // Default role for new users
        
        // Save to database
        User savedUser = userRepository.save(newUser);
        log.info("User registered successfully: {}", savedUser.getUsername());
        
        // Generate JWT token for auto-login
        final UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getUsername());
        final String token = jwtUtil.generateToken(userDetails);
        log.info("Auto-login token generated for user: {}", savedUser.getUsername());
        
        return new RegisterResponse(
            "User registered successfully", 
            savedUser.getUsername(),
            token,
            savedUser.getRole().toString()
        );
    }

    /**
     * Create tenant profile for authenticated user using JWT token
     * @param request Contains profile information
     * @param token JWT token
     * @return CreateProfileResponse with created profile information
     * @throws IllegalArgumentException if user not found or profile already exists
     */
    @Transactional
    public CreateProfileResponse createProfileWithToken(CreateProfileRequest request, String token) {
        // Extract username from JWT token
        String username = jwtUtil.extractUsername(token);
        log.info("Creating profile for user: {} (extracted from token)", username);
        
        return createProfile(request, username);
    }

    /**
     * Create tenant profile for authenticated user
     * @param request Contains profile information
     * @param username Username from JWT token
     * @return CreateProfileResponse with created profile information
     * @throws IllegalArgumentException if user not found or profile already exists
     */
    @Transactional
    public CreateProfileResponse createProfile(CreateProfileRequest request, String username) {
        log.info("Creating profile for user: {}", username);
        
        // Find user by username
        User user = userRepository.findByUsername(username)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if tenant profile already exists for this email
        if (tenantRepository.findByEmail(user.getEmail()).isPresent()) {
            log.warn("Profile creation failed: Profile already exists for email - {}", user.getEmail());
            throw new IllegalArgumentException("Profile already exists for this user");
        }
        
        // Validate phone numbers (10 digits)
        String cleanedPhone = formatPhoneNumber(request.getPhone());
        String cleanedEmergencyPhone = formatPhoneNumber(request.getEmergencyPhone());
        
        if (!isValidPhoneNumber(cleanedPhone)) {
            throw new IllegalArgumentException("Invalid phone number format. Must be 10 digits.");
        }
        
        if (!isValidPhoneNumber(cleanedEmergencyPhone)) {
            throw new IllegalArgumentException("Invalid emergency phone number format. Must be 10 digits.");
        }
        
        // Create new tenant profile
        Tenant tenant = new Tenant();
        tenant.setFirstName(request.getFirstName());
        tenant.setLastName(request.getLastName());
        tenant.setEmail(user.getEmail()); // Get email from authenticated user
        tenant.setPhone(cleanedPhone);
        tenant.setOccupation(request.getOccupation());
        tenant.setEmergencyContact(request.getEmergencyContact());
        tenant.setEmergencyPhone(cleanedEmergencyPhone);
        tenant.setStatus(TenantStatus.PENDING); // Default status
        
        // Save tenant
        Tenant savedTenant = tenantRepository.save(tenant);
        log.info("Profile created successfully for user: {} (Tenant ID: {})", username, savedTenant.getId());
        
        return new CreateProfileResponse(
            savedTenant.getId(),
            savedTenant.getFirstName(),
            savedTenant.getLastName(),
            savedTenant.getEmail(),
            savedTenant.getPhone(),
            "Profile created successfully"
        );
    }

    /**
     * Format phone number to XXX-XXX-XXXX format
     * @param phone Raw phone number
     * @return Formatted phone number
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null) {
            return null;
        }
        
        // Remove all non-numeric characters
        String cleaned = phone.replaceAll("\\D", "");
        
        // Format as XXX-XXX-XXXX
        if (cleaned.length() == 10) {
            return String.format("%s-%s-%s", 
                cleaned.substring(0, 3), 
                cleaned.substring(3, 6), 
                cleaned.substring(6));
        }
        
        return cleaned;
    }

    /**
     * Validate phone number (must be exactly 10 digits after cleaning)
     * @param phone Formatted or unformatted phone number
     * @return true if valid, false otherwise
     */
    private boolean isValidPhoneNumber(String phone) {
        if (phone == null) {
            return false;
        }
        String cleaned = phone.replaceAll("\\D", "");
        return cleaned.length() == 10;
    }

    /**
     * Get current user profile information from JWT token
     * @param token JWT token
     * @return UserProfileDto with user and tenant information
     */
    public UserProfileDto getCurrentUserProfile(String token) {
        log.info("Getting current user profile from token");
        
        // Extract username from token
        String username = jwtUtil.extractUsername(token);
        log.info("Extracted username from token: {}", username);
        
        // Find user
        List<User> users = userRepository.findByUsername(username);
        if (users.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }
        User user = users.get(0);
        
        log.info("Found user: {}, role: {}", user.getUsername(), user.getRole());
        
        // Create response DTO
        UserProfileDto profileDto = new UserProfileDto();
        profileDto.setId(user.getId());
        profileDto.setUsername(user.getUsername());
        profileDto.setEmail(user.getEmail());
        profileDto.setRole(user.getRole().toString());
        
        // Try to fetch tenant profile if exists
        tenantRepository.findByEmail(user.getEmail()).ifPresent(tenant -> {
            log.info("Found tenant profile for user: {}", user.getUsername());
            profileDto.setTenantId(tenant.getId());
            profileDto.setFirstName(tenant.getFirstName());
            profileDto.setLastName(tenant.getLastName());
            profileDto.setPhone(tenant.getPhone());
            profileDto.setOccupation(tenant.getOccupation());
            profileDto.setEmergencyContact(tenant.getEmergencyContact());
            profileDto.setEmergencyPhone(tenant.getEmergencyPhone());
            
            // Fetch active lease to get unit_id
            leaseRepository.findByTenantIdAndStatus(tenant.getId(), LeaseStatus.ACTIVE)
                .stream()
                .findFirst()
                .ifPresent(lease -> {
                    log.info("Found active lease for tenant: unit_id={}", lease.getUnit().getId());
                    profileDto.setUnitId(lease.getUnit().getId());
                });
        });
        
        return profileDto;
    }
}
