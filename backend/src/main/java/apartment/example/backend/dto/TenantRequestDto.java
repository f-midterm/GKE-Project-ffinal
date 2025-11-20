package apartment.example.backend.dto;

import lombok.Data;
import java.time.LocalDate;

// Why: DTO สำหรับรับข้อมูลเพื่อสร้าง/แก้ไข Tenant
// เราจะรับแค่ ID ของห้อง (unitId) ไม่ใช่ Object Unit ทั้งหมด เพื่อให้ Payload ของ Request เล็กและปลอดภัย
@Data
public class TenantRequestDto {
    private String name;
    private String phoneNumber;
    private String email;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private Long unitId; // Why: รับมาแค่ ID ของห้องที่จะให้ผู้เช่าเข้าอยู่
}