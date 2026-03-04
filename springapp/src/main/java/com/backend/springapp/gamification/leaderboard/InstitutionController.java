package com.backend.springapp.gamification.leaderboard;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for institution management.
 * GET /api/institutions          → list all institutions (for dropdowns)
 * POST /api/institutions         → create new institution (admin)
 */
@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionRepository institutionRepository;

    /** List all institutions — used by frontend dropdowns. */
    @GetMapping
    public ResponseEntity<List<InstitutionSummaryDTO>> list() {
        List<InstitutionSummaryDTO> institutions = institutionRepository.findAll()
                .stream()
                .map(i -> new InstitutionSummaryDTO(i.getId(), i.getName()))
                .sorted((a, b) -> a.name().compareToIgnoreCase(b.name()))
                .toList();
        return ResponseEntity.ok(institutions);
    }

    /** Create a new institution. */
    @PostMapping
    public ResponseEntity<InstitutionSummaryDTO> create(@RequestBody InstitutionSummaryDTO dto) {
        Institution institution = new Institution();
        institution.setName(dto.name());
        Institution saved = institutionRepository.save(institution);
        return ResponseEntity.ok(new InstitutionSummaryDTO(saved.getId(), saved.getName()));
    }
}
