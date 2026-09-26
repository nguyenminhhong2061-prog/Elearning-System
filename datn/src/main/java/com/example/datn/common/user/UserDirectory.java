package com.example.datn.common.user;

import java.util.Collection;
import java.util.Map;

/**
 * What other modules may show about users to other users. Implemented by the user module, so that modules depend only
 * on this contract and never see more than they may display (no full name, no email).
 */
public interface UserDirectory {

    /**
     * The name each user may be shown under to other users: their given name (the last word of the full name, as
     * Vietnamese names put it last). Unknown ids are absent from the result.
     */
    Map<Long, String> displayNames(Collection<Long> userIds);
}
