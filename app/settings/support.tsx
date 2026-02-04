import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { ArrowLeft, HelpCircle, Mail, MessageCircle, BookOpen, ExternalLink, Star } from 'lucide-react-native';

export default function SupportScreen() {
  const colors = useColors();
  const router = useRouter();

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const sendEmail = () => {
    openURL('mailto:support@familytree.app?subject=Family Tree App Support');
  };

  const supportOptions = [
    {
      icon: BookOpen,
      title: 'User Guide',
      description: 'Learn how to use all features',
      color: '#3B82F6',
      onPress: () => Alert.alert('Coming Soon', 'User guide will be available soon!'),
    },
    {
      icon: MessageCircle,
      title: 'FAQ',
      description: 'Frequently asked questions',
      color: '#10B981',
      onPress: () => Alert.alert('Coming Soon', 'FAQ section will be available soon!'),
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help from our team',
      color: '#F59E0B',
      onPress: sendEmail,
    },
    {
      icon: Star,
      title: 'Rate the App',
      description: 'Share your feedback',
      color: '#EC4899',
      onPress: () => Alert.alert('Thank You!', 'Thanks for your support! Rating will be available when app is published.'),
    },
  ];

  const tips = [
    '💡 Long press on a person to edit their details',
    '🔍 Pinch to zoom in/out on the family tree',
    '👆 Tap on a person and use "Add Relation" to connect family members',
    '💾 Export your data regularly to keep a backup',
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between border-b px-4 pb-4 pt-[60px]" style={{ borderBottomColor: colors.neutrals800 }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <AppText className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Help & Support
        </AppText>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-6 items-center rounded-[20px] border p-7" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          <HelpCircle size={40} color="#06B6D4" />
          <AppText className="mt-4 text-[22px] font-bold" style={{ color: colors.foreground }}>
            How can we help?
          </AppText>
          <AppText className="mt-2 text-center text-sm" style={{ color: colors.neutrals400 }}>
            Find answers or reach out to our support team
          </AppText>
        </View>

        <AppText className="mb-2 ml-1 text-xs font-semibold tracking-wide" style={{ color: colors.neutrals400 }}>
          SUPPORT OPTIONS
        </AppText>

        <View className="mb-6 overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          {supportOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <TouchableOpacity
                key={index}
                className="flex-row items-center gap-3.5 border-b p-3.5"
                style={{ borderBottomColor: index < supportOptions.length - 1 ? colors.neutrals800 : 'transparent' }}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: option.color + '20' }}>
                  <Icon size={22} color={option.color} />
                </View>
                <View className="flex-1">
                  <AppText className="text-base font-semibold" style={{ color: colors.foreground }}>
                    {option.title}
                  </AppText>
                  <AppText className="mt-0.5 text-sm" style={{ color: colors.neutrals400 }}>
                    {option.description}
                  </AppText>
                </View>
                <ExternalLink size={18} color={colors.neutrals500} />
              </TouchableOpacity>
            );
          })}
        </View>

        <AppText className="mb-2 ml-1 text-xs font-semibold tracking-wide" style={{ color: colors.neutrals400 }}>
          QUICK TIPS
        </AppText>

        <View className="rounded-2xl border p-4" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          {tips.map((tip, index) => (
            <View key={index} className="py-2">
              <AppText className="text-sm leading-5" style={{ color: colors.neutrals300 }}>
                {tip}
              </AppText>
            </View>
          ))}
        </View>

        <View className="items-center py-6">
          <AppText className="text-xs" style={{ color: colors.neutrals500 }}>
            Family Tree App v1.0.0
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
