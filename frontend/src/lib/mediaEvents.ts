export const PROFILE_AVATAR_UPDATED_EVENT = "profile-avatar-updated";

export type ProfileAvatarUpdatedDetail = {
  userId: string;
  avatarUrl: string | null;
};

export const dispatchProfileAvatarUpdated = (
  detail: ProfileAvatarUpdatedDetail
) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ProfileAvatarUpdatedDetail>(PROFILE_AVATAR_UPDATED_EVENT, {
      detail,
    })
  );
};
