package com.giftastic.giftastic.common.storage;

public interface ObjectStorageService {

    String upload(String objectKey, byte[] bytes, String contentType);

    void delete(String objectKey);
}
