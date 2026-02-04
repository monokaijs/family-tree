import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAppSelector } from '@/store/hooks';
import { ArrowLeft, Download, FileJson, Copy, Share2 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export default function ExportDataScreen() {
  const colors = useColors();
  const router = useRouter();
  const { persons, relationships } = useAppSelector((state) => state.familyTree);

  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      persons,
      relationships,
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(jsonString);
      Alert.alert('Copied!', 'Family tree data copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: jsonString,
        title: 'Family Tree Data',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share data');
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between border-b px-4 pb-4 pt-[60px]" style={{ borderBottomColor: colors.neutrals800 }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <AppText className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Export Data
        </AppText>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="mb-6 items-center rounded-2xl border p-6" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          <Download size={32} color={colors.primary} />
          <AppText className="mb-4 mt-3 text-lg font-semibold" style={{ color: colors.foreground }}>
            Export Summary
          </AppText>
          <View className="flex-row items-center">
            <View className="items-center px-6">
              <AppText className="text-[32px] font-bold" style={{ color: colors.primary }}>{persons.length}</AppText>
              <AppText className="mt-1 text-sm" style={{ color: colors.neutrals400 }}>People</AppText>
            </View>
            <View className="h-10 w-px" style={{ backgroundColor: colors.neutrals700 }} />
            <View className="items-center px-6">
              <AppText className="text-[32px] font-bold" style={{ color: colors.secondary }}>{relationships.length}</AppText>
              <AppText className="mt-1 text-sm" style={{ color: colors.neutrals400 }}>Relationships</AppText>
            </View>
          </View>
        </View>

        <AppText className="mb-2 ml-1 text-xs font-semibold tracking-wide" style={{ color: colors.neutrals400 }}>
          DATA PREVIEW
        </AppText>

        <View className="overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          <View className="flex-row items-center gap-2 border-b p-3" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <FileJson size={18} color={colors.neutrals400} />
            <AppText className="text-sm font-medium" style={{ color: colors.neutrals300 }}>
              family-tree.json
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 150 }}>
            <AppText className="p-3 font-mono text-[11px] leading-4" style={{ color: colors.neutrals300 }}>
              {jsonString.substring(0, 500)}...
            </AppText>
          </ScrollView>
        </View>

        <View className="mt-6 gap-3">
          <AppButton variant="secondary" onPress={handleCopyToClipboard} className="py-3.5">
            <View className="flex-row items-center justify-center">
              <Copy size={18} color={colors.foreground} />
              <AppText className="ml-2 font-semibold" style={{ color: colors.foreground }}>
                Copy to Clipboard
              </AppText>
            </View>
          </AppButton>

          <AppButton variant="primary" onPress={handleShare} className="py-3.5">
            <View className="flex-row items-center justify-center">
              <Share2 size={18} color={colors.primaryForeground} />
              <AppText className="ml-2 font-semibold" style={{ color: colors.primaryForeground }}>
                Share Data
              </AppText>
            </View>
          </AppButton>
        </View>

        <View className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          <AppText className="text-sm leading-[18px]" style={{ color: colors.neutrals400 }}>
            💡 Save this data in a secure location. You can use it to restore your family tree or transfer it to another device.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
