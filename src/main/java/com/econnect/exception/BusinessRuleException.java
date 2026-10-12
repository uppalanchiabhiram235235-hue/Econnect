package com.econnect.exception;

/** Thrown when a business rule (capacity, duplicate join, invalid state...) is violated. */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
