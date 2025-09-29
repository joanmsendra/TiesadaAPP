import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants';

const MatchCardSkeleton = () => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.skeletonEmoji} />
                <View style={styles.skeletonOpponent} />
            </View>
            <View style={styles.skeletonDate} />
            <View style={styles.footer}>
                <View style={styles.skeletonButton} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    skeletonEmoji: {
        width: 20,
        height: 20,
        backgroundColor: Colors.border,
        borderRadius: 10,
        marginRight: Spacing.sm,
    },
    skeletonOpponent: {
        flex: 1,
        height: 18,
        backgroundColor: Colors.border,
        borderRadius: 4,
    },
    skeletonDate: {
        height: 14,
        width: '60%',
        backgroundColor: Colors.border,
        borderRadius: 4,
        marginBottom: Spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    skeletonButton: {
        width: 80,
        height: 32,
        backgroundColor: Colors.border,
        borderRadius: 16,
    },
});

export default MatchCardSkeleton;


