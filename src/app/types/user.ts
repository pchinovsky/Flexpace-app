export interface User {
  uid: string;
  email: string | null;
  // firebase available user prop used for username
  displayName?: string | null;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  firstName?: string;
  lastName?: string;
  address?: string;
  profilePicture?: string;
  defBoardBckgr?: string;
}
