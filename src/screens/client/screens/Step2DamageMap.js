import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Vibration,
  Dimensions,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAddCar, DAMAGE_STATE, BOOLEAN_PARTS } from '../../../context/AddCarContext';
import { useTheme, Typography, Spacing, Radius } from '../../../context/ThemeContext';
import RAW_SVG_XML from '../../../../assets/carBlueprintXml';


const NATIVE_W = 722;
const NATIVE_H = 742;
const SCREEN_W = Dimensions.get('window').width;
const RENDER_H  = Math.round(NATIVE_H * (SCREEN_W / NATIVE_W));
const SCALE     = SCREEN_W / NATIVE_W;

function canonicalPartId(rawId) {
  if (!rawId) return rawId;
  return rawId.replace(/_zone$/, '');
}

const DAMAGE_COLORS = {
  [DAMAGE_STATE.NONE]:    null,
  [DAMAGE_STATE.SPRAYED]: '#EF4444',
  [DAMAGE_STATE.CRACKED]: '#3B82F6',
};
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

const PART_LABELS = {
  hood:                  'كابو',
  front_bumper:          'صدام أمامي',
  rear_bumper:           'صدام خلفي',
  front_fender_left:     'جنب أمامي أيسر',
  front_fender_right:    'جنب أمامي أيمن',
  back_fender_left:      'جنب خلفي أيسر',
  back_fender_right:     'جنب خلفي أيمن',
  boot:                  'صندوق الأمتعة',
  driver_door:           'باب السائق',
  front_passenger_door:  'باب أمامي أيمن',
  back_passenger_left:   'باب خلفي أيسر',
  back_passenger_right:  'باب خلفي أيمن',
  roof:                  'السقف',
  windshield:            'الزجاج الأمامي',
  rear_windshield:       'الزجاج الخلفي',
  headlight_left:        'مصباح أيسر',
  headlight_right:       'مصباح أيمن',
  backlight_left:        'مصباح خلفي أيسر',
  backlight_right:       'مصباح خلفي أيمن',
};

const TOUCH_ZONES_RAW = [
  { id: 'windshield_1',          partId: 'windshield',         x: 435, y:  31, w: 235, h:  59 , borderTopLeftRadius: 99, borderTopRightRadius: 99 },
  { id: 'hood_front_1',          partId: 'hood',               x: 417, y:  91, w: 265, h:  49, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  { id: 'front_bumper_1',        partId: 'front_bumper',       x: 397, y: 162, w: 302, h:  62 },
  { id: 'front_bumper_2',        partId: 'front_bumper',       x: 620, y: 419, w:  85, h:  62 },
  { id: 'front_bumper_3',        partId: 'front_bumper',       x:  25, y: 645, w:  85, h:  62 },
  { id: 'headlight_left_1',      partId: 'headlight_right',    x: 625, y: 132, w:  65, h:  42, borderTopLeftRadius: 9, borderTopRightRadius: 4, borderBottomLeftRadius: 999, borderBottomRightRadius: 355, rotation: -12 },
  { id: 'headlight_right_1',     partId: 'headlight_left',     x: 410, y: 132, w:  65, h:  42, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 355, borderBottomRightRadius: 999, rotation: 12 },
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
  { id: 'back_fender_left_r1',   partId: 'back_fender_right',  x: 118, y: 345, w:  85, h: 145, rotation: -33, borderBottomLeftRadius: 99, borderTopRightRadius: 33, borderTopLeftRadius: 33 },
  { id: 'back_fender_left_r2',   partId: 'back_fender_right',  x: 132, y: 325, w:  65, h:  35, rotation: -40, borderTopRightRadius: 99 },
  { id: 'back_fender_right_r1',  partId: 'back_fender_left',   x: 525, y: 565, w:  85, h: 145, rotation: 33, borderBottomLeftRadius: 99, borderTopRightRadius: 33, borderTopLeftRadius: 33 },
  { id: 'back_fender_right_r2',  partId: 'back_fender_left',   x: 551, y: 535, w:  35, h:  65, rotation: -40, borderTopRightRadius: 99 },
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
  isTriangle: z.isTriangle ?? false,
  rotation: z.rotation ?? 0,
}));

function resolveZoneColor(partId, damage) {
  if (!partId) return null;
  const cleanId   = canonicalPartId(partId);
  const isBoolean = BOOLEAN_PARTS?.has(cleanId);
  const val       = damage[cleanId];
  if (isBoolean) return val ? BOOL_ON_COLOR : null;
  if (!val || val === DAMAGE_STATE.NONE) return null;
  return DAMAGE_COLORS[val] ?? null;
}

function buildColoredSvgXml(rawXml, damage) {
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

function ZoneTouchOverlay({ onZonePress, damage }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {TOUCH_ZONES.map(zone => {
        const cleanId   = canonicalPartId(zone.partId);
        const isBoolean = BOOLEAN_PARTS?.has(cleanId);
        const val       = damage[cleanId];
        const isActive  = isBoolean
          ? val === true
          : val && val !== DAMAGE_STATE.NONE;

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
              color: isActive
                ? 'rgba(255,255,255,0.22)'
                : 'rgba(59,130,246,0.22)',
              borderless: false,
              radius: Math.min(zone.width, zone.height) / 2,
            }}
          />
        );
      })}
    </View>
  );
}

const LEGEND_ITEMS = [
  { color: '#9CA3AF', label: 'سليم'  },
  { color: '#EF4444', label: 'مطلي'  },
  { color: '#3B82F6', label: 'مكسور' },
  { color: '#F59E0B', label: 'مصباح' },
];

const Legend = React.memo(function Legend({ colors }) {
  return (
    <View style={legRow}>
      {LEGEND_ITEMS.map(i => (
        <View key={i.label} style={legItem}>
          <View style={[legSwatch, { backgroundColor: i.color + '55', borderColor: i.color }]} />
          <Text style={[legLabel, { color: colors.textSecondary }]}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
});

const legRow   = { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 12, justifyContent: 'flex-end' };
const legItem  = { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 };
const legSwatch = { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5 };
const legLabel  = { fontSize: 12 };

const DamageSummary = React.memo(function DamageSummary({ damage }) {
  const { colors } = useTheme();
  const ds = createDsStyles(colors);
  const seen  = new Set();
  const items = Object.entries(damage).filter(([k, v]) => {
    if (seen.has(k)) return false;
    seen.add(k);
    return BOOLEAN_PARTS?.has(k) ? v === true : v && v !== DAMAGE_STATE.NONE;
  });
  if (!items.length) return null;

  return (
    <View style={ds.wrap}>
      <Text style={ds.title}>الأضرار المحددة ({items.length})</Text>
      <View style={ds.chips}>
        {items.map(([k, v]) => {
          const isHL  = BOOLEAN_PARTS?.has(k);
          const color = isHL ? '#B45309' : v === DAMAGE_STATE.SPRAYED ? '#B91C1C' : '#1E40AF';
          return (
            <View key={k} style={[ds.chip, { borderColor: color + '88', backgroundColor: color + '15' }]}>
              <View style={[ds.dot, { backgroundColor: color }]} />
              <Text style={[ds.chipTxt, { color }]}>
                {PART_LABELS[k] ?? k}
                {!isHL ? (v === DAMAGE_STATE.SPRAYED ? ' (مطلي)' : ' (مكسور)') : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const createDsStyles = (colors) => StyleSheet.create({
  wrap:    { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: colors.border },
  title:   { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginBottom: 10 },
  chips:   { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip:    { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, gap: 5 },
  dot:     { width: 7, height: 7, borderRadius: 4 },
  chipTxt: { fontSize: 11, fontWeight: '600' },
});

export default function Step2DamageMap() {
  const { colors } = useTheme();
  const styles = createStyles(colors); 
  const { damage, toggleDamage, damage_details, setDamageDetails } = useAddCar();
  const scrollRef = useRef(null);

  const handleZonePress = useCallback((partId) => {
    if (!partId) return;
    if (Platform.OS === 'android') Vibration.vibrate(10);
    toggleDamage(canonicalPartId(partId));
  }, [toggleDamage]);

  const coloredSvgXml = useMemo(
    () => buildColoredSvgXml(RAW_SVG_XML, damage),
    [damage],
  );

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      <View style={styles.banner}>
        <View style={styles.contentPad}>
          <Text style={styles.bannerText}>
            اضغط على أي جزء لتحديد حالته: سليم ← مطلي (أحمر) ← مكسور (أزرق)
          </Text>
          <Legend colors={colors} />
        </View>
      </View>

      <View
        style={[styles.svgCard, { width: SCREEN_W, height: RENDER_H }]}
        pointerEvents="box-none"
      >
        <Image
          source={require('../../../../assets/car-blueprint1.png')}
          style={{ position: 'absolute', width: SCREEN_W, height: RENDER_H, transform: [{ scaleX: -1 }] }}
          resizeMode="stretch"
        />
        <SvgXml
          xml={coloredSvgXml}
          width={SCREEN_W}
          height={RENDER_H}
          style={[StyleSheet.absoluteFill, { transform: [{ scaleX: -1 }] }]}
          pointerEvents="none"
        />
        <ZoneTouchOverlay onZonePress={handleZonePress} damage={damage} />
      </View>

      <View style={styles.contentPad}>
        <DamageSummary damage={damage} colors={colors} />
        <View style={styles.notesWrap}>
          <Text style={styles.notesLabel}>تفاصيل إضافية عن الأضرار</Text>
          <TextInput
            value={damage_details}
            onChangeText={setDamageDetails}
            placeholder="اوصف الأضرار بالتفصيل (اختياري)..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
            textAlign="right"
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  scroll:      { backgroundColor: colors.background, paddingTop: Spacing.base, paddingBottom: 48 },
  contentPad:  { paddingHorizontal: Spacing.base },
  banner:      { flexDirection: 'row-reverse', backgroundColor: colors.actionBlue + '12', borderRadius: 12, padding: 12, marginBottom: 12, marginHorizontal: Spacing.base, alignItems: 'flex-start', gap: 10, borderWidth: 1, borderColor: colors.actionBlue + '33' },
  bannerIcon:  { fontSize: 18, marginTop: 1 },
  bannerText:  { flex: 1, fontSize: 13, color: colors.actionBlue, textAlign: 'right', lineHeight: 20 },
  svgCard:     { borderRadius: 12, overflow: 'hidden', backgroundColor: 'transparent', marginBottom: 14, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colors.border, position: 'relative' },
  touchZone:   { position: 'absolute', backgroundColor: 'transparent' },
  notesWrap:   { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: colors.border },
  notesLabel:  { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginBottom: 10 },
  notesInput:  { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, minHeight: 100, fontSize: 13, color: colors.textPrimary, backgroundColor: colors.background },
});
const touchZoneStyle = { position: 'absolute', backgroundColor: 'transparent' };
