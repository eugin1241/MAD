import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export const colors = {
  background: '#F6F5F0',
  primary: '#173F35',
  accent: '#D7F27B',
  orange: '#E58855',
  text: '#172D27',
  muted: '#69766F',
  border: '#DFE4DC',
  white: '#FFFFFF',
  danger: '#AF3931',
};
export function Screen({children, refreshing = false, onRefresh}) {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Title({children, subtitle}) {
  return (
    <View style={styles.title}>
      <Text style={ui.heading}>{children}</Text>
      {subtitle ? <Text style={ui.muted}>{subtitle}</Text> : null}
    </View>
  );
}
export function Card({children, style}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Body({children, muted, style}) {
  return <Text style={[muted ? ui.muted : ui.body, style]}>{children}</Text>;
}
export function Row({children, style}) {
  return <View style={[ui.row, style]}>{children}</View>;
}
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}) {
  const [busy, setBusy] = useState(false);
  const handlePress = async () => {
    if (busy || disabled) {
      return;
    }
    setBusy(true);
    try {
      await onPress?.();
    } catch (error) {
      Alert.alert('Belum berhasil', error.message || 'Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };
  const dark = variant !== 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: disabled || busy}}
      disabled={disabled || busy}
      onPress={handlePress}
      style={({pressed}) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        (disabled || busy || pressed) && styles.dim,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={dark ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.buttonText, !dark && styles.secondaryText]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({label, style, ...props}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...props}
        style={[styles.input, props.multiline && styles.multiline, style]}
      />
    </View>
  );
}
export function Chips({options, value, onChange}) {
  return (
    <View style={styles.chips}>
      {options.map(option => (
        <Pressable
          key={option.id}
          accessibilityRole="button"
          accessibilityState={{selected: value === option.id}}
          onPress={() => onChange(option.id)}
          style={[styles.chip, value === option.id && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              value === option.id && styles.chipTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const labels = {
  pending: 'Menunggu',
  approved: 'Tayang',
  rejected: 'Ditolak',
  removed: 'Dihapus',
  confirmed: 'Disetujui penjual',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  open: 'Terbuka',
  closed: 'Ditutup',
  resolved: 'Ditangani',
};
export function Badge({status}) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{labels[status] || status}</Text>
    </View>
  );
}
export function Empty({title, description}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>◇</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? (
        <Text style={styles.emptyDescription}>{description}</Text>
      ) : null}
    </View>
  );
}
export function ProductImage({uri, size = 100}) {
  const [failedUri, setFailedUri] = useState(null);
  const dimensions = {
    width: size,
    height: typeof size === 'number' ? size : 210,
  };
  return uri && uri !== failedUri ? (
    <Image
      accessibilityLabel="Foto produk"
      source={{uri}}
      onError={() => setFailedUri(uri)}
      style={[styles.image, dimensions]}
    />
  ) : (
    <View style={[styles.image, styles.placeholder, dimensions]}>
      <Text style={styles.placeholderText}>◇</Text>
    </View>
  );
}
export const ui = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  body: {fontSize: 15, lineHeight: 23, color: colors.text},
  muted: {fontSize: 13, lineHeight: 20, color: colors.muted},
  row: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10},
  section: {
    marginVertical: 12,
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },
});
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {padding: 20, paddingBottom: 36, gap: 14},
  title: {gap: 6, marginBottom: 4},
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  button: {
    minHeight: 46,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {backgroundColor: '#EAF0E4'},
  danger: {backgroundColor: colors.danger},
  dim: {opacity: 0.55},
  buttonText: {color: colors.white, fontWeight: '700', fontSize: 14},
  secondaryText: {color: colors.primary},
  field: {gap: 7},
  label: {fontSize: 13, color: colors.text, fontWeight: '600'},
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.white,
    color: colors.text,
    padding: 13,
    fontSize: 15,
    minHeight: 48,
  },
  multiline: {minHeight: 96, textAlignVertical: 'top'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {color: colors.muted, fontSize: 13, fontWeight: '600'},
  chipTextActive: {color: colors.accent},
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: '#EEF3E5',
  },
  badgeText: {fontSize: 11, fontWeight: '700', color: colors.primary},
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyIcon: {fontSize: 40, color: colors.primary},
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  image: {backgroundColor: '#EAF0E4', borderRadius: 14, resizeMode: 'cover'},
  placeholder: {alignItems: 'center', justifyContent: 'center'},
  placeholderText: {fontSize: 42, color: colors.primary},
});
