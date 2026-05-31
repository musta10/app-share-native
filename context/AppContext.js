import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { SEED_FRIENDS, SEED_SONGS, SEED_USER } from "@/data/seed";

const STORAGE_KEY = "share_state_v2";
const TUNELINK_V2_KEY = "tunelink_state_v2";
const LEGACY_KEY = "tunelink_state_v1";

const ALLOWED_COLORS = [
  "#FFBA00", "#f97316", "#ef4444", "#f59e0b", "#eab308",
  "#10b981", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

const DEFAULT_FOLLOWING = SEED_FRIENDS.filter((f) => f.following).map((f) => f.id);

const AppContext = createContext(null);

function makeAccountId(existingIds = new Set()) {
  let id;
  let tries = 0;
  do {
    id = `u_acc_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    tries++;
  } while (existingIds.has(id) && tries < 50);
  return id;
}

function slugify(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
}

function makeUniqueHandle(baseSlug, takenHandles) {
  const base = baseSlug || "yo";
  const candidate = `@${base}`;
  if (!takenHandles.has(candidate.toLowerCase())) return candidate;
  let i = 2;
  while (takenHandles.has(`@${base}${i}`.toLowerCase())) i++;
  return `@${base}${i}`;
}

function sanitizeProfile(profile) {
  const color = (profile?.color || "").toLowerCase();
  const isAllowed = ALLOWED_COLORS.some((c) => c.toLowerCase() === color);
  return {
    ...SEED_USER,
    ...profile,
    color: isAllowed ? profile.color : "#FFBA00",
  };
}

function migrateSongs(rawSongs) {
  if (!Array.isArray(rawSongs)) return [];
  return rawSongs.map((s) => {
    if (!s || typeof s !== "object") return s;
    if (s.platform) return s;
    const videoId = s.videoId || null;
    return {
      ...s,
      platform: "youtube",
      videoId,
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : (s.url || ""),
    };
  });
}

function dedupeAccounts(rawAccounts) {
  const seenIds = new Set();
  const seenHandles = new Set();
  const out = [];
  for (const a of rawAccounts) {
    let id = a.id;
    if (!id || seenIds.has(id)) {
      id = makeAccountId(seenIds);
    }
    seenIds.add(id);

    let profile = sanitizeProfile(a.profile || {});
    profile.id = id;
    let handleLc = (profile.handle || "").toLowerCase();
    if (!handleLc || seenHandles.has(handleLc)) {
      const base = slugify(profile.name) || "yo";
      profile.handle = makeUniqueHandle(base, seenHandles);
      handleLc = profile.handle.toLowerCase();
    }
    seenHandles.add(handleLc);

    out.push({
      id,
      profile,
      songs: migrateSongs(a.songs),
      following: Array.isArray(a.following) ? a.following : DEFAULT_FOLLOWING,
      lastActiveAt: a.lastActiveAt || Date.now(),
    });
  }
  return out;
}

export function AppProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [me, setMe] = useState(SEED_USER);
  const [songs, setSongs] = useState(SEED_SONGS);
  const [following, setFollowing] = useState(DEFAULT_FOLLOWING);
  const [hydrated, setHydrated] = useState(false);

  const onboarded = !!currentAccountId;

  useEffect(() => {
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          const oldRaw = await AsyncStorage.getItem(TUNELINK_V2_KEY);
          if (oldRaw) {
            raw = oldRaw;
            await AsyncStorage.setItem(STORAGE_KEY, oldRaw).catch(() => {});
            await AsyncStorage.removeItem(TUNELINK_V2_KEY).catch(() => {});
          }
        }
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data.accounts)) {
            const cleanedAccounts = dedupeAccounts(data.accounts);
            setAccounts(cleanedAccounts);
            const currentId = data.currentAccountId;
            const acc = cleanedAccounts.find((a) => a.id === currentId);
            if (acc) {
              setCurrentAccountId(acc.id);
              setMe(acc.profile);
              setSongs(acc.songs);
              setFollowing(acc.following);
            }
          }
        } else {
          const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
          if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            if (legacy?.me && legacy?.onboarded) {
              const profile = sanitizeProfile(legacy.me);
              const accId = profile.id || makeAccountId();
              profile.id = accId;
              const acc = {
                id: accId,
                profile,
                songs: migrateSongs(legacy.songs),
                following: Array.isArray(legacy.following) ? legacy.following : DEFAULT_FOLLOWING,
                lastActiveAt: Date.now(),
              };
              setAccounts([acc]);
              setCurrentAccountId(accId);
              setMe(profile);
              setSongs(acc.songs);
              setFollowing(acc.following);
            }
            await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
          }
        }
      } catch (e) {
        // silencioso
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Sincroniza cuenta actual hacia el array de accounts
  useEffect(() => {
    if (!hydrated || !currentAccountId) return;
    setAccounts((prev) => {
      const snapshot = {
        id: currentAccountId,
        profile: me,
        songs,
        following,
        lastActiveAt: Date.now(),
      };
      const idx = prev.findIndex((a) => a.id === currentAccountId);
      if (idx === -1) return [...prev, snapshot];
      const next = [...prev];
      next[idx] = snapshot;
      return next;
    });
  }, [me, songs, following, currentAccountId, hydrated]);

  // Persiste a AsyncStorage
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        currentAccountId,
        accounts,
      })
    ).catch(() => {});
  }, [accounts, currentAccountId, hydrated]);

  const users = useMemo(() => [me, ...SEED_FRIENDS], [me]);

  const addSong = (song) => {
    const platform = song.platform || "youtube";
    const videoId = song.videoId || null;
    const url =
      song.url ||
      (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
    const newSong = {
      id: `s_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      platform,
      url,
      videoId,
      title: song.title,
      artist: song.artist || "",
      addedById: me.id,
      sharedAt: Date.now(),
      message: song.message || "",
      likes: [],
      comments: [],
    };
    setSongs((prev) => [newSong, ...prev]);
    return newSong;
  };

  const removeSong = (songId) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  const toggleLike = (songId) => {
    setSongs((prev) =>
      prev.map((s) => {
        if (s.id !== songId) return s;
        const liked = s.likes.includes(me.id);
        return {
          ...s,
          likes: liked
            ? s.likes.filter((u) => u !== me.id)
            : [...s.likes, me.id],
        };
      })
    );
  };

  const addComment = (songId, text) => {
    if (!text || !text.trim()) return;
    setSongs((prev) =>
      prev.map((s) => {
        if (s.id !== songId) return s;
        return {
          ...s,
          comments: [
            ...s.comments,
            {
              id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              userId: me.id,
              text: text.trim(),
              at: Date.now(),
            },
          ],
        };
      })
    );
  };

  const toggleFollow = (userId) => {
    setFollowing((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const updateProfile = (changes) => {
    const trimmedName =
      typeof changes.name === "string" ? changes.name.trim() : null;
    if (trimmedName !== null && trimmedName.length < 2) {
      return { ok: false, error: "El nombre debe tener al menos 2 letras." };
    }

    let normalizedHandle = null;
    if (typeof changes.handle === "string") {
      const raw = changes.handle.trim().replace(/^@+/, "");
      if (!raw) {
        return { ok: false, error: "El usuario no puede estar vacío." };
      }
      const slug = slugify(raw);
      if (!slug) {
        return {
          ok: false,
          error: "El usuario solo puede tener letras y números.",
        };
      }
      normalizedHandle = `@${slug}`;
      const collision = accounts.some(
        (a) =>
          a.id !== currentAccountId &&
          (a.profile.handle || "").toLowerCase() === normalizedHandle.toLowerCase()
      );
      if (collision) {
        return {
          ok: false,
          error: `El usuario ${normalizedHandle} ya lo tiene otra cuenta guardada en este dispositivo.`,
        };
      }
    }

    let normalizedAge;
    if (Object.prototype.hasOwnProperty.call(changes, "age")) {
      const raw = changes.age;
      if (raw === null || raw === "" || raw === undefined) {
        return { ok: false, error: "Falta tu edad." };
      }
      const n = Number(raw);
      if (isNaN(n)) {
        return { ok: false, error: "La edad debe ser un número." };
      }
      if (n < 13) {
        return { ok: false, error: "Debes tener al menos 13 años." };
      }
      if (n > 120) {
        return { ok: false, error: "Edad inválida." };
      }
      normalizedAge = n;
    }

    let normalizedCountry;
    if (Object.prototype.hasOwnProperty.call(changes, "country")) {
      if (!changes.country) {
        return { ok: false, error: "Selecciona tu país." };
      }
      normalizedCountry = changes.country;
    }

    const finalName = trimmedName !== null ? trimmedName : me.name;
    const finalAge =
      normalizedAge !== undefined ? normalizedAge : me.age;
    const finalCountry =
      normalizedCountry !== undefined ? normalizedCountry : me.country;

    const duplicate = accounts.find(
      (a) =>
        a.id !== currentAccountId &&
        (a.profile.name || "").trim().toLowerCase() === finalName.toLowerCase() &&
        a.profile.age === finalAge &&
        a.profile.country === finalCountry
    );
    if (duplicate) {
      return {
        ok: false,
        error: `Ya tienes otra cuenta (${duplicate.profile.name}) con el mismo nombre, edad y país. Cambia algún dato.`,
      };
    }

    setMe((prev) => ({
      ...prev,
      ...changes,
      ...(trimmedName !== null ? { name: trimmedName } : {}),
      ...(normalizedHandle !== null ? { handle: normalizedHandle } : {}),
      ...(normalizedAge !== undefined ? { age: normalizedAge } : {}),
      ...(normalizedCountry !== undefined ? { country: normalizedCountry } : {}),
    }));
    return { ok: true };
  };

  const joinByCode = (code) => {
    if (!code || !code.trim()) return null;
    const normalized = code.trim().toLowerCase().replace(/^@/, "");
    const user = users.find(
      (u) =>
        u.id !== me.id &&
        (u.handle.toLowerCase().replace(/^@/, "") === normalized ||
          u.id.toLowerCase() === normalized)
    );
    if (!user) return null;
    if (!following.includes(user.id)) {
      setFollowing((prev) => [...prev, user.id]);
    }
    return user;
  };

  const switchAccount = (accountId) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return false;
    setCurrentAccountId(accountId);
    setMe(acc.profile);
    setSongs(acc.songs || []);
    setFollowing(acc.following || DEFAULT_FOLLOWING);
    return true;
  };

  const removeAccount = (accountId) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    if (accountId === currentAccountId) {
      setCurrentAccountId(null);
      setMe(SEED_USER);
      setSongs(SEED_SONGS);
      setFollowing(DEFAULT_FOLLOWING);
    }
  };

  const signOut = async () => {
    setCurrentAccountId(null);
    setMe(SEED_USER);
    setSongs(SEED_SONGS);
    setFollowing(DEFAULT_FOLLOWING);
  };

  const completeOnboarding = (data) => {
    const rawName = typeof data === "string" ? data : data?.name;
    const ageRaw = typeof data === "object" ? data?.age : undefined;
    const country = typeof data === "object" ? data?.country : undefined;
    const trimmed = (rawName || "").trim();

    if (!trimmed) {
      return { ok: false, error: "Escribe tu nombre." };
    }
    if (trimmed.length < 2) {
      return { ok: false, error: "El nombre debe tener al menos 2 letras." };
    }
    const ageNum = ageRaw === undefined || ageRaw === null || ageRaw === ""
      ? null
      : Number(ageRaw);
    if (ageNum === null || isNaN(ageNum)) {
      return { ok: false, error: "Falta tu edad." };
    }
    if (ageNum < 13) {
      return { ok: false, error: "Debes tener al menos 13 años." };
    }
    if (ageNum > 120) {
      return { ok: false, error: "Edad inválida." };
    }
    if (!country) {
      return { ok: false, error: "Selecciona tu país." };
    }

    const normalizedName = trimmed.toLowerCase();
    const duplicate = accounts.find(
      (a) =>
        (a.profile.name || "").trim().toLowerCase() === normalizedName &&
        a.profile.age === ageNum &&
        a.profile.country === country
    );
    if (duplicate) {
      return {
        ok: false,
        error: `Ya tienes una cuenta de ${duplicate.profile.name} guardada con esos mismos datos. Usa esa cuenta o cambia algún campo.`,
        existingAccountId: duplicate.id,
      };
    }

    const seenIds = new Set(accounts.map((a) => a.id));
    const seenHandles = new Set(
      accounts.map((a) => (a.profile.handle || "").toLowerCase())
    );

    const baseSlug = slugify(trimmed);
    const handle = makeUniqueHandle(baseSlug, seenHandles);
    const accId = makeAccountId(seenIds);

    const profile = {
      ...SEED_USER,
      id: accId,
      name: trimmed,
      handle,
      age: ageNum,
      country,
    };

    setCurrentAccountId(accId);
    setMe(profile);
    setSongs([]);
    setFollowing([]);
    return { ok: true, accountId: accId };
  };

  const getUser = (userId) => users.find((u) => u.id === userId) || users[0];

  const songById = (id) => songs.find((s) => s.id === id);

  const feedSongs = useMemo(() => {
    const allowed = new Set([me.id, ...following]);
    return songs
      .filter((s) => allowed.has(s.addedById))
      .sort((a, b) => b.sharedAt - a.sharedAt);
  }, [songs, following, me.id]);

  const mySongs = useMemo(
    () => songs.filter((s) => s.addedById === me.id),
    [songs, me.id]
  );

  const stats = useMemo(() => {
    const sharedCount = mySongs.length;
    const friendsCount = following.length;
    const likesReceived = mySongs.reduce((acc, s) => acc + s.likes.length, 0);
    return { sharedCount, friendsCount, likesReceived };
  }, [mySongs, following]);

  const savedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0)),
    [accounts]
  );

  const value = {
    me,
    users,
    songs,
    feedSongs,
    mySongs,
    following,
    hydrated,
    onboarded,
    stats,
    accounts,
    savedAccounts,
    currentAccountId,
    addSong,
    removeSong,
    toggleLike,
    addComment,
    toggleFollow,
    updateProfile,
    joinByCode,
    signOut,
    switchAccount,
    removeAccount,
    completeOnboarding,
    getUser,
    songById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `hace ${day}d`;
  const week = Math.floor(day / 7);
  if (week < 4) return `hace ${week}sem`;
  return new Date(ts).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
