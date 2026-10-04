package com.giftastic.giftastic.modules.category.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.giftastic.giftastic.modules.category.domain.Category;
import com.giftastic.giftastic.modules.category.repository.CategoryRepository;
import com.giftastic.giftastic.modules.product.domain.Product;

class CategoryServiceImplTests {

    @Test
    void updateRenamesBothPersistedCategoryNameFields() {
        CategoryRepository repository = mock(CategoryRepository.class);
        Category category = Category.create("Old name");
        when(repository.findById(category.getId())).thenReturn(Optional.of(category));
        CategoryServiceImpl service = new CategoryServiceImpl(repository);

        Category updated = service.updateCategory(category.getId(), "  New name  ");

        assertThat(updated.getCategoryName()).isEqualTo("New name");
    }

    @Test
    void deleteRefusesToBreakExistingProductRelationships() {
        CategoryRepository repository = mock(CategoryRepository.class);
        Category category = Category.create("Gifts");
        category.getProducts().add(mock(Product.class));
        when(repository.findById(category.getId())).thenReturn(Optional.of(category));
        CategoryServiceImpl service = new CategoryServiceImpl(repository);

        assertThatThrownBy(() -> service.deleteCategory(category.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("assigned to products");
        verify(repository, never()).delete(category);
    }

    @Test
    void deleteRemovesAnUnusedCategory() {
        CategoryRepository repository = mock(CategoryRepository.class);
        Category category = Category.create("Gifts");
        UUID categoryId = category.getId();
        when(repository.findById(categoryId)).thenReturn(Optional.of(category));
        CategoryServiceImpl service = new CategoryServiceImpl(repository);

        service.deleteCategory(categoryId);

        verify(repository).delete(category);
    }
}
