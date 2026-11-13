import React, {forwardRef, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export const authColors = {
  paper: '#F6F5F0',
  forest: '#173F35',
  ink: '#1D352D',
  muted: '#68766E',
  lime: '#D7F27B',
  peach: '#EDBA97',
  border: '#DDE4D9',
  error: '#A33532',
};

export function KlaboxLogo() {
  return (
    <View style={styles.brand} accessible accessibilityLabel="Klabox">
      <View style={styles.brandMark}>
        <View style={styles.kStem} />
        <View style={styles.kTop} />
        <View style={styles.kBottom} />
      </View>
      <Text style={styles.brandName}>
        Klabox<Text style={styles.brandDot}>.</Text>
      </Text>
    </View>
  );
}

function ParcelArtwork({compact}) {
  return (
    <View
      style={[styles.artwork, compact && styles.artworkCompact]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.orbit} />
      <View style={styles.orbitSmall} />
      <View style={styles.artDot} />
      <View style={styles.parcel}>
        <View style={styles.parcelTape} />
        <View style={styles.parcelLabel}>
          <View style={styles.labelLine} />
          <View style={styles.labelLineShort} />
        </View>
        <Text style={styles.parcelK}>k.</Text>
      </View>
      <View style={styles.tag}>
        <Text style={styles.tagText}>
          {compact ? 'Punya cerita.' : 'Temuan bagus!'}
        </Text>
      </View>
      <View style={styles.sparkle}>
        <View style={styles.sparkleVertical} />
        <View style={styles.sparkleHorizontal} />
      </View>
    </View>
  );
}

export function AuthShell({children, variant = 'login', onBack, footer}) {
  const {width, fontScale} = useWindowDimensions();
  const compact = variant === 'register';
  const showArtwork = width >= 360 && fontScale <= 1.2;
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="dark-content" backgroundColor={authColors.paper} />
      <KeyboardAvoidingView
        style={styles.grow}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.column}>
            <View style={styles.topbar}>
              <KlaboxLogo />
              {onBack ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Kembali ke login"
                  onPress={onBack}
                  style={({pressed}) => [
                    styles.back,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.backArrow}>‹</Text>
                  <Text style={styles.backText}>Kembali</Text>
                </Pressable>
              ) : (
                <View style={styles.marketPill}>
                  <View style={styles.pillDot} />
                  <Text style={styles.marketPillText}>MARKETPLACE</Text>
                </View>
              )}
            </View>
            <View style={[styles.hero, compact && styles.heroCompact]}>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>
                  {compact ? 'SELAMAT DATANG DI KLABOX' : 'ADA TEMUAN UNTUKMU'}
                </Text>
                <Text
                  style={[styles.heroTitle, compact && styles.heroTitleCompact]}
                >
                  {compact
                    ? 'Buka akun.\nBuka peluang.'
                    : 'Temuan baru.\nCerita baru.'}
                </Text>
                {!compact && (
                  <Text style={styles.heroSubtitle}>
                    Jual beli barang, dekatkan cerita.
                  </Text>
                )}
              </View>
              {showArtwork && <ParcelArtwork compact={compact} />}
            </View>
            <View style={styles.formCard}>{children}</View>
            <View style={styles.footer}>{footer}</View>
            <View style={styles.bottomBrand}>
              <View style={styles.bottomLine} />
              <Text style={styles.bottomText}>
                TEMUKAN · TERHUBUNG · BERTUKAR
              </Text>
              <View style={styles.bottomLine} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthHeading({title, subtitle}) {
  return (
    <View style={styles.formHeading}>
      <Text accessibilityRole="header" style={styles.formTitle}>
        {title}
      </Text>
      <Text style={styles.formSubtitle}>{subtitle}</Text>
    </View>
  );
}

function InputIcon({kind, active}) {
  const tint = active ? authColors.forest : authColors.muted;
  if (kind === 'email') {
    return (
      <Text style={[styles.atSign, {color: tint}]} accessible={false}>
        @
      </Text>
    );
  }
  return (
    <View style={styles.inputIcon} accessible={false}>
      {kind === 'name' ? (
        <>
          <View style={[styles.personHead, {borderColor: tint}]} />
          <View style={[styles.personBody, {borderColor: tint}]} />
        </>
      ) : (
        <>
          <View style={[styles.lockShackle, {borderColor: tint}]} />
          <View style={[styles.lockBody, {borderColor: tint}]}>
            <View style={[styles.lockDot, {backgroundColor: tint}]} />
          </View>
        </>
      )}
    </View>
  );
}

export const AuthInput = forwardRef(function AuthInput(
  {
    label,
    kind,
    error,
    hint,
    secure = false,
    editable = true,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputFrame,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        <InputIcon kind={kind} active={focused} />
        <TextInput
          ref={ref}
          {...props}
          editable={editable}
          accessibilityLabel={label}
          accessibilityHint={error || hint}
          placeholderTextColor="#829087"
          selectionColor={authColors.forest}
          secureTextEntry={secure && !visible}
          style={styles.input}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${
              visible ? 'Sembunyikan' : 'Tampilkan'
            } ${label.toLowerCase()}`}
            accessibilityState={{disabled: !editable}}
            disabled={!editable}
            hitSlop={4}
            onPress={() => setVisible(current => !current)}
            style={styles.visibility}
          >
            <Text style={styles.visibilityText}>
              {visible ? 'Tutup' : 'Lihat'}
            </Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

export function AuthSubmit({title, busyTitle, busy, disabled, onPress}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: busy || disabled, busy}}
      accessibilityLabel={busy ? busyTitle : title}
      disabled={busy || disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.submit,
        (pressed || busy || disabled) && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={authColors.forest} size="small" />
      ) : null}
      <Text style={styles.submitText}>{busy ? busyTitle : title}</Text>
      {!busy && <Text style={styles.submitArrow}>→</Text>}
    </Pressable>
  );
}

export function AuthNotice({message, success = false}) {
  if (!message) {
    return null;
  }
  return (
    <View style={[styles.notice, success && styles.noticeSuccess]}>
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.noticeText, success && styles.noticeSuccessText]}
      >
        {message}
      </Text>
    </View>
  );
}

export function AuthSwitch({prompt, title, onPress, disabled}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchPrompt}>{prompt}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        accessibilityState={{disabled}}
        onPress={onPress}
        style={styles.switchButton}
      >
        <Text style={styles.switchText}>
          {title}
          <Text> ↗</Text>
        </Text>
      </Pressable>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  forgotRow: {alignItems: 'flex-end', marginTop: -6, marginBottom: 5},
  textButton: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 2},
  textButtonLabel: {color: authColors.forest, fontSize: 13, fontWeight: '700'},
  note: {
    color: authColors.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
  },
  match: {
    color: authColors.forest,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -7,
    marginBottom: 13,
  },
});

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: authColors.paper},
  grow: {flex: 1},
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  column: {width: '100%', maxWidth: 480},
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
    flexWrap: 'wrap',
  },
  brand: {flexDirection: 'row', alignItems: 'center', gap: 9},
  brandMark: {
    width: 34,
    height: 36,
    backgroundColor: authColors.forest,
    borderRadius: 11,
    overflow: 'hidden',
  },
  kStem: {
    position: 'absolute',
    top: 9,
    left: 10,
    width: 4,
    height: 19,
    backgroundColor: authColors.lime,
    borderRadius: 1,
  },
  kTop: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 4,
    height: 12,
    backgroundColor: authColors.lime,
    borderRadius: 1,
    transform: [{rotate: '40deg'}],
  },
  kBottom: {
    position: 'absolute',
    top: 17,
    left: 17,
    width: 4,
    height: 12,
    backgroundColor: authColors.lime,
    borderRadius: 1,
    transform: [{rotate: '-38deg'}],
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: authColors.forest,
  },
  brandDot: {color: '#9BBD43'},
  marketPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillDot: {width: 5, height: 5, borderRadius: 3, backgroundColor: '#658645'},
  marketPillText: {
    color: authColors.muted,
    fontSize: 8,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  back: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  backArrow: {fontSize: 28, lineHeight: 31, color: authColors.forest},
  backText: {fontSize: 12, fontWeight: '600', color: authColors.forest},
  hero: {
    backgroundColor: authColors.forest,
    borderRadius: 26,
    padding: 22,
    minHeight: 188,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroCompact: {minHeight: 140, paddingVertical: 19},
  heroCopy: {flex: 1, zIndex: 1, gap: 10},
  eyebrow: {
    fontSize: 8,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 1.25,
    color: authColors.lime,
  },
  heroTitle: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: '#FFFFFF',
  },
  heroTitleCompact: {fontSize: 26, lineHeight: 31},
  heroSubtitle: {fontSize: 11, lineHeight: 18, color: '#CDD9C9', maxWidth: 180},
  artwork: {width: 116, height: 140, marginLeft: 6},
  artworkCompact: {height: 110, transform: [{scale: 0.87}]},
  orbit: {
    position: 'absolute',
    width: 155,
    height: 155,
    borderWidth: 1,
    borderColor: '#3A5D48',
    borderRadius: 78,
    left: -13,
    top: -6,
  },
  orbitSmall: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderWidth: 1,
    borderColor: '#3A5D48',
    borderRadius: 58,
    left: 7,
    top: 14,
  },
  artDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: authColors.peach,
    top: 4,
    left: 4,
  },
  parcel: {
    position: 'absolute',
    width: 91,
    height: 90,
    top: 24,
    left: 14,
    backgroundColor: authColors.lime,
    borderRadius: 15,
    transform: [{rotate: '-12deg'}],
    overflow: 'hidden',
    borderBottomWidth: 7,
    borderBottomColor: '#A9C95B',
  },
  parcelTape: {
    position: 'absolute',
    width: 23,
    height: 34,
    backgroundColor: '#AAC75D',
    top: 0,
    left: 34,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  parcelLabel: {
    position: 'absolute',
    width: 29,
    height: 19,
    left: 12,
    bottom: 15,
    backgroundColor: '#EFF7D1',
    borderRadius: 3,
    padding: 5,
    gap: 3,
  },
  labelLine: {height: 2, backgroundColor: '#809856', width: 17},
  labelLineShort: {height: 2, backgroundColor: '#809856', width: 10},
  parcelK: {
    position: 'absolute',
    right: 10,
    bottom: 5,
    fontSize: 31,
    fontWeight: '900',
    color: authColors.forest,
    letterSpacing: -2,
  },
  tag: {
    position: 'absolute',
    left: -4,
    top: 111,
    backgroundColor: authColors.peach,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    transform: [{rotate: '8deg'}],
  },
  tagText: {fontSize: 10, color: authColors.forest, fontWeight: '800'},
  sparkle: {
    position: 'absolute',
    top: 5,
    right: -1,
    width: 18,
    height: 18,
    transform: [{rotate: '15deg'}],
  },
  sparkleVertical: {
    position: 'absolute',
    top: 0,
    left: 7,
    height: 18,
    width: 3,
    borderRadius: 2,
    backgroundColor: authColors.lime,
  },
  sparkleHorizontal: {
    position: 'absolute',
    left: 0,
    top: 7,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: authColors.lime,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8DF',
    borderRadius: 26,
    padding: 22,
    shadowColor: '#173F35',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.035,
    shadowRadius: 18,
    elevation: 1,
  },
  formHeading: {gap: 6, marginBottom: 23},
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: authColors.ink,
  },
  formSubtitle: {fontSize: 13, lineHeight: 20, color: authColors.muted},
  field: {marginBottom: 16, gap: 7},
  label: {fontSize: 12, fontWeight: '700', color: authColors.ink},
  inputFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authColors.border,
    backgroundColor: '#FAFBF7',
    paddingLeft: 13,
    minHeight: 53,
  },
  inputFocused: {borderColor: '#4F7656', backgroundColor: '#F6FAEF'},
  inputError: {borderColor: '#CB7A71', backgroundColor: '#FFF9F7'},
  inputDisabled: {opacity: 0.6},
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: authColors.ink,
    paddingVertical: 14,
    paddingHorizontal: 11,
  },
  atSign: {fontSize: 21, fontWeight: '500', width: 20, textAlign: 'center'},
  inputIcon: {width: 20, height: 22},
  personHead: {
    position: 'absolute',
    top: 1,
    left: 6,
    width: 9,
    height: 9,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  personBody: {
    position: 'absolute',
    bottom: 1,
    left: 2,
    width: 17,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 1.5,
  },
  lockShackle: {
    position: 'absolute',
    top: 1,
    left: 5,
    width: 10,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 5,
  },
  lockBody: {
    position: 'absolute',
    bottom: 1,
    left: 2,
    width: 16,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: '#FAFBF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockDot: {width: 2, height: 4, borderRadius: 1},
  visibility: {
    minHeight: 48,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  visibilityText: {fontSize: 11, fontWeight: '700', color: authColors.forest},
  fieldError: {fontSize: 12, lineHeight: 18, color: authColors.error},
  hint: {fontSize: 11, lineHeight: 17, color: authColors.muted},
  submit: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: authColors.lime,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: authColors.forest,
    flexShrink: 1,
    textAlign: 'center',
  },
  submitArrow: {
    fontSize: 21,
    lineHeight: 24,
    color: authColors.forest,
    marginLeft: 8,
  },
  pressed: {opacity: 0.65},
  notice: {
    backgroundColor: '#FFF0EB',
    borderRadius: 11,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#C87769',
  },
  noticeText: {fontSize: 12, lineHeight: 19, color: authColors.error},
  noticeSuccess: {backgroundColor: '#EFF6E4', borderLeftColor: '#71934F'},
  noticeSuccessText: {color: authColors.forest},
  footer: {marginTop: 10},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  switchPrompt: {fontSize: 13, color: authColors.muted},
  switchButton: {minHeight: 44, paddingHorizontal: 4, justifyContent: 'center'},
  switchText: {fontSize: 13, fontWeight: '800', color: authColors.forest},
  bottomBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  bottomLine: {height: 1, backgroundColor: '#DFE4D8', flex: 1},
  bottomText: {
    fontSize: 8,
    letterSpacing: 1.1,
    color: '#78836F',
    textAlign: 'center',
  },
});
