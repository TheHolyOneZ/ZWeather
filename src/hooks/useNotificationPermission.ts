import { useEffect, useState } from "react";
import {
  getPermission,
  onPermissionChange,
  refreshPermission,
  type PermissionState,
} from "@/lib/notifications";

export function useNotificationPermission(): PermissionState {
  const [state, setState] = useState<PermissionState>(getPermission);

  useEffect(() => {


    void refreshPermission();
    return onPermissionChange(setState);
  }, []);

  return state;
}
