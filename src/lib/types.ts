export type UserRank = 'Seedling' | 'Wise Plane Tree' | 'Doctor';

export interface User {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  rank: UserRank;
  gardenHappiness: number; // 0-100
  location?: { latitude: number; longitude: number };
  totalStars: number;
}

export type PrivacyStatus = 'private' | 'public';

export interface Post {
  postId: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  photoUrl: string;
  plantName: string;
  nickname: string;
  privacyStatus: PrivacyStatus;
  location?: { latitude: number; longitude: number };
  timestamp: number;
  starSum: number;
  starCount: number;
  trendingScore: number;
  careInfo?: {
    watering: string;
    pruning: string;
    light: string;
    humidity: string;
    toxicity: string;
  };
}

export type CommentType = 'question' | 'advice' | 'experience';

export interface Comment {
  commentId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  type: CommentType;
  parentCommentId?: string;
  timestamp: number;
}

export interface Friendship {
  docId: string; // uid1_uid2
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted';
}