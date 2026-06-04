import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Modal, FlatList as RNFlatList,
  StatusBar, Alert, ActivityIndicator, InteractionManager, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { supabase } from '../../../supabase';
import { useTheme, Typography, Spacing, Radius } from '../../../context/ThemeContext';


const CURRENT_YEAR = new Date().getFullYear();
const YEARS      = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => String(CURRENT_YEAR - i));
const BRANDS     = ['Renault','Peugeot','Citroën','Dacia','Volkswagen','Toyota','Hyundai','Kia','Fiat','BMW','Mercedes','Audi','أخرى'];
const CATEGORIES = [
  { id: 'Engine',       label: 'المحرك'                    },
  { id: 'Transmission', label: 'علبة السرعات (Boite)'      },
  { id: 'Suspension',   label: 'نظام التعليق'              },
  { id: 'Brakes',       label: 'الفرامل'                   },
  { id: 'Electrical',   label: 'الكهرباء والإلكترونيات'    },
  { id: 'Body',         label: 'الهيكل الخارجي'            },
  { id: 'Interior',     label: 'المقصورة الداخلية'         },
  { id: 'Cooling',      label: 'نظام التبريد'              },
  { id: 'Exhaust',      label: 'نظام العادم (Echappement)' },
  { id: 'Fuel',         label: 'نظام الوقود'               },
  { id: 'Steering',     label: 'نظام التوجيه'              },
  { id: 'Other',        label: 'أخرى'                      },
];
const WILAYAS = [
  "01 أدرار","02 الشلف","03 الأغواط","04 أم البواقي","05 باتنة","06 بجاية",
  "07 بسكرة","08 بشار","09 البليدة","10 البويرة","11 تمنراست","12 تبسة",
  "13 تلمسان","14 تيارت","15 تيزي وزو","16 الجزائر","17 الجلفة","18 جيجل",
  "19 سطيف","20 سعيدة","21 سكيكدة","22 سيدي بلعباس","23 عنابة","24 قالمة",
  "25 قسنطينة","26 المدية","27 مستغانم","28 المسيلة","29 معسكر","30 ورقلة",
  "31 وهران","32 البيض","33 إليزي","34 برج بوعريريج","35 بومرداس","36 الطارف",
  "37 تندوف","38 تسمسيلت","39 الوادي","40 خنشلة","41 سوق أهراس","42 تيبازة",
  "43 ميلة","44 عين الدفلى","45 النعامة","46 عين تموشنت","47 غرداية","48 غليزان",
  "49 تيميمون","50 برج باجي مختار","51 أولاد جلال","52 بني عباس","53 عين صالح",
  "54 عين قزام","55 تقرت","56 جانت","57 المغير","58 المنيعة",
];

const INITIAL_FORM = {
  brand: '', model: '', year: '', category_id: '', category_label: '',
  part_reference: '', description: '', budget_dzd: '', wilaya: '',
};

// ─── PickerModal ──────────────────────────────────────────────────────────────
const PickerModal = React.memo(function PickerModal({ visible, title, options, onSelect, onClose, colors }) {
  const styles  = createStyles(colors);
  const slideUp = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slideUp, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      speed: 16,
      bounciness: 4,
    }).start();
  }, [visible]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.pickItem}
      onPress={() => { onSelect(item); onClose(); }}
      activeOpacity={0.7}
    >
      <Text style={styles.pickItemText}>{item.label || item}</Text>
    </TouchableOpacity>
  ), [onSelect, onClose, styles]);

  const ItemSep      = useCallback(() => <View style={styles.pickSep} />, [styles]);
  const keyExtractor = useCallback((_, i) => String(i), []);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.pickBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.pickSheet, { transform: [{ translateY: slideUp }] }]}>
          <View style={styles.pickHandle} />
          <Text style={styles.pickTitle}>{title}</Text>
          <RNFlatList
            data={options}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={renderItem}
            ItemSeparatorComponent={ItemSep}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
            removeClippedSubviews
          />
        </Animated.View>
      </View>
    </Modal>
  );
});

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const Dropdown = React.memo(function Dropdown({ label, value, placeholder, onPress, colors }) {
  const styles = createStyles(colors);
  return (
    <TouchableOpacity style={styles.ddWrap} onPress={onPress} activeOpacity={0.8}>
      {label ? <Text style={styles.ddFloatLabel}>{label}</Text> : null}
      <View style={styles.ddInner}>
        <Text style={[styles.ddValue, !value && styles.ddPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.ddChevron}>▾</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Sec ──────────────────────────────────────────────────────────────────────
const Sec = React.memo(function Sec({ label, colors }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.secRow}>
      <View style={styles.secBar} />
      <Text style={styles.secText}>{label}</Text>
    </View>
  );
});

// ─── FieldLabel ───────────────────────────────────────────────────────────────
const FieldLabel = React.memo(function FieldLabel({ label, colors }) {
  const styles = createStyles(colors);
  return <Text style={styles.fieldLabel}>{label}</Text>;
});

// ─── PartRequestScreen ────────────────────────────────────────────────────────
export default function PartRequestScreen({ navigation }) {
  const { colors } = useTheme();
  const styles     = createStyles(colors);
  const insets     = useSafeAreaInsets();
  const user       = useSelector(state => state.auth.user);

  const [loading,      setLoading]      = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [form,         setForm]         = useState(INITIAL_FORM);

  const updateForm = useCallback((key, value) =>
    setForm(prev => ({ ...prev, [key]: value })), []);

  const pickerConfig = useMemo(() => ({
    brand:    { title: 'الماركة',    options: BRANDS     },
    year:     { title: 'سنة الصنع', options: YEARS      },
    category: { title: 'الفئة',     options: CATEGORIES },
    wilaya:   { title: 'الولاية',   options: WILAYAS    },
  }), []);

  const handlePickerSelect = useCallback((val) => {
    setActivePicker(prev => {
      setForm(f => {
        if (prev === 'category') return { ...f, category_id: val.id, category_label: val.label };
        return { ...f, [prev]: val };
      });
      return null;
    });
  }, []);

  const closePicker  = useCallback(() => setActivePicker(null),        []);
  const openBrand    = useCallback(() => setActivePicker('brand'),     []);
  const openYear     = useCallback(() => setActivePicker('year'),      []);
  const openCategory = useCallback(() => setActivePicker('category'),  []);
  const openWilaya   = useCallback(() => setActivePicker('wilaya'),    []);
  const handleBack   = useCallback(() => navigation.goBack(),          [navigation]);

  const setModel  = useCallback((v) => updateForm('model',          v), [updateForm]);
  const setRef    = useCallback((v) => updateForm('part_reference', v), [updateForm]);
  const setDesc   = useCallback((v) => updateForm('description',    v), [updateForm]);
  const setBudget = useCallback((v) => updateForm('budget_dzd', v.replace(/[^0-9]/g, '')), [updateForm]);

  const handleSubmit = useCallback(async () => {
    if (!user?.id) { Alert.alert('خطأ', 'يجب تسجيل الدخول لتقديم طلب.'); return; }
    if (!form.category_id || !form.description.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء الحقول الإلزامية (الفئة والوصف).');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('parts_requests').insert([{
        user_id:        user.id,
        brand:          form.brand          || null,
        model:          form.model          || null,
        year:           form.year           ? parseInt(form.year)         : null,
        category:       form.category_id,
        description:    form.description.trim(),
        part_reference: form.part_reference.trim() || null,
        budget_dzd:     form.budget_dzd     ? parseFloat(form.budget_dzd) : null,
        wilaya:         form.wilaya         || null,
      }]);
      if (error) throw error;
      Alert.alert('نجاح', 'تم إرسال طلبك بنجاح. سيقوم المزودون بالتواصل معك قريباً.', [{
        text: 'حسناً',
        onPress: () => InteractionManager.runAfterInteractions(() => navigation.goBack()),
      }]);
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, form, navigation]);

  const cfg = pickerConfig[activePicker] ?? { title: '', options: [] };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.hdrBlob1} />
        <View style={styles.hdrBlob2} />
        <View style={styles.hdrInner}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>طلب قطعة غيار</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={22} color={colors.actionBlue} />
          <Text style={styles.infoText}>
            أدخل تفاصيل القطعة التي تبحث عنها، وسنقوم بتوصيل طلبك للمتاجر المعتمدة.
          </Text>
        </View>

        {/* ── Car info ── */}
        <Sec label="معلومات السيارة (اختياري)" colors={colors} />
        <View style={styles.sectionBox}>
          <Dropdown
            label="الماركة"
            value={form.brand}
            placeholder="اختر الماركة"
            onPress={openBrand}
            colors={colors}
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.ddWrap}>
                <Text style={styles.ddFloatLabel}>الموديل</Text>
                <TextInput
                  value={form.model}
                  onChangeText={setModel}
                  placeholder="مثال: Clio 4"
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                  textAlign="right"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Dropdown
                label="السنة"
                value={form.year}
                placeholder="السنة"
                onPress={openYear}
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* ── Part details ── */}
        <Sec label="تفاصيل القطعة *" colors={colors} />
        <View style={styles.sectionBox}>
          <Dropdown
            label="نوع القطعة *"
            value={form.category_label}
            placeholder="حدد نوع القطعة"
            onPress={openCategory}
            colors={colors}
          />
          <View style={styles.ddWrap}>
            <Text style={styles.ddFloatLabel}>رقم القطعة (Reference) - اختياري</Text>
            <TextInput
              value={form.part_reference}
              onChangeText={setRef}
              placeholder="مثال: 8200XXXXXX"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              textAlign="right"
              keyboardType="ascii-capable"
            />
          </View>
          <View style={[styles.ddWrap, styles.textAreaWrap]}>
            <Text style={styles.ddFloatLabel}>الوصف *</Text>
            <TextInput
              value={form.description}
              onChangeText={setDesc}
              placeholder="اشرح بدقة القطعة التي تحتاجها..."
              placeholderTextColor={colors.placeholder}
              style={styles.textArea}
              textAlign="right"
              textAlignVertical="top"
              multiline
            />
          </View>
        </View>

        {/* ── Extra info ── */}
        <Sec label="معلومات إضافية" colors={colors} />
        <View style={styles.sectionBox}>
          <View style={styles.ddWrap}>
            <Text style={styles.ddFloatLabel}>الميزانية التقريبية (دج)</Text>
            <TextInput
              value={form.budget_dzd}
              onChangeText={setBudget}
              placeholder="مثال: 15000"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              textAlign="right"
              keyboardType="number-pad"
            />
          </View>
          <Dropdown
            label="الولاية"
            value={form.wilaya}
            placeholder="ولاية التواجد"
            onPress={openWilaya}
            colors={colors}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitTxt}>إرسال الطلب</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>

      <PickerModal
        visible={!!activePicker}
        title={cfg.title}
        options={cfg.options}
        onSelect={handlePickerSelect}
        onClose={closePicker}
        colors={colors}
      />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    overflow: 'hidden',
    position: 'relative',
  },
  hdrBlob1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -80, left: -50 },
  hdrBlob2: { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(201,168,76,0.07)', bottom: -50, right: 20 },
  hdrInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 38, height: 38, borderRadius: Radius.full,
    backgroundColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: colors.textInverse,
    textAlign: 'center',
  },

  // Content
  content:    { padding: Spacing.base, paddingBottom: 60 },
  sectionBox: { gap: 10, marginBottom: 4 },
  row:        { flexDirection: 'row-reverse', gap: 10 },

  // Info banner
  infoBox: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.actionBlue + '12',
    padding: Spacing.base,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.actionBlue + '33',
  },
  infoText: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: colors.actionBlue,
    textAlign: 'right',
    lineHeight: 20,
  },

  secRow:  { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 10 },
  secBar:  { width: 3, height: 18, borderRadius: 2, backgroundColor: colors.actionBlue },
  secText: { fontFamily: Typography.fontFamily.bold, fontSize: 15, color: colors.textPrimary },

  ddWrap: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  ddFloatLabel: {
    position: 'absolute',
    top: -9, right: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    fontSize: 10,
    color: colors.textSecondary,
    zIndex: 1,
    fontFamily: Typography.fontFamily.medium,
  },
  ddInner:       { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  ddValue:       { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: colors.textPrimary },
  ddPlaceholder: { color: colors.placeholder },
  ddChevron:     { fontSize: 16, color: colors.textMuted },

  input: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: colors.textPrimary,
    height: 54,
  },
  textAreaWrap: { minHeight: 110, justifyContent: 'flex-start', paddingTop: 18 },
  textArea: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: colors.textPrimary,
    minHeight: 80,
    width: '100%',
  },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: Radius.full,
    height: 54,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitTxt: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },

  pickBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickSheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  pickHandle:   { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.divider, marginVertical: 12 },
  pickTitle:    { fontFamily: Typography.fontFamily.bold, fontSize: 17, textAlign: 'center', paddingBottom: 14, borderBottomWidth: 0.5, borderColor: colors.divider, color: colors.textPrimary },
  pickItem:     { padding: 17, alignItems: 'center' },
  pickItemText: { fontFamily: Typography.fontFamily.medium, fontSize: 15, color: colors.textPrimary },
  pickSep:      { height: 0.5, backgroundColor: colors.divider },
});