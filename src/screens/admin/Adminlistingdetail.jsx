import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, StatusBar, Alert, ActivityIndicator,
  Vibration, Platform, Pressable, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useTheme, Typography, Spacing } from '../../context/ThemeContext';
import { supabase } from '../../supabase';
import RAW_SVG_XML from '../../../assets/carBlueprintXml';


const { width: SW } = Dimensions.get('window');
const NATIVE_W = 722;
const NATIVE_H = 742;
const SCREEN_W = SW - Spacing.base * 2;
const RENDER_H = Math.round(NATIVE_H * (SCREEN_W / NATIVE_W));
const SCALE    = SCREEN_W / NATIVE_W;

export const STATUS_META = {
  pending:   { label: 'قيد المراجعة', color: '#F59E0B', bg: '#FEF3C7' },
  published: { label: 'منشور',        color: '#10B981', bg: '#D1FAE5' },
  rejected:  { label: 'مرفوض',        color: '#EF4444', bg: '#FEE2E2' },
};

const FUEL_OPTIONS = ['benzine', 'diesel', 'hybrid', 'electric'];
const FUEL_LABELS  = { benzine: 'بنزين', diesel: 'ديزل', hybrid: 'هجين', electric: 'كهربائي' };

export const PART_TO_DB_COL = Object.freeze({
  hood:                 'hood_damaged',
  front_bumper:         'front_bumper_damaged',
  rear_bumper:          'rear_bumper_damaged',
  front_fender_left:    'front_left_fender_damaged',
  front_fender_right:   'front_right_fender_damaged',
  back_fender_left:     'back_fender_left_damaged',
  back_fender_right:    'back_fender_right_damaged',
  driver_door:          'driver_door_damaged',
  front_passenger_door: 'front_passenger_door_damaged',
  back_passenger_left:  'rear_left_door_damaged',
  back_passenger_right: 'rear_right_door_damaged',
  roof:                 'roof_damaged',
  boot:                 'trunk_damaged',
  windshield:           'windshield_damaged',
  rear_windshield:      'rear_windshield_damaged',
  headlight_left:       'headlight_left_damaged',
  headlight_right:      'headlight_right_damaged',
  backlight_left:       'backlight_left_damaged',
  backlight_right:      'backlight_right_damaged',
});

const BOOL_DAMAGE_PARTS = Object.keys(PART_TO_DB_COL);

const PART_LABELS = Object.freeze({
  hood:                 'كابو',
  front_bumper:         'صدام أمامي',
  rear_bumper:          'صدام خلفي',
  front_fender_left:    'جنب أمامي أيسر',
  front_fender_right:   'جنب أمامي أيمن',
  back_fender_left:     'جنب خلفي أيسر',
  back_fender_right:    'جنب خلفي أيمن',
  boot:                 'صندوق الأمتعة',
  driver_door:          'باب السائق',
  front_passenger_door: 'باب أمامي أيمن',
  back_passenger_left:  'باب خلفي أيسر',
  back_passenger_right: 'باب خلفي أيمن',
  roof:                 'السقف',
  windshield:           'الزجاج الأمامي',
  rear_windshield:      'الزجاج الخلفي',
  headlight_left:       'مصباح أيسر',
  headlight_right:      'مصباح أيمن',
  backlight_left:       'ضوء خلفي أيسر',
  backlight_right:      'ضوء خلفي أيمن',
});

const BOOL_ON_COLOR = '#F59E0B';

const ZONE_ID_TO_PART = {
  'hood_zone':                 'hood',
  'front_bumper_zone':         'front_bumper',
  'windshield_zone':           'windshield',
  'rear_bumper_zone':          'rear_bumper',
  'boot_zone':                 'boot',
  'rear_windshield_zone':      'rear_windshield',
  'front_fender_left_zone':    'front_fender_right',
  'front_fender_right_zone':   'front_fender_left',
  'back_fender_left_zone':     'back_fender_right',
  'back_fender_right_zone':    'back_fender_left',
  'driver_door_zone':          'front_passenger_door',
  'front_passenger_door_zone': 'driver_door',
  'back_passenger_left_zone':  'back_passenger_right',
  'back_passenger_right_zone': 'back_passenger_left',
  'roof_zone':                 'roof',
  'headlight_left_zone':       'headlight_right',
  'headlight_right_zone':      'headlight_left',
  'backlight_left_zone':       'backlight_right',
  'backlight_right_zone':      'backlight_left',
};

const TOUCH_ZONES_RAW = [
  { id: 'windshield_1',          partId: 'windshield',         x: 435, y:  31, w: 235, h:  59 , borderTopLeftRadius: 99, borderTopRightRadius: 99 },
  { id: 'hood_front_1',          partId: 'hood',               x: 417, y:  91, w: 265, h:  49, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  { id: 'front_bumper_1',        partId: 'front_bumper',       x: 397, y: 162, w: 302, h:  62 },
  { id: 'front_bumper_2',        partId: 'front_bumper',       x: 620, y: 419, w:  85, h:  62 },
  { id: 'front_bumper_3',        partId: 'front_bumper',       x:  25, y: 645, w:  85, h:  62 },
  { id: 'headlight_left_1',      partId: 'headlight_right',    x: 625, y: 132, w:  65, h:  42, borderTopLeftRadius: 9, borderTopRightRadius: 4, borderBottomLeftRadius: 999, borderBottomRightRadius: 355, rotation: 12 },
  { id: 'headlight_right_1',     partId: 'headlight_left',     x: 410, y: 132, w:  65, h:  42, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 355, borderBottomRightRadius: 999, rotation: -12 },
  { id: 'front_fender_left_1',   partId: 'front_fender_right', x: 500, y: 385, w: 111, h: 110, borderBottomRightRadius: 9999, },
  { id: 'front_fender_right_1',  partId: 'front_fender_left',  x: 121, y: 605, w: 111, h: 110, borderBottomLeftRadius: 9999, },
  { id: 'rear_windshield_1',     partId: 'rear_windshield',    x:  91, y:  35, w: 195, h:  41 , borderTopLeftRadius: 21, borderTopRightRadius: 21 },
  { id: 'boot_1',                partId: 'boot',               x:  75, y:  80, w: 225, h:  25, borderBottomLeftRadius: 9999, borderBottomRightRadius: 9999, },
  { id: 'boot_2',                partId: 'boot',               x:  91, y: 119, w: 195, h:  32, borderBottomLeftRadius: 75, borderBottomRightRadius: 75, borderTopRightRadius: 99, borderTopLeftRadius: 99, },
  { id: 'boot_3',                partId: 'boot',               x: 175, y: 100, w:  25, h:  32, },
  { id: 'backlight_right_1',     partId: 'backlight_left',     x:  55, y: 102, w:  65, h:  29, borderBottomRightRadius: 99 },
  { id: 'backlight_left_2',      partId: 'backlight_right',    x: 105, y: 105, w:  65, h:  11, borderBottomRightRadius: 99 },
  { id: 'backlight_left_1',      partId: 'backlight_right',    x: 255, y: 102, w:  65, h:  29, borderBottomLeftRadius: 99 },
  { id: 'backlight_right_2',     partId: 'backlight_left',     x: 205, y: 105, w:  65, h:  11, borderBottomLeftRadius: 99 },
  { id: 'rear_bumper_1',         partId: 'rear_bumper',        x:  35, y: 155, w: 305, h:  71, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  { id: 'rear_bumper_2',         partId: 'rear_bumper',        x:  35, y: 135, w:  65, h:  45, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  { id: 'rear_bumper_3',         partId: 'rear_bumper',        x: 272, y: 135, w:  65, h:  45, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  { id: 'rear_bumper_4',         partId: 'rear_bumper',        x:  25, y: 408, w:  85, h:  62 },
  { id: 'rear_bumper_5',         partId: 'rear_bumper',        x: 620, y: 630, w:  85, h:  62 },
  { id: 'back_fender_left_r1',   partId: 'back_fender_right',  x: 118, y: 345, w:  85, h: 145, rotation: 33, borderBottomLeftRadius: 99, borderTopRightRadius: 33, borderTopLeftRadius: 33 },
  { id: 'back_fender_left_r2',   partId: 'back_fender_right',  x: 132, y: 325, w:  65, h:  35, rotation: 40, borderTopRightRadius: 99 },
  { id: 'back_fender_right_r1',  partId: 'back_fender_left',   x: 525, y: 565, w:  85, h: 145, rotation: -33, borderBottomLeftRadius: 99, borderTopRightRadius: 33, borderTopLeftRadius: 33 },
  { id: 'back_fender_right_r2',  partId: 'back_fender_left',   x: 551, y: 535, w:  35, h:  65, rotation: 40, borderTopRightRadius: 99 },
  { id: 'roof_1',                partId: 'roof',               x: 182, y: 295, w: 255, h:   5 },
  { id: 'roof_2',                partId: 'roof',               x: 455, y:  11, w: 195, h:  15 },
  { id: 'roof_3',                partId: 'roof',               x: 105, y:  15, w: 165, h:  15 },
  { id: 'driver_door_1',         partId: 'front_passenger_door', x: 350, y: 375, w: 150, h: 100 },
  { id: 'back_passenger_left_1', partId: 'back_passenger_right',  x: 195, y: 362, w: 150, h: 115, borderBottomLeftRadius: 9999, },
  { id: 'front_passenger_door_1', partId: 'driver_door',         x: 235, y: 600, w: 150, h: 100 },
  { id: 'back_passenger_right_1', partId: 'back_passenger_left', x: 387, y: 585, w: 150, h: 115, borderBottomRightRadius: 9999, },
];

const TOUCH_ZONES = TOUCH_ZONES_RAW.map(z => ({
  id:     z.id, 
  partId: z.partId,
  left:   Math.round(z.x * SCALE),
  top:    Math.round(z.y * SCALE),
  width:  Math.round(z.w * SCALE),
  height: Math.round(z.h * SCALE),
  borderRadius: z.r ? Math.round(z.r * SCALE) : 0,
  borderBottomLeftRadius: z.borderBottomLeftRadius ? Math.round(z.borderBottomLeftRadius * SCALE) : undefined,  
  borderBottomRightRadius: z.borderBottomRightRadius ? Math.round(z.borderBottomRightRadius * SCALE) : undefined,
  borderTopLeftRadius:  z.borderTopLeftRadius  ? Math.round(z.borderTopLeftRadius  * SCALE) : undefined,
  borderTopRightRadius: z.borderTopRightRadius ? Math.round(z.borderTopRightRadius * SCALE) : undefined,
  rotation: z.rotation ?? 0,
}));


function canonicalPartId(rawId) {
  if (!rawId) return rawId;
  return rawId.replace(/_zone$/, '');
}

function resolveZoneColor(partId, damage) {
  if (!partId) return null;
  const cleanId = canonicalPartId(partId);
  return damage[cleanId] ? BOOL_ON_COLOR : null;
}

function buildColoredSvgXml(rawXml, damage) {
  if (!rawXml) return rawXml;
  let xml = rawXml;
  for (const [zoneId, partId] of Object.entries(ZONE_ID_TO_PART)) {
    const targetColor = resolveZoneColor(partId, damage);
    if (!targetColor) continue;
    xml = xml.replace(
      new RegExp(`(<g[^>]*id=["']${zoneId}["'][^>]*fill=["'])([^"']+)(["'])`, 'gi'),
      `$1${targetColor}$3`
    );
    xml = xml.replace(
      new RegExp(`(<g[^>]*fill=["'])([^"']+)(["'][^>]*id=["']${zoneId}["'])`, 'gi'),
      `$1${targetColor}$3`
    );
  }
  return xml;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const touchZoneStyle = { position: 'absolute', backgroundColor: 'rgba(238, 5, 5, 0.22)' };

function ZoneTouchOverlay({ onZonePress, damage }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {TOUCH_ZONES.map(zone => {
        const cleanId  = canonicalPartId(zone.partId);
        const isActive = damage[cleanId];

        return (
          <Pressable
            key={zone.id}
            onPress={() => onZonePress(zone.partId)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={[
              touchZoneStyle,
              {
                left:   zone.left,
                top:    zone.top,
                width:  zone.width,
                height: zone.height,
                borderBottomLeftRadius: zone.borderBottomLeftRadius,
                borderBottomRightRadius: zone.borderBottomRightRadius,
                borderTopLeftRadius:  zone.borderTopLeftRadius,
                borderTopRightRadius: zone.borderTopRightRadius,
                transform: [{ rotate: `${zone.rotation}deg` }],
              },
            ]}
            android_ripple={{
              color: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(245, 158, 11, 0.22)',
              borderless: false,
              radius: Math.min(zone.width, zone.height) / 2,
            }}
          />
        );
      })}
    </View>
  );
}

const Section = React.memo(function Section({ title, children, colors }) {
  const styles = createSectionStyles(colors);
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.accent} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
});

const FieldRow = React.memo(function FieldRow({ label, children, colors }) {
  const styles = createFieldRowStyles(colors);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
});

const AdminInput = React.memo(function AdminInput({ value, onChangeText, keyboardType, multiline, numberOfLines, colors }) {
  const styles = createInputStyles(colors);
  return (
    <TextInput
      value={String(value ?? '')}
      onChangeText={onChangeText}
      keyboardType={keyboardType || 'default'}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlign="right"
      style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
    />
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const toImageSource = (raw) => {
  if (!raw) return null;
  if (raw.startsWith('http'))       return { uri: raw };
  if (raw.startsWith('data:image')) return { uri: raw };
  return { uri: `data:image/jpeg;base64,${raw}` };
};

export default function AdminListingDetail({ route, navigation }) {
  const insets      = useSafeAreaInsets();
  const { colors }  = useTheme();
  const styles      = createStyles(colors);
  const { listingId } = route.params;

  const [listing,    setListing]    = useState(null);
  const [inspection, setInspection] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({});
  const [damage,     setDamage]     = useState({});
  const [score,      setScore]      = useState('');
  const [dmgNote,    setDmgNote]    = useState('');

  const load = useCallback(async () => {
    try {
      const [{ data: l }, { data: ins }] = await Promise.all([
        supabase.from('listings').select('*').eq('id', listingId).single(),
        supabase.from('inspections').select('*').eq('listing_id', listingId).maybeSingle(),
      ]);
      setListing(l);
      setForm({
        brand: l.brand, model: l.model, version: l.version || '',
        engine: l.engine || '', year: String(l.year),
        mileage: String(l.mileage), fuel_type: l.fuel_type,
        price_dzd: String(l.price_dzd), wilaya: l.wilaya || '',
        description: l.description || '',
      });
      if (ins) {
        setInspection(ins);
        setScore(String(ins.condition_score ?? ''));
        setDmgNote(ins.damage_details || '');
        const d = {};
        Object.entries(PART_TO_DB_COL).forEach(([partId, col]) => { d[partId] = !!ins[col]; });
        setDamage(d);
      } else {
        const d = {};
        BOOL_DAMAGE_PARTS.forEach(p => { d[p] = false; });
        setDamage(d);
      }
    } catch { Alert.alert('خطأ', 'فشل تحميل البيانات'); }
    finally  { setLoading(false); }
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

  const toggleDamage = useCallback((partId) => {
    if (!partId) return;
    Vibration.vibrate(Platform.OS === 'android' ? 10 : 0);
    setDamage(prev => ({ ...prev, [canonicalPartId(partId)]: !prev[canonicalPartId(partId)] }));
  }, []);

  const coloredSvg = useMemo(() => buildColoredSvgXml(RAW_SVG_XML, damage), [damage]);

  const setFormField   = useCallback((key, val) => setForm(p => ({ ...p, [key]: val })), []);
  const setBrand       = useCallback((v) => setFormField('brand',       v), [setFormField]);
  const setModel       = useCallback((v) => setFormField('model',       v), [setFormField]);
  const setVersion     = useCallback((v) => setFormField('version',     v), [setFormField]);
  const setEngine      = useCallback((v) => setFormField('engine',      v), [setFormField]);
  const setYear        = useCallback((v) => setFormField('year',        v), [setFormField]);
  const setMileage     = useCallback((v) => setFormField('mileage',     v), [setFormField]);
  const setPriceDzd    = useCallback((v) => setFormField('price_dzd',   v), [setFormField]);
  const setWilaya      = useCallback((v) => setFormField('wilaya',      v), [setFormField]);
  const setDescription = useCallback((v) => setFormField('description', v), [setFormField]);
  const setFuelType    = useCallback((v) => setFormField('fuel_type',   v), [setFormField]);

  const fuelHandlers = useMemo(() =>
    Object.fromEntries(FUEL_OPTIONS.map(f => [f, () => setFuelType(f)])),
  [setFuelType]);

  const handleSaveListing = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        brand:       form.brand?.trim(),
        model:       form.model?.trim(),
        version:     form.version?.trim()     || null,
        engine:      form.engine?.trim()      || null,
        year:        parseInt(form.year, 10)  || listing.year,
        mileage:     parseInt(form.mileage, 10) || listing.mileage,
        fuel_type:   form.fuel_type,
        price_dzd:   parseFloat(form.price_dzd) || listing.price_dzd,
        wilaya:      form.wilaya?.trim()      || null,
        description: form.description?.trim() || null,
      };
      const { data, error } = await supabase.from('listings').update(payload).eq('id', listingId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('RLS blocked: no rows updated.');
      Alert.alert('✅ تم الحفظ', 'تم تحديث بيانات الإعلان بنجاح');
      await load();
    } catch (e) { Alert.alert('خطأ', e.message); }
    finally     { setSaving(false); }
  }, [form, listing, listingId, load]);

  const handleSaveInspection = useCallback(async () => {
    setSaving(true);
    try {
      const damagePayload = {};
      Object.entries(PART_TO_DB_COL).forEach(([partId, col]) => { damagePayload[col] = damage[partId] === true; });
      const scoreInt = parseInt(score, 10);
      const fullPayload = {
        ...damagePayload,
        damage_details:  dmgNote?.trim() || null,
        condition_score: !isNaN(scoreInt) && scoreInt >= 1 && scoreInt <= 10 ? scoreInt : null,
      };
      let data, error;
      if (inspection?.id) {
        ({ data, error } = await supabase.from('inspections').update(fullPayload).eq('id', inspection.id).select());
      } else {
        ({ data, error } = await supabase.from('inspections').insert({ listing_id: listingId, ...fullPayload }).select());
      }
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('RLS blocked: no inspection rows affected.');
      Alert.alert('✅ تم الحفظ', 'تم تحديث بيانات الفحص بنجاح');
      await load();
    } catch (e) { Alert.alert('خطأ', e.message); }
    finally     { setSaving(false); }
  }, [damage, score, dmgNote, inspection, listingId, load]);

  const handleSetStatus = useCallback((status) => {
    const META = {
      published: { label: 'نشر الإعلان',    msg: 'هل تريد نشر هذا الإعلان؟',              style: 'default'     },
      rejected:  { label: 'رفض الإعلان',    msg: 'هل تريد رفض هذا الإعلان؟',              style: 'destructive' },
      pending:   { label: 'إعادة للمراجعة', msg: 'هل تريد إعادة الإعلان لقيد المراجعة؟', style: 'default'     },
    };
    const { label, msg, style } = META[status];
    Alert.alert(label, msg, [
      { text: 'إلغاء', style: 'cancel' },
      { text: label, style, onPress: async () => {
        setSaving(true);
        try {
          const { data, error } = await supabase.from('listings').update({
            status,
            accepted_by_admin: status === 'published',
            reviewed_at: new Date().toISOString(),
          }).eq('id', listingId).select();
          if (error) throw error;
          if (!data || data.length === 0) throw new Error('RLS blocked: status not updated.');
          await load();
          if (status !== 'pending') navigation.goBack();
        } catch (e) { Alert.alert('خطأ', e.message); }
        finally     { setSaving(false); }
      }},
    ]);
  }, [listingId, load, navigation]);

  const handlePublish = useCallback(() => handleSetStatus('published'), [handleSetStatus]);
  const handleReject  = useCallback(() => handleSetStatus('rejected'),  [handleSetStatus]);
  const handlePending = useCallback(() => handleSetStatus('pending'),   [handleSetStatus]);
  const handleBack    = useCallback(() => navigation.goBack(),          [navigation]);

  const damagedParts = useMemo(() => Object.entries(damage).filter(([, v]) => v), [damage]);

  // Dynamically resolve image source from fetched listing state safely
  const img = useMemo(() => toImageSource(listing?.car_images?.[0]), [listing?.car_images]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusMeta = STATUS_META[listing?.status] || STATUS_META.pending;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3971" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusPillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
        <Text style={styles.headerTitle}>{listing?.brand} {listing?.model}</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← رجوع</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} removeClippedSubviews>

        {img && (
          <Image source={img} style={styles.ccImage} resizeMode="cover" fadeDuration={0} />
        )}
          
        <Section title="🚗 بيانات الإعلان" colors={colors}>
          <FieldRow label="الماركة" colors={colors}><AdminInput value={form.brand}       onChangeText={setBrand}       colors={colors} /></FieldRow>
          <FieldRow label="الموديل" colors={colors}><AdminInput value={form.model}       onChangeText={setModel}       colors={colors} /></FieldRow>
          <FieldRow label="الإصدار" colors={colors}><AdminInput value={form.version}     onChangeText={setVersion}     colors={colors} /></FieldRow>
          <FieldRow label="المحرك"  colors={colors}><AdminInput value={form.engine}      onChangeText={setEngine}      colors={colors} /></FieldRow>
          <View style={styles.dualRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>السنة</Text>
              <AdminInput value={form.year}    onChangeText={setYear}    keyboardType="numeric" colors={colors} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>الكيلومترات</Text>
              <AdminInput value={form.mileage} onChangeText={setMileage} keyboardType="numeric" colors={colors} />
            </View>
          </View>
          <FieldRow label="السعر (دج)"  colors={colors}><AdminInput value={form.price_dzd}  onChangeText={setPriceDzd} keyboardType="numeric" colors={colors} /></FieldRow>
          <FieldRow label="الولاية"     colors={colors}><AdminInput value={form.wilaya}     onChangeText={setWilaya}   colors={colors} /></FieldRow>
          <FieldRow label="نوع الوقود"  colors={colors}>
            <View style={styles.fuelRow}>
              {FUEL_OPTIONS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.fuelChip, form.fuel_type === f && styles.fuelChipActive]}
                  onPress={fuelHandlers[f]}
                >
                  <Text style={[styles.fuelLabel, form.fuel_type === f && styles.fuelLabelActive]}>{FUEL_LABELS[f]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FieldRow>
          <FieldRow label="الوصف" colors={colors}><AdminInput value={form.description} onChangeText={setDescription} multiline numberOfLines={4} colors={colors} /></FieldRow>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveListing} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 حفظ بيانات الإعلان</Text>}
          </TouchableOpacity>
        </Section>

        <Section title="🔍 خريطة الأضرار (فحص الإدارة)" colors={colors}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendLabel}>سليم</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendLabel}>متضرر</Text></View>
          </View>
          
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={[styles.svgCard, { width: SCREEN_W, height: RENDER_H }]} pointerEvents="box-none">
              <Image
                source={require('../../../assets/car-blueprint1.png')}
                style={{ position: 'absolute', width: SCREEN_W, height: RENDER_H, }}
                resizeMode="stretch" 
                pointerEvents="none" 
                fadeDuration={0}
              />
              <SvgXml 
                xml={coloredSvg} 
                width={SCREEN_W} 
                height={RENDER_H} 
                style={StyleSheet.absoluteFill} 
                pointerEvents="none" 
              />
              <ZoneTouchOverlay onZonePress={toggleDamage} damage={damage} />
            </View>
          </View>

          {damagedParts.length > 0 ? (
            <View style={styles.dmgList}>
              <Text style={styles.dmgTitle}>الأجزاء المتضررة ({damagedParts.length})</Text>
              <View style={styles.dmgChips}>
                {damagedParts.map(([k]) => (
                  <TouchableOpacity key={k} style={styles.dmgChip} onPress={() => toggleDamage(k)}>
                    <Text style={styles.dmgChipText}>{PART_LABELS[k] ?? k} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
              <Text style={styles.noDmgText}>✅ لا أضرار محددة</Text>
            </View>
          )}
          <FieldRow label="تقييم الحالة (1–10)" colors={colors}>
            <AdminInput
              value={score}
              onChangeText={v => { if (!v || (parseInt(v) >= 1 && parseInt(v) <= 10)) setScore(v); }}
              keyboardType="numeric"
              colors={colors}
            />
          </FieldRow>
          <FieldRow label="ملاحظات الفحص" colors={colors}>
            <AdminInput value={dmgNote} onChangeText={setDmgNote} multiline numberOfLines={4} colors={colors} />
          </FieldRow>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveInspection} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 حفظ بيانات الفحص</Text>}
          </TouchableOpacity>
        </Section>

        <Section title="⚖️ قرار الإعلان" colors={colors}>
          <View style={styles.decisionWrap}>
            <Text style={styles.currentStatus}>
              الحالة الحالية: <Text style={{ color: statusMeta.color, fontFamily: Typography.fontFamily.bold }}>{statusMeta.label}</Text>
            </Text>
            <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={saving || listing?.status === 'published'}>
              <Text style={styles.publishBtnText}>✅ نشر الإعلان</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} disabled={saving || listing?.status === 'rejected'}>
              <Text style={styles.rejectBtnText}>❌ رفض الإعلان</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pendingBtn} onPress={handlePending} disabled={saving || listing?.status === 'pending'}>
              <Text style={styles.pendingBtnText}>⏳ إعادة لقيد المراجعة</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createSectionStyles = (colors) => StyleSheet.create({
  wrap:   { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  accent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#0B3971', },
  title:  { fontFamily: Typography.fontFamily.black, fontSize: 15, color: colors.textPrimary,},
});

const createFieldRowStyles = (colors) => StyleSheet.create({
  wrap:  { paddingHorizontal: 16, paddingBottom: 12 },
  label: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: colors.textSecondary, textAlign: 'left', marginBottom: 6 },
});

const createInputStyles = (colors) => StyleSheet.create({
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    fontFamily: Typography.fontFamily.medium, color: colors.textPrimary,
    backgroundColor: colors.background,
  },
});

const createStyles = (colors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.background },
  loader:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header:         { backgroundColor: '#0B3971', paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:        { padding: 8 },
  backText:       { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  headerTitle:    { fontFamily: Typography.fontFamily.black, fontSize: 17, color: '#fff', flex: 1, textAlign: 'center' },
  statusPill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontFamily: Typography.fontFamily.bold, fontSize: 11 },
  scroll:         { paddingHorizontal: 16, paddingBottom: 22, },
  imgRow:         { flexDirection: 'row', gap: 8,},
  carImg:         { width: 200, height: 140, borderRadius: 10 },
  ccImage:        { width: '100%', height: 220, borderRadius: 12, marginBottom: 14, backgroundColor: colors.surface }, // Fixed layout dimension requirement
  dualRow:        { flexDirection: 'row-reverse', gap: 12, paddingHorizontal: 16, paddingBottom: 12,  },
  fieldLabel:     { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: colors.textSecondary, textAlign: 'left', marginBottom: 6 },
  fuelRow:        { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  fuelChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  fuelChipActive: { backgroundColor: '#0B3971', borderColor: '#0B3971' },
  fuelLabel:      { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  fuelLabelActive:{ color: '#fff' },
  saveBtn:        { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#0B3971', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:    { fontFamily: Typography.fontFamily.bold, fontSize: 15, color: '#fff' },
  svgCard:        { borderRadius: 12, overflow: 'hidden', backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border, marginBottom: 8, alignSelf: 'center', position: 'relative' },
  legendRow:      { flexDirection: 'row-reverse', gap: 16, paddingHorizontal: 16, marginBottom: 8 },
  legendItem:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  legendLabel:    { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: colors.textPrimary },
  dmgList:        { paddingHorizontal: 16, paddingBottom: 12 },
  dmgTitle:       { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: colors.textPrimary, textAlign: 'right' },
  dmgChips:       { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  dmgChip:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#F59E0B' },
  dmgChipText:    { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: '#92400E' },
  noDmgText:      { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: '#10B981', textAlign: 'right' },
  decisionWrap:   { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  currentStatus:  { fontFamily: Typography.fontFamily.regular, fontSize: 13, color: colors.textSecondary, textAlign: 'right' },
  publishBtn:     { backgroundColor: '#D1FAE5', borderWidth: 2, borderColor: '#10B981', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  publishBtnText: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: '#065F46' },
  rejectBtn:      { backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  rejectBtnText:  { fontFamily: Typography.fontFamily.black, fontSize: 16, color: '#991B1B' },
  pendingBtn:     { backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: '#F59E0B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  pendingBtnText: { fontFamily: Typography.fontFamily.black, fontSize: 14, color: '#92400E' },
});
