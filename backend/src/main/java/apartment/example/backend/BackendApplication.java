package apartment.example.backend;

import apartment.example.backend.entity.Unit;
import apartment.example.backend.entity.User;
import apartment.example.backend.repository.UnitRepository;
import apartment.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;
import apartment.example.backend.entity.enums.UnitStatus;
import java.math.BigDecimal;
import java.util.stream.IntStream;

@EnableScheduling
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UnitRepository unitRepository) {

        return args -> {
            // --- Initialize default users from environment variables ---
            // SECURITY: Credentials are loaded from environment variables for better security
            
            String adminUsername = System.getenv().getOrDefault("ADMIN_USERNAME", "admin");
            String adminPassword = System.getenv().getOrDefault("ADMIN_PASSWORD", "admin123");
            String adminEmail = System.getenv().getOrDefault("ADMIN_EMAIL", "admin@apartment.com");
            
            String villagerUsername = System.getenv().getOrDefault("VILLAGER_USERNAME", "villager");
            String villagerPassword = System.getenv().getOrDefault("VILLAGER_PASSWORD", "villager123");
            String villagerEmail = System.getenv().getOrDefault("VILLAGER_EMAIL", "villager@apartment.com");
            
            String testUsername = System.getenv().getOrDefault("TEST_USERNAME", "testuser");
            String testPassword = System.getenv().getOrDefault("TEST_PASSWORD", "test123");
            String testEmail = System.getenv().getOrDefault("TEST_EMAIL", "testuser@apartment.com");
            
            // Delete existing users to avoid duplicates
            userRepository.findByUsername(adminUsername).forEach(userRepository::delete);
            userRepository.findByUsername(villagerUsername).forEach(userRepository::delete);
            userRepository.findByUsername(testUsername).forEach(userRepository::delete);
            
            // Create admin user
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setEmail(adminEmail);
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
            System.out.println(">>> Created ADMIN user: " + adminUsername + " (email: " + adminEmail + ")");

            // Create villager user for testing
            User villager = new User();
            villager.setUsername(villagerUsername);
            villager.setPassword(passwordEncoder.encode(villagerPassword));
            villager.setEmail(villagerEmail);
            villager.setRole(User.Role.VILLAGER);
            userRepository.save(villager);
            System.out.println(">>> Created VILLAGER user: " + villagerUsername + " (email: " + villagerEmail + ")");

            // Create test user (different from 'user' to allow registration testing)
            User testUser = new User();
            testUser.setUsername(testUsername);
            testUser.setPassword(passwordEncoder.encode(testPassword));
            testUser.setEmail(testEmail);
            testUser.setRole(User.Role.USER);
            userRepository.save(testUser);
            System.out.println(">>> Created TEST user: " + testUsername + " (email: " + testEmail + ")");
        };
    }
}