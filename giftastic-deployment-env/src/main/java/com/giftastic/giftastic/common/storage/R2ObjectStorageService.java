package com.giftastic.giftastic.common.storage;

import java.net.URI;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class R2ObjectStorageService implements ObjectStorageService {

    private final R2StorageProperties properties;
    private volatile S3Client client;

    @Override
    public String upload(String objectKey, byte[] bytes, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.getBucketName())
                .key(objectKey)
                .contentType(contentType)
                .contentLength((long) bytes.length)
                .build();
        client().putObject(request, RequestBody.fromBytes(bytes));
        return properties.publicUrlFor(objectKey);
    }

    @Override
    public void delete(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return;
        }
        client().deleteObject(DeleteObjectRequest.builder()
                .bucket(properties.getBucketName())
                .key(objectKey)
                .build());
    }

    private S3Client client() {
        properties.validateConfigured();
        S3Client current = client;
        if (current != null) {
            return current;
        }
        synchronized (this) {
            if (client == null) {
                client = S3Client.builder()
                        .endpointOverride(URI.create(properties.endpoint()))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(properties.getAccessKeyId(), properties.getSecretAccessKey())))
                        .region(Region.of("auto"))
                        .serviceConfiguration(S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                        .build();
            }
            return client;
        }
    }
}
