// @ts-nocheck
/**
 * handleDeleteClick。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import type { SetAny } from "../lib/app-types";

interface UseHandleDeleteClickDeps {
  pendingDeleteId: any;
  saveUsers: any;
  selectedUser: any;
  setPendingDeleteId: SetAny;
  setSelectedUser: SetAny;
  users: any;
}

export function use_handleDeleteClick(deps: UseHandleDeleteClickDeps) {
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
