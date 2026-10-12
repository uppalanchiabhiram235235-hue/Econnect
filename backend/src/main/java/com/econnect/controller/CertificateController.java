package com.econnect.controller;

import com.econnect.dto.CertificateResponse;
import com.econnect.service.CertificateService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CertificateController {

    private final CertificateService certificates;

    public CertificateController(CertificateService certificates) {
        this.certificates = certificates;
    }

    @GetMapping("/participation/{id}/certificate")
    public CertificateResponse getCertificate(@PathVariable Long id) {
        return certificates.getCertificateForParticipation(id);
    }

    @GetMapping("/certificates/verify/{code}")
    public CertificateResponse verifyCertificate(@PathVariable String code) {
        return certificates.verifyCertificate(code);
    }
}
