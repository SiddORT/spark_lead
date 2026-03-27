import { useGetUsersMap } from "@workspace/api-client-react";

export function useUserMap() {
  const { data: users, isLoading } = useGetUsersMap();
  
  const map = new Map(users?.map(u => [u.id, u]) || []);
  
  const resolveName = (id?: string | null) => {
     if (!id) return 'Unassigned';
     return map.get(id)?.displayName || id;
  };

  const resolveEmail = (id?: string | null) => {
    if (!id) return '';
    return map.get(id)?.email || '';
 };
  
  return { map, resolveName, resolveEmail, isLoading, users: users || [] };
}
