package com.giftastic.giftastic.modules.category.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.category.dto.CategoryCreateRequest;
import com.giftastic.giftastic.modules.category.dto.CategoryResponse;
import com.giftastic.giftastic.modules.category.dto.CategoryUpdateRequest;
import com.giftastic.giftastic.modules.category.service.CategoryServiceImpl;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryServiceImpl categoryServiceImpl;
    
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(){
        return ResponseEntity.ok(categoryServiceImpl.getAllCategories().stream()
                .map(CategoryResponse::from)
                .toList());
    }
    
    @PostMapping
    @PreAuthorize("hasPermission(null, 'MANAGE_CATEGORIES')")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryCreateRequest request){
        return ResponseEntity.status(201)
                .body(CategoryResponse.from(categoryServiceImpl.createCategory(request.categoryName())));
    }

    @PatchMapping("/{categoryId}")
    @PreAuthorize("hasPermission(null, 'MANAGE_CATEGORIES')")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID categoryId,
            @Valid @RequestBody CategoryUpdateRequest request) {
        return ResponseEntity.ok(CategoryResponse.from(
                categoryServiceImpl.updateCategory(categoryId, request.categoryName())));
    }


    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasPermission(null, 'MANAGE_CATEGORIES')")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID categoryId){
        categoryServiceImpl.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
