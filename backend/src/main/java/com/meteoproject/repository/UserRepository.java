package com.meteoproject.repository;

import com.meteoproject.domain.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.active = :active AND " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<User> searchUsers(@Param("active") Boolean active, @Param("search") String search, Pageable pageable);

    Page<User> findByActive(Boolean active, Pageable pageable);
}
