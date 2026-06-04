import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ScrollView, RefreshControl, TextInput,
  StatusBar, Dimensions, Modal, FlatList as RNFlatList,
  Platform, Animated,
  I18nManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabase';
import { useTheme, Typography, Spacing, Radius  } from '../../../context/ThemeContext';

I18nManager.forceRTL(true);
const { width: SW } = Dimensions.get('window');
const CARD_W        = SW - Spacing.base * 2;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => String(CURRENT_YEAR - i));

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

const ENGINES = ['1.0','1.2','1.2 TCe','1.4','1.5 dCi','1.6','1.6 HDi','1.9 D','2.0','2.0 TDi','3.0'];

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

const FUEL_OPTIONS = [
  { value: 'all',   label: 'الكل'  },
  { value: 'بنزين', label: 'بنزين' },
  { value: 'ديزل',  label: 'ديزل'  },
  { value: 'GPL',   label: 'GPL'   },
  { value: 'هجين',  label: 'هجين'  },
];

const DEFAULT_FILTER = {
  brand: '', model: '', fuel_type: 'all', engine: '',
  year_min: '', year_max: '', price_min: '', price_max: '',
  mileage_max: '', wilaya: '',
};

const isNew          = (d) => d && (Date.now() - new Date(d).getTime()) < 3 * 86400000;
const isFilterActive = (f) =>
  f.brand || f.model || f.fuel_type !== 'all' || f.engine ||
  f.year_min || f.year_max || f.price_min || f.price_max ||
  f.mileage_max || f.wilaya;

const formatPrice = (p) => {
  if (!p) return '—';
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}م`;
  if (p >= 1_000)     return `${Math.round(p / 1_000)}k`;
  return String(p);
};

const toImageSource = (raw) => {
  if (!raw) return null;
  if (raw.startsWith('http'))       return { uri: raw };
  if (raw.startsWith('data:image')) return { uri: raw };
  return { uri: `data:image/jpeg;base64,${raw}` };
};

function PickerModal({ visible, title, options, onSelect, onClose }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity 
          style={styles.pickBackdrop} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        <View style={styles.pickSheet}>
          <View style={styles.pickHandle} />
          <Text style={styles.pickTitle}>{title}</Text>
          
          <RNFlatList
            data={options}
            keyExtractor={(_, i) => String(i)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.pickItem} 
                onPress={() => { onSelect(item); onClose(); }} 
                activeOpacity={0.7}
              >
                <Text style={styles.pickItemText}>{item || '—'}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.pickSep} />}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
          />
        </View>
      </View>
    </Modal>
  );
}

export function Dropdown({ label, value, placeholder, onPress }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <TouchableOpacity style={styles.ddWrap} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.ddFloatLabel}>{label}</Text>
      <View style={styles.ddInner}>
        <Text style={[styles.ddValue, !value && styles.ddPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.ddChevron}>▾</Text>
      </View>
    </TouchableOpacity>
  );
}


export function Sec({ label }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.secRow}>
      <View style={styles.secBar} />
      <Text style={styles.secText}>{label}</Text>
    </View>
  );
}

export function Header({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.hdrWrap, { paddingTop: 45 }]}>
      <View style={styles.hdrBlob1} />
      <View style={styles.hdrBlob2} />
      <View style={styles.hdrInner}>
        <TouchableOpacity 
          style={styles.hdrProfileBtn} 
          onPress={() => navigation.navigate('Profile')} 
          activeOpacity={0.75}
        >
          <Ionicons name="person" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.hdrBrand}>
          <View>
            <Text style={styles.hdrTitle}>Auto Granatie</Text>
            <Text style={styles.hdrSubtitle}>سوق السيارات الموثوق</Text>
          </View>
            <View style={styles.hdrBadge}>
            <Image 
              source={require('../../../../assets/icon1.png')} 
              style={{ width: 111, height: 111 }} 
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function SearchBar({ value, onChange, onFilterPress, hasActiveFilter }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.sbRow}>
      <TouchableOpacity
        style={[styles.sbFilterBtn, hasActiveFilter && styles.sbFilterBtnActive]}
        onPress={onFilterPress}
        activeOpacity={0.8}
      >
        <Ionicons name="options-outline" size={20} color="white" />
        {hasActiveFilter && <View style={styles.sbFilterDot} />}
      </TouchableOpacity>
      <View style={[styles.sbWrap, focused && styles.sbWrapFocused, { flex: 1 }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="ابحث: ماركة، موديل، ولاية..."
          placeholderTextColor={colors.placeholder}
          style={styles.sbInput}
          textAlign="right"
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

function FilterModal({
  visible, draft, setDraft, onApply, onClose,
  onOpenPicker, activePicker, pickerConfig, onSelectPicker, onClosePicker,
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  if (!visible) return null;
  const cfg = pickerConfig[activePicker] ?? { title: '', options: [] };

  function set(key, val) { setDraft(d => ({ ...d, [key]: val })); }

  const brandDisplayName = BRANDS.find(b => b.id === draft.brand)?.name || '';

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.fmBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.fmSheet}>
        <View style={styles.fmSheetHeader}>
          <TouchableOpacity onPress={onClose} style={styles.fmCloseBtn}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.fmSheetTitle}>تصفية النتائج</Text>
          <TouchableOpacity onPress={() => setDraft(DEFAULT_FILTER)}>
            <Text style={styles.fmResetTxt}>إعادة تعيين</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.fmBody}>
          <Sec label="الماركة" />
          <Dropdown label="الماركة" value={brandDisplayName} placeholder="كل الماركات" onPress={() => onOpenPicker('brand')} />
          {draft.brand ? (
            <TouchableOpacity onPress={() => { set('brand', ''); set('model', ''); }} style={styles.fmClearRow}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
              <Text style={styles.fmClearTxt}>إلغاء الماركة</Text>
            </TouchableOpacity>
          ) : null}

          <Sec label="الموديل" />
          <Dropdown
            label="الموديل"
            value={draft.model}
            placeholder={draft.brand ? 'اختر الموديل' : 'اختر الماركة أولاً'}
            onPress={() => draft.brand && onOpenPicker('model')}
          />
          {draft.model ? (
            <TouchableOpacity onPress={() => set('model', '')} style={styles.fmClearRow}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
              <Text style={styles.fmClearTxt}>إلغاء الموديل</Text>
            </TouchableOpacity>
          ) : null}

          <Sec label="نوع الوقود" />
          <View style={styles.fmChipRow}>
            {FUEL_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.fmChip, draft.fuel_type === o.value && styles.fmChipActive]}
                onPress={() => set('fuel_type', o.value)}
              >
                <Text style={[styles.fmChipTxt, draft.fuel_type === o.value && styles.fmChipTxtActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Sec label="المحرك" />
          <Dropdown label="سعة المحرك" value={draft.engine} placeholder="كل المحركات" onPress={() => onOpenPicker('engine')} />
          {draft.engine ? (
            <TouchableOpacity onPress={() => set('engine', '')} style={styles.fmClearRow}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
              <Text style={styles.fmClearTxt}>إلغاء المحرك</Text>
            </TouchableOpacity>
          ) : null}

          <Sec label="سنة الصنع" />
          <View style={styles.fmRangeRow}>
            <View style={{ flex: 1 }}><Dropdown label="من" value={draft.year_min} placeholder="1990" onPress={() => onOpenPicker('year_min')} /></View>
            <View style={styles.fmRangeDivider} />
            <View style={{ flex: 1 }}><Dropdown label="إلى" value={draft.year_max} placeholder={String(CURRENT_YEAR)} onPress={() => onOpenPicker('year_max')} /></View>
          </View>

          <Sec label="السعر (دج)" />
          <View style={styles.fmRangeRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.ddWrap}>
                <Text style={styles.ddFloatLabel}>من</Text>
                <TextInput value={draft.price_min} onChangeText={v => set('price_min', v.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={colors.placeholder} keyboardType="number-pad" style={styles.fmInlineInput} textAlign="right" />
              </View>
            </View>
            <View style={styles.fmRangeDivider} />
            <View style={{ flex: 1 }}>
              <View style={styles.ddWrap}>
                <Text style={styles.ddFloatLabel}>إلى</Text>
                <TextInput value={draft.price_max} onChangeText={v => set('price_max', v.replace(/[^0-9]/g, ''))} placeholder="∞" placeholderTextColor={colors.placeholder} keyboardType="number-pad" style={styles.fmInlineInput} textAlign="right" />
              </View>
            </View>
          </View>

          <Sec label="الكيلومتراج الأقصى" />
          <View style={styles.ddWrap}>
            <Text style={styles.ddFloatLabel}>الكيلومتراج (km)</Text>
            <TextInput value={draft.mileage_max} onChangeText={v => set('mileage_max', v.replace(/[^0-9]/g, ''))} placeholder="مثال: 150000" placeholderTextColor={colors.placeholder} keyboardType="number-pad" style={styles.fmInlineInput} textAlign="right" />
          </View>

          <Sec label="الولاية" />
          <Dropdown label="الولاية" value={draft.wilaya} placeholder="اختر الولاية" onPress={() => onOpenPicker('wilaya')} />
          {draft.wilaya ? (
            <TouchableOpacity onPress={() => set('wilaya', '')} style={styles.fmClearRow}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
              <Text style={styles.fmClearTxt}>إلغاء الولاية</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <View style={styles.fmFooter}>
          <TouchableOpacity style={styles.fmApplyBtn} onPress={onApply} activeOpacity={0.85}>
            <Ionicons name="search" size={18} color="#fff" style={{ marginLeft: 6 }} />
            <Text style={styles.fmApplyTxt}>بحث بهذه الفلاتر</Text>
          </TouchableOpacity>
        </View>

        <PickerModal
          visible={!!activePicker}
          title={cfg.title}
          options={cfg.options}
          onSelect={onSelectPicker}
          onClose={onClosePicker}
        />
      </View>
    </Modal>
  );
}

function FilterHeader({ onClose, onReset }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <>
      <TouchableOpacity onPress={onClose} style={styles.fmCloseBtn}>
        <Ionicons name="close" size={20} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.fmSheetTitle}>تصفية النتائج</Text>
      <TouchableOpacity onPress={onReset}>
        <Text style={styles.fmResetTxt}>إعادة تعيين</Text>
      </TouchableOpacity>
    </>
  );
}

function Skeleton({ opacity }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Animated.View style={[styles.sklCard, { opacity }]}>
      <View style={styles.sklImg} />
      <View style={{ padding: Spacing.sm, gap: 8 }}>
        <View style={styles.sklLine} />
        <View style={[styles.sklLine, { width: '55%' }]} />
        <View style={[styles.sklLine, { width: '35%', height: 6 }]} />
      </View>
    </Animated.View>
  );
}

function CarCard({ item, onPress }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const img          = toImageSource(item.car_images?.[0]);
  const mileageLabel = item.mileage;
  const scale        = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[styles.ccOuter, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.ccImageBox}>
          {img ? (
            <Image source={img} style={styles.ccImage} resizeMode="cover" fadeDuration={0} />
          ) : (
            <View style={styles.ccNoImage}>
              <View style={styles.ccCarBody} />
              <View style={styles.ccCarRoof} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(5, 25, 55, 0.8)']}
            style={styles.ccGradientOverlay}
          >
            <View style={styles.ccPriceRow}>
              <Text style={styles.ccPriceDz}>مليون </Text>
              <Text style={styles.ccPriceNum}>{formatPrice(item.price_dzd)}</Text>
            </View>
          </LinearGradient>

          {isNew(item.created_at) && (
            <View style={styles.ccNewPill}>
              <Text style={styles.ccNewText}>جديد</Text>
            </View>
          )}
        </View>

        <View style={styles.ccInfo}>
          <View style={styles.ccInfoTop}>
            <Text style={styles.ccBrandText} numberOfLines={1}>{item.brand} {item.model}</Text>
            <View style={styles.ccYearChip}>
              <Text style={styles.ccYearChipTxt}>{item.year}</Text>
            </View>
          </View>

          {item.engine ? (
            <Text style={styles.ccEngineText}>{item.engine}</Text>
          ) : null}

          <View style={styles.ccInfoBottom}>
            <View style={styles.ccTag}>
              <Ionicons name="speedometer-outline" size={11} color={colors.textMuted} />
              <Text style={styles.ccTagTxt}>{mileageLabel} km</Text>
            </View>
            {item.fuel_type ? (
              <View style={styles.ccTag}>
                <Ionicons name="flame-outline" size={11} color={colors.textMuted} />
                <Text style={styles.ccTagTxt}>{item.fuel_type}</Text>
              </View>
            ) : null}
            {item.wilaya ? (
              <View style={[styles.ccTag, styles.ccLocTag, {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderRadius: Radius.full, borderWidth: 0, borderColor: colors.border, backgroundColor: "transparent"}]}>
                <View style={styles.ccLocDot} />
                <Text style={[styles.ccTagTxt, { fontSize: 16, fontWeight: '700' }]} numberOfLines={1}>{item.wilaya}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
function Empty({ query }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.empWrap}>
      <View style={styles.empIconWrap}>
        <View style={styles.empCarBody} />
        <View style={styles.empCarRoof} />
        <Text style={styles.empQ}>؟</Text>
      </View>
      <Text style={styles.empTitle}>لا توجد نتائج</Text>
      <Text style={styles.empSub}>{query ? `لم نجد "${query}"` : 'لا يوجد إعلانات منشورة حالياً'}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
  const styles = createStyles(colors);
  const [activePicker,  setActivePicker]  = useState(null);
  const [listings,      setListings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [query,         setQuery]         = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [draft,         setDraft]         = useState(DEFAULT_FILTER);
  const [applied,       setApplied]       = useState(DEFAULT_FILTER);

  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  async function fetchListings(q = '', f = DEFAULT_FILTER) {
    try {
      let qb = supabase
        .from('listings')
        .select('id,brand,model,version,engine,year,mileage,fuel_type,price_dzd,wilaya,car_images,created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(40);

      if (f.brand)               qb = qb.eq('brand', f.brand);
      if (f.model)               qb = qb.ilike('model', `%${f.model}%`);
      if (f.fuel_type !== 'all') qb = qb.eq('fuel_type', f.fuel_type);
      if (f.engine)              qb = qb.eq('engine', f.engine);
      if (f.year_min)            qb = qb.gte('year', parseInt(f.year_min));
      if (f.year_max)            qb = qb.lte('year', parseInt(f.year_max));
      if (f.price_min)           qb = qb.gte('price_dzd', parseFloat(f.price_min));
      if (f.price_max)           qb = qb.lte('price_dzd', parseFloat(f.price_max));
      if (f.mileage_max)         qb = qb.lte('mileage', parseInt(f.mileage_max));
      if (f.wilaya)              qb = qb.ilike('wilaya', `%${f.wilaya}%`);
      if (q.trim())              qb = qb.or(`brand.ilike.%${q}%,model.ilike.%${q}%,wilaya.ilike.%${q}%`);

      const { data } = await qb;
      setListings(data || []);
    } catch {
      setListings([]);
    }
  }

  useEffect(() => {
    fetchListings('', DEFAULT_FILTER).finally(() => setLoading(false));
  }, []);

  const debounceRef = useRef(null);
  function handleSearch(v) {
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchListings(v, applied), 380);
  }

  function handleApplyFilter() {
    setApplied(draft);
    setFilterVisible(false);
    fetchListings(query, draft);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchListings(query, applied);
    setRefreshing(false);
  }

  function handlePickerSelect(pickerKey, value) {
    setDraft(d => {
      const next = { ...d, [pickerKey]: value };
      if (pickerKey === 'brand') {
        const found = BRANDS.find(b => b.name === value);
        next.brand = found ? found.id : value;
        next.model = '';
      }
      return next;
    });
    setActivePicker(null);
    if (pickerKey === 'brand') setTimeout(() => setActivePicker('model'), 300);
  }

  function handleClearFilters() {
    setApplied(DEFAULT_FILTER);
    setDraft(DEFAULT_FILTER);
    fetchListings(query, DEFAULT_FILTER);
  }

  const pickerConfig = {
    brand:    { title: 'الماركة',    options: BRAND_NAMES },
    model:    { title: 'الموديل',    options: draft.brand ? (MODELS_BY_BRAND[draft.brand] || []) : [] },
    engine:   { title: 'سعة المحرك', options: ['', ...ENGINES] },
    year_min: { title: 'من سنة',     options: ['', ...YEARS] },
    year_max: { title: 'إلى سنة',    options: ['', ...YEARS] },
    wilaya:   { title: 'الولاية',    options: ['', ...WILAYAS] },
  };

  const hasActive = isFilterActive(applied);
const ListHeader = (
    <View>
      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChange={handleSearch}
          onFilterPress={() => { setDraft(applied); setFilterVisible(true); }}
          hasActiveFilter={hasActive}
        />
      </View>
      {!loading && (
        <View style={styles.countRow}>
          <View style={styles.liveIndicator} />
          <Text style={styles.countText}>{listings.length} إعلان</Text>
          {hasActive && (
            <TouchableOpacity onPress={handleClearFilters} style={styles.clearFilterBtn}>
              <Ionicons name="close-circle" size={13} color={colors.actionBlue} />
              <Text style={styles.clearFilterTxt}>إلغاء الفلاتر</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sortText}>الأحدث أولاً</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />
      <Header navigation={navigation} />

      <FilterModal
        visible={filterVisible}
        draft={draft}
        setDraft={setDraft}
        onApply={handleApplyFilter}
        onClose={() => setFilterVisible(false)}
        onOpenPicker={setActivePicker}
        activePicker={activePicker}
        pickerConfig={pickerConfig}
        onSelectPicker={(v) => handlePickerSelect(activePicker, v)}
        onClosePicker={() => setActivePicker(null)}
      />

      {loading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map(i => <Skeleton key={i} opacity={pulseAnim} />)}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<Empty query={query} />}
          renderItem={({ item }) => (
            <CarCard
              item={item}
              onPress={(itemData) => navigation.navigate('DetailsScreen', { item: itemData })}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.actionBlue}
              colors={[colors.actionBlue]}
            />
          }
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={5}
          updateCellsBatchingPeriod={80}
        />
      )}
    </View>
  );
}
const IMAGE_H = CARD_W * 0.56;

const createStyles = (colors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.background },
  searchWrap:     { paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  content:        { paddingHorizontal: Spacing.base, paddingBottom: 120, gap: 12 },
  countRow:       { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  liveIndicator:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  countText:      { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: colors.textPrimary },
  sortText:       { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: colors.textMuted, textAlign: 'left' },
  clearFilterBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, backgroundColor: colors.actionBlue + '15', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  clearFilterTxt: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: colors.actionBlue },
  skeletonGrid:   { gap: 12, padding: Spacing.base },

  hdrWrap:       { backgroundColor: colors.primary, paddingHorizontal: Spacing.base, overflow: 'hidden', position: 'relative' },
  hdrBlob1:      { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -80, left: -50 },
  hdrBlob2:      { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(201,168,76,0.07)', bottom: -50, right: 20 },
  hdrInner:      { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  hdrBrand:      { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  hdrBadge:      { width: 88, height: 88, borderRadius: 99, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hdrTitle:      { fontSize: Typography.fontSize.md, color: colors.textInverse, fontWeight: 'bold' },
  hdrSubtitle:   { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  hdrProfileBtn: { backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: Radius.full, padding: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' },


  sbRow:            { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  sbWrap:           { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: colors.surface, borderRadius: Radius.full, height: 50, paddingHorizontal: Spacing.base, gap: 8, borderWidth: 1, borderColor: colors.border },
  sbWrapFocused:    { borderColor: colors.actionBlue, borderWidth: 1.5 },
  sbInput:          { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: colors.textPrimary },
  sbFilterBtn:      { width: 50, height: 50, borderRadius: Radius.full, backgroundColor: "#1E4E8C", alignItems: 'center', justifyContent: 'center' },
  sbFilterBtnActive:{ backgroundColor: "#1E4E8C" },
  sbFilterDot:      { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold, borderWidth: 1.5, borderColor: colors.surface },

  fmBackdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  fmSheet:        { position: 'absolute', top: 0, bottom: 0, left: SW * 0.15, right: 0, backgroundColor: colors.surface, borderLeftWidth: 0.5, borderLeftColor: 'rgba(0,0,0,0.1)' },
  fmSheetHeader:  { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 52, paddingBottom: Spacing.base, borderBottomWidth: 0.5, borderBottomColor: colors.divider, backgroundColor: colors.primary },
  fmCloseBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  fmSheetTitle:   { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: colors.surface },
  fmResetTxt:     { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: colors.surface },
  fmBody:         { padding: Spacing.base, gap: 4, paddingBottom: 20 },
  fmChipRow:      { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  fmChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  fmChipActive:   { backgroundColor: colors.actionBlue, borderColor: colors.actionBlue },
  fmChipTxt:      { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: colors.textSecondary },
  fmChipTxtActive:{ color: '#fff' },
  fmRangeRow:     { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  fmRangeDivider: { width: 16, height: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 8 },
  fmInlineInput:  { fontSize: 14, color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, height: 24 },
  fmClearRow:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 2, alignSelf: 'flex-end' },
  fmClearTxt:     { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: colors.textMuted },
  fmFooter:       { padding: Spacing.base, paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base, borderTopWidth: 0.5, borderTopColor: colors.divider },
  fmApplyBtn:     { backgroundColor: colors.actionBlue, borderRadius: Radius.full, height: 52, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fmApplyTxt:     { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: '#fff' },

  ddWrap:        { height: 54, borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, backgroundColor: colors.surface, paddingHorizontal: 15, justifyContent: 'center', position: 'relative', marginBottom: 4 },
  ddFloatLabel:  { position: 'absolute', top: -9, right: 12, backgroundColor: colors.surface, paddingHorizontal: 4, fontSize: 10, color: colors.textSecondary, zIndex: 1 },
  ddInner:       { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  ddValue:       { fontSize: 14, color: colors.textPrimary },
  ddPlaceholder: { color: colors.placeholder },
  ddChevron:     { fontSize: 16, color: colors.textMuted },


  pickBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickSheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  pickHandle:   { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.divider, marginVertical: 12 },
  pickTitle:    { fontSize: 17, fontWeight: '600', textAlign: 'center', paddingBottom: 14, borderBottomWidth: 0.5, borderColor: colors.divider, color: colors.textPrimary },
  pickItem:     { padding: 17, alignItems: 'center' },
  pickItemText: { fontSize: 15, color: colors.textPrimary, fontFamily: Typography.fontFamily.medium },
  pickSep:      { height: 0.5, backgroundColor: colors.divider },

  secRow:  { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 10 },
  secBar:  { width: 3, height: 18, borderRadius: 2, backgroundColor: colors.actionBlue },
  secText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', alignSelf: 'center' },

  ccOuter: {
    width:           CARD_W,
    backgroundColor: colors.surface,
    borderRadius:    Radius.lg + 4,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     'rgba(11,57,113,0.09)',
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius:  12,
      },
      android: { elevation: 3 },
    }),
  },
  ccImageBox:       { width: '100%', height: IMAGE_H, position: 'relative', overflow: 'hidden', backgroundColor: colors.divider },
  ccImage:          { width: '100%', height: '100%' },
  ccNoImage:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF4FA' },
  ccCarRoof:        { width: 38, height: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#BBCFE0' },
  ccCarBody:        { width: 54, height: 18, borderRadius: 4, backgroundColor: '#C5D5E6' },
  ccGradientOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: IMAGE_H * 0.5, justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: 8 },
  ccPriceRow:       { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 2, backgroundColor: 'rgba(0, 0, 0, 0.42)', alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ccPriceNum:       { fontFamily: Typography.fontFamily.black, fontSize: 23, color: colors.gold, letterSpacing: 0.3 },
  ccPriceDz:        { fontFamily: Typography.fontFamily.regular, fontSize: 16, color: colors.gold + 'BB' },
  ccNewPill:        { position: 'absolute', top: 10, right: 10, backgroundColor: colors.success, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  ccNewText:        { fontFamily: Typography.fontFamily.bold, fontSize: 9, color: '#fff' },
  ccInfo:           { padding: 14, gap: 6 },
  ccInfoTop:        { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  ccBrandText:      { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  ccYearChip:       { backgroundColor: colors.actionBlue + '12', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  ccYearChipTxt:    { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: colors.actionBlue },
  ccEngineText:     { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'right' },
  ccInfoBottom:     { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  ccTag:            { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.background },
  ccLocTag:         { flex: 1 },
  ccTagTxt:         { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: colors.textSecondary },
  ccLocDot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.actionBlue },

  sklCard: { width: CARD_W, borderRadius: Radius.lg + 4, backgroundColor: colors.surface, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider },
  sklImg:  { width: '100%', height: IMAGE_H, backgroundColor: colors.divider },
  sklLine: { height: 8, borderRadius: 4, backgroundColor: colors.divider, width: '80%', alignSelf: 'flex-end' },

  empWrap:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  empIconWrap: { width: 80, height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative' },
  empCarBody:  { width: 70, height: 28, borderRadius: 6, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.divider },
  empCarRoof:  { width: 40, height: 18, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 2, borderColor: colors.border, marginBottom: -2, backgroundColor: colors.divider },
  empQ:        { position: 'absolute', fontSize: 26, color: colors.textMuted, fontWeight: 'bold' },
  empTitle:    { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  empSub:      { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});