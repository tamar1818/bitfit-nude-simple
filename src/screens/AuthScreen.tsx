import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useT, useI18n } from '../lib/i18n';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

export function AuthScreen() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const handleSubmit = async () => {
    if (mode === 'signup' && !acceptedPolicy) {
      Toast.show({ type: 'error', text1: t('mustAcceptPolicy') });
      return;
    }
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: t('requiredField') });
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        Toast.show({ type: 'success', text1: 'Account created!' });
        navigation.navigate('Onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message ?? 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  const showPrivacy = () => {
    Alert.alert(t('privacyTitle'), t('privacyBody'), [
      { text: t('decline'), style: 'destructive', onPress: () => setAcceptedPolicy(false) },
      { text: t('accept'), onPress: () => setAcceptedPolicy(true) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.logo}>bitfit</Text>
            <TouchableOpacity
              onPress={() => setLang(lang === 'ka' ? 'en' : 'ka')}
              style={styles.langBtn}
            >
              <Text style={styles.langText}>{lang === 'ka' ? '🇬🇪 KA' : '🇬🇧 EN'}</Text>
            </TouchableOpacity>
          </View>

          {/* Hero text */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>
              {mode === 'signup' ? 'Start your\njourney.' : 'Welcome\nback.'}
            </Text>
            <Text style={styles.heroSub}>{t('tagline')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder={t('fullName')}
                placeholderTextColor={Colors.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor={Colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              placeholderTextColor={Colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {mode === 'signup' && (
              <TouchableOpacity style={styles.policyRow} onPress={() => setAcceptedPolicy(!acceptedPolicy)}>
                <View style={[styles.checkbox, acceptedPolicy && styles.checkboxChecked]}>
                  {acceptedPolicy && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.policyText}>
                  {t('acceptPolicyPrefix')}{' '}
                  <Text style={styles.policyLink} onPress={showPrivacy}>
                    {t('privacyPolicy')}
                  </Text>
                  {' '}{t('andTerms')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, (submitting || (mode === 'signup' && !acceptedPolicy)) && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting || (mode === 'signup' && !acceptedPolicy)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? t('loading') : mode === 'signup' ? t('signUp') : t('signIn')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('orContinueWith').toUpperCase()}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth buttons */}
          <View style={styles.oauthRow}>
            <TouchableOpacity style={styles.oauthBtn} activeOpacity={0.8}>
              <Text style={styles.oauthIcon}>G</Text>
              <Text style={styles.oauthText}>{t('continueWithGoogle')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.oauthBtn, styles.appleBtn]} activeOpacity={0.8}>
              <Text style={[styles.oauthIcon, { color: '#fff' }]}></Text>
              <Text style={[styles.oauthText, { color: '#fff' }]}>{t('continueWithApple')}</Text>
            </TouchableOpacity>
          </View>

          {/* Toggle mode */}
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          >
            <Text style={styles.toggleText}>
              {mode === 'signup' ? t('haveAccount') : t('noAccount')}{' '}
              <Text style={styles.toggleAction}>
                {mode === 'signup' ? t('signIn') : t('signUp')}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.ink },
  hero: { marginTop: 40, marginBottom: 8 },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.ink,
    lineHeight: 44,
    letterSpacing: -1,
  },
  heroSub: { marginTop: 8, fontSize: FontSizes.sm, color: Colors.muted },
  form: { marginTop: Spacing.xxl, gap: Spacing.md },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
    fontSize: FontSizes.base,
    color: Colors.ink,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  policyText: { flex: 1, fontSize: FontSizes.sm, color: Colors.ink, lineHeight: 20 },
  policyLink: { fontWeight: '700', textDecorationLine: 'underline' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: FontSizes.base, fontWeight: '700' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: Spacing.xxl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSizes.xs, color: Colors.muted, fontWeight: '600', letterSpacing: 1 },
  oauthRow: { gap: Spacing.sm },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    paddingVertical: 14,
  },
  appleBtn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  oauthIcon: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.ink },
  oauthText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.ink },
  toggleBtn: { marginTop: Spacing.xxl, alignItems: 'center' },
  toggleText: { fontSize: FontSizes.sm, color: Colors.muted },
  toggleAction: { fontWeight: '700', color: Colors.ink },
});
