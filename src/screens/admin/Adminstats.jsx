import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator, InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing } from '../../context/ThemeContext';
import { supabase } from '../../supabase';
import { selectUser, logoutUser } from '../../redux/slices/authSlice';
import { useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';

// ─── Constants ────────────────────────────────────────────────────────────────

const FUEL_LABELS = { benzine: 'بنزين', diesel: 'ديزل', hybrid: 'هجين', electric: 'كهربائي' };

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminStats({ navigation }) {
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles     = createStyles(colors);
  const dispatch   = useDispatch();
  const [stats,   setStats]   = useState({ total: 0, pending: 0, published: 0, rejected: 0, brands: {}, fuels: {}, avgPrice: 0 });
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch(logoutUser());
      await Promise.all([
        SecureStore.deleteItemAsync('userEmail'),
        SecureStore.deleteItemAsync('userRole'),
        SecureStore.deleteItemAsync('userName'),
        SecureStore.deleteItemAsync('userId'),
        SecureStore.deleteItemAsync('rememberMe'),
      ]);
      navigation.replace('Login');
    } catch (error) {
      console.error('❌ Sign-out error:', error);
    }
  };

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const { data } = await supabase
          .from('listings')
          .select('status,brand,fuel_type,price_dzd');
        if (!data) return;
        
        const s = { total: data.length, pending: 0, published: 0, rejected: 0, brands: {}, fuels: {}, avgPrice: 0 };
        let totalPrice = 0;
        
        data.forEach(r => {
          // Explicitly isolate statuses safely to avoid mutating master object structural keys
          if (r.status === 'pending') s.pending++;
          if (r.status === 'published') s.published++;
          if (r.status === 'rejected') s.rejected++;

          s.brands[r.brand]    = (s.brands[r.brand]    || 0) + 1;
          s.fuels[r.fuel_type] = (s.fuels[r.fuel_type] || 0) + 1;
          totalPrice += parseFloat(r.price_dzd || 0);
        });
        
        s.avgPrice = data.length ? Math.round(totalPrice / data.length) : 0;
        setStats(s);
      } catch (err) {
        console.error(err);
      } finally { 
        setLoading(false); 
      }
    });
    return () => task.cancel();
  }, []);

  const { topBrands, maxBrand } = useMemo(() => {
    const top = Object.entries(stats.brands).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { topBrands: top, maxBrand: top[0]?.[1] || 1 };
  }, [stats]); 

  const statCards = useMemo(() => [
    { label: 'إجمالي', value: stats.total,     color: '#60A5FA', icon: '📋' },
    { label: 'منشور',  value: stats.published,  color: '#10B981', icon: '✅' },
    { label: 'انتظار', value: stats.pending,    color: '#F59E0B', icon: '⏳' },
    { label: 'مرفوض',  value: stats.rejected,   color: '#EF4444', icon: '❌' },
  ], [stats.total, stats.published, stats.pending, stats.rejected]);

  const fuelIcon = (fuel) => ({
    electric: '⚡', hybrid: '🌿', diesel: '🛢️',
  }[fuel] || '⛽');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3971" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.back}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 الإحصائيات</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Stat cards grid */}
          <View style={styles.grid}>
            {statCards.map(c => (
              <View key={c.label} style={[styles.card, { borderTopColor: c.color, borderTopWidth: 3 }]}>
                <Text style={styles.cardIcon}>{c.icon}</Text>
                <Text style={[styles.cardValue, { color: c.color }]}>{c.value}</Text>
                <Text style={styles.cardLabel}>{c.label}</Text>
              </View>
            ))}
          </View>

          {/* Average price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>متوسط السعر</Text>
            <Text style={styles.bigNum}>{(stats.avgPrice / 1_000_000).toFixed(2)} مليون دج</Text>
          </View>

          {/* Top brands */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أكثر الماركات إعلاناً</Text>
            {topBrands.map(([brand, count]) => (
              <View key={brand} style={styles.barRow}>
                <Text style={styles.barLabel}>{brand}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${(count / maxBrand) * 100}%` }]} />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            ))}
          </View>

          {/* Fuel distribution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>توزيع أنواع الوقود</Text>
            <View style={styles.fuelGrid}>
              {Object.entries(stats.fuels || {}).map(([fuel, count]) => (
                <View key={fuel} style={styles.fuelCard}>
                  <Text style={styles.fuelIcon}>{fuelIcon(fuel)}</Text>
                  <Text style={styles.fuelCount}>{count}</Text>
                  <Text style={styles.fuelLabel}>{FUEL_LABELS[fuel] ?? fuel}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sign out */}
          <View style={styles.signOutCard}>
            <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
              <View style={[styles.signOutIcon, { backgroundColor: colors.error + '14' }]}>
                <Text style={{ fontSize: 18 }}>🚪</Text>
              </View>
              <View style={styles.signOutText}>
                <Text style={[styles.signOutLabel, { color: colors.error }]}>تسجيل الخروج</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors) => StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.background },
  loaderWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { backgroundColor: '#0B3971', paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back:         { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  headerTitle:  { fontFamily: Typography.fontFamily.black, fontSize: 18, color: '#fff' },
  scroll:       { padding: Spacing.base, paddingBottom: 80 },

  // Stat grid
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  card:         { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cardIcon:     { fontSize: 24, marginBottom: 6 },
  cardValue:    { fontFamily: Typography.fontFamily.black, fontSize: 28 },
  cardLabel:    { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Section card
  section:      { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontFamily: Typography.fontFamily.black, fontSize: 15, color: colors.text, textAlign: 'right', marginBottom: 14 },
  bigNum:       { fontFamily: Typography.fontFamily.black, fontSize: 28, color: colors.primary, textAlign: 'center' },

  // Brand bar chart
  barRow:       { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10, gap: 10 },
  barLabel:     { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: colors.text, width: 70, textAlign: 'right' },
  barBg:        { flex: 1, height: 10, backgroundColor: colors.background, borderRadius: 5, overflow: 'hidden' },
  barFill:      { height: '100%', backgroundColor: '#0B3971', borderRadius: 5 },
  barCount:     { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: colors.textSecondary, width: 28, textAlign: 'left' },

  // Fuel cards
  fuelGrid:     { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  fuelCard:     { backgroundColor: colors.background, borderRadius: 12, padding: 14, alignItems: 'center', minWidth: 80 },
  fuelIcon:     { fontSize: 22, marginBottom: 4 },
  fuelCount:    { fontFamily: Typography.fontFamily.black, fontSize: 20, color: colors.primary },
  fuelLabel:    { fontFamily: Typography.fontFamily.medium, fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Sign out
  signOutCard:  { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  signOutRow:   { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 14, gap: Spacing.base },
  signOutIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  signOutText:  { flex: 1, alignItems: 'flex-end' },
  signOutLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base },
});