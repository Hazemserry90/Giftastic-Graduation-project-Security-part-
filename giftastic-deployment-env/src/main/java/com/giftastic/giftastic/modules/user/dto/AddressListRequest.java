package com.giftastic.giftastic.modules.user.dto;

import java.util.List;
import com.giftastic.giftastic.modules.user.domain.Address;

public record AddressListRequest(
    List<Address> addresses
) {}
