package com.giftastic.giftastic.modules.category.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.common.exception.ResourceNotFoundException;
import com.giftastic.giftastic.modules.category.domain.Category;
import com.giftastic.giftastic.modules.category.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CategoryServiceImpl {
    
    private final CategoryRepository categoryRepository;

    @Transactional
    public Category createCategory(String categoryName){
        return categoryRepository.save(Category.create(categoryName));
    }

    @Transactional
    public Category updateCategory(UUID categoryId, String categoryName) {
        Category category = getCategory(categoryId);
        category.rename(categoryName);
        return category;
    }

    @Transactional
    public void deleteCategory(UUID categoryId){
        Category category = getCategory(categoryId);
        if (!category.getProducts().isEmpty()) {
            throw new IllegalArgumentException("Category cannot be deleted while it is assigned to products");
        }
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public List<Category> getAllCategories(){
        return categoryRepository.findAll();
    }

    private Category getCategory(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }
}
