import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../../../supabase';
import { useNavigation } from '@react-navigation/core';
import { useTheme } from '../../../context/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../../redux/slices/authSlice';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');

const FUEL_META = {
  بنزين:  { label: 'بنزين',   color: '#FF7043' },
  ديزل:   { label: 'ديزل',    color: '#5C6BC0' },
  هجين:   { label: 'هجين',    color: '#26A69A' },
  GPL:    { label: 'GPL',     color: '#66BB6A' },
};

const fmt = (p) => {
  if (!p) return '—';
  return p >= 1_000_000 ? `${(p / 1_000_000).toFixed(1)}م` : `${Math.round(p / 1000)}k`;
};

const toSrc = (raw) => {
  if (!raw) return null;
  return { uri: raw.startsWith('http') ? raw : `data:image/jpeg;base64,${raw}` };
};

function MiniCard({ item, onPress, onDelete }) {
  const fuel = FUEL_META[item.fuel_type] || { label: item.fuel_type || '—', color: '#888' };
  const img  = toSrc(item.car_images?.[0]);

  return (
    <TouchableOpacity style={mc.card} onPress={() => onPress(item)} activeOpacity={0.85}>
      <View style={mc.imgBox}>
        {img ? (
          <Image source={img} style={mc.img} resizeMode="cover" />
        ) : (
          <View style={mc.noImg}>
            <View style={mc.carRoof} />
            <View style={mc.carBody} />
          </View>
        )}
        <View style={[mc.statusBadge, {
          backgroundColor:
            item.status === 'published' ? '#10B981'
            : item.status === 'rejected' ? '#EF4444'
            : '#F59E0B',
        }]}>
          <Text style={mc.statusText}>
            {item.status === 'published' ? 'منشور'
              : item.status === 'rejected' ? 'مرفوض'
              : 'قيد المراجعة'}
          </Text>
        </View>
      </View>

      <View style={mc.info}>
        <Text style={mc.name} numberOfLines={1}>{item.brand} {item.model}</Text>
        <Text style={mc.year}>{item.year} · {item.engine || item.version || '—'}</Text>
        <View style={mc.bottom}>
          <Text style={mc.price}>{fmt(item.price_dzd)} دج</Text>
          <View style={[mc.fuelTag, { borderColor: fuel.color + '50', backgroundColor: fuel.color + '14' }]}>
            <Text style={[mc.fuelText, { color: fuel.color }]}>{fuel.label}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={mc.deleteBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <View style={mc.deleteX1} />
        <View style={mc.deleteX2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const Profile = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const user = useSelector(selectUser);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [orders,        setOrders]        = useState([]);
  const [listings,      setListings]      = useState([]);
  const [listingStats,  setListingStats]  = useState({ total: 0, published: 0, pending: 0 });
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeTab,     setActiveTab]     = useState('all');

  const fetchListings = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('listings')
      .select('id,brand,model,version,engine,year,fuel_type,price_dzd,car_images,status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) { console.warn('listings fetch error:', error.message); return; }

    const rows = data || [];
    setListings(rows);
    setListingStats({
      total:     rows.length,
      published: rows.filter(l => l.status === 'published').length,
      pending:   rows.filter(l => l.status === 'pending').length,
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, parts(name, image_url))`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert(t('common_error'), t('orders_error'));
    }
  }, [t]);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    await fetchListings(user?.id);
    setLoading(false);
  };
  load();
}, [user?.id, fetchListings]);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchListings(user?.id);
  setRefreshing(false);
};

  const handleDeleteListing = (id) => {
    Alert.alert('حذف الإعلان', 'هل أنت متأكد أنك تريد حذف هذا الإعلان؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          await supabase.from('listings').delete().eq('id', id);
          setListings(v => v.filter(l => l.id !== id));
          setListingStats(s => ({ ...s, total: s.total - 1 }));
        },
      },
    ]);
  };

  const getDisplayName = () => {
    if (user?.name)                  return user.name;
    if (user?.full_name)             return user.full_name;
    if (user?.displayName)           return user.displayName;
    if (user?.user_metadata?.name)   return user.user_metadata.name;
    if (user?.email)                 return user.email.split('@')[0];
    return t('guest_user');
  };

  const getPhone = () => {
    if (user?.phone)       return user.phone;
    if (user?.phoneNumber) return user.phoneNumber;
    return t('no_email');
  };

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

  const getStatusColor = (status) => ({
    pending:   '#F59E0B', confirmed: '#3B82F6',
    shipped:   '#8B5CF6', delivered: '#10B981', cancelled: '#EF4444',
  }[status] || '#6B7280');

  const getStatusIcon = (status) => ({
    pending:   'time-outline',       confirmed: 'checkmark-circle-outline',
    shipped:   'car-outline',        delivered: 'checkmark-done-circle',
    cancelled: 'close-circle-outline',
  }[status] || 'help-circle-outline');

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all')       return true;
    if (activeTab === 'pending')   return ['pending', 'confirmed', 'shipped'].includes(order.status);
    if (activeTab === 'delivered') return order.status === 'delivered';
    return true;
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileSection}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color={colors.textSecondary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{getDisplayName()}</Text>
          <Text style={styles.userEmail}>{getPhone()}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={50} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

const renderStats = () => (
  <View style={styles.statsContainer}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{listingStats.total}</Text>
      <Text style={styles.statLabel}>إجمالي الإعلانات</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: '#10B981' }]}>{listingStats.published}</Text>
      <Text style={styles.statLabel}>منشور</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: '#F59E0B' }]}>{listingStats.pending}</Text>
      <Text style={styles.statLabel}>قيد المراجعة</Text>
    </View>
  </View>
);

  const renderListingsSection = () => (
    <View style={styles.listingsSection}>
      {listings.length === 0 ? (
        <View style={styles.emptyListings}>
          <Ionicons name="car-outline" size={52} color={colors.textSecondary} />
          <Text style={styles.emptyListingsTitle}>لا توجد إعلانات</Text>
          <Text style={styles.emptyListingsSub}>أضف سيارتك الأولى الآن</Text>
        </View>
      ) : (
        <View style={styles.listingsCol}>
          {listings.map(item => (
            <MiniCard
              key={item.id}
              item={item}
              onPress={(it) => navigation.navigate('AddCar', { listing: it })}
              onDelete={handleDeleteListing}
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {[
        { key: 'all',       label: t('profile_all_orders')  },
        { key: 'pending',   label: t('profile_in_progress') },
        { key: 'delivered', label: t('profile_completed')   },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );


  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {[
        { icon: 'heart-outline',        label: t('profile_favorites'), screen: 'Favorites'  },
        { icon: 'location-outline',     label: t('profile_addresses'), screen: 'Addresses'  },
        { icon: 'help-circle-outline',  label: t('profile_support'),   screen: 'Support'    },
        { icon: 'settings-outline',     label: t('settings'),          screen: 'Settings'   },
      ].map(({ icon, label, screen }) => (
        <TouchableOpacity key={screen} style={styles.actionButton} onPress={() => navigation.navigate(screen)}>
          <Ionicons name={icon} size={24} color={colors.primary} />
          <Text style={styles.actionText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderHeader()}
        {renderStats()}
        {renderQuickActions()}

        <View style={styles.ordersSection}>
          <Text style={styles.sectionTitle}>إعلاناتي</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            renderListingsSection()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const mc = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, flexDirection: 'row-reverse', overflow: 'hidden', marginBottom: 0, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, position: 'relative' },
  imgBox:     { width: 110, height: 90, position: 'relative', overflow: 'hidden', backgroundColor: '#EEF4FA', flexShrink: 0 },
  img:        { width: '100%', height: '100%' },
  noImg:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF4FA', gap: 0 },
  carRoof:    { width: 32, height: 13, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#C0D0E0' },
  carBody:    { width: 50, height: 16, borderRadius: 3, backgroundColor: '#C8D9EC' },
  statusBadge:{ position: 'absolute', top: 6, right: 6, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontWeight: '700', fontSize: 8, color: '#fff' },
  info:       { flex: 1, padding: 10, justifyContent: 'center', gap: 3, paddingRight: 28 },
  name:       { fontWeight: '700', fontSize: 13, color: '#0D1B2E', textAlign: 'right' },
  year:       { fontSize: 11, color: '#6B7280', textAlign: 'right' },
  bottom:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 2 },
  price:      { fontWeight: '900', fontSize: 13, color: '#1E4E8C' },
  fuelTag:    { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  fuelText:   { fontWeight: '600', fontSize: 8 },
  deleteBtn:  { position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' },
  deleteX1:   { position: 'absolute', width: 12, height: 1.5, backgroundColor: '#EF4444', borderRadius: 1, transform: [{ rotate: '45deg' }] },
  deleteX2:   { position: 'absolute', width: 12, height: 1.5, backgroundColor: '#EF4444', borderRadius: 1, transform: [{ rotate: '-45deg' }] },
});

const createStyles = (colors) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  header:             { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingBottom:41 },
  profileSection:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder:  { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  profileInfo:        { flex: 1 },
  userName:           { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  userEmail:          { fontSize: 14, color: '#fff', opacity: 0.9 },
  signOutButton:      { padding: 4 },
  editButton:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' },
  editButtonText:     { marginLeft: 8, color: colors.primary, fontWeight: '600', fontSize: 14 },

  statsContainer:     { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 16, marginTop: -30, borderRadius: 12, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  statItem:           { flex: 1, alignItems: 'center' },
  statValue:          { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  statLabel:          { fontSize: 12, color: colors.textSecondary },
  statDivider:        { width: 1, backgroundColor: colors.border, marginHorizontal: 16 },

  quickActions:       { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 20 },
  actionButton:       { alignItems: 'center', flex: 1 },
  actionText:         { marginTop: 8, fontSize: 12, color: colors.text, fontWeight: '500' },

  ordersSection:      { paddingHorizontal: 16, paddingTop: 10, marginBottom: 8 },
  sectionTitle:       { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 12 },

  // listings
  listingsSection:    { gap: 12 },
  listingStatsRow:    { flexDirection: 'row-reverse', gap: 8, marginBottom: 8 },
  listingStatChip:    { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  listingStatNum:     { fontSize: 18, fontWeight: '800', color: colors.primary },
  listingStatLbl:     { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  listingsCol:        { gap: 10 },
  emptyListings:      { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyListingsTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyListingsSub:   { fontSize: 13, color: colors.textSecondary },

  // orders
  tabsContainer:      { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 10, padding: 4, marginBottom: 16 },
  tab:                { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab:          { backgroundColor: colors.primary },
  tabText:            { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  activeTabText:      { color: '#fff', fontWeight: '600' },
  loader:             { marginTop: 40 },
  emptyContainer:     { alignItems: 'center', paddingVertical: 60 },
  emptyText:          { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtext:       { fontSize: 14, color: colors.textSecondary, marginTop: 8 },

  orderCard:          { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  orderHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  orderId:            { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  orderDate:          { fontSize: 12, color: colors.textSecondary },
  statusBadge:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText:         { marginLeft: 4, fontSize: 12, fontWeight: '600' },
  orderItems:         { marginBottom: 12 },
  orderItemRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  orderItemImage:     { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  orderItemInfo:      { flex: 1 },
  orderItemName:      { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 2 },
  orderItemQuantity:  { fontSize: 12, color: colors.textSecondary },
  orderItemPrice:     { fontSize: 14, fontWeight: '600', color: colors.primary },
  moreItems:          { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
  orderFooter:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  deliveryLabel:      { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  deliveryAddress:    { fontSize: 13, color: colors.text, fontWeight: '500' },
  totalContainer:     { alignItems: 'flex-end' },
  totalLabel:         { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  totalAmount:        { fontSize: 18, fontWeight: 'bold', color: colors.primary },
});

export default Profile;