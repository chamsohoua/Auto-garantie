import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  SafeAreaView, 
  Modal, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions,
  I18nManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabase'; 
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUser } from '../../../redux/slices/authSlice'; 
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { AntDesign } from '@expo/vector-icons';
const { width, height } = Dimensions.get('window');

export default function Settings({ navigation }) {
  const currentUser = useSelector(selectUser);
  const dispatch = useDispatch();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: ''
  });


  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || currentUser.user_metadata?.name || '',
        phone_number: currentUser.phone_number || currentUser.phone || '',
        email: currentUser.email || ''
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!formData.name) {
Alert.alert(t('common_error'), t('settings_name_required'));
      return;
    }

    setLoading(true);
    try {
      const updates = {
        name: formData.name,
        updated_at: new Date(),
      };

      const { data, error } = await supabase
        .from('users')
        .update(updates) 
        .eq('id', currentUser.id)
        .select();

      if (error) throw error;
 

Alert.alert(t('settings_success'), t('settings_success'));
      setModalVisible(false);
      
    } catch (error) {
      console.error('Update Error:', error);
Alert.alert(t('settings_update_failed'), error.message);
    } finally {
      setLoading(false);
    }
  };
   const changeLanguage = async (lang) => {
      try {
        await i18n.changeLanguage(lang);
        await SecureStore.setItemAsync('userLanguage', lang);
        
        const shouldBeRTL = lang === 'ar';
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.forceRTL(shouldBeRTL);
          alert(t('app_restart_required'));
        }
        
        setShowLanguageModal(false);
      } catch (error) {
        console.error('Language change error:', error);
      }
    };
 const getLanguageName = (code) => {
    const languages = {
      en: 'English',
      ar: 'العربية',
      fr: 'Français'
    };
    return languages[code] || code;
  };
  const renderSettingItem = ({ icon, color, label, value, onPress, isSwitch, switchValue, onSwitch }) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress} 
      disabled={isSwitch}
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      
      {isSwitch ? (
        <Switch 
          value={switchValue} 
          onValueChange={onSwitch} 
          trackColor={{ false: "#D1D1D6", true: "#34C759" }}
        />
      ) : (
        <View style={styles.rowRight}>
          {value && <Text style={styles.valueText}>{value}</Text>}
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
<Text style={styles.headerTitle}>{t('settings_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
<Text style={styles.sectionHeader}>{t('settings_account')}</Text>
        <View style={styles.section}>
          {renderSettingItem({
            icon: "person",
            color: "#4CAF50",
            label: "Profile Details",
            onPress: () => setModalVisible(true)
          })}
          {renderSettingItem({
            icon: "notifications",
            color: "#FF9800",
            label: "Notifications",
            onPress: () => {}
          })}
          {renderSettingItem({
            icon: "shield-checkmark",
            color: "#0056a7",
            label: "Password & Security",
            onPress: () => {navigation.navigate('Password')},
          })}
        </View>

<Text style={styles.sectionHeader}>{t('settings_preferences')}</Text>
        <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.languageButton, isRTL && styles.languageButtonRTL]}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={[styles.languageButtonContent, isRTL && styles.rowRTL]}>
            <Ionicons name="language" size={24} color={"#007ca1"} />
            <View style={[styles.languageButtonText, isRTL && styles.languageButtonTextRTL]}>
              <Text style={[styles.languageButtonTitle, isRTL && styles.textRTL]}>
                {t('language')}
              </Text>
              <Text style={[styles.languageButtonSubtitle, isRTL && styles.textRTL]}>
                {getLanguageName(i18n.language)}
              </Text>
            </View>
          </View>
          <AntDesign 
            name={isRTL ? "left" : "right"} 
            size={20} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>
          
        </View>
        
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
<Text style={styles.modalTitle}>{t('settings_edit_profile')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
<Text style={styles.label}>{t('settings_full_name')}</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
  placeholder={t('settings_enter_name')}
              />
            </View>

            <View style={styles.formGroup}>
<Text style={styles.label}>{t('settings_phone_readonly')}</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.phone_number}
                editable={false}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
<Text style={styles.saveButtonText}>{t('settings_save_changes')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
 <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
              {t('select_language')}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'en' && styles.languageOptionActive
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.languageOptionText}>English</Text>
              {i18n.language === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color="#4B0082" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'ar' && styles.languageOptionActive
              ]}
              onPress={() => changeLanguage('ar')}
            >
              <Text style={styles.languageOptionText}>العربية</Text>
              {i18n.language === 'ar' && (
                <Ionicons name="checkmark-circle" size={24} color="#4B0082" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'fr' && styles.languageOptionActive
              ]}
              onPress={() => changeLanguage('fr')}
            >
              <Text style={styles.languageOptionText}>Français</Text>
              {i18n.language === 'fr' && (
                <Ionicons name="checkmark-circle" size={24} color="#4B0082" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[styles.modalCancelText, isRTL && styles.textRTL]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingTop:20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F2F2F7',
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#000' },
  content: { padding: 20, paddingTop: 10 },
  
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 12,
    marginTop: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 16, color: '#000' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 16, color: '#8E8E93', marginRight: 6 },
  
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  versionText: { textAlign: 'center', color: '#C7C7CC', marginTop: 20, fontSize: 13 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#8E8E93', marginBottom: 8 },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#000',
  },
  disabledInput: { color: '#8E8E93', opacity: 0.7 },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
   languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    borderRadius: 12,
    marginTop: 5,
  },
  languageButtonRTL: {
    flexDirection: 'row-reverse',
  },
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButtonText: {
    marginLeft: width * 0.03,
    color: "#000",
  },
  languageButtonTextRTL: {
    marginLeft: 0,
    marginRight: width * 0.03,
  },
  languageButtonTitle: {
    fontSize: width * 0.04,
    color: "#000",
    fontWeight: '600',
  },
  languageButtonSubtitle: {
    fontSize: width * 0.033,
    color: "#6B7280",
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: "#007ca1",
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.15,
    borderRadius: 24,
    alignSelf: 'center',
    marginTop: height * 0.025,
    borderColor: "#000",
    borderWidth: 0.5,
  },
  signOut: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    paddingBottom: height * 0.04,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: height * 0.02,
    color: "#000",
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    borderRadius: 12,
    marginBottom: height * 0.01,
    backgroundColor: '#F9FAFB',
  },
  languageOptionActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#4B0082',
  },
  languageOptionText: {
    fontSize: width * 0.045,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalCancelButton: {
    marginTop: height * 0.02,
    paddingVertical: height * 0.015,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: width * 0.04,
    color: "#000",
    fontWeight: '600',
    textAlign: 'center',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  modalDescription: {
  fontSize: width * 0.037,
  color: "#6B7280",
  textAlign: 'center',
  marginBottom: height * 0.02,
  paddingHorizontal: width * 0.04,
},
intervalOption: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: height * 0.018,
  paddingHorizontal: width * 0.04,
  borderRadius: 12,
  marginBottom: height * 0.01,
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
intervalOptionActive: {
  backgroundColor: '#EDE9FE',
  borderWidth: 2,
  borderColor: '#4B0082',
},
intervalContent: {
  flex: 1,
},
intervalTitle: {
  fontSize: width * 0.043,
  color: '#1F2937',
  fontWeight: '600',
  marginBottom: 4,
},
intervalSubtitle: {
  fontSize: width * 0.035,
  color: '#6B7280',
},
disableOption: {
  backgroundColor: '#FEE2E2',
  borderColor: '#EF4444',
},
});