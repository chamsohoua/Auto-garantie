import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ScrollView, Animated, RefreshControl,
  TextInput, StatusBar, Alert, ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing } from '../../context/ThemeContext';
import { supabase } from '../../supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUS_META = {
  pending:   { label: 'قيد المراجعة', color: '#F59E0B', bg: '#FEF3C7' },
  published: { label: 'منشور',        color: '#10B981', bg: '#D1FAE5' },
  rejected:  { label: 'مرفوض',        color: '#EF4444', bg: '#FEE2E2' },
};

const TAB_FILTERS = [
  { id: 'all',       label: 'الكل'         },
  { id: 'pending',   label: 'قيد المراجعة' },
  { id: 'published', label: 'منشور'         },
  { id: 'rejected',  label: 'مرفوض'        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const toImageSource = (raw) => {
  if (!raw) return null;
  if (raw.startsWith('http'))       return { uri: raw };
  if (raw.startsWith('data:image')) return { uri: raw };
  return { uri: `data:image/jpeg;base64,${raw}` };
};

export const formatPrice = (p) => {
  if (!p) return '—';
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)}م`;
  if (p >= 1_000)     return `${Math.round(p / 1_000)}k`;
  return String(p);
};


const AdminHeader = React.memo(function AdminHeader({ insets, counts }) {
  const styles = createHeaderStyles();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.inner}>
        <Text style={styles.title}>لوحة الإدارة</Text>
        <Text style={styles.sub}>Auto Garantie DZ</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{counts.pending}</Text>
          <Text style={styles.statLabel}>انتظار</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#10B981' }]}>{counts.published}</Text>
          <Text style={styles.statLabel}>منشور</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{counts.rejected}</Text>
          <Text style={styles.statLabel}>مرفوض</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#60A5FA' }]}>{counts.all}</Text>
          <Text style={styles.statLabel}>الكل</Text>
        </View>
      </View>
    </View>
  );
});

// ─── ListingAdminCard ─────────────────────────────────────────────────────────

const ListingAdminCard = React.memo(function ListingAdminCard({ item, onPress }) {
  const { colors } = useTheme();
  const styles     = createCardStyles(colors);
  const scale      = useRef(new Animated.Value(1)).current;
  const meta       = STATUS_META[item.status] || STATUS_META.pending;
  const img        = useMemo(() => toImageSource(item.car_images?.[0]), [item.car_images]);

  const press = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 80, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 60, bounciness: 5 }),
    ]).start();
    onPress?.(item);
  }, [item, onPress, scale]);

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }]}>
      <TouchableOpacity onPress={press} activeOpacity={1} style={styles.inner}>
        <View style={styles.imgBox}>
          {img
            ? <Image source={img} style={styles.img} resizeMode="cover" fadeDuration={0} />
            : <View style={styles.noImg}><Text style={{ fontSize: 32 }}>🚗</Text></View>
          }
          <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.color + '60' }]}>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.carName}>{item.brand} {item.model}</Text>
            <Text style={styles.price}>{formatPrice(item.price_dzd)} مليون</Text>
          </View>
          <Text style={styles.sub}>{item.year} · {item.mileage?.toLocaleString()} km · {item.wilaya || '—'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}><Text style={styles.metaText}>⛽ {item.fuel_type}</Text></View>
            {item.engine && <View style={styles.metaChip}><Text style={styles.metaText}>🔧 {item.engine}</Text></View>}
            <View style={[styles.metaChip, { marginLeft: 'auto' }]}>
              <Text style={styles.metaText}>{new Date(item.created_at).toLocaleDateString('ar-DZ')}</Text>
            </View>
          </View>
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>اضغط للمراجعة والتعديل ←</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) =>
  prev.item.id     === next.item.id &&
  prev.item.status === next.item.status &&
  prev.onPress     === next.onPress
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminDashboard({ navigation }) {
  const insets         = useSafeAreaInsets();
  const { colors }     = useTheme();
  const styles         = createStyles(colors);

  const [listings,   setListings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState('pending');
  const [query,      setQuery]      = useState('');
  const [counts,     setCounts]     = useState({ pending: 0, published: 0, rejected: 0, all: 0 });

const fetchListings = useCallback(async (status = 'all', q = '') => {
    try {
      let qb = supabase
        .from('listings')
        .select('id,brand,model,version,engine,year,mileage,fuel_type,price_dzd,wilaya,car_images,status,created_at,accepted_by_admin,reviewed_at,user_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (status !== 'all') qb = qb.eq('status', status);
      if (q.trim()) qb = qb.or(`brand.ilike.%${q}%,model.ilike.%${q}%,wilaya.ilike.%${q}%`);

      const { data, error } = await qb; // ✨ Added error handling payload
      if (error) throw error;

      setListings(data || []);
    } catch (err) { 
      console.error(err);
      setListings([]); 
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('listings').select('status'); // ✨ Added error handling payload
      if (error) throw error;
      if (!data) return;

      const c = { pending: 0, published: 0, rejected: 0, all: data.length };
      data.forEach(r => { if (c[r.status] !== undefined) c[r.status]++; });
      setCounts(c);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const task = InteractionManager.runAfterInteractions(() => {
      Promise.all([fetchListings(tab, query), fetchCounts()])
        .finally(() => setLoading(false));
    });
    return () => task.cancel();
  }, [tab, query, fetchListings, fetchCounts]); 



  const debRef = useRef(null);
  const handleSearch = useCallback((v) => {
    setQuery(v);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => fetchListings(tab, v), 380);
  }, [tab, fetchListings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchListings(tab, query), fetchCounts()]);
    setRefreshing(false);
  }, [tab, query, fetchListings, fetchCounts]);

  const handleCardPress = useCallback((item) => {
    navigation.navigate('AdminListingDetail', { listingId: item.id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <ListingAdminCard item={item} onPress={handleCardPress} />
  ), [handleCardPress]);

  const keyExtractor = useCallback((i) => i.id, []);

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing} onRefresh={onRefresh}
      tintColor={colors.primary} colors={[colors.primary]}
    />
  ), [refreshing, onRefresh, colors.primary]);

const renderHeader = useCallback(() => (
    <View>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="ابحث بالماركة، المدينة..."
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          textAlign="right"
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {TAB_FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setTab(f.id)}
            style={[styles.tabBtn, tab === f.id && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, tab === f.id && styles.tabLabelActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.countText}>{listings.length} إعلان</Text>
    </View>
  ), [query, handleSearch, tab, listings.length, styles, colors.textSecondary]);

  const renderEmpty = useCallback(() => (
    !loading ? (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>لا توجد إعلانات</Text>
      </View>
    ) : null
  ), [loading, styles]);

  const ListEmpty = useMemo(() => (
    !loading ? (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>لا توجد إعلانات</Text>
      </View>
    ) : null
  ), [loading, styles]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3971" />
      <AdminHeader insets={insets} counts={counts} />
      <FlatList
        data={listings}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.content}
ListHeaderComponent={renderHeader}
  ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={5}
        windowSize={5}
        updateCellsBatchingPeriod={100}
      />
    </View>
  );
}

const createHeaderStyles = () => StyleSheet.create({
  wrap:      { backgroundColor: '#0B3971', paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden', position: 'relative' },
  blob1:     { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -80, left: -50 },
  blob2:     { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(26,91,170,0.5)', bottom: -50, right: -20 },
  inner:     { alignItems: 'center', marginBottom: 14 },
  title:     { fontFamily: Typography.fontFamily.black, fontSize: 22, color: '#fff', textAlign: 'center' },
  sub:       { fontFamily: Typography.fontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 2 },
  statsRow:  { flexDirection: 'row', gap: 8 },
  statCard:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statNum:   { fontFamily: Typography.fontFamily.black, fontSize: 20 },
  statLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
});

const createCardStyles = (colors) => StyleSheet.create({
  outer:          { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  inner:          { flexDirection: 'column' },
  imgBox:         { height: 160, position: 'relative', backgroundColor: colors.background },
  img:            { width: '100%', height: '100%' },
  noImg:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBadge:    { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot:      { width: 7, height: 7, borderRadius: 4 },
  statusLabel:    { fontFamily: Typography.fontFamily.bold, fontSize: 11 },
  content:        { padding: 14 },
  row:            { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  carName:        { fontFamily: Typography.fontFamily.black, fontSize: 16, color: colors.text, textAlign: 'right' },
  price:          { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: colors.primary },
  sub:            { fontFamily: Typography.fontFamily.regular, fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginTop: 3 },
  metaRow:        { flexDirection: 'row-reverse', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  metaChip:       { backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  metaText:       { fontFamily: Typography.fontFamily.medium, fontSize: 11, color: colors.text },
  actionHint:     { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end' },
  actionHintText: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: colors.primary },
});

const createStyles = (colors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.background },
  content:        { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  searchWrap:     { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, height: 48, paddingHorizontal: 14, marginBottom: 12, marginTop: 14, borderWidth: 1.5, borderColor: colors.border, gap: 8 },
  searchInput:    { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: 14, color: colors.text },
  searchIcon:     { fontSize: 18 },
  tabRow:         { flexDirection: 'row', gap: 8, paddingVertical: 8, paddingHorizontal: 4 },
  tabBtn:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  tabBtnActive:   { backgroundColor: '#0B3971', borderColor: '#0B3971' },
  tabLabel:       { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: colors.textSecondary },
  tabLabelActive: { color: '#fff' },
  countText:      { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: colors.textSecondary, textAlign: 'right', marginBottom: 8, paddingHorizontal: 4 },
  empty:          { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: colors.textSecondary },
});