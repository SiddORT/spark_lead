import { useState, useMemo, useEffect } from "react";
import {
  useGetCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany,
  useGetServices, useCreateService, useUpdateService, useDeleteService, useLinkServiceCompanies,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@/components/ui";
import { TablePagination } from "@/components/table-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { PlusCircle, Pencil, Trash2, Link as LinkIcon, Building2, Briefcase, Search, X } from "lucide-react";
import { PermissionCheck } from "@/components/auth-provider";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export function Companies() {
  const { data: companies = [] } = useGetCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();
  const queryClient = useQueryClient();

  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 300);
  const [page, setPage] = useState(1);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", industry: "", notes: "" });

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() =>
    companies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())),
    [companies, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleOpen = (company?: any) => {
    if (company) {
      setEditingId(company.id);
      setFormData({ name: company.name, industry: company.industry || "", notes: company.notes || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", industry: "", notes: "" });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingId
      ? updateMutation.mutateAsync({ id: editingId, data: formData })
      : createMutation.mutateAsync({ data: formData });
    action.then(() => {
      toast.success(`Company ${editingId ? "updated" : "created"}`);
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsOpen(false);
    }).catch(err => toast.error(err.message));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => { toast.success("Company deleted"); queryClient.invalidateQueries({ queryKey: ["/api/companies"] }); },
        onError: (err: any) => toast.error(err.message),
      });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Building2 size={28} style={{ color: "var(--teal)" }} />
            Companies
          </h1>
          <p className="page-subtitle">{companies.length} companies in your database</p>
        </div>
        <PermissionCheck resource="companies" action="create">
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => handleOpen()}>
              <PlusCircle size={15} /> Add Company
            </button>
          </div>
        </PermissionCheck>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <div className="search-input-wrapper" style={{ flex: "1 1 220px" }}>
            <Search size={15} />
            <input
              className="input"
              placeholder="Search companies…"
              value={searchRaw}
              onChange={e => setSearchRaw(e.target.value)}
            />
          </div>
          {searchRaw && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearchRaw("")} style={{ color: "var(--danger)", border: "1px solid var(--danger-dim)" }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>

        <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Industry</th>
              <th>Linked Services</th>
              <th>Created</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c.id} style={{ cursor: "default" }}>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{c.industry || "—"}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                    {c.services?.map((s: any) => (
                      <span key={s.id} className="badge badge-teal" style={{ fontSize: 10 }}>{s.name}</span>
                    ))}
                    {!c.services?.length && <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>—</span>}
                  </div>
                </td>
                <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {format(new Date(c.createdAt), "MMM d, yyyy")}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <PermissionCheck resource="companies" action="update">
                      <button className="btn btn-ghost btn-icon" onClick={() => handleOpen(c)} title="Edit"><Pencil size={14} /></button>
                    </PermissionCheck>
                    <PermissionCheck resource="companies" action="delete">
                      <button className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={14} /></button>
                    </PermissionCheck>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr style={{ cursor: "default" }}>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Building2 size={20} /></div>
                    <div className="empty-state-title">{search ? "No companies found" : "No companies yet"}</div>
                    <div className="empty-state-desc">
                      {search ? "Try a different search term." : "Add your first company to get started."}
                    </div>
                    {search && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={() => setSearchRaw("")}>
                        <X size={13} /> Clear Search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="modal-head">
          <div className="modal-head-left">
            <div className="modal-head-icon teal"><Building2 size={16} /></div>
            <div>
              <div className="modal-title">{editingId ? "Edit Company" : "Add Company"}</div>
              <div className="modal-subtitle">{editingId ? "Update company details" : "Add a new company to your database"}</div>
            </div>
          </div>
          <button className="modal-close" onClick={() => setIsOpen(false)}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label className="field-label">Company Name <span className="req">*</span></label>
              <input className="field-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div className="form-field">
              <label className="field-label">Industry</label>
              <input className="field-input" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} placeholder="e.g. Technology, Finance…" />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Notes</label>
              <textarea className="field-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes about this company…" />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <><div className="spinner-sm" /> Saving…</> : "Save Company"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function Services() {
  const { data: services = [] } = useGetServices();
  const { data: allCompanies = [] } = useGetCompanies();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const linkMutation = useLinkServiceCompanies();
  const queryClient = useQueryClient();

  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 300);
  const [page, setPage] = useState(1);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "", description: "" });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkingService, setLinkingService] = useState<any>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() =>
    services.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())),
    [services, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleOpen = (service?: any) => {
    if (service) {
      setEditingId(service.id);
      setFormData({ name: service.name, category: service.category || "", description: service.description || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", category: "", description: "" });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingId
      ? updateMutation.mutateAsync({ id: editingId, data: formData })
      : createMutation.mutateAsync({ data: formData });
    action.then(() => {
      toast.success(`Service ${editingId ? "updated" : "created"}`);
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsOpen(false);
    }).catch(err => toast.error(err.message));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => { toast.success("Service deleted"); queryClient.invalidateQueries({ queryKey: ["/api/services"] }); },
        onError: (err: any) => toast.error(err.message),
      });
    }
  };

  const openLinkDialog = (service: any) => {
    setLinkingService(service);
    setSelectedCompanies(service.companies?.map((c: any) => c.id) || []);
    setLinkOpen(true);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    linkMutation.mutate({ id: linkingService.id, data: { companyIds: selectedCompanies } }, {
      onSuccess: () => { toast.success("Companies linked"); queryClient.invalidateQueries({ queryKey: ["/api/services"] }); setLinkOpen(false); },
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Briefcase size={28} style={{ color: "var(--teal)" }} />
            Services
          </h1>
          <p className="page-subtitle">{services.length} services in your catalog</p>
        </div>
        <PermissionCheck resource="services" action="create">
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => handleOpen()}>
              <PlusCircle size={15} /> Add Service
            </button>
          </div>
        </PermissionCheck>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <div className="search-input-wrapper" style={{ flex: "1 1 220px" }}>
            <Search size={15} />
            <input className="input" placeholder="Search services…" value={searchRaw} onChange={e => setSearchRaw(e.target.value)} />
          </div>
          {searchRaw && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearchRaw("")} style={{ color: "var(--danger)", border: "1px solid var(--danger-dim)" }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>

        <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Linked Companies</th>
              <th style={{ width: 150 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(s => (
              <tr key={s.id} style={{ cursor: "default" }}>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{s.category || "—"}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                    {s.companies?.map((c: any) => (
                      <span key={c.id} className="badge badge-purple" style={{ fontSize: 10 }}>{c.name}</span>
                    ))}
                    {!s.companies?.length && <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>None linked</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <PermissionCheck resource="services" action="update">
                      <button className="btn btn-ghost btn-icon" style={{ color: "var(--teal)" }} onClick={() => openLinkDialog(s)} title="Link companies"><LinkIcon size={14} /></button>
                    </PermissionCheck>
                    <PermissionCheck resource="services" action="update">
                      <button className="btn btn-ghost btn-icon" onClick={() => handleOpen(s)} title="Edit"><Pencil size={14} /></button>
                    </PermissionCheck>
                    <PermissionCheck resource="services" action="delete">
                      <button className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={14} /></button>
                    </PermissionCheck>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr style={{ cursor: "default" }}>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Briefcase size={20} /></div>
                    <div className="empty-state-title">{search ? "No services found" : "No services yet"}</div>
                    <div className="empty-state-desc">
                      {search ? "Try a different search term." : "Add your first service to the catalog."}
                    </div>
                    {search && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={() => setSearchRaw("")}>
                        <X size={13} /> Clear Search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {/* Service Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="modal-head">
          <div className="modal-head-left">
            <div className="modal-head-icon purple"><Briefcase size={16} /></div>
            <div>
              <div className="modal-title">{editingId ? "Edit Service" : "Add Service"}</div>
              <div className="modal-subtitle">{editingId ? "Update service details" : "Add a new service to your catalog"}</div>
            </div>
          </div>
          <button className="modal-close" onClick={() => setIsOpen(false)}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label className="field-label">Service Name <span className="req">*</span></label>
              <input className="field-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. CRM Integration" />
            </div>
            <div className="form-field">
              <label className="field-label">Category</label>
              <input className="field-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Software, Consulting…" />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Description</label>
              <textarea className="field-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe this service…" />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <><div className="spinner-sm" /> Saving…</> : "Save Service"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Link Companies Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <div className="modal-head">
          <div className="modal-head-left">
            <div className="modal-head-icon teal"><LinkIcon size={16} /></div>
            <div>
              <div className="modal-title">Link Companies</div>
              <div className="modal-subtitle">Select companies to link to <strong style={{ color: "var(--text-primary)" }}>{linkingService?.name}</strong></div>
            </div>
          </div>
          <button className="modal-close" onClick={() => setLinkOpen(false)}><X size={15} /></button>
        </div>
        <form onSubmit={handleLinkSubmit}>
          <div className="modal-body">
            <div style={{
              maxHeight: 240, overflowY: "auto",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--r-md)",
              padding: "var(--sp-2)",
              background: "var(--bg-subtle)",
            }}>
              {allCompanies.map(c => (
                <label key={c.id} style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-3)",
                  padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(c.id)}
                    onChange={e => setSelectedCompanies(prev =>
                      e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                    )}
                    style={{ accentColor: "var(--teal)", width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{c.name}</span>
                </label>
              ))}
              {allCompanies.length === 0 && (
                <div style={{ padding: "var(--sp-4)", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                  No companies available
                </div>
              )}
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setLinkOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={linkMutation.isPending}>
              {linkMutation.isPending ? <><div className="spinner-sm" /> Saving…</> : "Save Links"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
