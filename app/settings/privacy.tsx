import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { ArrowLeft, Shield, Database, Eye, Lock, Share2 } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const router = useRouter();

  const sections = [
    {
      icon: Database,
      title: 'Data Storage',
      content: 'All your family tree data is stored locally on your device. We do not upload or store any of your personal information on external servers. Your data remains completely private and under your control.',
    },
    {
      icon: Eye,
      title: 'Data Collection',
      content: 'This app does not collect any personal data, analytics, or usage information. We believe your family history is deeply personal and should remain private.',
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: 'Your data is protected by your device\'s built-in security features. We recommend enabling device-level security (passcode, Face ID, Touch ID) to protect your family tree data.',
    },
    {
      icon: Share2,
      title: 'Data Sharing',
      content: 'When you export or share your family tree data, it is sent directly to the recipient of your choice. We do not intercept, store, or have access to any shared data.',
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between border-b px-4 pb-4 pt-[60px]" style={{ borderBottomColor: colors.neutrals800 }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <AppText className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Privacy Policy
        </AppText>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-5 items-center rounded-[20px] border p-7" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          <Shield size={40} color={colors.primary} />
          <AppText className="mt-4 text-[22px] font-bold" style={{ color: colors.foreground }}>
            Your Privacy Matters
          </AppText>
          <AppText className="mt-2 text-center text-sm" style={{ color: colors.neutrals400 }}>
            We are committed to protecting your personal information
          </AppText>
        </View>

        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <View
              key={index}
              className="mb-3 rounded-2xl border p-4"
              style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}
            >
              <View className="mb-3 flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: colors.neutrals800 }}>
                  <Icon size={20} color={colors.primary} />
                </View>
                <AppText className="text-base font-semibold" style={{ color: colors.foreground }}>
                  {section.title}
                </AppText>
              </View>
              <AppText className="text-sm leading-5" style={{ color: colors.neutrals300 }}>
                {section.content}
              </AppText>
            </View>
          );
        })}

        <View className="items-center py-6">
          <AppText className="text-xs" style={{ color: colors.neutrals500 }}>
            Last updated: February 2026
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
