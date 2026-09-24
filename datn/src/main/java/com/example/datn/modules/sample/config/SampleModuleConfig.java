package com.example.datn.modules.sample.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class SampleModuleConfig {

    @Bean
    public Clock applicationClock() {
        return Clock.systemUTC();
    }
}
