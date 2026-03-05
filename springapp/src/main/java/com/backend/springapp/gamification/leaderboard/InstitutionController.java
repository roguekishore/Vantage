package com.backend.springapp.gamification.leaderboard;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for institution management.
 * GET /api/institutions          → list all institutions (for dropdowns)
 * GET /api/institutions/search   → search institutions by name (typeahead)
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

    /** Typeahead search — used by the signup form institution picker. */
    @GetMapping("/search")
    public ResponseEntity<List<InstitutionSummaryDTO>> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "10") int limit) {
        List<InstitutionSummaryDTO> results = institutionRepository
                .searchByName(q, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(i -> new InstitutionSummaryDTO(i.getId(), i.getName()))
                .toList();
        return ResponseEntity.ok(results);
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
