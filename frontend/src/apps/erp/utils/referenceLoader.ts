import { publicAPI, erpRecordAPI, userAPI } from "../services/api";

// Matches a field key to a module or special reference
export const matchModuleKey = (fieldKey: string, modules: any[]): string | null => {
  const normalizedKey = fieldKey.toLowerCase().replace(/_id$/, "").replace(/_master$/, "").replace(/s$/, "");
  
  // Find a module that matches this normalized key
  const match = modules.find((m) => {
    const normMod = m.module_key.toLowerCase().replace(/_master$/, "").replace(/s$/, "");
    return normMod === normalizedKey || normalizedKey.includes(normMod) || normMod.includes(normalizedKey);
  });
  
  return match ? match.module_key : null;
};

// Fetches options for a field from references
export const fetchReferenceOptions = async (
  fieldKey: string,
  modules: any[],
  isAuthenticated: boolean = false
): Promise<{ value: string; label: string }[] | null> => {
  const key = fieldKey.toLowerCase();

  // Special Case: Counsellors from the Users table
  if (key.includes("counsellor")) {
    try {
      // Users list requires auth
      if (!isAuthenticated) return null;
      const res = await userAPI.getAll();
      return (res.data || [])
        .filter((u: any) =>
          u.roles?.some((r: any) => {
            const name = typeof r === "string" ? r : r.role_name;
            return name?.toLowerCase().includes("counsellor");
          })
        )
        .map((u: any) => ({
          value: String(u.user_id),
          label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username,
        }));
    } catch (err) {
      console.error("Failed to load counsellors from user directory:", err);
    }
  }

  // Generic Case: Match fieldKey to a metadata module
  const refModuleKey = matchModuleKey(fieldKey, modules);
  if (!refModuleKey) {
    // Fallback: Check if it's a known static list, like inquiry_status
    if (key.includes("status") || key.includes("approval_status")) {
      return [
        { value: "Open", label: "Open" },
        { value: "Assigned", label: "Assigned" },
        { value: "Closed", label: "Closed" },
        { value: "Registered", label: "Registered" },
        { value: "Enrolled", label: "Enrolled" },
      ];
    }
    return null;
  }

  try {
    const res = isAuthenticated
      ? await erpRecordAPI.getRecordsByModule(refModuleKey)
      : await publicAPI.getRecordsByModule(refModuleKey);

    return (res.data || []).map((rec: any) => {
      const data = rec.data || {};
      let label = "";

      // Smart label mapping based on module name
      if (refModuleKey.includes("course")) {
        label = data.course_name || data.name || data.title;
      } else if (refModuleKey.includes("stream")) {
        label = data.stream_name || data.name || data.title;
      } else if (refModuleKey.includes("institute") || refModuleKey.includes("college")) {
        label = data.inst_name || data.name || data.inst_city;
      } else if (refModuleKey.includes("counsellor")) {
        label = `${data.counsellor_fname || ""} ${data.counsellor_lname || ""}`.trim();
      } else if (refModuleKey.includes("status")) {
        label = data.status_name || data.name;
      }

      if (!label) {
        // Fallback: use first string value, or record ID
        const stringVal = Object.values(data).find((v) => typeof v === "string" && v.length > 1);
        label = stringVal ? String(stringVal) : rec.record_id.slice(0, 8);
      }

      return {
        value: rec.record_id,
        label: label,
      };
    });
  } catch (err) {
    console.error(`Failed to load reference options for field ${fieldKey} from module ${refModuleKey}:`, err);
    return null;
  }
};
