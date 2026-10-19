package com.campusnest.entity;

public enum EscrowStatus {
    /** Token is being held and a bed is reserved. */
    HELD,
    /** 48 hours passed without completion; the bed was released and the token is due for refund. */
    EXPIRED
}
