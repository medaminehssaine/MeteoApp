package com.meteoproject.service.ai;

import com.meteoproject.dto.projection.ProjectionResponse.RecommendationItem;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Generates actionable recommendations based on layer analysis results.
 */
@Component
public class RecommendationEngine {

    public List<RecommendationItem> generate(LayerResult trend, LayerResult simulation,
                                              LayerResult actionPlan, LayerResult risk,
                                              LayerResult capacity) {
        List<RecommendationItem> recommendations = new ArrayList<>();

        if (trend.getScore() < 60) {
            recommendations.add(RecommendationItem.builder()
                    .category("Trend")
                    .priority("HIGH")
                    .action("Conduct a root-cause analysis on the declining trend. Review recent indicator changes and identify corrective actions.")
                    .expectedImpact("Stabilize or reverse the negative trend within 2-3 measurement cycles")
                    .build());
        }

        if (simulation.getScore() < 50) {
            recommendations.add(RecommendationItem.builder()
                    .category("Plan")
                    .priority("URGENT")
                    .action("Re-baseline the project plan. Consider scope reduction or timeline extension. Current velocity suggests plan is not achievable.")
                    .expectedImpact("Improve plan feasibility score by 20-30 points")
                    .build());
        } else if (simulation.getScore() < 70) {
            recommendations.add(RecommendationItem.builder()
                    .category("Plan")
                    .priority("MEDIUM")
                    .action("Review and optimize action dependencies. Identify parallel execution opportunities to accelerate delivery.")
                    .expectedImpact("Improve plan confidence and reduce schedule risk")
                    .build());
        }

        if (actionPlan.getScore() < 50) {
            recommendations.add(RecommendationItem.builder()
                    .category("Actions")
                    .priority("URGENT")
                    .action("Immediately address blocked actions. Escalate dependencies and assign resolution owners for each blocker.")
                    .expectedImpact("Unblock critical path and improve plan health by 15-25 points")
                    .build());
        }

        if (actionPlan.getScore() < 70) {
            recommendations.add(RecommendationItem.builder()
                    .category("Actions")
                    .priority("HIGH")
                    .action("Review late actions and adjust deadlines or reassign resources. Focus on actions with highest weight impact.")
                    .expectedImpact("Reduce late action ratio and improve delivery confidence")
                    .build());
        }

        if (risk.getScore() < 50) {
            recommendations.add(RecommendationItem.builder()
                    .category("Risk")
                    .priority("URGENT")
                    .action("Define mitigation plans for all high-severity risks. Consider risk transfer or avoidance strategies for critical items.")
                    .expectedImpact("Reduce risk exposure score by 20-40 points")
                    .build());
        } else if (risk.getScore() < 70) {
            recommendations.add(RecommendationItem.builder()
                    .category("Risk")
                    .priority("MEDIUM")
                    .action("Update risk register and ensure all medium+ risks have assigned owners and mitigation plans.")
                    .expectedImpact("Improve mitigation coverage and reduce surprise risk materialization")
                    .build());
        }

        if (capacity.getScore() < 50) {
            recommendations.add(RecommendationItem.builder()
                    .category("Capacity")
                    .priority("HIGH")
                    .action("Rebalance team workload. Some members are overloaded while others are underutilized. Consider temporary resource allocation or scope adjustment.")
                    .expectedImpact("Improve team productivity and reduce burnout risk")
                    .build());
        }

        if (capacity.getScore() < 70) {
            recommendations.add(RecommendationItem.builder()
                    .category("Capacity")
                    .priority("MEDIUM")
                    .action("Assign unassigned tasks and review workload distribution across team members.")
                    .expectedImpact("Ensure all critical tasks have owners and balanced workload")
                    .build());
        }

        if (recommendations.isEmpty()) {
            recommendations.add(RecommendationItem.builder()
                    .category("General")
                    .priority("LOW")
                    .action("Project is on track. Continue current practices and maintain regular monitoring cadence.")
                    .expectedImpact("Sustain current positive trajectory")
                    .build());
        }

        return recommendations;
    }
}
