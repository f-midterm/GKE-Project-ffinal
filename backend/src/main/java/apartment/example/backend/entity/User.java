package apartment.example.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.Collections;

// Why: @Table(name = "users") เป็นการระบุชื่อตารางในฐานข้อมูลให้ชัดเจน
// เพื่อหลีกเลี่ยงปัญหาชื่อ "user" ซึ่งอาจเป็นคำสงวนใน SQL บางเวอร์ชัน
@Entity
@Table(name = "users")
@Data
// Why: ทำให้คลาส User ของเราเข้ากันได้กับ Spring Security
// โดย implement interface UserDetails ซึ่งบังคับให้เราต้องมี method บางอย่าง
public class User implements UserDetails {

    public enum Role {
        ADMIN, USER, VILLAGER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    private String password;

    @jakarta.persistence.Column(length = 254)
    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;

    @jakarta.persistence.Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;

    // Why: เมธอดนี้ใช้สำหรับระบุ "สิทธิ์" หรือ "Role" ของผู้ใช้
    // Return user's role as authority for Spring Security
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // Why: เมธอดเหล่านี้ใช้ตรวจสอบสถานะของบัญชีผู้ใช้ เช่น บัญชีหมดอายุ, ถูกล็อค
    // สำหรับตอนนี้เราตั้งให้เป็น true ทั้งหมด เพื่อให้ใช้งานได้เสมอ
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}