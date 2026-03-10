import AdminCases from "./AdminCases";

// Current backend endpoints for case operations (load/save/send) are implemented
// in AdminCases. Reuse that implementation for /admin/case-manager so the route
// is connected to live case data and email send actions.
export default function AdminCaseManager() {
  return <AdminCases />;
}
