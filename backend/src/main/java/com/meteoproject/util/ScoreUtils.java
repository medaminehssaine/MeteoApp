package com.meteoproject.util;

public final class ScoreUtils {

    private ScoreUtils() {}

    /** Clamp a double to [min, max]. */
    public static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    /** Clamp an int to [min, max]. */
    public static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Calculate indicator score (0-100) given a raw value and thresholds.
     * Higher values are normally better (lower values for inverted indicators).
     */
    public static int calculateScore(double value, double green, double orange, double red, boolean inverted) {
        if (inverted) {
            if (value <= green)  return clamp((int)(80 + (green - value) / Math.max(green, 1) * 20), 0, 100);
            if (value <= orange) return clamp((int)(50 + (orange - value) / Math.max(orange - green, 1) * 30), 0, 100);
            if (value <= red)    return clamp((int)(20 + (red - value) / Math.max(red - orange, 1) * 30), 0, 100);
            return clamp((int)(Math.max(0, 20 - (value - red) / Math.max(red, 1) * 20)), 0, 100);
        }
        if (value >= green)  return clamp((int)(80 + Math.min((value - green) / Math.max(100 - green, 1) * 20, 20)), 0, 100);
        if (value >= orange) return clamp((int)(50 + (value - orange) / Math.max(green - orange, 1) * 30), 0, 100);
        if (value >= red)    return clamp((int)(20 + (value - red) / Math.max(orange - red, 1) * 30), 0, 100);
        return clamp((int)(value / Math.max(red, 1) * 20), 0, 100);
    }

    /** Convert numeric score to météo label. */
    public static String scoreToMeteoLabel(double score) {
        if (score >= 85) return "SOLEIL";
        if (score >= 70) return "NUAGE_CLAIR";
        if (score >= 50) return "NUAGE_CHARGE";
        return "ORAGE";
    }

    /** Weighted average of parallel value/weight arrays. */
    public static double weightedAverage(double[] values, double[] weights) {
        double totalWeighted = 0, totalWeight = 0;
        for (int i = 0; i < values.length; i++) {
            totalWeighted += values[i] * weights[i];
            totalWeight += weights[i];
        }
        return totalWeight > 0 ? totalWeighted / totalWeight : 0;
    }
}
