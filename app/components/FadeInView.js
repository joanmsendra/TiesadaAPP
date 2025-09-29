import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const FadeInView = ({ children, duration = 800, delay = 0 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
            }).start();
        }, delay);

        return () => clearTimeout(timeout);
    }, [fadeAnim, duration, delay]);

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            {children}
        </Animated.View>
    );
};

export default FadeInView;


