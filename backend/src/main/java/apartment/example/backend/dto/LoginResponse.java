package apartment.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

// Why: สร้าง DTO สำหรับการตอบกลับหลัง Login สำเร็จ
// การส่งข้อมูลเป็น object ช่วยให้เราเพิ่มข้อมูลอื่น ๆ ในอนาคตได้ง่าย เช่น user details
@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String role;
    private String username;
}