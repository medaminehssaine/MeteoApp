package com.meteoproject.util;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class DateUtils {

    private DateUtils() {}

    public static long daysBetween(LocalDate from, LocalDate to) {
        return ChronoUnit.DAYS.between(from, to);
    }

    public static long daysSince(LocalDate date) {
        return ChronoUnit.DAYS.between(date, LocalDate.now());
    }

    public static long daysUntil(LocalDate date) {
        return ChronoUnit.DAYS.between(LocalDate.now(), date);
    }

    public static boolean isOverdue(LocalDate plannedEnd) {
        return LocalDate.now().isAfter(plannedEnd);
    }

    public static int workingDaysBetween(LocalDate start, LocalDate end) {
        int workingDays = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            int dayOfWeek = current.getDayOfWeek().getValue();
            if (dayOfWeek < 6) workingDays++; // Mon-Fri
            current = current.plusDays(1);
        }
        return workingDays;
    }
}
