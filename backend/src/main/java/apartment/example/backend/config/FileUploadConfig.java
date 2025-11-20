package apartment.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * File Upload Configuration
 * 
 * Configures file upload directory and serves uploaded files as static resources
 */
@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads/payment-slips}")
    private String uploadDir;

    @Value("${file.maintenance-upload-dir:uploads/maintenance-attachments}")
    private String maintenanceUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Convert relative path to absolute path for payment slips
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadPathString = uploadPath.toUri().toString();
        
        // Serve uploaded files at /uploads/payment-slips/**
        registry.addResourceHandler("/uploads/payment-slips/**")
                .addResourceLocations(uploadPathString + "/");

        // Convert relative path to absolute path for maintenance attachments
        Path maintenanceUploadPath = Paths.get(maintenanceUploadDir).toAbsolutePath().normalize();
        String maintenanceUploadPathString = maintenanceUploadPath.toUri().toString();
        
        // Serve uploaded files at /uploads/maintenance-attachments/**
        registry.addResourceHandler("/uploads/maintenance-attachments/**")
                .addResourceLocations(maintenanceUploadPathString + "/");
    }
}
