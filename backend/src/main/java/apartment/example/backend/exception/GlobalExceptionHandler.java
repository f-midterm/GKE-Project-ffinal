package apartment.example.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDateTime;

/**
 * Global exception handler for the entire application.
 * Provides centralized error handling and standardized error responses.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle resource not found exceptions (404)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex, 
            HttpServletRequest request) {
        log.error("Resource not found: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.NOT_FOUND, 
            ex.getMessage(), 
            request.getRequestURI()
        );
    }

    /**
     * Handle authentication failures (401)
     */
    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, 
            HttpServletRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.UNAUTHORIZED, 
            "Invalid username or password", 
            request.getRequestURI()
        );
    }

    /**
     * Handle generic authentication exceptions (401)
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException ex, 
            HttpServletRequest request) {
        log.warn("Authentication error: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.UNAUTHORIZED, 
            "Authentication failed", 
            request.getRequestURI()
        );
    }

    /**
     * Handle access denied (403)
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, 
            HttpServletRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.FORBIDDEN, 
            "You don't have permission to access this resource", 
            request.getRequestURI()
        );
    }

    /**
     * Handle illegal arguments (400)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, 
            HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST, 
            ex.getMessage(), 
            request.getRequestURI()
        );
    }

    /**
     * Handle validation errors (400)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex, 
            HttpServletRequest request) {
        String errorMessage = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("Validation failed");
        
        log.warn("Validation error: {}", errorMessage);
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST, 
            errorMessage, 
            request.getRequestURI()
        );
    }

    /**
     * Handle all other exceptions (500)
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, 
            HttpServletRequest request) {
        log.error("Unexpected error occurred: {}", ex.getMessage(), ex);
        return buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR, 
            "An unexpected error occurred. Please contact support.", 
            request.getRequestURI()
        );
    }

    /**
     * Build standardized error response
     */
    private ResponseEntity<ErrorResponse> buildErrorResponse(
            HttpStatus status, 
            String message, 
            String path) {
        ErrorResponse errorResponse = new ErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            message,
            LocalDateTime.now(),
            path
        );
        return new ResponseEntity<>(errorResponse, status);
    }
}
