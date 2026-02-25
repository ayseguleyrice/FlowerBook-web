import {
  addDoc,
  collection,
  doc,
  GeoPoint,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { DocumentData, QuerySnapshot } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, assertFirebaseReady, db, ensureSignedInAnonymously, storage } from '@/lib/firebase';
import type { Comment, CommentType, Post, PrivacyStatus, User, UserRank } from '@/lib/types';

const DEFAULT_AVATAR = 'https://picsum.photos/seed/flowerbook-avatar/100/100';
const DEFAULT_RANK: UserRank = 'Filiz Üye';

function toMillis(value: Timestamp | number | Date | null | undefined): number {
  if (!value) return Date.now();
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return value.getTime();
}

function pairId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

function toLatLng(location?: GeoPoint | { latitude: number; longitude: number }) {
  if (!location) return undefined;
  if (location instanceof GeoPoint) {
    return { latitude: location.latitude, longitude: location.longitude };
  }
  return location;
}

function hoursSince(timestampMs: number) {
  return Math.max(0, (Date.now() - timestampMs) / (1000 * 60 * 60));
}

function calculateTrendingScore(starSum: number, timestampMs: number) {
  return Number((starSum / (hoursSince(timestampMs) + 2)).toFixed(4));
}

function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDiff = toRad(b.latitude - a.latitude);
  const lngDiff = toRad(b.longitude - a.longitude);

  const h =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

async function getOrCreateCurrentUser() {
  assertFirebaseReady();
  const user = await ensureSignedInAnonymously();
  if (!user || !db) {
    throw new Error('Unable to authenticate user.');
  }

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const username = `plantparent_${user.uid.slice(0, 6)}`;
    await setDoc(userRef, {
      uid: user.uid,
      username,
      displayName: 'Plant Parent',
      avatarUrl: DEFAULT_AVATAR,
      rank: DEFAULT_RANK,
      gardenHappiness: 0,
      totalStars: 0,
      location: null,
    });
  }

  return user;
}

async function getOwnerPublicMeta(ownerId: string) {
  if (!db) {
    return { ownerName: 'Plant Parent', ownerAvatar: DEFAULT_AVATAR };
  }

  const ownerSnap = await getDoc(doc(db, 'users', ownerId));
  if (!ownerSnap.exists()) {
    return { ownerName: 'Plant Parent', ownerAvatar: DEFAULT_AVATAR };
  }

  const data = ownerSnap.data();
  return {
    ownerName: (data.displayName as string) || (data.username as string) || 'Plant Parent',
    ownerAvatar: (data.avatarUrl as string) || DEFAULT_AVATAR,
  };
}

function mapPost(
  postId: string,
  data: Record<string, unknown>,
  ownerName: string,
  ownerAvatar: string
): Post {
  return {
    postId,
    ownerId: String(data.ownerId ?? ''),
    ownerName,
    ownerAvatar,
    photoUrl: String(data.photoUrl ?? ''),
    plantCommonName: String(data.plantCommonName ?? 'Unknown Plant'),
    nickname: String(data.nickname ?? ''),
    privacyStatus: (data.privacyStatus as PrivacyStatus) ?? 'public',
    location: toLatLng(data.location as GeoPoint | undefined),
    timestamp: toMillis(data.timestamp as Timestamp | undefined),
    starSum: Number(data.starSum ?? 0),
    starCount: Number(data.starCount ?? 0),
    trendingScore: Number(data.trendingScore ?? 0),
    careInfo: data.careInfo as Post['careInfo'] | undefined,
  };
}

export async function uploadTemporaryImage(file: File) {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!storage) throw new Error('Storage unavailable.');

  const tempPath = `temp-uploads/${user.uid}/${Date.now()}-${file.name}`;
  const imageRef = ref(storage, tempPath);
  await uploadBytes(imageRef, file, { contentType: file.type });
  const downloadUrl = await getDownloadURL(imageRef);

  return { path: tempPath, downloadUrl };
}

export async function createPost(params: {
  photoUrl: string;
  plantCommonName: string;
  nickname: string;
  privacyStatus: PrivacyStatus;
  careInfo: NonNullable<Post['careInfo']>;
  location?: { latitude: number; longitude: number };
}) {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) throw new Error('Firestore unavailable.');

  const location = params.location
    ? new GeoPoint(params.location.latitude, params.location.longitude)
    : null;

  const postRef = await addDoc(collection(db, 'posts'), {
    ownerId: user.uid,
    photoUrl: params.photoUrl,
    plantCommonName: params.plantCommonName,
    nickname: params.nickname,
    privacyStatus: params.privacyStatus,
    location,
    timestamp: serverTimestamp(),
    starSum: 0,
    starCount: 0,
    trendingScore: 0,
    careInfo: params.careInfo,
  });

  return postRef.id;
}

async function readPostsFromQuery(queryPromise: Promise<QuerySnapshot<DocumentData>>) {
  const snapshot = await queryPromise;
  const posts = await Promise.all(
    snapshot.docs.map(async (postDoc) => {
      const raw = postDoc.data() as Record<string, unknown>;
      const ownerId = String(raw.ownerId ?? '');
      const ownerMeta = await getOwnerPublicMeta(ownerId);
      return mapPost(postDoc.id, raw, ownerMeta.ownerName, ownerMeta.ownerAvatar);
    })
  );

  return posts;
}

export async function getTrendingPublicPosts() {
  assertFirebaseReady();
  if (!db) return [];

  return readPostsFromQuery(
    getDocs(
      query(
        collection(db, 'posts'),
        where('privacyStatus', '==', 'public'),
        orderBy('trendingScore', 'desc'),
        limit(30)
      )
    )
  );
}

export async function getFreshPublicPosts() {
  assertFirebaseReady();
  if (!db) return [];

  return readPostsFromQuery(
    getDocs(
      query(
        collection(db, 'posts'),
        where('privacyStatus', '==', 'public'),
        orderBy('timestamp', 'desc'),
        limit(30)
      )
    )
  );
}

export async function getNearbyPublicPosts(center: { latitude: number; longitude: number }) {
  assertFirebaseReady();
  if (!db) return [];

  const latitudeRadius = 10 / 111;
  const longitudeRadius = 10 / (111 * Math.cos((center.latitude * Math.PI) / 180));

  const latMin = center.latitude - latitudeRadius;
  const latMax = center.latitude + latitudeRadius;
  const lngMin = center.longitude - longitudeRadius;
  const lngMax = center.longitude + longitudeRadius;

  const snapshot = await getDocs(
    query(
      collection(db, 'posts'),
      where('privacyStatus', '==', 'public'),
      where('location', '>=', new GeoPoint(latMin, lngMin)),
      where('location', '<=', new GeoPoint(latMax, lngMax)),
      limit(100)
    )
  );

  const mapped = await Promise.all(
    snapshot.docs.map(async (postDoc) => {
      const raw = postDoc.data() as Record<string, unknown>;
      const ownerId = String(raw.ownerId ?? '');
      const ownerMeta = await getOwnerPublicMeta(ownerId);
      return mapPost(postDoc.id, raw, ownerMeta.ownerName, ownerMeta.ownerAvatar);
    })
  );

  return mapped
    .filter((post) => {
      if (!post.location) return false;
      return haversineDistanceKm(center, post.location) <= 10;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function getMyPosts() {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) return [];

  return readPostsFromQuery(
    getDocs(
      query(collection(db, 'posts'), where('ownerId', '==', user.uid), orderBy('timestamp', 'desc'), limit(50))
    )
  );
}

export async function getPostById(postId: string) {
  assertFirebaseReady();
  if (!db) return null;

  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;

  const raw = snap.data() as Record<string, unknown>;
  const ownerMeta = await getOwnerPublicMeta(String(raw.ownerId ?? ''));
  return mapPost(snap.id, raw, ownerMeta.ownerName, ownerMeta.ownerAvatar);
}

export async function submitStars(postId: string, stars: number) {
  assertFirebaseReady();
  await getOrCreateCurrentUser();
  if (!db) throw new Error('Firestore unavailable.');

  const postRef = doc(db, 'posts', postId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(postRef);
    if (!snap.exists()) {
      throw new Error('Post not found.');
    }

    const data = snap.data() as Record<string, unknown>;
    const timestampMs = toMillis(data.timestamp as Timestamp | undefined);
    const currentStarSum = Number(data.starSum ?? 0);
    const currentStarCount = Number(data.starCount ?? 0);

    const nextStarSum = currentStarSum + stars;
    const nextStarCount = currentStarCount + 1;
    const nextTrendingScore = calculateTrendingScore(nextStarSum, timestampMs);

    transaction.update(postRef, {
      starSum: nextStarSum,
      starCount: nextStarCount,
      trendingScore: nextTrendingScore,
    });

    const ownerId = String(data.ownerId ?? '');
    if (ownerId && db) {
      const ownerRef = doc(db, 'users', ownerId);
      transaction.set(ownerRef, { totalStars: increment(stars) }, { merge: true });
    }
  });
}

export async function getComments(postId: string) {
  assertFirebaseReady();
  if (!db) return [];

  const commentsSnapshot = await getDocs(
    query(collection(db, 'posts', postId, 'comments'), orderBy('timestamp', 'desc'), limit(100))
  );

  const comments = await Promise.all(
    commentsSnapshot.docs.map(async (commentDoc) => {
      const data = commentDoc.data() as Record<string, unknown>;
      const authorId = String(data.authorId ?? '');
      const authorMeta = await getOwnerPublicMeta(authorId);

      return {
        commentId: commentDoc.id,
        authorId,
        authorName: authorMeta.ownerName,
        authorAvatar: authorMeta.ownerAvatar,
        text: String(data.text ?? ''),
        type: (data.type as CommentType) ?? 'experience',
        parentCommentId: (data.parentCommentId as string | null | undefined) ?? null,
        timestamp: toMillis(data.timestamp as Timestamp | undefined),
      } satisfies Comment;
    })
  );

  return comments;
}

export async function addComment(params: {
  postId: string;
  text: string;
  type: CommentType;
  parentCommentId?: string | null;
}) {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) throw new Error('Firestore unavailable.');

  await addDoc(collection(db, 'posts', params.postId, 'comments'), {
    authorId: user.uid,
    text: params.text,
    type: params.type,
    parentCommentId: params.parentCommentId ?? null,
    timestamp: serverTimestamp(),
  });
}

export async function getCurrentUserProfile() {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) return null;

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) return null;

  const data = snap.data() as Record<string, unknown>;

  return {
    uid: String(data.uid ?? user.uid),
    username: String(data.username ?? ''),
    displayName: String(data.displayName ?? 'Plant Parent'),
    avatarUrl: String(data.avatarUrl ?? DEFAULT_AVATAR),
    rank: (data.rank as UserRank) ?? DEFAULT_RANK,
    gardenHappiness: Number(data.gardenHappiness ?? 0),
    location: toLatLng(data.location as GeoPoint | undefined),
    totalStars: Number(data.totalStars ?? 0),
  } satisfies User;
}

export async function getAcceptedFriendCount() {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) return 0;

  const [asRequester, asReceiver] = await Promise.all([
    getDocs(
      query(
        collection(db, 'friendships'),
        where('requesterId', '==', user.uid),
        where('status', '==', 'accepted')
      )
    ),
    getDocs(
      query(
        collection(db, 'friendships'),
        where('receiverId', '==', user.uid),
        where('status', '==', 'accepted')
      )
    ),
  ]);

  return asRequester.size + asReceiver.size;
}

export async function updateMyLocation(location: { latitude: number; longitude: number }) {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) return;

  await setDoc(
    doc(db, 'users', user.uid),
    { location: new GeoPoint(location.latitude, location.longitude) },
    { merge: true }
  );
}

export type FriendshipWithUser = {
  docId: string;
  uid: string;
  displayName: string;
  avatarUrl: string;
  status: 'pending' | 'accepted';
  direction: 'sent' | 'received';
};

export async function getMyFriendships(): Promise<FriendshipWithUser[]> {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) return [];

  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('requesterId', '==', user.uid))),
    getDocs(query(collection(db, 'friendships'), where('receiverId', '==', user.uid))),
  ]);

  const results: FriendshipWithUser[] = [];

  for (const snap of [...sentSnap.docs, ...receivedSnap.docs]) {
    const data = snap.data() as Record<string, unknown>;
    const isSent = data.requesterId === user.uid;
    const otherUid = isSent ? String(data.receiverId ?? '') : String(data.requesterId ?? '');
    const meta = await getOwnerPublicMeta(otherUid);
    results.push({
      docId: snap.id,
      uid: otherUid,
      displayName: meta.ownerName,
      avatarUrl: meta.ownerAvatar,
      status: (data.status as 'pending' | 'accepted') ?? 'pending',
      direction: isSent ? 'sent' : 'received',
    });
  }

  return results;
}

export async function acceptFriendRequest(docId: string) {
  assertFirebaseReady();
  if (!db) return;
  await setDoc(doc(db, 'friendships', docId), { status: 'accepted' }, { merge: true });
}

export async function searchUsersByUsername(searchTerm: string) {
  assertFirebaseReady();
  const me = await getOrCreateCurrentUser();
  if (!db) return [];

  const snap = await getDocs(
    query(
      collection(db, 'users'),
      where('username', '>=', searchTerm.toLowerCase()),
      where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
      limit(10)
    )
  );

  return snap.docs
    .filter((d) => d.id !== me.uid)
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        uid: d.id,
        username: String(data.username ?? ''),
        displayName: String(data.displayName ?? 'Plant Parent'),
        avatarUrl: String(data.avatarUrl ?? DEFAULT_AVATAR),
      };
    });
}

export async function createOrUpdateFriendship(receiverId: string) {
  assertFirebaseReady();
  const user = await getOrCreateCurrentUser();
  if (!db) return;

  const friendshipId = pairId(user.uid, receiverId);
  await setDoc(
    doc(db, 'friendships', friendshipId),
    {
      requesterId: user.uid,
      receiverId,
      status: 'pending',
    },
    { merge: true }
  );
}

export async function promoteTempImageToPermanent(tempPath: string, postId: string) {
  if (!storage || !db) {
    return;
  }

  const sourceRef = ref(storage, tempPath);
  const sourceUrl = await getDownloadURL(sourceRef);
  await updateDoc(doc(db, 'posts', postId), { photoUrl: sourceUrl });
}

export async function removeTempImage(path: string) {
  if (!storage) {
    return;
  }

  await deleteObject(ref(storage, path));
}

export function calculateGardenHappinessFromPosts(posts: Post[]) {
  if (posts.length === 0) return 0;

  const twoWeeksMs = 1000 * 60 * 60 * 24 * 14;
  const caredRecently = posts.filter(post => Date.now() - post.timestamp <= twoWeeksMs).length;
  const normalized = Math.round(Math.min(100, (caredRecently / Math.max(1, posts.length)) * 100));
  return normalized;
}

export function currentUid() {
  return auth?.currentUser?.uid ?? null;
}
