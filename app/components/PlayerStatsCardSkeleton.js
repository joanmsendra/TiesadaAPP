import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Fonts } from '../constants';

const PlayerStatsCardSkeleton = () => {
    return (
        <View style={styles.card}>
            <View style={styles.rankContainer}>
                <View style={styles.skeletonRank} />
            </View>
            <View style={styles.skeletonImage} />
            
            <View style={styles.playerInfo}>
                <View style={styles.skeletonName} />
                <View style={styles.skeletonPosition} />
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <View style={styles.skeletonIcon} />
                    <View style={styles.skeletonStat} />
                </View>
                <View style={styles.statItem}>
                    <View style={styles.skeletonIcon} />
                    <View style={styles.skeletonStat} />
                </View>
                <View style={styles.statItem}>
                    <View style={styles.skeletonIcon} />
                    <View style={styles.skeletonStat} />
                </View>
            </View>

            <View style={styles.mvpContainer}>
                <View style={styles.skeletonMvpScore} />
                <View style={styles.skeletonMvpLabel} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    rankContainer: {
        marginRight: Spacing.md,
    },
    skeletonRank: {
        width: 20,
        height: 20,
        backgroundColor: Colors.border,
        borderRadius: 4,
    },
    skeletonImage: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: Colors.border,
        marginRight: Spacing.md,
    },
    playerInfo: {
        flex: 1,
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    skeletonName: {
        height: 16,
        backgroundColor: Colors.border,
        borderRadius: 4,
        marginBottom: 4,
    },
    skeletonPosition: {
        height: 12,
        width: '60%',
        backgroundColor: Colors.border,
        borderRadius: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: Spacing.sm,
    },
    skeletonIcon: {
        width: 16,
        height: 16,
        backgroundColor: Colors.border,
        borderRadius: 8,
        marginRight: Spacing.xs,
    },
    skeletonStat: {
        width: 20,
        height: 16,
        backgroundColor: Colors.border,
        borderRadius: 4,
    },
    mvpContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.md,
        minWidth: 40,
    },
    skeletonMvpScore: {
        width: 30,
        height: 24,
        backgroundColor: Colors.border,
        borderRadius: 4,
        marginBottom: 4,
    },
    skeletonMvpLabel: {
        width: 25,
        height: 10,
        backgroundColor: Colors.border,
        borderRadius: 4,
    },
});

export default PlayerStatsCardSkeleton;


