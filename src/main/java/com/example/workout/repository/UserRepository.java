package com.example.workout.repository;

import com.example.workout.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    /** 만료된 게스트 계정. 한 번에 처리할 양을 제한해 정리 트랜잭션이 길어지지 않게 한다. */
    List<User> findTop200ByGuestTrueAndExpiresAtBefore(LocalDateTime threshold);
}
