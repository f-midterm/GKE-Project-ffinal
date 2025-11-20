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
            // SECURITY: All credentials must be provided via environment variables
            
            String adminUsername = System.getenv("DEFAULT_ADMIN_USERNAME");
            String adminPassword = System.getenv("DEFAULT_ADMIN_PASSWORD");
            String adminEmail = System.getenv("DEFAULT_ADMIN_EMAIL");
            
            String villagerUsername = System.getenv("DEFAULT_VILLAGER_USERNAME");
            String villagerPassword = System.getenv("DEFAULT_VILLAGER_PASSWORD");
            String villagerEmail = System.getenv("DEFAULT_VILLAGER_EMAIL");
            
            String testUsername = System.getenv("DEFAULT_TEST_USERNAME");
            String testPassword = System.getenv("DEFAULT_TEST_PASSWORD");
            String testEmail = System.getenv("DEFAULT_TEST_EMAIL");
            
            // Validate required environment variables
            if (adminUsername == null || adminPassword == null || adminEmail == null) {
                throw new IllegalStateException("Admin user environment variables are not set. Required: DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_EMAIL");
            }
            if (villagerUsername == null || villagerPassword == null || villagerEmail == null) {
                throw new IllegalStateException("Villager user environment variables are not set. Required: DEFAULT_VILLAGER_USERNAME, DEFAULT_VILLAGER_PASSWORD, DEFAULT_VILLAGER_EMAIL");
            }
            if (testUsername == null || testPassword == null || testEmail == null) {
                throw new IllegalStateException("Test user environment variables are not set. Required: DEFAULT_TEST_USERNAME, DEFAULT_TEST_PASSWORD, DEFAULT_TEST_EMAIL");
            }
            
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