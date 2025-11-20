package apartment.example.backend.security;

import apartment.example.backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

// Why: @Component ทำให้คลาสนี้เป็น Spring Bean และสามารถนำไปฉีด (Inject)
// ในคลาสอื่น ๆ ที่ต้องการใช้งานได้
@Component
public class JwtUtil {

    // Why: อ่านค่า Secret Key และ Expiration Time จากไฟล์ application.properties
    // การใช้ @Value ช่วยให้เราจัดการค่า config ได้จากที่เดียว
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // Why: เมธอดสำหรับดึง username ออกจาก Token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // NEW: Extract userId from JWT token
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Integer) {
            return ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        }
        return null;
    }

    // Why: เมธอดสำหรับสร้าง Token จากข้อมูล UserDetails
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();
        
        // Add userId to token claims if available
        if (userDetails instanceof User) {
            User user = (User) userDetails;
            extraClaims.put("userId", user.getId());
            extraClaims.put("role", user.getRole().name());
        }
        
        return generateToken(extraClaims, userDetails);
    }

    // Why: เมธอดสำหรับตรวจสอบความถูกต้องของ Token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        // Why: ตรวจสอบว่า username ใน token ตรงกับ user ที่ login อยู่ และ token ยังไม่หมดอายุ
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    // NEW: Simple token validation without UserDetails (checks expiration and signature only)
    public boolean validateToken(String token, String username) {
        try {
            final String tokenUsername = extractUsername(token);
            return (tokenUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Why: เมธอดหลักที่ใช้ในการดึงข้อมูล (Claim) ใดๆ ก็ตามจาก Token
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Why: เมธอดหลักที่ใช้ในการสร้าง Token
    private String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                // Why: "Subject" ของ Token คือข้อมูลหลักที่ระบุว่า Token นี้เป็นของใคร
                // ในที่นี้เราใช้ username
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                // Why: ตั้งวันหมดอายุของ Token ตามค่าที่เรากำหนดใน application.properties
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                // Why: "เซ็น" Token ด้วย Secret Key ของเราโดยใช้อัลกอริทึม HS256
                // นี่คือส่วนที่ทำให้ Token ปลอดภัยจากการปลอมแปลง
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        // Why: ใช้ Jwts parser ในการถอดรหัส Token โดยใช้ Secret Key ของเรา
        // ถ้า Token ไม่ถูกต้องหรือถูกแก้ไข ส่วนนี้จะโยน Exception ออกมา
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Why: สร้าง SigningKey object จาก Secret Key ที่เป็น String ของเรา
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}