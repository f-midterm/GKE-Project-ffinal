package apartment.example.backend.config;

import apartment.example.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Constructor injection via @RequiredArgsConstructor
    private final JwtAuthenticationFilter jwtAuthFilter;
    
    // Read CORS configuration from environment
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no authentication required
                        .requestMatchers("/api/auth/**", "/api/health", "/health/**", "/ready").permitAll()
                        // Prometheus metrics endpoint - allow unauthenticated access for Prometheus scraping
                        .requestMatchers("/actuator/prometheus", "/actuator/health", "/actuator/info").permitAll()
                        
                        // Serve uploaded payment slips - public access for easier viewing
                        .requestMatchers("/uploads/**").permitAll()
                        
                        // PDF Download endpoints - allow authenticated users
                        .requestMatchers(HttpMethod.GET, "/leases/*/agreement", "/invoices/*/pdf", "/invoices/*/receipt").authenticated()
                        
                        // Lease Termination - VILLAGER can terminate their own lease
                        .requestMatchers(HttpMethod.POST, "/leases/*/terminate").hasAnyRole("VILLAGER", "ADMIN")
                        
                        // Units - Read access for authenticated users, Write access for ADMIN only
                        .requestMatchers(HttpMethod.GET, "/units/**").authenticated()  // Any authenticated user can view
                        .requestMatchers("/units/**").hasAnyRole("ADMIN")  // Only ADMIN can create/update/delete
                        
                        // Rental Requests - User endpoints (MUST be before the catch-all admin rule)
                        .requestMatchers(HttpMethod.GET, "/rental-requests/me/latest").authenticated()  // User can check their own status
                        .requestMatchers(HttpMethod.POST, "/rental-requests/*/acknowledge").authenticated()  // User can acknowledge rejection (single path segment)
                        .requestMatchers(HttpMethod.POST, "/rental-requests/authenticated").authenticated()  // User can submit authenticated booking
                        .requestMatchers(HttpMethod.POST, "/rental-requests", "/rental-requests/unit/**").authenticated()  // Users can submit (legacy)
                        .requestMatchers("/rental-requests/**").hasAnyRole("ADMIN")  // ADMIN can view/approve/reject (catch-all)
                        
                        // Settings - Read access for authenticated, Write for ADMIN only
                        .requestMatchers(HttpMethod.GET, "/settings/**").authenticated()
                        .requestMatchers("/settings/**").hasAnyRole("ADMIN")
                        
                        // Invoices - Tenants can view their own invoices
                        // IMPORTANT: Specific routes MUST come before catch-all patterns
                        .requestMatchers(HttpMethod.POST, "/invoices/{id}/upload-slip").authenticated()  // User can upload payment slip
                        .requestMatchers(HttpMethod.POST, "/invoices/{id}/installment").authenticated()  // User can create installment plan
                        .requestMatchers(HttpMethod.GET, "/invoices/{id}/installments").authenticated()  // User can view installment invoices
                        .requestMatchers(HttpMethod.POST, "/invoices/{id}/verify").hasAnyRole("ADMIN")  // Admin can verify payments
                        .requestMatchers(HttpMethod.GET, "/invoices/waiting-verification").hasAnyRole("ADMIN")  // Admin can view pending verifications
                        .requestMatchers(HttpMethod.GET, "/invoices/tenant/**").authenticated()  // User can view own invoices by email
                        .requestMatchers(HttpMethod.GET, "/invoices/{id}").authenticated()  // User can view invoice details by ID
                        .requestMatchers(HttpMethod.GET, "/invoices/{id}/pdf").authenticated()  // User can download invoice PDF
                        .requestMatchers("/invoices/**").hasAnyRole("ADMIN")  // Admin can manage all invoices
                        
                        // Tenants - Users can view their own profile
                        .requestMatchers(HttpMethod.GET, "/tenants/*").authenticated()  // User can view own tenant profile by ID
                        .requestMatchers("/tenants/**").hasAnyRole("ADMIN")  // Admin can manage all tenants
                        
                        // Maintenance Requests - ORDER MATTERS! Specific rules first, then generic
                        .requestMatchers(HttpMethod.POST, "/maintenance-requests").hasAnyRole("VILLAGER", "ADMIN")  // Create request
                        .requestMatchers(HttpMethod.POST, "/maintenance-requests/*/upload-attachments").hasAnyRole("VILLAGER", "ADMIN")  // Upload files
                        .requestMatchers(HttpMethod.GET, "/maintenance-requests/my-requests").authenticated()  // View own requests (any authenticated user)
                        .requestMatchers(HttpMethod.GET, "/maintenance-requests/tenant/*").hasAnyRole("VILLAGER", "ADMIN")  // View by tenant ID
                        .requestMatchers(HttpMethod.GET, "/maintenance-requests/available-slots").authenticated()  // Users can view available time slots
                        .requestMatchers(HttpMethod.PUT, "/maintenance-requests/*/select-time").authenticated()  // Users can select time slot for their requests
                        .requestMatchers(HttpMethod.GET, "/maintenance-requests").authenticated()  // All authenticated users can view (for checking time slots)
                        .requestMatchers(HttpMethod.GET, "/maintenance-requests/*").hasAnyRole("ADMIN")  // Admin views specific
                        .requestMatchers(HttpMethod.PUT, "/maintenance-requests/**").hasAnyRole("ADMIN")  // Admin updates
                        .requestMatchers(HttpMethod.DELETE, "/maintenance-requests/**").hasAnyRole("ADMIN")  // Admin deletes
                        
                        // Maintenance Stocks - Admin only
                        .requestMatchers("/maintenance/stocks/**", "/maintenance-requests/*/items/**").hasAnyRole("ADMIN")  // Stock and items management
                        
                        // Maintenance Schedules - Admin only
                        .requestMatchers("/maintenance/schedules/**").hasAnyRole("ADMIN")  // Schedule management
                        
                        // Maintenance Notifications - Authenticated users can view their own
                        .requestMatchers("/maintenance/notifications/**").authenticated()  // Notification access
                        
                        // Users API - Admin only
                        .requestMatchers("/users/**").hasAnyRole("ADMIN")
                        
                        // Admin-only endpoints
                        .requestMatchers("/admin/**", "/leases/**", 
                                       "/payments/**").hasAnyRole("ADMIN")
                        // Villager endpoints (villagers can access their own data)
                        .requestMatchers("/villager/**").hasAnyRole("VILLAGER", "ADMIN")
                        // All other requests must be authenticated
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Parse comma-separated origins from environment variable
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight for 1 hour
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}