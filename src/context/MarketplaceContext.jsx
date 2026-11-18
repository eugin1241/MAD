import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useAuth} from './AuthContext';
import {API_BASE_URL} from '../config/marketplace';
import {createApi, emptyData} from '../services/marketplaceApi';
import {createActions} from '../services/marketplaceActions';

const Context = createContext(null);
const api = createApi(API_BASE_URL);
export function MarketplaceProvider({children}) {
  const {user, loading: authLoading} = useAuth();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRef = useRef(user);
  userRef.current = authLoading ? null : user;
  const generation = useRef(0);
  const inFlight = useRef(null);
  const refresh = useCallback(async () => {
    const uid = userRef.current?.uid;
    if (!uid) {
      return;
    }
    if (inFlight.current?.uid === uid) {
      return inFlight.current.promise;
    }
    const epoch = generation.current;
    const promise = (async () => {
      try {
        const next = await api.readAll();
        if (generation.current !== epoch || userRef.current?.uid !== uid) {
          return;
        }
        if (!next.profiles.some(profile => profile.id === uid)) {
          const profile = await api.post('profiles', {
            id: uid,
            name:
              userRef.current.displayName ||
              userRef.current.email?.split('@')[0] ||
              'Pengguna',
            role: 'user',
            location: '',
            avatarUrl: '',
            createdAt: new Date().toISOString(),
          });
          next.profiles.push(profile);
        }
        if (generation.current === epoch && userRef.current?.uid === uid) {
          setData(next);
          setError('');
        }
      } catch (failure) {
        if (generation.current === epoch) {
          setError(failure.message);
        }
      } finally {
        if (generation.current === epoch) {
          setLoading(false);
        }
        if (inFlight.current?.promise === promise) {
          inFlight.current = null;
        }
      }
    })();
    inFlight.current = {uid, promise};
    return promise;
  }, []);
  useEffect(() => {
    generation.current += 1;
    inFlight.current = null;
    setData(emptyData());
    setError('');
    setLoading(Boolean(user?.uid) && !authLoading);
    if (user?.uid && !authLoading) {
      refresh();
    }
    return () => {
      generation.current += 1;
    };
  }, [user?.uid, authLoading, refresh]);
  const actions = useMemo(
    () =>
      createActions({
        api,
        getUser: () => userRef.current,
        onChanged: async () => {
          // Finish any older read before requesting the post-mutation snapshot.
          if (inFlight.current) {
            await inFlight.current.promise;
          }
          await refresh();
        },
      }),
    [refresh],
  );
  const profile = data.profiles.find(item => item.id === user?.uid);
  return (
    <Context.Provider
      value={{
        user,
        profile,
        data,
        loading,
        error,
        refresh,
        actions,
        uploadProductImage: api.uploadImage,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useMarketplace() {
  const value = useContext(Context);
  if (!value) {
    throw new Error('MarketplaceProvider diperlukan.');
  }
  return value;
}
