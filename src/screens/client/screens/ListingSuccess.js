import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, BackHandler,
} from 'react-native';
import { useTheme, Typography, Spacing, Radius } from '../../../context/ThemeContext';


export default function ListingSuccess({ navigation, route }) {
  const { colors } = useTheme();
  const styles     = createStyles(colors);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>تم نشر إعلانك بنجاح!</Text>
          <Text style={styles.subtitle}>
            سيارة {route.params?.carModel || 'السيارة'} الآن قيد المراجعة وستظهر للمشترين قريباً.
          </Text>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>رقم الإعلان</Text>
              <Text style={styles.statValue}>#DZ-{Math.floor(Math.random() * 90000) + 10000}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>الحالة</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>قيد الانتظار</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryBtnText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: Spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  checkIcon: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.base,
  },
  statsCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginTop: Spacing.xl,
    flexDirection: 'row-reverse',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: colors.textPrimary,
  },
  divider: {
    width: 0.5,
    backgroundColor: colors.border,
    marginHorizontal: Spacing.sm,
  },
  footer: {
    gap: Spacing.base,
    marginBottom: Spacing.lg,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: colors.textSecondary,
  },
});