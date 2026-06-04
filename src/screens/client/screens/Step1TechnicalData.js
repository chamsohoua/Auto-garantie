import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  FlatList, TextInput, StyleSheet, Animated,
} from 'react-native';
import { useAddCar } from '../../../context/AddCarContext';
import { useTheme, Typography, Spacing, Radius } from '../../../context/ThemeContext';


const BRANDS = [
  { id: 'renault',    name: 'Renault'    },
  { id: 'peugeot',    name: 'Peugeot'    },
  { id: 'citroen',    name: 'Citroën'    },
  { id: 'dacia',      name: 'Dacia'      },
  { id: 'volkswagen', name: 'Volkswagen' },
  { id: 'toyota',     name: 'Toyota'     },
  { id: 'hyundai',    name: 'Hyundai'    },
  { id: 'kia',        name: 'Kia'        },
  { id: 'fiat',       name: 'Fiat'       },
  { id: 'seat',       name: 'Seat'       },
  { id: 'opel',       name: 'Opel'       },
  { id: 'bmw',        name: 'BMW'        },
  { id: 'mercedes',   name: 'Mercedes'   },
  { id: 'audi',       name: 'Audi'       },
  { id: 'nissan',     name: 'Nissan'     },
  { id: 'other',      name: 'أخرى'       },
];
const BRAND_NAMES = BRANDS.map(b => b.name);

const MODELS_BY_BRAND = {
  renault:    ['Clio 3','Clio 4','campus','Megane 4','Logan','Symbol','Megane 3','Duster','Captur','Talisman','Kadjar'],
  peugeot:    ['206','207','208','301','308','3008','5008','508'],
  citroen:    ['C3','C4','C5','Berlingo','DS3'],
  dacia:      ['Logan','Sandero','Duster','Dokker','Lodgy'],
  volkswagen: ['Golf','Polo','Passat','Tiguan','Jetta'],
  toyota:     ['Yaris','Corolla','Camry','RAV4','Hilux','Land Cruiser'],
  hyundai:    ['i10','i20','i30','Elantra','Tucson','Santa Fe'],
  kia:        ['Picanto','Rio','Cerato','Sportage','Sorento'],
  fiat:       ['Punto','Palio','Bravo','Stilo','500'],
  bmw:        ['Serie 1','Serie 3','Serie 5','X1','X3','X5'],
  mercedes:   ['Classe A','Classe C','Classe E','GLC','GLE'],
  audi:       ['A3','A4','A6','Q3','Q5','Q7'],
  other:      ['أخرى'],
};

const ENGINES      = ['1.0','1.2','1.2 TCe','1.4','1.5 dCi','1.6','1.6 HDi','1.9 D','2.0','2.0 TDi','3.0'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => String(CURRENT_YEAR - i));
const WILAYAS      = [
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
const FUEL_OPTIONS = ['بنزين','ديزل','GPL','هجين'];

const PickerModal = React.memo(function PickerModal({ visible, title, options, onSelect, onClose }) {
  const { colors } = useTheme();
  const styles     = createStyles(colors);
  const slideUp    = useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    Animated.spring(slideUp, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      speed: 16,
      bounciness: 4,
    }).start();
  }, [visible]);

  const renderItem   = useCallback(({ item }) => (
    <TouchableOpacity style={styles.pickItem} onPress={() => { onSelect(item); onClose(); }} activeOpacity={0.7}>
      <Text style={styles.pickItemText}>{item}</Text>
    </TouchableOpacity>
  ), [onSelect, onClose, styles]);

  const ItemSep      = useCallback(() => <View style={styles.pickSep} />, [styles]);
  const keyExtractor = useCallback((_, i) => String(i), []);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.pickBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.pickSheet, { transform: [{ translateY: slideUp }] }]}>
          <View style={styles.pickHandle} />
          <Text style={styles.pickTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={renderItem}
            ItemSeparatorComponent={ItemSep}
            initialNumToRender={14}
            maxToRenderPerBatch={14}
            windowSize={5}
            removeClippedSubviews
          />
        </Animated.View>
      </View>
    </Modal>
  );
});

const Dropdown = React.memo(function Dropdown({ label, value, placeholder, onPress }) {
  const { colors } = useTheme();
  const styles     = createStyles(colors);
  return (
    <TouchableOpacity style={styles.ddWrap} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.ddFloatLabel}>{label}</Text>
      <View style={styles.ddInner}>
        <Text style={[styles.ddValue, !value && styles.ddPlaceholder]}>{value || placeholder}</Text>
        <Text style={styles.ddChevron}>▾</Text>
      </View>
    </TouchableOpacity>
  );
});

const Sec = React.memo(function Sec({ label }) {
  const { colors } = useTheme();
  const styles     = createStyles(colors);
  return (
    <View style={styles.secRow}>
      <View style={styles.secBar} />
      <Text style={styles.secText}>{label}</Text>
    </View>
  );
});

const FuelChip = React.memo(function FuelChip({ fuel, active, onPress, colors }) {
  const styles      = createStyles(colors);
  const handlePress = useCallback(() => onPress(fuel), [fuel, onPress]);
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.fuelChip, active && styles.fuelChipActive]}
    >
      <Text style={[styles.fuelText, active && styles.fuelTextActive]}>{fuel}</Text>
    </TouchableOpacity>
  );
});

export default function Step1TechnicalData() {
  const { colors } = useTheme();
  const styles     = createStyles(colors);

  const {
    brand, model, version, engine,
    year, mileage, fuel_type, wilaya, price_dzd,
    setField,
  } = useAddCar();

  const [modal, setModal] = useState(null);

  const modelList = useMemo(() =>
    brand ? (MODELS_BY_BRAND[brand] || []) : [],
  [brand]);

  const brandDisplayName = useMemo(() =>
    BRANDS.find(b => b.id === brand)?.name || '',
  [brand]);

  const openBrand  = useCallback(() => setModal('brand'),  []);
  const openModel  = useCallback(() => setModal('model'),  []);
  const openEngine = useCallback(() => setModal('engine'), []);
  const openYear   = useCallback(() => setModal('year'),   []);
  const openWilaya = useCallback(() => setModal('wilaya'), []);
  const closeModal = useCallback(() => setModal(null),     []);

  const setVersion = useCallback((v) => setField('version',   v), [setField]);
  const setMileage = useCallback((v) => setField('mileage',   v), [setField]);
  const setPrice   = useCallback((v) => setField('price_dzd', v), [setField]);

  const handleBrandSelect = useCallback((v) => {
    const found = BRANDS.find(b => b.name === v);
    if (found) {
      setField('brand', found.id);
      setField('model', '');
      setTimeout(() => setModal('model'), 400);
    }
  }, [setField]);

  const handleModelSelect  = useCallback((v) => {
    if (v !== 'يرجى اختيار الماركة أولاً') setField('model', v);
  }, [setField]);

  const handleEngineSelect = useCallback((v) => setField('engine',    v), [setField]);
  const handleYearSelect   = useCallback((v) => setField('year',      v), [setField]);
  const handleWilayaSelect = useCallback((v) => setField('wilaya',    v), [setField]);
  const handleFuelSelect   = useCallback((f) => setField('fuel_type', f), [setField]);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Sec label="الماركة" />
      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Dropdown label="الماركة *" value={brandDisplayName} placeholder="اختر الماركة" onPress={openBrand} />
        </View>
      </View>

      <Sec label="الموديل والنسخة" />
      <View style={styles.twoCol}>
        <View style={{ flex: 1.2 }}>
          <Dropdown label="الموديل *" value={model} placeholder="اختر الموديل" onPress={openModel} />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="النسخة (GT Line...)"
            placeholderTextColor={colors.placeholder}
            value={version}
            onChangeText={setVersion}
            style={styles.textInput}
            textAlign="right"
          />
        </View>
      </View>

      <Sec label="المحرك والسنة" />
      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Dropdown label="المحرك" value={engine} placeholder="مثال: 1.5" onPress={openEngine} />
        </View>
        <View style={{ flex: 1 }}>
          <Dropdown label="السنة *" value={year ? String(year) : ''} placeholder="2024" onPress={openYear} />
        </View>
      </View>

      <Sec label="نوع الوقود *" />
      <View style={styles.fuelGrid}>
        {FUEL_OPTIONS.map((f) => (
          <FuelChip key={f} fuel={f} active={fuel_type === f} onPress={handleFuelSelect} colors={colors} />
        ))}
      </View>

      <Sec label="المسافة والموقع" />
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>المسافة المقطوعة (كم) *</Text>
        <TextInput
          placeholder="أدخل عدد الكيلومترات..."
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={mileage ? String(mileage) : ''}
          onChangeText={setMileage}
          style={styles.textInputFull}
          textAlign="right"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>السعر (دج) *</Text>
        <TextInput
          placeholder="أدخل السعر بالدينار الجزائري..."
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={price_dzd ? String(price_dzd) : ''}
          onChangeText={setPrice}
          style={styles.textInputFull}
          textAlign="right"
        />
      </View>

      <Dropdown label="الولاية *" value={wilaya} placeholder="اختر الولاية" onPress={openWilaya} />

      <View style={{ height: 100 }} />

      <PickerModal visible={modal === 'brand'}  title="الماركة"      options={BRAND_NAMES}                                          onSelect={handleBrandSelect}  onClose={closeModal} />
      <PickerModal visible={modal === 'model'}  title="اختر الموديل" options={modelList.length ? modelList : ['يرجى اختيار الماركة أولاً']} onSelect={handleModelSelect}  onClose={closeModal} />
      <PickerModal visible={modal === 'engine'} title="سعة المحرك"   options={ENGINES}                                              onSelect={handleEngineSelect} onClose={closeModal} />
      <PickerModal visible={modal === 'year'}   title="سنة الصنع"    options={YEARS}                                                onSelect={handleYearSelect}   onClose={closeModal} />
      <PickerModal visible={modal === 'wilaya'} title="الولاية"      options={WILAYAS}                                              onSelect={handleWilayaSelect} onClose={closeModal} />
    </ScrollView>
  );
}
const createStyles = (colors) => StyleSheet.create({
  scroll:         { padding: Spacing.base },
  twoCol:         { flexDirection: 'row-reverse', gap: 12, marginBottom: 15 },

  textInput: {
    flex: 1, height: 54,
    borderRadius: Radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    fontSize: Typography.fontSize.sm,
    color: colors.textPrimary,
  },
  textInputFull: {
    height: 54,
    borderRadius: Radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    fontSize: Typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: 15,
  },
  inputWrapper:   { marginBottom: 10 },
  inputLabel:     { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 5, marginRight: 5 },

  fuelGrid:       { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  fuelChip: {
    flex: 1, minWidth: '22%', height: 45,
    borderRadius: Radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  fuelChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  fuelText:       { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: colors.textSecondary },
  fuelTextActive: { fontFamily: Typography.fontFamily.bold,   fontSize: Typography.fontSize.sm, color: "#fff" },

  
  ddWrap: {
    height: 54,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  ddFloatLabel: {
    position: 'absolute', top: -9, right: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    fontSize: 10,
    color: colors.textSecondary,
    zIndex: 1,
  },
  ddInner:      { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  ddValue:      { fontSize: Typography.fontSize.sm, color: colors.textPrimary },
  ddPlaceholder:{ color: colors.placeholder },
  ddChevron:    { fontSize: 16, color: colors.textMuted },

  pickBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  pickHandle:   { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.divider, marginVertical: 12 },
  pickTitle:    { fontFamily: Typography.fontFamily.bold, fontSize: 17, textAlign: 'center', paddingBottom: 14, borderBottomWidth: 0.5, borderColor: colors.divider, color: colors.textPrimary },
  pickItem:     { padding: 17, alignItems: 'center' },
  pickItemText: { fontFamily: Typography.fontFamily.medium, fontSize: 15, color: colors.textPrimary },
  pickSep:      { height: 0.5, backgroundColor: colors.divider },

  secRow:  { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 10 },
  secBar:  { width: 3, height: 18, borderRadius: 2, backgroundColor: colors.actionBlue },
  secText: { fontFamily: Typography.fontFamily.bold, fontSize: 15, color: colors.textPrimary },
});
