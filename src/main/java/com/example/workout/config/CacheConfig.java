package com.example.workout.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 캐시 설정 (캐시별 독립 TTL 적용)
 * - exercises: 24시간 TTL (거의 변경 없는 정적 데이터)
 * - userDetails: 10분 TTL (보안 고려)
 * - userTotalVolume: 1시간 TTL (Dashboard 성능 최적화)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // 캐시별 독립적인 설정 적용
        cacheManager.registerCustomCache("exercises", 
            Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(24, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        cacheManager.registerCustomCache("userDetails", 
            Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats()
                .build());
        
        cacheManager.registerCustomCache("userTotalVolume", 
            Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats()
                .build());
        
        // 기본 설정 (명시되지 않은 캐시용)
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats());
        
        return cacheManager;
    }
}