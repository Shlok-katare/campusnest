package com.campusnest.dto;

/** Regexes shared by request DTOs. */
public final class Patterns {

    /** Indian mobile number, optional +91 prefix, e.g. "+91 98765 43210" or "9876543210". */
    public static final String PHONE = "^(\\+91[\\s-]?)?[6-9]\\d{4}[\\s-]?\\d{5}$";

    private Patterns() {
    }
}
