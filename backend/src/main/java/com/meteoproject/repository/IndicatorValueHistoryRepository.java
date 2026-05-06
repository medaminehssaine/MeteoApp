package com.meteoproject.repository;

import com.meteoproject.domain.indicator.IndicatorValueHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface IndicatorValueHistoryRepository extends JpaRepository<IndicatorValueHistory, UUID> {
    List<IndicatorValueHistory> findByProjectIndicatorIdOrderByMeasuredAtDesc(UUID projectIndicatorId);

    @Query("SELECT ivh FROM IndicatorValueHistory ivh WHERE ivh.projectIndicator.id = :piId ORDER BY ivh.measuredAt DESC")
    List<IndicatorValueHistory> findRecentHistory(@Param("piId") UUID piId, Pageable pageable);

    @Query("SELECT ivh FROM IndicatorValueHistory ivh WHERE ivh.projectIndicator.id = :piId AND ivh.measuredAt BETWEEN :from AND :to ORDER BY ivh.measuredAt ASC")
    List<IndicatorValueHistory> findByDateRange(@Param("piId") UUID piId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
