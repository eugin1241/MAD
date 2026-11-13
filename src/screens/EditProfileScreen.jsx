import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Body,
  Button,
  Card,
  Empty,
  Field,
  ProductImage,
  Screen,
  Title,
} from '../components/MarketplaceUI';

function ProfileForm({profile, actions, navigation}) {
  const [name, setName] = useState(profile.name || '');
  const [location, setLocation] = useState(profile.location || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  async function save() {
    if (name.trim().length < 2) {
      throw new Error('Nama minimal 2 karakter.');
    }
    if (avatarUrl.trim() && !/^https:\/\/\S+$/i.test(avatarUrl.trim())) {
      throw new Error('Gunakan URL foto yang diawali https://.');
    }
    await actions.updateProfile({
      name: name.trim(),
      location: location.trim(),
      avatarUrl: avatarUrl.trim(),
    });
    Alert.alert('Profil tersimpan', 'Informasi profilmu sudah diperbarui.');
    navigation.goBack();
  }
  return (
    <Card>
      <ProductImage uri={avatarUrl} size={88} />
      <Field
        label="Nama lengkap"
        value={name}
        onChangeText={setName}
        maxLength={80}
        autoCapitalize="words"
      />
      <Field
        label="Kota / lokasi"
        value={location}
        onChangeText={setLocation}
        maxLength={120}
        placeholder="Contoh: Makassar"
      />
      <Field
        label="URL foto profil (HTTPS, opsional)"
        value={avatarUrl}
        onChangeText={setAvatarUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://..."
        maxLength={1000}
      />
      <Body muted>
        Lokasi membantu pembeli merencanakan pertemuan untuk transaksi.
      </Body>
      <Button title="Simpan perubahan" onPress={save} />
    </Card>
  );
}

export default function EditProfileScreen({navigation}) {
  const {profile, actions, loading, refresh, error} = useMarketplace();
  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Buat orang lebih mengenal lapakmu">Edit profil</Title>
      {error ? <Body>{error}</Body> : null}
      {profile ? (
        <ProfileForm
          key={profile.id}
          profile={profile}
          actions={actions}
          navigation={navigation}
        />
      ) : (
        <Empty
          title="Profil belum tersedia"
          description="Tarik layar ke bawah untuk mencoba lagi."
        />
      )}
    </Screen>
  );
}
