"use client";

import type { PlaceSummaryResponse } from "@/types/catalog";
import type { PostResponse } from "@/types/social";
import type { UserSearchResult } from "@/types/search";
import { cx } from "@/lib/classNames";
import { Avatar } from "@/components/elements/Avatar";
import { NavIcon } from "@/components/ui/NavIcon";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { useT } from "@/hooks";

export interface ZyraSearchResultsProps {
  places: PlaceSummaryResponse[];
  users: UserSearchResult[];
  posts: PostResponse[];
  loading: boolean;
  query: string;
  onResultClick: (type: "place" | "user" | "post", id: string) => void;
  onAskZyra?: () => void;
}

export const ZyraSearchResults = ({
  places,
  users,
  posts,
  loading,
  query,
  onResultClick,
  onAskZyra,
}: ZyraSearchResultsProps) => {
  const { t } = useT();
  const hasResults = places.length > 0 || users.length > 0 || posts.length > 0;
  const showNoResults = !loading && query.length >= 2 && !hasResults;

  return (
    <div
      className={cx(
        "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[var(--radius-lg)] border bg-surface shadow-md",
        "border-border/70"
      )}
      style={{
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
      }}
      role="listbox"
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <ZyraMark size="xs" glow={false} />
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zyra-text">
              {t("Zyra AI")}
            </p>
            <p className="text-[11px] text-subtle">{t("Profile-guided search")}</p>
          </div>
        </div>
        <span className="rounded-full border border-border/70 bg-surface-muted px-2 py-1 text-[10px] font-semibold text-zyra-text">
          {t("AI")}
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-subtle">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zyra-text border-t-transparent" />
            <span className="text-sm">{t("Zyra is searching...")}</span>
          </div>
        )}

        {showNoResults && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
              <NavIcon name="search" className="h-5 w-5 text-subtle" />
            </div>
            <p className="text-sm text-subtle">
              {t("No results for \"{query}\"", { query })}
            </p>

            {onAskZyra && (
              <div className="mt-1 flex w-full flex-col items-center gap-3 rounded-[var(--radius-md)] border border-zyra-border/50 px-4 py-4 zyra-surface-soft">
                <div className="flex items-center gap-2">
                  <ZyraMark size="xs" glow={false} />
                  <p className="text-xs text-foreground">
                    {t("Zyra might be able to help you")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAskZyra}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-zyra-start via-zyra-mid to-zyra-end px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  {t("Ask Zyra")}
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && hasResults && (
          <>
            {places.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <NavIcon
                    name="map-pin"
                    className="h-3.5 w-3.5 text-zyra-text"
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zyra-text">
                    {t("Places")}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {places.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => onResultClick("place", place.id)}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
                      role="option"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-muted text-zyra-text">
                        <NavIcon
                          name="map-pin"
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {place.name}
                        </p>
                        {place.category && (
                          <p className="truncate text-xs text-subtle">
                            {place.category.name}
                          </p>
                        )}
                      </div>
                      <NavIcon
                        name="chevron-right"
                        className="h-4 w-4 shrink-0 text-subtle"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {users.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <NavIcon name="users" className="h-3.5 w-3.5 text-zyra-text" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zyra-text">
                    {t("Users")}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {users.map((user) => {
                    const displayName =
                      user.fullName ??
                      (user.username ? `@${user.username}` : t("User"));
                    const usernameLabel =
                      user.fullName && user.username ? `@${user.username}` : null;
                    const locationLabel = [user.city, user.country]
                      .filter(Boolean)
                      .join(", ");
                    const metaLabel = [usernameLabel, locationLabel]
                      .filter(Boolean)
                      .join(" • ");

                    return (
                      <button
                        key={user.userId}
                        type="button"
                        onClick={() => onResultClick("user", user.userId)}
                        className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
                        role="option"
                      >
                        <Avatar
                          name={displayName}
                          src={user.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {displayName}
                          </p>
                          {metaLabel && (
                            <p className="truncate text-xs text-subtle">
                              {metaLabel}
                            </p>
                          )}
                        </div>
                        <NavIcon
                          name="chevron-right"
                          className="h-4 w-4 shrink-0 text-subtle"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <NavIcon name="chat" className="h-3.5 w-3.5 text-zyra-text" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zyra-text">
                    {t("Posts")}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => onResultClick("post", post.id)}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
                      role="option"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-muted text-zyra-text">
                        <NavIcon name="chat" className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {t("User {id}", {
                            id: post.userId?.toString()?.slice(0, 8) ?? "-",
                          })}
                        </p>
                        <p className="truncate text-xs text-subtle">
                          {post.content.slice(0, 120)}
                        </p>
                      </div>
                      <NavIcon
                        name="chevron-right"
                        className="h-4 w-4 shrink-0 text-subtle"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!loading && hasResults && (
        <div className="border-t border-border/70 px-3 py-2">
          <div className="flex items-center justify-center gap-2 text-[10px] text-subtle">
            <ZyraMark size="xs" glow={false} />
            <span>
              {t("Powered by")}{" "}
              <span className="font-semibold text-zyra-text">{t("Zyra AI")}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
