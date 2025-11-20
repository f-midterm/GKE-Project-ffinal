package apartment.example.backend.service;

import apartment.example.backend.entity.User;
import apartment.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    // Why: นี่คือเมธอดหลักที่ Spring Security จะเรียกใช้เมื่อต้องการข้อมูลผู้ใช้
    // เราต้องเขียนโค้ดเพื่อค้นหาผู้ใช้จาก username ที่ส่งเข้ามา
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Why: ใช้ findByUsername ที่เราจะสร้างขึ้นใน UserRepository เพื่อค้นหาผู้ใช้
        // ถ้าไม่พบผู้ใช้ ให้โยน UsernameNotFoundException ซึ่งเป็นวิธีมาตรฐานของ Spring Security
        return userRepository.findByUsername(username)
                .stream().findFirst()
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }
}