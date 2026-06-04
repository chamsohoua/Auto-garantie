import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, TouchableOpacity,
  Dimensions, Share, Linking, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useTheme, Typography, Spacing, Radius } from '../../../context/ThemeContext';
import { supabase } from '../../../supabase';
import RAW_SVG_XML from '../../../../assets/carBlueprintXml';

const { width: SW } = Dimensions.get('window');

const toImageSource = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  if (raw.startsWith('http'))       return { uri: raw };
  if (raw.startsWith('data:image')) return { uri: raw };
  return { uri: `data:image/jpeg;base64,${raw}` };
};

const NATIVE_W    = 722;
const NATIVE_H    = 742;
const BLUEPRINT_W = SW - (Spacing?.base ?? 16) * 2;
const BLUEPRINT_H = Math.round(NATIVE_H * (BLUEPRINT_W / NATIVE_W));


const DB_TO_SVG_COLOR = Object.freeze({
  hood_damaged:                 '#e5e7eb',
  front_bumper_damaged:         '#d1d5db',
  windshield_damaged:           '#dfdfe6',
  windshield_cracked:           '#dfdfe6',
  rear_bumper_damaged:          '#f3f3f3',
  trunk_damaged:                '#fafafa',
  rear_windshield_damaged:      '#dedee6',
  rear_windshield_cracked:      '#dedee6',
  front_left_fender_damaged:    '#f3f4f6',
  front_right_fender_damaged:   '#e2e8f0',
  back_fender_left_damaged:     '#fcfcfc',
  back_fender_right_damaged:    '#fbfbfb',
  driver_door_damaged:          '#e2e2e2',
  front_passenger_door_damaged: '#e3e3e3',
  left_door_damaged:            '#eee',
  right_door_damaged:           '#ececec',
  roof_damaged:                 '#f1f5f9',
  headlight_left_damaged:       '#dbeafe',
  headlight_right_damaged:      '#bfdbfe',
  backlight_left_damaged:       '#febfbf',
  backlight_right_damaged:      '#febfbd',
});

const SVG_REPLACE_PATTERNS = Object.entries(DB_TO_SVG_COLOR).map(([col, baseColor]) => ({
  col,
  dq: new RegExp(`fill="${baseColor}"`, 'gi'),
  sq: new RegExp(`fill='${baseColor}'`, 'gi'),
}));

const COL_DAMAGE = '#E31E24';

function buildInspectionSvg(rawXml, inspection) {
  if (!inspection || !rawXml) return rawXml;
  let xml = rawXml;
  for (const { col, dq, sq } of SVG_REPLACE_PATTERNS) {
    if (inspection[col] === true) {
      xml = xml.replace(dq, `fill="${COL_DAMAGE}"`).replace(sq, `fill='${COL_DAMAGE}'`);
    }
  }
  return xml;
}

const DAMAGE_LABELS = Object.freeze({
  hood_damaged:                 'كابو',
  front_bumper_damaged:         'صدام أمامي',
  rear_bumper_damaged:          'صدام خلفي',
  front_left_fender_damaged:    'جنب أمامي أيسر',
  front_right_fender_damaged:   'جنب أمامي أيمن',
  back_fender_left_damaged:     'جنب خلفي أيسر',
  back_fender_right_damaged:    'جنب خلفي أيمن',
  trunk_damaged:                'صندوق الأمتعة',
  driver_door_damaged:          'باب السائق',
  front_passenger_door_damaged: 'باب أمامي أيمن',
  left_door_damaged:            'باب خلفي أيسر',
  right_door_damaged:           'باب خلفي أيمن',
  roof_damaged:                 'السقف',
  windshield_damaged:           'الزجاج الأمامي',
  windshield_cracked:           'الزجاج الأمامي (شقوق)',
  rear_windshield_damaged:      'الزجاج الخلفي',
  rear_windshield_cracked:      'الزجاج الخلفي (شقوق)',
  headlight_left_damaged:       'مصباح أيسر',
  headlight_right_damaged:      'مصباح أيمن',
  backlight_left_damaged:       'ضوء خلفي أيسر',
  backlight_right_damaged:      'ضوء خلفي أيمن',
});

const BlueprintDamageViewer = React.memo(function BlueprintDamageViewer({ inspection, colors }) {
  const bpStyles = createBpStyles(colors);
  const coloredSvg = useMemo(
    () => buildInspectionSvg(RAW_SVG_XML, inspection),
    [inspection]
  );

  const damagedParts = useMemo(() => {
    if (!inspection) return [];
    return Object.entries(DAMAGE_LABELS)
      .filter(([col]) => inspection[col] === true)
      .map(([, label]) => label);
  }, [inspection]);

  return (
    <View>
      <View style={bpStyles.svgCard}>
        <Image
          source={require('../../../../assets/car-blueprint1.png')}
          style={{ position: 'absolute', width: BLUEPRINT_W, height: BLUEPRINT_H }}
          resizeMode="stretch"
          pointerEvents="none"
          fadeDuration={0}
        />
        <SvgXml
          xml={coloredSvg}
          width={BLUEPRINT_W}
          height={BLUEPRINT_H}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <Text style={bpStyles.hint}>الأجزاء المحددة بالأحمر تحتاج إلى إصلاح</Text>

      {damagedParts.length > 0 && (
        <View style={bpStyles.chipsWrap}>
          <Text style={bpStyles.chipsTitle}>الأضرار المحددة ({damagedParts.length})</Text>
          <View style={bpStyles.chips}>
            {damagedParts.map((label) => (
              <View key={label} style={bpStyles.chip}>
                <View style={bpStyles.chipDot} />
                <Text style={bpStyles.chipTxt}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});


const ViewToggle = React.memo(function ViewToggle({ mode, onPress2d, onPress3d, colors }) {
  const togStyles = createTogStyles(colors);
  return (
    <View style={togStyles.wrap}>
      <View style={[togStyles.btn, mode === '2d' && togStyles.active]} onPress={onPress2d} activeOpacity={0.75}>
        <Text style={[togStyles.txt, mode === '2d' && togStyles.activeTxt]}>🗺 مخطط ثنائي</Text>
      </View>
    </View>
  );
});

const StatBox = React.memo(function StatBox({ label, val, icon, colors }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.statBox}>
      <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>
      <Text style={styles.statVal}>{val}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

export default function DetailsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const { item } = route.params;

  const [inspection,        setInspection]        = useState(null);
  const [loadingInspection, setLoadingInspection] = useState(true);
  const [activeImage,       setActiveImage]       = useState(0);
  const [viewMode,          setViewMode]          = useState('2d');

  const fetchInspection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('listing_id', String(item.id).trim());
      if (error) { console.error('Supabase Error:', error.message); return; }
      setInspection(data && data.length > 0 ? data[0] : null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInspection(false);
    }
  }, [item.id]);

  useEffect(() => { fetchInspection(); }, [fetchInspection]);


  const handleScroll    = useCallback((e) =>
    setActiveImage(Math.round(e.nativeEvent.contentOffset.x / SW)), []);
  const handleShare     = useCallback(() =>
    Share.share({ message: `شاهد هذه الـ ${item.brand} على Auto Garantie!` }), [item.brand]);
  const handleBack      = useCallback(() => navigation.goBack(), [navigation]);
  const handleCall      = useCallback(() =>
    Linking.openURL(`tel:${item.user_phone || ''}`), [item.user_phone]);
  const handleMode2d    = useCallback(() => setViewMode('2d'), []);
  const handleMode3d    = useCallback(() => setViewMode('3d'), []);

  const imageSources = useMemo(() =>
    (item.car_images || []).map(toImageSource).filter(Boolean),
  [item.car_images]);

  const mileageLabel = useMemo(() =>
    `${Math.round((item.mileage || 0) / 1000)}k`,
  [item.mileage]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent />

      <View style={[styles.headerActions, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.circBtn} onPress={handleShare}>
          <Text style={{ fontSize: 19, color: '#fff' }}>➦</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.circBtn} onPress={handleBack}>
          <Text style={{ fontSize: 26, color: '#fff' }}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews
      >
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={32}
          >
            {imageSources.length > 0 ? imageSources.map((src, idx) => (
              <Image
                key={idx}
                source={src}
                style={styles.heroImg}
                resizeMode="cover"
                fadeDuration={0}
              />
            )) : (
              <View style={[styles.heroImg, styles.noImgPlaceholder]}>
                <Text style={{ fontSize: 60 }}>🚗</Text>
              </View>
            )}
          </ScrollView>
          {imageSources.length > 1 && (
            <View style={styles.pagination}>
              {imageSources.map((_, i) => (
                <View key={i} style={[styles.dot, activeImage === i && styles.activeDot]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>{item.brand} {item.model}</Text>
              <Text style={styles.locationTxt}>📍 {item.wilaya || 'الجزائر'}</Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceVal}>{item.price_dzd?.toLocaleString()}</Text>
              <Text style={styles.priceCur}>مليون</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatBox label="السنة"   val={item.year}          icon="📅" colors={colors} />
            <StatBox label="المسافة" val={mileageLabel}        icon="🛣️" colors={colors} />
            <StatBox label="المحرك"  val={item.engine || '—'} icon="⚙️" colors={colors} />
            <StatBox label="الوقود"  val={item.fuel_type || 'benzine'} icon="⛽" colors={colors} />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHdr}>
              <Text style={styles.sectionTitle}>تقرير حالة السيارة (Auto Garantie)</Text>
              {inspection?.condition_score && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreTxt}>{inspection.condition_score}/10</Text>
                </View>
              )}
            </View>

            {loadingInspection ? (
              <ActivityIndicator color={colors.actionBlue} style={{ margin: 20 }} />
            ) : inspection ? (
              <>
                <ViewToggle mode={viewMode} onPress2d={handleMode2d} onPress3d={handleMode3d} colors={colors} />


                {viewMode === '2d' && <BlueprintDamageViewer inspection={inspection} colors={colors} />}

                {inspection.damage_details && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesTitle}>ملاحظات الفاحص:</Text>
                    <Text style={styles.notesText}>{inspection.damage_details}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.noData}>لا يوجد تقرير فحص لهذا الإعلان حتى الآن.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>تفاصيل إضافية</Text>
            <Text style={styles.descTxt}>
              {item.description || 'لا يوجد وصف متاح لهذه المركبة.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
          <Text style={styles.actionBtnTxt}>اتصال هاتفي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.chatBtn]}>
          <Text style={[styles.actionBtnTxt, { color: colors.primaryDeepBlue }]}>دردشة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createBpStyles = (colors) => StyleSheet.create({
  svgCard:    { width: BLUEPRINT_W, height: BLUEPRINT_H, borderRadius: 12, overflow: 'hidden', backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border, marginBottom: 8, alignSelf: 'center' },
  hint:       { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginBottom: 12 },
  chipsWrap:  { backgroundColor: colors.background, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.divider },
  chipsTitle: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: colors.textSecondary, textAlign: 'right', marginBottom: 8 },
  chips:      { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  chip:       { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: '#E31E2488', backgroundColor: '#E31E2415', gap: 5 },
  chipDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: COL_DAMAGE },
  chipTxt:    { fontSize: 11, fontFamily: Typography.fontFamily.bold, color: COL_DAMAGE },
});

const createTogStyles = (colors) => StyleSheet.create({
  wrap:      { flexDirection: 'row-reverse', backgroundColor: colors.background, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.divider, marginBottom: 14, overflow: 'hidden' },
  btn:       { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  active:    { backgroundColor: colors.primary },
  txt:       { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: colors.textMuted },
  activeTxt: { color: '#fff' },
});

const createStyles = (colors) => StyleSheet.create({
  root:             { flex: 1, backgroundColor: colors.background, paddingBottom: 88 },
  headerActions:    { position: 'absolute', zIndex: 10, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  circBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  imageContainer:   { width: SW, height: 333, backgroundColor: '#000' },
  heroImg:          { width: SW, height: 320, resizeMode: 'cover' },
  noImgPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.divider },
  pagination:       { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot:        { width: 20, backgroundColor: colors.gold },
  content:          { padding: Spacing.base, gap: Spacing.base, marginTop: -20, backgroundColor: colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  mainInfo:         { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  brandTitle:       { fontFamily: Typography.fontFamily.black, fontSize: 24, color: colors.textPrimary, textAlign: 'right' },
  locationTxt:      { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  priceTag:         { alignItems: 'center', flexDirection: 'row', gap: 4 },
  priceVal:         { fontFamily: Typography.fontFamily.black, fontSize: 28, color: colors.primary },
  priceCur:         { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: colors.gold },
  statsRow:         { flexDirection: 'row-reverse', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 15, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: colors.border },
  statBox:          { alignItems: 'center', flex: 1 },
  statVal:          { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: colors.textPrimary },
  statLabel:        { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: colors.textMuted },
  sectionCard:      { backgroundColor: colors.surface, padding: Spacing.base, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: colors.border },
  sectionHdr:       { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle:     { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: colors.textPrimary, textAlign: 'right' },
  scoreBadge:       { backgroundColor: colors.gold + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: colors.gold },
  scoreTxt:         { color: colors.gold, fontSize: 14, fontFamily: Typography.fontFamily.black },
  notesContainer:   { marginTop: 16, backgroundColor: colors.background, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.divider },
  notesTitle:       { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginBottom: 6 },
  notesText:        { fontFamily: Typography.fontFamily.regular, fontSize: 13, color: colors.textPrimary, textAlign: 'right', lineHeight: 20 },
  descTxt:          { fontFamily: Typography.fontFamily.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'right' },
  noData:           { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: 20 },
  actionBar:        { position: 'absolute', bottom: 55, left: 0, right: 0, backgroundColor: colors.surface, padding: Spacing.base, flexDirection: 'row', gap: Spacing.sm, borderTopWidth: 1, borderColor: colors.divider },
  actionBtn:        { flex: 1, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  callBtn:          { backgroundColor: colors.primary },
  chatBtn:          { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary },
  actionBtnTxt:     { fontFamily: Typography.fontFamily.bold, color: '#fff', fontSize: 16 },
});