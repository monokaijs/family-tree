import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAppDispatch } from '@/store/hooks';
import { ArrowLeft, Upload, FileJson, AlertTriangle } from 'lucide-react-native';

export default function ImportDataScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const validateAndParse = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      if (!parsed.data || !Array.isArray(parsed.data.persons) || !Array.isArray(parsed.data.relationships)) {
        throw new Error('Invalid data structure');
      }
      setParseError(null);
      return parsed;
    } catch (error: any) {
      setParseError(error.message || 'Invalid JSON format');
      return null;
    }
  };

  const handleImport = () => {
    const parsed = validateAndParse(jsonInput);
    if (!parsed) return;

    Alert.alert(
      'Import Data',
      `This will replace your current family tree with ${parsed.data.persons.length} people and ${parsed.data.relationships.length} relationships. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'familyTree/resetTree' });
            parsed.data.persons.forEach((person: any) => {
              dispatch({ type: 'familyTree/addPerson', payload: person });
            });
            Alert.alert('Success', 'Family tree data imported successfully!');
            router.back();
          },
        },
      ]
    );
  };

  const handlePaste = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      const text = await Clipboard.getStringAsync();
      if (text) {
        setJsonInput(text);
        validateAndParse(text);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between border-b px-4 pb-4 pt-[60px]" style={{ borderBottomColor: colors.neutrals800 }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <AppText className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Import Data
        </AppText>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-6 items-center rounded-2xl border p-6" style={{ backgroundColor: colors.neutrals900, borderColor: colors.neutrals800 }}>
          <Upload size={32} color={colors.primary} />
          <AppText className="mt-3 text-lg font-semibold" style={{ color: colors.foreground }}>
            Restore Your Family Tree
          </AppText>
          <AppText className="mt-2 text-center text-sm" style={{ color: colors.neutrals400 }}>
            Paste your exported JSON data below to restore your family tree
          </AppText>
        </View>

        <AppText className="mb-2 ml-1 text-xs font-semibold tracking-wide" style={{ color: colors.neutrals400 }}>
          JSON DATA
        </AppText>

        <View className="overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.neutrals900, borderColor: parseError ? colors.error : colors.neutrals800 }}>
          <View className="flex-row items-center justify-between border-b p-3" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <View className="flex-row items-center gap-2">
              <FileJson size={16} color={colors.neutrals400} />
              <AppText className="text-sm font-medium" style={{ color: colors.neutrals300 }}>
                Paste JSON here
              </AppText>
            </View>
            <TouchableOpacity onPress={handlePaste} className="rounded-lg px-3 py-1.5" style={{ backgroundColor: colors.neutrals800 }}>
              <AppText className="text-xs font-semibold" style={{ color: colors.foreground }}>
                Paste
              </AppText>
            </TouchableOpacity>
          </View>
          <TextInput
            className="min-h-[150px] p-3 font-mono text-xs leading-[18px]"
            style={{ color: colors.foreground }}
            value={jsonInput}
            onChangeText={(text) => {
              setJsonInput(text);
              if (text) validateAndParse(text);
              else setParseError(null);
            }}
            placeholder='{"version": "1.0.0", "data": {...}}'
            placeholderTextColor={colors.neutrals600}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {parseError && (
          <View className="mt-3 flex-row items-center gap-2.5 rounded-xl p-3" style={{ backgroundColor: colors.error + '20' }}>
            <AlertTriangle size={18} color={colors.error} />
            <AppText className="flex-1 text-sm" style={{ color: colors.error }}>
              {parseError}
            </AppText>
          </View>
        )}

        <View className="mt-4 flex-row items-start gap-2.5 rounded-xl border p-3.5" style={{ backgroundColor: '#F59E0B20', borderColor: '#F59E0B40' }}>
          <AlertTriangle size={18} color="#F59E0B" />
          <AppText className="flex-1 text-sm leading-[18px]" style={{ color: '#F59E0B' }}>
            Warning: Importing data will replace your existing family tree. Make sure to export your current data first if you want to keep it.
          </AppText>
        </View>

        <AppButton
          variant="primary"
          onPress={handleImport}
          disabled={!jsonInput || !!parseError}
          className="mt-6"
        >
          Import Data
        </AppButton>
      </ScrollView>
    </View>
  );
}
