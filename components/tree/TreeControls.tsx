import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { ZoomIn, ZoomOut, Crosshair, RotateCcw, Plus, LayoutGrid } from 'lucide-react-native';
import { AppText } from '@/components/ui';

interface TreeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onReset?: () => void;
  onAddPerson?: () => void;
  onAutoLayout?: () => void;
  scale: number;
}

export default function TreeControls({
  onZoomIn,
  onZoomOut,
  onCenter,
  onReset,
  onAddPerson,
  onAutoLayout,
  scale,
}: TreeControlsProps) {
  const colors = useColors();

  return (
    <>
      <View
        className="absolute right-4 top-safe-offset-12 overflow-hidden rounded-2xl shadow-lg bg-neutrals900"
      >
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center"
          onPress={onZoomIn}
          activeOpacity={0.7}
        >
          <ZoomIn size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View className="items-center px-2 py-1.5">
          <AppText className="text-[10px] -mx-2 font-semibold text-neutrals100">
            {Math.round(scale * 100)}%
          </AppText>
        </View>

        <TouchableOpacity
          className="h-12 w-12 items-center justify-center"
          onPress={onZoomOut}
          activeOpacity={0.7}
        >
          <ZoomOut size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View
        className="absolute right-4 top-[260px] overflow-hidden rounded-2xl shadow-lg bg-neutrals900"
      >
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center"
          onPress={onCenter}
          activeOpacity={0.7}
        >
          <Crosshair size={20} color={colors.foreground} />
        </TouchableOpacity>

        {onAutoLayout && (
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center"
            onPress={onAutoLayout}
            activeOpacity={0.7}
          >
            <LayoutGrid size={18} color={colors.foreground} />
          </TouchableOpacity>
        )}

        {onReset && (
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center"
            onPress={onReset}
            activeOpacity={0.7}
          >
            <RotateCcw size={18} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {onAddPerson && (
        <TouchableOpacity
          className="absolute bottom-4 right-4 h-15 w-15 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary, width: 60, height: 60 }}
          onPress={onAddPerson}
          activeOpacity={0.8}
        >
          <Plus size={28} color={colors.primaryForeground} strokeWidth={3} />
        </TouchableOpacity>
      )}
    </>
  );
}
