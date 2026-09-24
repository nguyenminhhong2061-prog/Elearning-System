package com.example.datn.modules.auth.config;

import com.example.datn.modules.user.enums.UserRole;
import com.example.datn.modules.user.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the bootstrap admin account at startup when ADMIN_EMAIL and ADMIN_PASSWORD are set. */
@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final AdminProperties properties;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountInitializer(
            AdminProperties properties,
            UserService userService,
            PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (isBlank(properties.email()) || isBlank(properties.password())) {
            log.info("ADMIN_EMAIL / ADMIN_PASSWORD not set: skipping admin account bootstrap");
            return;
        }
        if (userService.emailExists(properties.email())) {
            log.info("Admin account {} already exists", properties.email());
            return;
        }
        if (properties.password().length() < 8 || properties.password().getBytes().length > 72) {
            throw new IllegalStateException("ADMIN_PASSWORD must be between 8 and 72 bytes long");
        }
        userService.createUser(
                properties.fullName(),
                properties.email(),
                passwordEncoder.encode(properties.password()),
                UserRole.ADMIN);
        log.info("Created admin account {}", properties.email());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
