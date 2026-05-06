package com.meteoproject.repository;

import com.meteoproject.domain.indicator.IndicatorLibrary;
import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface IndicatorLibraryRepository extends JpaRepository<IndicatorLibrary, UUID> {
    List<IndicatorLibrary> findByIsActiveTrue();
    List<IndicatorLibrary> findByCategoryAndIsActiveTrue(IndicatorCategory category);
    Optional<IndicatorLibrary> findByCode(String code);
    boolean existsByCode(String code);
}
