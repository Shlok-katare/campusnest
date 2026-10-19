package com.campusnest.controller;

import com.campusnest.dto.EscrowResponseDto;
import com.campusnest.dto.ReservationRequestDto;
import com.campusnest.service.EscrowService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/escrow")
public class EscrowController {

    private final EscrowService escrow;

    public EscrowController(EscrowService escrow) {
        this.escrow = escrow;
    }

    @PostMapping("/reserve")
    @ResponseStatus(HttpStatus.CREATED)
    public EscrowResponseDto reserve(@Valid @RequestBody ReservationRequestDto request) {
        return escrow.reserve(request);
    }
}
