import React, {useRef, useState} from 'react';
import {Text} from 'react-native';
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

export default function RegisterScreen({navigation}) {
  const {register} = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const nameInput = useRef(null);
  const emailInput = useRef(null);
  const passwordInput = useRef(null);
  const confirmInput = useRef(null);

  const change = (field, setter) => value => {
    setter(value);
    setErrors(current => ({
      ...current,
      [field]: '',
      ...(field === 'password' ? {confirmPassword: ''} : {}),
    }));
    setMessage('');
  };

  async function handleRegister() {
    if (pendingRef.current) {
      return;
    }
    setMessage('');
    const nextErrors = {};
    if (name.trim().length < 2) {
      nextErrors.name = 'Nama minimal 2 karakter.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Masukkan alamat email yang valid.';
    }
    if (password.length < 6) {
      nextErrors.password = 'Kata sandi minimal 6 karakter.';
    }
    if (!confirmPassword || password !== confirmPassword) {
      nextErrors.confirmPassword = 'Konfirmasi kata sandi belum cocok.';
    }
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      ({
        name: nameInput,
        email: emailInput,
        password: passwordInput,
        confirmPassword: confirmInput,
      })[firstError].current?.focus();
      return;
    }
    pendingRef.current = true;
    setPending(true);
    try {
      const result = await register(email.trim(), password, name.trim());
      if (!result.success) {
        setMessage(
          result.error || 'Akun belum berhasil dibuat. Silakan coba lagi.',
        );
      }
    } catch {
      setMessage('Koneksi sedang bermasalah. Silakan coba lagi.');
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  const goToLogin = () => {
    if (!pendingRef.current) {
      navigation.navigate('Login');
    }
  };
  return (
    <AuthShell
      variant="register"
      onBack={goToLogin}
      footer={
        <AuthSwitch
          prompt="Sudah punya akun?"
          title="Masuk di sini"
          disabled={pending}
          onPress={goToLogin}
        />
      }
    >
      <AuthHeading
        title="Kenalan dulu, yuk."
        subtitle="Satu akun untuk belanja dan mulai berjualan."
      />
      <AuthNotice message={message} />
      <AuthInput
        ref={nameInput}
        label="Nama lengkap"
        kind="name"
        placeholder="Nama yang akan dilihat pengguna lain"
        value={name}
        onChangeText={change('name', setName)}
        error={errors.name}
        editable={!pending}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={80}
        returnKeyType="next"
        onSubmitEditing={() => emailInput.current?.focus()}
        blurOnSubmit={false}
      />
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
        textContentType="emailAddress"
        maxLength={254}
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
        blurOnSubmit={false}
      />
      <AuthInput
        ref={passwordInput}
        label="Kata sandi"
        kind="password"
        placeholder="Buat kata sandi"
        value={password}
        onChangeText={change('password', setPassword)}
        error={errors.password}
        hint="Gunakan minimal 6 karakter."
        editable={!pending}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmInput.current?.focus()}
        blurOnSubmit={false}
      />
      <AuthInput
        ref={confirmInput}
        label="Konfirmasi kata sandi"
        kind="password"
        placeholder="Ulangi kata sandimu"
        value={confirmPassword}
        onChangeText={change('confirmPassword', setConfirmPassword)}
        error={errors.confirmPassword}
        editable={!pending}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleRegister}
      />
      {!!confirmPassword &&
        password === confirmPassword &&
        password.length >= 6 && (
          <Text accessibilityLiveRegion="polite" style={authStyles.match}>
            Kata sandi sudah cocok.
          </Text>
        )}
      <AuthSubmit
        title="Buat akun Klabox"
        busyTitle="Menyiapkan akunmu…"
        busy={pending}
        onPress={handleRegister}
      />
      <Text style={authStyles.note}>Temuan berikutnya bisa jadi milikmu.</Text>
    </AuthShell>
  );
}
