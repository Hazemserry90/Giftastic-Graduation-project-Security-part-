package com.giftastic.giftastic.modules.search.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.search.dto.UnifiedSearchResponse;
import com.giftastic.giftastic.modules.search.service.UnifiedSearchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final UnifiedSearchService unifiedSearchService;

    @GetMapping
    public ResponseEntity<UnifiedSearchResponse> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int limit) {
        log.debug("Search request: q={}, limit={}", q, limit);
        UnifiedSearchResponse results = unifiedSearchService.search(q, limit);
        return ResponseEntity.ok(results);
    }
}
