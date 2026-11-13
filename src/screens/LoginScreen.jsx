import React, {useRef, useState} from 'react';
import {Alert, Pressable, Text, View} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {
  AuthHeading,
  AuthInput,
  AuthNotice,
  AuthShell,
  AuthSubmit,
  AuthSwitch,
  authStyles,
} from '../components/AuthUI';

const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function LoginScreen({navigation}) {
  const {login, resetPassword} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState('');
  const pendingRef = useRef(false);
  const passwordInput = useRef(null);
  const emailInput = useRef(null);

  const change = (field, setter) => value => {
    setter(value);
    setErrors(current => ({...current, [field]: ''}));
    setMessage('');
    setSuccess('');
  };

  async function handleLogin() {
    if (pendingRef.current) {
      return;
    }
    setMessage('');
    setSuccess('');
    const nextErrors = {};
    if (!validEmail(email)) {
      nextErrors.email = 'Masukkan alamat email yang valid.';
    }
    if (!password) {
      nextErrors.password = 'Masukkan kata sandimu.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      (nextErrors.email ? emailInput : passwordInput).current?.focus();
      return;
    }
    pendingRef.current = true;
    setPending('login');
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setMessage(result.error || 'Belum berhasil masuk. Coba lagi.');
      }
    } catch {
      setMessage('Koneksi sedang bermasalah. Silakan coba lagi.');
    } finally {
      pendingRef.current = false;
      setPending('');
    }
  }

  function handleForgotPassword() {
    if (pendingRef.current) {
      return;
    }
    setMessage('');
    setSuccess('');
    if (!validEmail(email)) {
      setErrors(current => ({
        ...current,
        email: 'Isi email akunmu untuk mengatur ulang kata sandi.',
      }));
      emailInput.current?.focus();
      return;
    }
    const targetEmail = email.trim();
    Alert.alert(
      'Atur ulang kata sandi',
      `Kirim tautan reset ke ${targetEmail}?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Kirim tautan',
          onPress: async () => {
            if (pendingRef.current) {
              return;
            }
            pendingRef.current = true;
            setPending('reset');
            try {
              const result = await resetPassword(targetEmail);
              if (result.success) {
                setSuccess(
                  'Tautan reset sudah dikirim. Periksa kotak masuk atau folder spam emailmu.',
                );
              } else {
                setMessage(result.error || 'Tautan belum berhasil dikirim.');
              }
            } catch {
              setMessage('Koneksi sedang bermasalah. Silakan coba lagi.');
            } finally {
              pendingRef.current = false;
              setPending('');
            }
          },
        },
      ],
    );
  }

  return (
    <AuthShell
      footer={
        <AuthSwitch
          prompt="Baru di Klabox?"
          title="Buat akun"
          disabled={!!pending}
          onPress={() => navigation.navigate('Register')}
        />
      }
    >
      <AuthHeading
        title="Senang kamu kembali."
        subtitle="Masuk untuk melanjutkan temuanmu."
      />
      <AuthNotice message={message} />
      <AuthNotice message={success} success />
      <AuthInput
        ref={emailInput}
        label="Email"
        kind="email"
        placeholder="nama@email.com"
        value={email}
        onChangeText={change('email', setEmail)}
        error={errors.email}
        editable={!pending}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
        blurOnSubmit={false}
        maxLength={254}
      />
      <AuthInput
        ref={passwordInput}
        label="Kata sandi"
        kind="password"
        placeholder="Masukkan kata sandimu"
        value={password}
        onChangeText={change('password', setPassword)}
        error={errors.password}
        editable={!pending}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
      <View style={authStyles.forgotRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{disabled: !!pending}}
          disabled={!!pending}
          onPress={handleForgotPassword}
          style={authStyles.textButton}
        >
          <Text style={authStyles.textButtonLabel}>
            {pending === 'reset' ? 'Mengirim tautan…' : 'Lupa kata sandi?'}
          </Text>
        </Pressable>
      </View>
      <AuthSubmit
        title="Masuk ke Klabox"
        busyTitle="Sedang masuk…"
        busy={pending === 'login'}
        disabled={pending === 'reset'}
        onPress={handleLogin}
      />
    </AuthShell>
  );
}
