import React, { useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAddCar } from '../../../context/AddCarContext';
import { useTheme, Typography, Spacing, Radius } from '../../../context/ThemeContext';


const PHOTO_SLOTS = [
  { key: 'car', label: 'السيارة', mandatory: true, icon: '🚗' },
];

const TIPS = [
  'التقط الصور في ضوء النهار الطبيعي',
  'نظّف السيارة قبل التصوير',
  'صوّر من زوايا متعددة',
  'أظهر أي عيوب بوضوح لبناء الثقة',
];

// ─── CameraIcon ───────────────────────────────────────────────────────────────
const CameraIcon = React.memo(function CameraIcon({ size = 28, color }) {
  return (
    <View style={{ width: size, height: size * 0.76, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size, height: size * 0.68, borderRadius: 5, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19, borderWidth: 2, borderColor: color }} />
      </View>
      <View style={{ position: 'absolute', top: -2, left: size * 0.22, width: size * 0.22, height: 5, borderRadius: 3, borderWidth: 2, borderColor: color }} />
    </View>
  );
});

// ─── XIcon ────────────────────────────────────────────────────────────────────
const XIcon = React.memo(function XIcon({ size = 12 }) {
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{ position: 'absolute', width: size, height: 2, backgroundColor: '#fff', top: size / 2 - 1, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: size, height: 2, backgroundColor: '#fff', top: size / 2 - 1, borderRadius: 1, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
});

// ─── PhotoSlot ────────────────────────────────────────────────────────────────
const PhotoSlot = React.memo(function PhotoSlot({ slot, uri, onPick, onDelete, colors }) {
  const styles = createStyles(colors);
  const scale  = useRef(new Animated.Value(1)).current;

  const press = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50, bounciness: 6 }),
    ]).start();
    onPick(slot.key);
  }, [slot.key, onPick, scale]);

  const handleDelete = useCallback(() => onDelete(slot.key), [slot.key, onDelete]);

  const filled    = !!uri;
  const mandatory = slot.mandatory;

  return (
    <Animated.View style={[styles.psOuter, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[
          styles.psCell,
          filled    && styles.psCellFilled,
          mandatory && !filled && styles.psCellMandatory,
        ]}
        onPress={press}
        activeOpacity={0.8}
      >
        {filled ? (
          <>
            <Image source={{ uri }} style={styles.psImage} resizeMode="cover" fadeDuration={0} />
            <TouchableOpacity
              style={styles.psDeleteBtn}
              onPress={handleDelete}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <XIcon size={10} />
            </TouchableOpacity>
            <View style={styles.psFilledBadge}>
              <Text style={styles.psFilledBadgeText}>✓</Text>
            </View>
          </>
        ) : (
          <View style={styles.psEmpty}>
            <CameraIcon size={30} color={mandatory ? colors.actionBlue : colors.textMuted} />
            <Text style={[styles.psAddText, mandatory && styles.psAddTextMandatory]}>إضافة صورة</Text>
            {mandatory && <View style={styles.psMandatoryDot} />}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.psLabelRow}>
        {mandatory && <Text style={styles.psAsterisk}>*</Text>}
        <Text style={[styles.psLabel, mandatory && styles.psLabelMandatory]} numberOfLines={1}>
          {slot.label}
        </Text>
      </View>
    </Animated.View>
  );
}, (prev, next) =>
  prev.uri      === next.uri &&
  prev.onPick   === next.onPick &&
  prev.onDelete === next.onDelete &&
  prev.colors   === next.colors
);

// ─── PhotoProgress ────────────────────────────────────────────────────────────
const PhotoProgress = React.memo(function PhotoProgress({ photos, mandatory, colors }) {
  const styles          = createStyles(colors);
  const total           = PHOTO_SLOTS.length;
  const filled          = Object.values(photos).filter(Boolean).length;
  const mandatoryFilled = mandatory.filter(k => photos[k]).length;
  const pct             = filled / total;
  const allMand         = mandatoryFilled === mandatory.length;

  return (
    <View style={styles.progWrap}>
      <View style={styles.progTextRow}>
        <Text style={styles.progRight}>{filled} / {total} صورة</Text>
        <Text style={[styles.progStatus, allMand ? styles.progStatusOk : styles.progStatusWarn]}>
          {allMand ? '✓ الصور الإلزامية مكتملة' : `${mandatory.length - mandatoryFilled} صورة إلزامية ناقصة`}
        </Text>
      </View>
      <View style={styles.progTrack}>
        <View style={[styles.progFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
});

// ─── Step3PhotoUpload ─────────────────────────────────────────────────────────
export default function Step3PhotoUpload() {
  const { colors } = useTheme();
  const styles     = createStyles(colors);
  const { photos, setPhoto, MANDATORY_SLOTS } = useAddCar();

  const requestAndPick = useCallback(async (slot) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('الإذن مرفوض', 'يرجى السماح للتطبيق بالوصول إلى مكتبة الصور من الإعدادات.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      setPhoto(slot, result.assets[0].uri);
    }
  }, [setPhoto]);

  const handleDelete = useCallback((slot) => {
    Alert.alert('حذف الصورة', 'هل تريد إزالة هذه الصورة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => setPhoto(slot, null) },
    ]);
  }, [setPhoto]);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.infoBox}>
        <View style={styles.infoIconWrap}>
          <Text style={styles.infoIcon}>📷</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>صور السيارة</Text>
          <Text style={styles.infoText}>
            الصور المعلّمة بـ <Text style={styles.asteriskInline}>*</Text> إلزامية.
            الصور عالية الجودة تزيد فرص البيع بنسبة 3×
          </Text>
        </View>
      </View>

      <PhotoProgress photos={photos} mandatory={MANDATORY_SLOTS} colors={colors} />

      <View style={styles.grid}>
        {PHOTO_SLOTS.map(slot => (
          <PhotoSlot
            key={slot.key}
            slot={slot}
            uri={photos[slot.key]}
            onPick={requestAndPick}
            onDelete={handleDelete}
            colors={colors}
          />
        ))}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 نصائح للتصوير</Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors) => StyleSheet.create({
  scroll:        { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: 40 },

  // Info box
  infoBox:       { flexDirection: 'row-reverse', backgroundColor: colors.actionBlue + '12', borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.base, gap: Spacing.sm, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.actionBlue + '33' },
  infoIconWrap:  { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.actionBlue, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  infoIcon:      { fontSize: 18 },
  infoTitle:     { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: colors.primary, textAlign: 'right', marginBottom: 3 },
  infoText:      { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'right', lineHeight: 18 },
  asteriskInline:{ color: colors.error, fontWeight: 'bold' },

  grid:          { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: '3.5%', marginBottom: Spacing.base },

  // PhotoSlot
  psOuter:            { width: '31%', alignItems: 'center', gap: 4 },
  psCell:             { width: '100%', aspectRatio: 1, borderRadius: Radius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  psCellFilled:       { borderStyle: 'solid', borderColor: colors.success },
  psCellMandatory:    { borderColor: colors.actionBlue + '88', backgroundColor: colors.actionBlue + '08' },
  psImage:            { width: '100%', height: '100%' },
  psEmpty:            { alignItems: 'center', gap: 4 },
  psAddText:          { fontFamily: Typography.fontFamily.medium, fontSize: 8, color: colors.textMuted, textAlign: 'center' },
  psAddTextMandatory: { color: colors.actionBlue },
  psMandatoryDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error },
  psDeleteBtn:        { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  psFilledBadge:      { position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  psFilledBadgeText:  { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  psLabelRow:         { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  psLabel:            { fontFamily: Typography.fontFamily.medium, fontSize: 9, color: colors.textSecondary, textAlign: 'center', maxWidth: 80 },
  psLabelMandatory:   { color: colors.textPrimary },
  psAsterisk:         { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: colors.error, lineHeight: 14 },

  // PhotoProgress
  progWrap:       { backgroundColor: colors.surface, borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.base, borderWidth: 0.5, borderColor: colors.border },
  progTextRow:    { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progRight:      { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: colors.textSecondary },
  progStatus:     { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs },
  progStatusOk:   { color: colors.success },
  progStatusWarn: { color: colors.warning },
  progTrack:      { height: 6, borderRadius: 3, backgroundColor: colors.divider, overflow: 'hidden' },
  progFill:       { height: '100%', borderRadius: 3, backgroundColor: colors.actionBlue },

  // Tips card
  tipsCard:  { backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 0.5, borderColor: colors.border, justifyContent: 'flex-start', alignItems: 'flex-start' },
  tipsTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: colors.textPrimary, textAlign: 'left', marginBottom: Spacing.sm },
  tipRow:    { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, paddingVertical: 3, alignSelf: 'stretch' },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.actionBlue, alignSelf: 'center' },
  tipText:   { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: colors.textSecondary, textAlign: 'right', lineHeight: 20 },
});