import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Switch, TextInput, Modal, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useT, useI18n } from '../lib/i18n';
import { Colors, FontSizes, Radii, Spacing } from '../lib/theme';

interface Profile {
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  goal: string | null;
  avatar_url: string | null;
}

export function SettingsScreen() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, age, height_cm, goal, avatar_url').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile));
  }, [user]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `avatars/${user!.id}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id);
      setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
      Toast.show({ type: 'success', text1: 'Photo updated!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logout'), 'Are you sure?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      Toast.show({ type: 'error', text1: 'Type DELETE to confirm' });
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await supabase.auth.signOut();
      Toast.show({ type: 'success', text1: t('accountDeleted') });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: t('deleteFailed') });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const Row = ({ icon, label, right, onPress }: { icon: string; label: string; right?: React.ReactNode; onPress?: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ marginLeft: 'auto' }}>{right ?? <Text style={styles.chevron}>›</Text>}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('settings')}</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrapper} activeOpacity={0.8}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{profile?.full_name?.[0]?.toUpperCase() ?? 'B'}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}><Text style={{ fontSize: 12 }}>📷</Text></View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.full_name ?? user?.email ?? ''}</Text>
            <Text style={styles.profileMeta}>
              {[profile?.age && `${profile.age}y`, profile?.height_cm && `${profile.height_cm}cm`, profile?.goal].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>{t('appearance').toUpperCase()}</Text>
        <View style={styles.card}>
          <Row icon="🌙" label={t('darkMode')} right={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#fff" />} />
        </View>

        {/* Language */}
        <Text style={styles.sectionLabel}>{t('language').toUpperCase()}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.langOption, lang === 'ka' && styles.langOptionSelected]}
            onPress={() => setLang('ka')}
            activeOpacity={0.8}
          >
            <Text style={styles.langFlag}>🇬🇪</Text>
            <Text style={[styles.langName, lang === 'ka' && { color: Colors.primary }]}>{t('georgian')}</Text>
            {lang === 'ka' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.langOption, lang === 'en' && styles.langOptionSelected]}
            onPress={() => setLang('en')}
            activeOpacity={0.8}
          >
            <Text style={styles.langFlag}>🇬🇧</Text>
            <Text style={[styles.langName, lang === 'en' && { color: Colors.primary }]}>{t('english')}</Text>
            {lang === 'en' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>{t('profile').toUpperCase()}</Text>
        <View style={styles.card}>
          <Row icon="📧" label={user?.email ?? ''} onPress={undefined} right={<View />} />
          <View style={styles.divider} />
          <Row icon="🚪" label={t('logout')} onPress={handleLogout} />
        </View>

        {/* Legal */}
        <Text style={styles.sectionLabel}>{t('legal').toUpperCase()}</Text>
        <View style={styles.card}>
          <Row icon="🔒" label={t('viewPrivacyPolicy')} />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>{t('dangerZone').toUpperCase()}</Text>
        <View style={[styles.card, { borderColor: Colors.destructive + '30' }]}>
          <Row icon="🗑" label={t('deleteAccount')} onPress={() => setDeleteOpen(true)} right={<Text style={{ fontSize: 18, color: Colors.destructive }}>›</Text>} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Delete account modal */}
      <Modal visible={deleteOpen} transparent animationType="slide" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('deleteAccountTitle')}</Text>
            <Text style={styles.modalDesc}>{t('deleteAccountDesc')}</Text>
            <Text style={styles.inputLabel}>{t('deleteAccountTypeToConfirm')} "DELETE"</Text>
            <TextInput
              style={styles.input}
              placeholder="DELETE"
              placeholderTextColor={Colors.muted}
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              autoCapitalize="characters"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setDeleteOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={[styles.deleteBtn, deleting && { opacity: 0.5 }]}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteBtnText}>{deleting ? t('loading') : t('deleteAccountConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl },
  pageTitle: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.ink, marginBottom: Spacing.xl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.primary },
  cameraBtn: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.ink },
  profileMeta: { fontSize: FontSizes.sm, color: Colors.muted, marginTop: 2 },
  sectionLabel: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.muted, letterSpacing: 1, marginBottom: 8, marginTop: Spacing.lg },
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.lg },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowLabel: { fontSize: FontSizes.sm, fontWeight: '500', color: Colors.ink, flex: 1 },
  chevron: { fontSize: 20, color: Colors.muted },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 52 },
  langOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.lg },
  langOptionSelected: { backgroundColor: Colors.brandSoft },
  langFlag: { fontSize: 20 },
  langName: { flex: 1, fontSize: FontSizes.sm, fontWeight: '600', color: Colors.ink },
  checkmark: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xxl, paddingBottom: 44 },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.ink, marginBottom: 8 },
  modalDesc: { fontSize: FontSizes.sm, color: Colors.muted, lineHeight: 20, marginBottom: Spacing.lg },
  inputLabel: { fontSize: FontSizes.xs, color: Colors.muted, marginBottom: 6 },
  input: { backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingHorizontal: Spacing.lg, paddingVertical: 14, fontSize: FontSizes.base, color: Colors.ink },
  cancelBtn: { flex: 1, backgroundColor: Colors.secondary, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.ink },
  deleteBtn: { flex: 1, backgroundColor: Colors.destructive, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { fontSize: FontSizes.base, fontWeight: '700', color: '#fff' },
});
