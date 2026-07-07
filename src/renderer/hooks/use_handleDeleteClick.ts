// @ts-nocheck
/**
 * handleDeleteClick。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";

export function use_handleDeleteClick(deps: any) {
  const {
    pendingDeleteId,
    saveUsers,
    selectedUser,
    setPendingDeleteId,
    setSelectedUser,
    users,
  } = deps;
  const handleDeleteClick = (accountId, event) => {
            (event.stopPropagation(),
              pendingDeleteId === accountId ?
              (saveUsers(users.filter((account) => account.id !== accountId)), selectedUser?.id === accountId && setSelectedUser(null), setPendingDeleteId(null)) :
              (setPendingDeleteId(accountId), setTimeout(() => setPendingDeleteId(null), 3e3)));
          };
  return { handleDeleteClick };
}
