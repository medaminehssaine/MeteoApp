package com.meteoproject.service.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LayerResult {
    private String layerName;
    private double score;
    private double confidence;
    private String explanation;
}
