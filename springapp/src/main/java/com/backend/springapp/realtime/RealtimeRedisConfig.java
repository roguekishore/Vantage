package com.backend.springapp.realtime;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/** Subscribes the bridge to the shared channel. Absent entirely when the flag is off. */
@Configuration
@ConditionalOnProperty(name = "vantage.realtime.redis.enabled", havingValue = "true")
public class RealtimeRedisConfig {

    @Bean
    RedisMessageListenerContainer realtimeListenerContainer(RedisConnectionFactory factory, RealtimeRedisBridge bridge) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(bridge, new ChannelTopic(bridge.channel()));
        return container;
    }
}
