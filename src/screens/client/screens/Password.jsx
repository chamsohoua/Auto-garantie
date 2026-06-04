import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Platform,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../redux/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../supabase';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const { width, height } = Dimensions.get('window');

const Password = () => {
    const user = useSelector(selectUser);
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const isRTL = i18n.language === 'ar';

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const hashPassword = async (password) => {
        const digest = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );
        return digest;
    };

    const validateInputs = () => {
        if (!oldPassword) {
            Alert.alert(t('error'), t('please_enter_old_password'));
            return false;
        }

        if (!newPassword) {
            Alert.alert(t('error'), t('please_enter_new_password'));
            return false;
        }

        if (newPassword.length < 8) {
            Alert.alert(t('error'), t('password_min_8_characters'));
            return false;
        }

        if (!confirmPassword) {
            Alert.alert(t('error'), t('please_confirm_password'));
            return false;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(t('error'), t('passwords_do_not_match'));
            return false;
        }

        if (oldPassword === newPassword) {
            Alert.alert(t('error'), t('new_password_same_as_old'));
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validateInputs()) return;

        try {
            setLoading(true);

            const userEmail = user?.email || await SecureStore.getItemAsync('userEmail');

            // Fetch current user data
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('password_hash')
                .eq('email', userEmail)
                .single();

            if (fetchError) throw fetchError;

            // Verify old password by hashing and comparing
            const oldPasswordHash = await hashPassword(oldPassword);

            if (oldPasswordHash !== userData.password_hash) {
                Alert.alert(t('error'), t('old_password_incorrect'));
                setLoading(false);
                return;
            }

            // Hash new password
            const newPasswordHash = await hashPassword(newPassword);

            // Update password
            const { error: updateError } = await supabase
                .from('users')
                .update({ password_hash: newPasswordHash })
                .eq('email', userEmail);

            if (updateError) throw updateError;

            Alert.alert(
                t('success'),
                t('password_changed_successfully'),
                [
                    {
                        text: t('ok'),
                        onPress: () => {
                            setOldPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            navigation.goBack();
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Error changing password:', error);
            Alert.alert(t('error'), t('failed_to_change_password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, isRTL && styles.backButtonRTL]}
                >
                    <Ionicons
                        name={isRTL ? "arrow-forward" : "arrow-back"}
                        size={24}
                        color={colors.text}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }, isRTL && styles.textRTL]}>
                    {t('security')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
                    <Text style={[styles.infoTitle, { color: colors.text }]}>
                        {t('change_your_password')}
                    </Text>
                    <Text style={[styles.infoDescription, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
                        {t('password_security_description')}
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>
                            {t('old_password')}
                        </Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.icons} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }, isRTL && styles.textInputRTL]}
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                placeholder={t('enter_old_password')}
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showOldPassword}
                                textAlign={isRTL ? 'right' : 'left'}
                            />
                            <TouchableOpacity
                                onPress={() => setShowOldPassword(!showOldPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showOldPassword ? "eye-outline" : "eye-off-outline"}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>
                            {t('new_password')}
                        </Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.icons} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }, isRTL && styles.textInputRTL]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder={t('enter_new_password')}
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showNewPassword}
                                textAlign={isRTL ? 'right' : 'left'}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNewPassword(!showNewPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.hint, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
                            {t('password_hint')}
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>
                            {t('confirm_new_password')}
                        </Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.icons} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }, isRTL && styles.textInputRTL]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder={t('confirm_new_password')}
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showConfirmPassword}
                                textAlign={isRTL ? 'right' : 'left'}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.changePasswordButton, loading && styles.changePasswordButtonDisabled]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={[styles.changePasswordButtonText, isRTL && styles.textRTL]}>
                                    {t('change_password')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: width * 0.05,
        paddingTop: Platform.OS === 'ios' ? height * 0.066 : height * 0.046,
        paddingBottom: height * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonRTL: {
        transform: [{ scaleX: -1 }],
    },
    headerTitle: {
        fontSize: width * 0.05,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: width * 0.05,
        paddingTop: height * 0.03,
        paddingBottom: height * 0.05,
    },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoTitle: {
        fontSize: width * 0.048,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    infoDescription: {
        fontSize: width * 0.035,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    formContainer: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: width * 0.04,
        fontWeight: '600',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: width * 0.04,
        fontWeight: '500',
    },
    textInputRTL: {
        textAlign: 'right',
    },
    eyeIcon: {
        padding: 4,
    },
    hint: {
        fontSize: width * 0.032,
        marginLeft: 4,
        marginTop: 4,
    },
    changePasswordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ac3600ff',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    changePasswordButtonDisabled: {
        opacity: 0.6,
    },
    changePasswordButtonText: {
        color: '#fff',
        fontSize: width * 0.045,
        fontWeight: '600',
    },
    textRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});

export default Password;