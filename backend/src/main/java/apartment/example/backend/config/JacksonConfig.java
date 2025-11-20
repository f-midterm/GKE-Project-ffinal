package apartment.example.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Jackson Configuration
 * 
 * Configures Jackson ObjectMapper to handle Hibernate lazy loading proxies
 * and prevent serialization errors when returning JPA entities as JSON
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        // Create Hibernate6Module to handle Hibernate lazy loading
        Hibernate6Module hibernate6Module = new Hibernate6Module();
        
        // Configure to initialize lazy-loaded properties during serialization
        // This prevents "hibernateLazyInitializer" serialization errors
        hibernate6Module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, false);
        hibernate6Module.configure(Hibernate6Module.Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS, true);
        
        // Build ObjectMapper with Hibernate support
        return Jackson2ObjectMapperBuilder.json()
                .modules(hibernate6Module, new JavaTimeModule())
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .featuresToDisable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
                .build();
    }
}
