package com.meteoproject.repository;

import com.meteoproject.domain.meteo.MeteoHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface MeteoHistoryRepository extends JpaRepository<MeteoHistory, UUID> {
    @Query("SELECT mh FROM MeteoHistory mh WHERE mh.projectId = :projectId ORDER BY mh.calculationDate DESC")
    List<MeteoHistory> findLatest(@Param("projectId") UUID projectId, Pageable pageable);

    org.springframework.data.domain.Page<MeteoHistory> findByProjectIdOrderByCalculationDateDesc(UUID projectId, Pageable pageable);

    Optional<MeteoHistory> findTopByProjectIdOrderByCalculationDateDesc(UUID projectId);

    @Query("SELECT mh FROM MeteoHistory mh WHERE mh.projectId = :projectId AND mh.calculationDate BETWEEN :from AND :to ORDER BY mh.calculationDate ASC")
    List<MeteoHistory> findByDateRange(@Param("projectId") UUID projectId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    Optional<MeteoHistory> findByProjectIdAndCalculationDate(UUID projectId, LocalDate date);
}
