package com.meteoproject.repository;

import com.meteoproject.domain.cqd.CQDHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface CQDHistoryRepository extends JpaRepository<CQDHistory, UUID> {
    @Query("SELECT c FROM CQDHistory c WHERE c.projectId = :projectId ORDER BY c.calculationDate DESC")
    List<CQDHistory> findLatest(@Param("projectId") UUID projectId, Pageable pageable);

    @Query("SELECT c FROM CQDHistory c WHERE c.projectId = :projectId AND c.calculationDate BETWEEN :from AND :to ORDER BY c.calculationDate ASC")
    List<CQDHistory> findByDateRange(@Param("projectId") UUID projectId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
