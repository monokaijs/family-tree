import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Switch } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleTheme, setLanguage } from '@/store/slices/appSlice';
import { LANGUAGES, LanguageCode, changeLanguage } from '@/config/i18n';
import {
  Sun,
  Moon,
  Shield,
  FileText,
  HelpCircle,
  Download,
  Upload,
  ChevronRight,
  TreeDeciduous,
  Globe,
  Check,
  X,
} from 'lucide-react-native';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, rightElement, showArrow = true }: SettingsItemProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      className="flex-row items-center gap-3.5 p-3.5"
      style={{ backgroundColor: colors.neutrals900 }}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: colors.neutrals800 }}>
        {icon}
      </View>
      <View className="flex-1">
        <AppText className="text-base font-semibold" style={{ color: colors.foreground }}>{title}</AppText>
        {subtitle && (
          <AppText className="mt-0.5 text-sm" style={{ color: colors.neutrals400 }}>{subtitle}</AppText>
        )}
      </View>
      {rightElement || (showArrow && onPress && (
        <ChevronRight size={20} color={colors.neutrals500} />
      ))}
    </TouchableOpacity>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();

  return (
    <View className="mt-6 px-4">
      <AppText className="mb-2 ml-1 text-xs font-semibold tracking-wide" style={{ color: colors.neutrals400 }}>{title}</AppText>
      <View className="overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
        {children}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const colors = useColors();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useAppSelector((state) => state.app);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await changeLanguage(langCode);
    dispatch(setLanguage(langCode));
    setLanguageModalVisible(false);
  };

  const currentLanguage = LANGUAGES[i18n.language as LanguageCode] || LANGUAGES.en;

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="items-center px-5 pb-6 pt-[60px]">
          <TreeDeciduous size={32} color={colors.primary} />
          <AppText className="mt-3 text-3xl font-bold" style={{ color: colors.foreground }}>
            {t('SETTINGS_SCREEN.TITLE')}
          </AppText>
          <AppText className="mt-1 text-sm" style={{ color: colors.neutrals400 }}>
            {t('SETTINGS_SCREEN.SUBTITLE')}
          </AppText>
        </View>

        <SettingsSection title={t('APPEARANCE').toUpperCase()}>
          <SettingsItem
            icon={theme === 'dark' ? <Moon size={22} color={colors.primary} /> : <Sun size={22} color={colors.primary} />}
            title={t('SETTINGS_SCREEN.DARK_MODE')}
            subtitle={theme === 'dark' ? t('SETTINGS_SCREEN.USING_DARK') : t('SETTINGS_SCREEN.USING_LIGHT')}
            rightElement={
              <Switch
                value={theme === 'dark'}
                onValueChange={handleThemeToggle}
                size="md"
              />
            }
            showArrow={false}
          />
          <View className="ml-[72px] h-px" style={{ backgroundColor: colors.neutrals800 }} />
          <SettingsItem
            icon={<Globe size={22} color="#3B82F6" />}
            title={t('SETTINGS_SCREEN.LANGUAGE')}
            subtitle={currentLanguage.nativeName}
            onPress={() => setLanguageModalVisible(true)}
          />
        </SettingsSection>

        <SettingsSection title={t('SETTINGS_SCREEN.EXPORT_DATA').toUpperCase()}>
          <SettingsItem
            icon={<Download size={22} color="#10B981" />}
            title={t('SETTINGS_SCREEN.EXPORT_DATA')}
            subtitle={t('SETTINGS_SCREEN.EXPORT_DESC')}
            onPress={() => router.push('/settings/export')}
          />
          <View className="ml-[72px] h-px" style={{ backgroundColor: colors.neutrals800 }} />
          <SettingsItem
            icon={<Upload size={22} color="#3B82F6" />}
            title={t('SETTINGS_SCREEN.IMPORT_DATA')}
            subtitle={t('SETTINGS_SCREEN.IMPORT_DESC')}
            onPress={() => router.push('/settings/import')}
          />
        </SettingsSection>

        <SettingsSection title={t('SETTINGS_SCREEN.SUPPORT').toUpperCase()}>
          <SettingsItem
            icon={<Shield size={22} color="#8B5CF6" />}
            title={t('SETTINGS_SCREEN.PRIVACY')}
            subtitle={t('SETTINGS_SCREEN.PRIVACY_DESC')}
            onPress={() => router.push('/settings/privacy')}
          />
          <View className="ml-[72px] h-px" style={{ backgroundColor: colors.neutrals800 }} />
          <SettingsItem
            icon={<FileText size={22} color="#EC4899" />}
            title={t('SETTINGS_SCREEN.TERMS')}
            subtitle={t('SETTINGS_SCREEN.TERMS_DESC')}
            onPress={() => router.push('/settings/terms')}
          />
          <View className="ml-[72px] h-px" style={{ backgroundColor: colors.neutrals800 }} />
          <SettingsItem
            icon={<HelpCircle size={22} color="#06B6D4" />}
            title={t('SETTINGS_SCREEN.SUPPORT')}
            subtitle={t('SETTINGS_SCREEN.SUPPORT_DESC')}
            onPress={() => router.push('/settings/support')}
          />
        </SettingsSection>

        <View className="items-center gap-1 py-8">
          <AppText className="text-xs" style={{ color: colors.neutrals500 }}>
            Family Tree App v1.0.0
          </AppText>
          <AppText className="text-xs" style={{ color: colors.neutrals600 }}>
            Made with ❤️
          </AppText>
        </View>
      </ScrollView>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View
            className="mx-6 w-full max-w-sm overflow-hidden rounded-2xl"
            style={{ backgroundColor: colors.neutrals900 }}
          >
            <View className="flex-row items-center justify-between border-b p-4" style={{ borderColor: colors.neutrals800 }}>
              <AppText className="text-lg font-bold" style={{ color: colors.foreground }}>
                {t('SETTINGS_SCREEN.SELECT_LANGUAGE')}
              </AppText>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <X size={24} color={colors.neutrals400} />
              </TouchableOpacity>
            </View>

            {Object.values(LANGUAGES).map((lang) => (
              <TouchableOpacity
                key={lang.code}
                className="flex-row items-center justify-between border-b p-4"
                style={{ borderColor: colors.neutrals800 }}
                onPress={() => handleLanguageChange(lang.code as LanguageCode)}
              >
                <View>
                  <AppText className="text-base font-medium" style={{ color: colors.foreground }}>
                    {lang.nativeName}
                  </AppText>
                  <AppText className="text-sm" style={{ color: colors.neutrals400 }}>
                    {lang.name}
                  </AppText>
                </View>
                {i18n.language === lang.code && (
                  <Check size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
