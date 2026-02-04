import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react-native';

export default function TermsOfServiceScreen() {
  const colors = useColors();
  const router = useRouter();

  const terms = [
    {
      title: '1. Acceptance of Terms',
      content: 'By downloading, installing, or using the Family Tree App, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.',
    },
    {
      title: '2. Use License',
      content: 'We grant you a limited, non-exclusive, non-transferable license to use the app for personal, non-commercial purposes. You may not modify, distribute, or create derivative works based on the app.',
    },
    {
      title: '3. User Data',
      content: 'You are solely responsible for the data you enter into the app. We do not have access to your family tree data as it is stored locally on your device.',
    },
    {
      title: '4. Prohibited Uses',
      content: 'You agree not to use the app for any unlawful purpose, to violate any laws, or to infringe upon the rights of others. You must not attempt to reverse engineer or decompile the app.',
    },
    {
      title: '5. Disclaimer of Warranties',
      content: 'The app is provided "as is" without warranties of any kind. We do not guarantee that the app will be error-free or uninterrupted.',
    },
    {
      title: '6. Limitation of Liability',
      content: 'We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app, including loss of data.',
    },
    {
      title: '7. Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.',
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between border-b px-4 pb-4 pt-[60px]" style={{ borderBottomColor: colors.neutrals800 }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <AppText className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Terms of Service
        </AppText>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-5 items-center rounded-[20px] border p-7" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          <FileText size={40} color={colors.secondary} />
          <AppText className="mt-4 text-[22px] font-bold" style={{ color: colors.foreground }}>
            Terms of Service
          </AppText>
          <AppText className="mt-2 text-center text-sm" style={{ color: colors.neutrals400 }}>
            Please read these terms carefully before using the app
          </AppText>
        </View>

        {terms.map((term, index) => (
          <View
            key={index}
            className="mb-3 rounded-2xl border p-4"
            style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}
          >
            <View className="mb-2.5 flex-row items-center gap-2.5">
              <CheckCircle2 size={18} color={colors.primary} />
              <AppText className="flex-1 text-[15px] font-semibold" style={{ color: colors.foreground }}>
                {term.title}
              </AppText>
            </View>
            <AppText className="ml-7 text-sm leading-5" style={{ color: colors.neutrals300 }}>
              {term.content}
            </AppText>
          </View>
        ))}

        <View className="items-center py-6">
          <AppText className="text-xs" style={{ color: colors.neutrals500 }}>
            Effective Date: February 2026
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
