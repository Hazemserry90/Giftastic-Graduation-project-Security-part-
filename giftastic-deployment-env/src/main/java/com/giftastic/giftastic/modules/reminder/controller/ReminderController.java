package com.giftastic.giftastic.modules.reminder.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.reminder.domain.Reminder;
import com.giftastic.giftastic.modules.reminder.service.ReminderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reminders")
@RequiredArgsConstructor
@Tag(name = "Reminders", description = "Gift reminder management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Get my reminders",
        description = "Retrieves all reminders for the authenticated user. Requires USER role."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Reminders retrieved successfully"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<List<Reminder>> getMyReminders() {
        UUID customerId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(reminderService.getCustomerReminders(customerId));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Create reminder",
        description = "Creates a new gift reminder for the authenticated user. Requires USER role."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Reminder created successfully", 
                     content = @Content(schema = @Schema(implementation = Reminder.class))),
        @ApiResponse(responseCode = "400", description = "Invalid reminder data"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<Reminder> createReminder(
            @Parameter(description = "Reminder creation request", required = true)
            @RequestBody ReminderRequest request) {
        UUID customerId = SecurityUtils.getCurrentUserId();
        Reminder reminder = reminderService.scheduleReminder(customerId, request.getDescription(), request.getScheduledAt());
        return ResponseEntity.ok(reminder);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Reminder> updateReminder(@PathVariable UUID id, @RequestBody ReminderRequest request) {
        UUID customerId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(reminderService.updateReminder(id, customerId, request.getDescription(), request.getScheduledAt()));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasAuthority('SUPER_ADMIN')")
    @Operation(
        summary = "Delete reminder",
        description = "Deletes a reminder. Users can delete their own reminders, admins can delete any reminder."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Reminder deleted successfully"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Reminder not found")
    })
    public ResponseEntity<Void> deleteReminder(
            @Parameter(description = "ID of the reminder", required = true)
            @PathVariable UUID id) {
        UUID customerId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.hasAuthority("SUPER_ADMIN");
        reminderService.deleteReminder(id, customerId, isAdmin);
        return ResponseEntity.noContent().build();
    }
}

@Data
class ReminderRequest {
    private String description;
    private LocalDateTime scheduledAt;
}
