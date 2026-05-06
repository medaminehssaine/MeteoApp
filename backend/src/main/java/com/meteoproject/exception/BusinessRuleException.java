package com.meteoproject.exception;

import lombok.Getter;

@Getter
public class BusinessRuleException extends RuntimeException {
    private final String rule;
    private final String field;

    public BusinessRuleException(String rule, String message) {
        super(message);
        this.rule = rule;
        this.field = null;
    }

    public BusinessRuleException(String rule, String field, String message) {
        super(message);
        this.rule = rule;
        this.field = field;
    }
}
