package com.giftastic.giftastic.modules.commission.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.common.pricing.CommissionRates;
import com.giftastic.giftastic.modules.commission.domain.CommissionRule;
import com.giftastic.giftastic.modules.commission.domain.RuleType;
import com.giftastic.giftastic.modules.commission.dto.CommissionRuleDTO;
import com.giftastic.giftastic.modules.commission.repository.CommissionRuleRepository;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommissionRuleService {

    private final CommissionRuleRepository ruleRepository;
    private final VendorRepository vendorRepository;
    private final NotificationService notificationService;

    @Transactional
    public synchronized CommissionRuleDTO createGlobalRule(BigDecimal rate, LocalDateTime startDate, LocalDateTime endDate, UUID createdBy) {
        ensureNoActiveCustomRule();
        CommissionRule rule = CommissionRule.createGlobal(rate, startDate, endDate, createdBy);
        ruleRepository.save(rule);
        String displayRate = CommissionRates.formatPercent(rule.getRate());

        List<Vendor> vendors = vendorRepository.findByIsVerifiedTrue();
        for (Vendor vendor : vendors) {
            notificationService.sendNotification(
                    vendor.getSupplierId(),
                    "Commission Rate Changed",
                    "Commission rate changed to " + displayRate + "% effective " + startDate,
                    com.giftastic.giftastic.modules.notification.domain.NotificationType.VENDOR_ALERT,
                    "{\"ruleType\":\"GLOBAL\",\"rate\":\"" + rule.getRate() + "\",\"startDate\":\"" + startDate + "\"}"
            );
        }

        return CommissionRuleDTO.from(rule, null);
    }

    @Transactional
    public synchronized CommissionRuleDTO createSupplierSpecificRule(UUID supplierId, BigDecimal rate, LocalDateTime startDate, LocalDateTime endDate, UUID createdBy) {
        ensureNoActiveCustomRule();
        CommissionRule rule = CommissionRule.createSupplierSpecific(supplierId, rate, startDate, endDate, createdBy);
        ruleRepository.save(rule);
        String displayRate = CommissionRates.formatPercent(rule.getRate());

        notificationService.sendNotification(
                supplierId,
                "Commission Rate Changed",
                "Your commission rate changed to " + displayRate + "% effective " + startDate,
                com.giftastic.giftastic.modules.notification.domain.NotificationType.VENDOR_ALERT,
                "{\"ruleType\":\"SUPPLIER_SPECIFIC\",\"rate\":\"" + rule.getRate() + "\",\"startDate\":\"" + startDate + "\"}"
        );

        String vendorName = getVendorName(supplierId);
        return CommissionRuleDTO.from(rule, vendorName);
    }

    public List<CommissionRuleDTO> getAllActiveRules() {
        List<CommissionRule> rules = ruleRepository.findByActiveTrue();
        return rules.stream()
                .map(r -> CommissionRuleDTO.from(r, r.getSupplierId() != null ? getVendorName(r.getSupplierId()) : null))
                .collect(Collectors.toList());
    }

    public List<CommissionRuleDTO> getGlobalRules() {
        List<CommissionRule> rules = ruleRepository.findByTypeAndActiveTrue(RuleType.GLOBAL);
        return rules.stream()
                .map(r -> CommissionRuleDTO.from(r, null))
                .collect(Collectors.toList());
    }

    public List<CommissionRuleDTO> getSupplierRules(UUID supplierId) {
        List<CommissionRule> rules = ruleRepository.findBySupplierIdAndActiveTrue(supplierId);
        String vendorName = getVendorName(supplierId);
        return rules.stream()
                .map(r -> CommissionRuleDTO.from(r, vendorName))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deactivateRule(UUID ruleId) {
        CommissionRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        rule.deactivate();
        ruleRepository.save(rule);
    }

    private String getVendorName(UUID supplierId) {
        return vendorRepository.findBySupplierId(supplierId)
                .map(v -> v.getStoreName())
                .orElse("Unknown Vendor");
    }

    private void ensureNoActiveCustomRule() {
        if (ruleRepository.existsByActiveTrue()) {
            throw new IllegalStateException(
                    "Only one custom commission rule can be active. Deactivate the current rule to return to the default 10% rate or create a different rule.");
        }
    }
}
