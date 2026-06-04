import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddCarProvider, useAddCar, DAMAGE_STATE } from '../../../context/AddCarContext';
import Step1TechnicalData from './Step1TechnicalData';
import Step2DamageMap     from './Step2DamageMap';
import Step3PhotoUpload   from './Step3PhotoUpload';
import { useTheme, Typography, Spacing, Radius } from '../../../context/ThemeContext';
import { supabase }       from '../../../supabase';
import * as FileSystem    from 'expo-file-system/legacy';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../redux/slices/authSlice';

const STEPS = [
  { num: 1, label: 'البيانات التقنية', icon: '⚙' },
  { num: 2, label: 'خريطة الأضرار',    icon: '🔍' },
  { num: 3, label: 'الصور',            icon: '📷' },
];

const fuelMapping = {
  'ديزل':   'diesel',
  'بنزين':  'benzine',
  'سيرغاز': 'gpl',
  'كهرباء': 'electric',
  'هجين':   'hybrid',
};

const StepPill = React.memo(function StepPill({ step, active, done, onPress, colors }) {
  const styles = createStyles(colors);
  const scale  = useRef(new Animated.Value(active ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1 : 0.9,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [active]);

  const handlePress = useCallback(() => {
    if (done) onPress();
  }, [done, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={done ? 0.7 : 1}
      style={styles.pillWrap}
    >
      <Animated.View style={[
        styles.pillCircle,
        active && styles.pillCircleActive,
        done   && styles.pillCircleDone,
        { transform: [{ scale }] },
      ]}>
        {done && !active
          ? <Text style={styles.pillCheckmark}>✓</Text>
          : <Text style={[styles.pillNum, active && styles.pillNumActive]}>{step.num}</Text>
        }
      </Animated.View>
      <Text style={[styles.pillLabel, active && styles.pillLabelActive]} numberOfLines={1}>
        {step.label}
      </Text>
    </TouchableOpacity>
  );
});

const ProgressTrack = React.memo(function ProgressTrack({ currentStep, colors }) {
  const styles   = createStyles(colors);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: (currentStep - 1) / (STEPS.length - 1),
      useNativeDriver: false,
      speed: 12,
      bounciness: 2,
    }).start();
  }, [currentStep]);

  const widthInterpolation = useMemo(() =>
    progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
  [progress]);

  return (
    <View style={styles.trackWrap}>
      <View style={styles.trackRail} />
      <Animated.View style={[styles.trackFill, { width: widthInterpolation }]} />
    </View>
  );
});

const DamageBadge = React.memo(function DamageBadge({ count, colors }) {
  const styles = createStyles(colors);
  if (!count) return null;
  return (
    <View style={styles.damageBadge}>
      <Text style={styles.damageBadgeText}>{count} ضرر</Text>
    </View>
  );
});

function AddCarContent({ navigation }) {
  const { colors } = useTheme();
  const styles     = createStyles(colors);
  const insets     = useSafeAreaInsets();
  const reduxUser = useSelector(selectUser);

  const {
    currentStep, goToStep, damagedCount, isStep3Valid,
    brand, model, year, fuel_type, mileage, wilaya, price_dzd, version, engine,
    damage, damage_details, photos,
  } = useAddCar();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevStep  = useRef(currentStep);

  useEffect(() => {
    const dir = currentStep > prevStep.current ? 1 : -1;
    prevStep.current = currentStep;
    slideAnim.setValue(dir * 40);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 3,
    }).start();
  }, [currentStep]);

  const canGoNext = useMemo(() => {
    if (currentStep === 1) return !!(brand && model && year && fuel_type && mileage && wilaya && price_dzd);
    if (currentStep === 2) return true;
    if (currentStep === 3) return isStep3Valid;
    return true;
  }, [currentStep, brand, model, year, fuel_type, mileage, wilaya, price_dzd, isStep3Valid]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) goToStep(currentStep - 1);
    else navigation?.goBack();
  }, [currentStep, goToStep, navigation]);

  const handleNext = useCallback(async () => {
    if (currentStep < 3) {
      goToStep(currentStep + 1);
      return;
    }

    try {
      if (!reduxUser?.id) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        return;
      }
      const userId = reduxUser.id;

      const base64Images = [];
      for (const [key, uri] of Object.entries(photos || {})) {
        if (!uri || typeof uri !== 'string') continue;
        try {
          const b64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const ext      = (uri.split('.').pop() || '').toLowerCase();
          const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          base64Images.push(`data:${mimeType};base64,${b64}`);
        } catch (e) {
          console.error(`FileSystem failed for ${key}:`, e);
        }
      }

      if (base64Images.length === 0) {
        Alert.alert('خطأ', 'فشل في معالجة الصور، يرجى المحاولة مرة أخرى');
        return;
      }

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id:    userId,
          brand,
          model,
          version:    version   || null,
          engine:     engine    || null,
          year:       Number(year),
          mileage:    Number(mileage),
          fuel_type:  fuelMapping[fuel_type] || fuel_type,
          price_dzd:  Number(price_dzd),
          wilaya:     wilaya    || null,
          car_images: base64Images,
          status:     'pending',
        })
        .select()
        .single();

      if (listingError) throw listingError;

      const isDamaged = (id) => {
        const v = damage[id];
        if (v === undefined || v === null) return false;
        if (typeof v === 'boolean') return v;
        return v !== DAMAGE_STATE.NONE;
      };
      const isCracked = (id) => damage[id] === DAMAGE_STATE.CRACKED;

      const { error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          listing_id:                   listing.id,
          hood_damaged:                 isDamaged('hood'),
          front_bumper_damaged:         isDamaged('front_bumper'),
          rear_bumper_damaged:          isDamaged('rear_bumper'),
          front_left_fender_damaged:    isDamaged('front_fender_left'),
          front_right_fender_damaged:   isDamaged('front_fender_right'),
          back_fender_left_damaged:     isDamaged('back_fender_left'),
          back_fender_right_damaged:    isDamaged('back_fender_right'),
          roof_damaged:                 isDamaged('roof'),
          trunk_damaged:                isDamaged('boot'),
          driver_door_damaged:          isDamaged('driver_door'),
          front_passenger_door_damaged: isDamaged('front_passenger_door'),
          rear_left_door_damaged:       isDamaged('back_passenger_left'),
          rear_right_door_damaged:      isDamaged('back_passenger_right'),
          windshield_damaged:           isDamaged('windshield'),
          windshield_cracked:           isCracked('windshield'),
          rear_windshield_damaged:      isDamaged('rear_windshield'),
          rear_windshield_cracked:      isCracked('rear_windshield'),
          headlight_left_damaged:       isDamaged('headlight_left'),
          headlight_right_damaged:      isDamaged('headlight_right'),
          backlight_left_damaged:       isDamaged('backlight_left'),
          backlight_right_damaged:      isDamaged('backlight_right'),
          damage_details:               damage_details || null,
        });

      if (inspectionError) throw inspectionError;
      navigation?.navigate('ListingSuccess');

    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('خطأ في الإرسال', err.message || 'فشل إرسال الإعلان، حاول مرة أخرى');
    }
  }, [currentStep, goToStep, reduxUser, photos, brand, model, version, engine, year,
      mileage, fuel_type, price_dzd, wilaya, damage, damage_details, navigation]);

  const goTo1 = useCallback(() => goToStep(1), [goToStep]);
  const goTo2 = useCallback(() => goToStep(2), [goToStep]);
  const goTo3 = useCallback(() => goToStep(3), [goToStep]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.hdrBlob1} />
        <View style={styles.hdrBlob2} />
        <View style={styles.hdrInner}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>إضافة سيارة للبيع</Text>
            <Text style={styles.headerSub}>الخطوة {currentStep} من {STEPS.length}</Text>
          </View>
          <View style={styles.headerRight}>
            {currentStep === 2 && <DamageBadge count={damagedCount} colors={colors} />}
          </View>
        </View>
      </View>

      <View style={styles.pillRow}>
        <StepPill step={STEPS[0]} active={currentStep === 1} done={currentStep > 1} onPress={goTo1} colors={colors} />
        <StepPill step={STEPS[1]} active={currentStep === 2} done={currentStep > 2} onPress={goTo2} colors={colors} />
        <StepPill step={STEPS[2]} active={currentStep === 3} done={currentStep > 3} onPress={goTo3} colors={colors} />
      </View>
      <ProgressTrack currentStep={currentStep} colors={colors} />

      <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
        {currentStep === 1 && <Step1TechnicalData />}
        {currentStep === 2 && <Step2DamageMap />}
        {currentStep === 3 && <Step3PhotoUpload />}
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canGoNext && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={!canGoNext}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === 3 ? 'إرسال الإعلان' : 'التالي'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AddCarScreen({ navigation }) {
  return (
    <AddCarProvider>
      <AddCarContent navigation={navigation} />
    </AddCarProvider>
  );
}

const createStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
    position: 'relative',
  },
  hdrBlob1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -80, left: -50,
  },
  hdrBlob2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(201,168,76,0.07)', bottom: -50, right: 20,
  },
  hdrInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radius.full,
    backgroundColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
  },
  backArrow: {
    width: 10, height: 10,
    borderTopWidth: 2, borderRightWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '225deg' }],
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: colors.textInverse,
  },
  headerSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  headerRight: { width: 60, alignItems: 'flex-end' },

  damageBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  damageBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xs,
    color: colors.textInverse,
  },

  pillRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: colors.surface,
    gap: 4,
  },
  pillWrap:        { flex: 1, alignItems: 'center', gap: 5 },
  pillCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  pillCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.actionBlue,
  },
  pillCircleDone:  { backgroundColor: colors.success },
  pillNum: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: colors.textMuted,
  },
  pillNumActive:   { color: colors.textInverse },
  pillCheckmark:   { fontSize: 14, color: colors.textInverse, fontWeight: 'bold' },
  pillLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pillLabelActive: { color: colors.primary },

  trackWrap: {
    marginHorizontal: 20, marginBottom: 2,
    height: 3, borderRadius: 2, overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  trackRail: { ...StyleSheet.absoluteFillObject, backgroundColor: "#1E4E8C" },
  trackFill: { height: '100%', backgroundColor: "#1E4E8C", borderRadius: 2 },

  stepContent: { flex: 1 },
  footer: {
    paddingbottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  nextBtn: {
    backgroundColor: "#1E4E8C",
    height: 52,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '50%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
    marginBottom: Spacing.md , position:"absolute", bottom: Spacing.base, alignSelf: 'center', width: '50%'
  },
  nextBtnDisabled: { backgroundColor: "#1E4E8C" + '80', marginBottom: Spacing.md , position:"absolute", bottom: Spacing.base, alignSelf: 'center', width: '50%' },
  nextBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
});