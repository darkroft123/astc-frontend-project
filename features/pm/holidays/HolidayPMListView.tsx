"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import {
  listHolidays, deleteHoliday, getAllProjects, getProjectMembers, getUserById, bulkCreateHolidays, getCollectionsForProject, getGlobalCollections, getAdminSetting, updateAdminSetting, createCollection, deleteCollection, linkProjectToCollection, unlinkProjectFromCollection, deleteCollectionItem, CollectionOutput
} from "@/app/services/project.assistance.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Column } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar as CalendarIcon, Users, Briefcase, RefreshCw, X, Link as LinkIcon, Unlink, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SubMetricCard } from "@/components/dashboard/SubMetricCard";
import PageHeader from "@/components/layout/page-header";
import { Calendar } from "@/components/ui/calendar";
import { HolidayImporter } from "./HolidayImporter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle } from "lucide-react";
export function HolidayPMListView() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [members, setMembers] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [memberExceptions, setMemberExceptions] = useState<any[]>([]);
  const [projectCollections, setProjectCollections] = useState<CollectionOutput[]>([]);
  const [globalCollections, setGlobalCollections] = useState<CollectionOutput[]>([]);
  const [globalAssignedCollectionId, setGlobalAssignedCollectionId] = useState<string | null>(null);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("project"); 
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form States - Create Collection
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [assignedCollectionId, setAssignedCollectionId] = useState<string | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<string | null>(null);
  const [selectedGlobalCollection, setSelectedGlobalCollection] = useState<string>("");
  const [formName, setFormName] = useState("");
  const [formDates, setFormDates] = useState<Date[]>([]);
  const [dateNames, setDateNames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States - User Exception
  const [isExceptionFormOpen, setIsExceptionFormOpen] = useState(false);
  const [formType, setFormType] = useState<"USER_INCLUDE" | "USER_EXCLUDE">("USER_INCLUDE");
  const [formTargetId, setFormTargetId] = useState<string>("");
  const [exceptionName, setExceptionName] = useState("");
  const [exceptionDates, setExceptionDates] = useState<Date[]>([]);

  // Member Exceptions Modal
  const [exceptionsModalUser, setExceptionsModalUser] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getAllProjects(token).then((data) => {
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!token || selectedProjectId === "all" || !selectedProjectId) {
      setMembers([]);
      return;
    }
    getProjectMembers(token, selectedProjectId).then(async (data) => {
      setMembers(data || []);
      const names: Record<string, string> = {};
      for (const m of (data || [])) {
        if (m.userId) {
          const user = await getUserById(token, m.userId).catch(() => null);
          if (user) {
            names[m.userId] = `${user.firstName} ${user.lastName}`;
          }
        }
      }
      setUserNames(names);
    });
  }, [token, selectedProjectId]);

  const fetchData = async () => {
    if (!token || selectedProjectId === "all" || !selectedProjectId) {
      setProjectCollections([]);
      setMemberExceptions([]);
      return;
    }
    setLoading(true);
    try {
      const [pCols, gCols, gAssigned] = await Promise.all([
        getCollectionsForProject(token, selectedProjectId),
        getGlobalCollections(token),
        getAdminSetting(token, "GLOBAL_ASSIGNED_COLLECTION_ID").catch(() => null),
      ]);
      setProjectCollections(pCols || []);
      setGlobalCollections(gCols || []);
      if (gAssigned) {
        setGlobalAssignedCollectionId(gAssigned);
      }
      
      const memHols = [];
      for (const m of members) {
        if (m.userId) {
          const userHols = await listHolidays(token, m.userId, year);
          if (userHols) memHols.push(...userHols);
        }
      }
      setMemberExceptions(memHols);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAssignment = async () => {
    if (pendingAssignment && token && selectedProjectId && selectedProjectId !== "all") {
      try {
        await linkProjectToCollection(token, selectedProjectId, pendingAssignment);
        setAssignedCollectionId(pendingAssignment);
        await fetchData();
        toast({ title: "Colección asignada al proyecto con éxito" });
      } catch (error) {
        console.error("Error confirmAssignment in HolidayPMListView:", error);
        toast({ title: "Error al asignar colección al proyecto", variant: "destructive" });
      }
    }
    setPendingAssignment(null);
  };

  useEffect(() => {
    if (members.length >= 0) {
      fetchData();
    }
  }, [token, selectedProjectId, year, members.length]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId) return;
    
    if (selectedProjectId === "all") {
      toast({ title: "Atención", description: "Por favor selecciona un proyecto específico arriba.", variant: "destructive" });
      return;
    }
    if (!formName.trim()) {
      alert("El nombre de la colección es obligatorio.");
      return;
    }
    const validDates = formDates.map(d => {
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - (offset*60*1000));
      return adjusted.toISOString().split('T')[0];
    });
    
    const items = validDates.map(d => ({ date: d, name: dateNames[d] || formName }));
    
    setIsSubmitting(true);
    try {
      const created = await createCollection(token, { name: formName, scope: "PROJECT", ownerId: selectedProjectId }, items);
      if (created?.id) {
        await linkProjectToCollection(token, selectedProjectId, created.id).catch(() => null);
        setAssignedCollectionId(created.id);
      }
      setIsFormOpen(false);
      setFormName("");
      setFormDates([]);
      setDateNames({});
      await fetchData();
      toast({ title: "Colección creada y asignada al proyecto con éxito" });
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast({ title: "Error", description: error.message || "No se pudo crear la colección.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId || !selectedGlobalCollection) return;
    try {
      await linkProjectToCollection(token, selectedProjectId, selectedGlobalCollection);
      setAssignedCollectionId(selectedGlobalCollection);
      setIsLinkModalOpen(false);
      setSelectedGlobalCollection("");
      await fetchData();
      toast({ title: "Colección enlazada y asignada al proyecto" });
    } catch (error) {
      toast({ title: "Error al enlazar colección", variant: "destructive" });
    }
  };

  const handleUnlinkCollection = async (collectionId: string) => {
    if (!confirm("¿Desvincular esta colección del proyecto?")) return;
    try {
      await unlinkProjectFromCollection(token!, selectedProjectId, collectionId);
      if (assignedCollectionId === collectionId) {
        setAssignedCollectionId(null);
      }
      await fetchData();
      toast({ title: "Colección desvinculada" });
    } catch (error) {
      toast({ title: "Error al desvincular", variant: "destructive" });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta colección? Se borrarán sus feriados.")) return;
    try {
      await deleteCollection(token!, collectionId);
      fetchData();
      toast({ title: "Colección eliminada" });
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const handleDeleteCollectionItem = async (itemId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta fecha específica de la colección?")) return;
    try {
      await deleteCollectionItem(token!, itemId);
      fetchData();
      toast({ title: "Fecha eliminada" });
    } catch (error) {
      toast({ title: "Error al eliminar fecha", variant: "destructive" });
    }
  };

  const handleImportHolidays = async (items: {date: string, name: string}[], namePrefix: string) => {
    if (!token || !selectedProjectId) return;
    
    if (selectedProjectId === "all") {
      toast({ title: "Atención", description: "Por favor selecciona un proyecto específico arriba.", variant: "destructive" });
      return;
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const projectName = selectedProject ? selectedProject.name : `Proyecto ${selectedProjectId.substring(0,8)}`;

    try {
      await createCollection(token, { name: `${namePrefix} ${projectName}`, scope: "PROJECT", ownerId: selectedProjectId }, items);
      toast({ title: "Feriados importados al proyecto" });
      fetchData();
    } catch (error) {
      toast({ title: "Error al importar", variant: "destructive" });
    }
  };

  const handleImportMemberHolidays = async (items: {date: string, name: string}[], namePrefix: string) => {
    if (!exceptionsModalUser || selectedProjectId === "all" || !selectedProjectId) return;
    try {
      await bulkCreateHolidays(token || "", exceptionsModalUser, items.map(i => i.date), namePrefix, "USER_INCLUDE");
      toast({ title: "Feriados importados al usuario" });
      fetchData();
    } catch (error) {
      toast({ title: "Error al importar", variant: "destructive" });
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const validDates = exceptionDates.map(d => {
      const offset = d.getTimezoneOffset();
      return new Date(d.getTime() - (offset*60*1000)).toISOString().split('T')[0];
    });
    try {
      await bulkCreateHolidays(token, formTargetId, validDates, exceptionName || "Excepción", formType);
      setIsExceptionFormOpen(false);
      setExceptionDates([]);
      setExceptionName("");
      fetchData();
      toast({ title: "Excepción guardada" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDeleteException = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta excepción?")) return;
    try {
      await deleteHoliday(token!, id);
      fetchData();
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const openFormForUser = (userId: string) => {
    setFormType("USER_INCLUDE");
    setFormTargetId(userId);
    setExceptionName("");
    setExceptionDates([]);
    setIsExceptionFormOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const availableCollections = useMemo(() => {
    const map = new Map<string, CollectionOutput>();
    for (const c of projectCollections) map.set(c.id, c);
    for (const c of globalCollections) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [projectCollections, globalCollections]);

  const activeAssignedCollectionId = useMemo(() => {
    if (assignedCollectionId) return assignedCollectionId;
    if (projectCollections && projectCollections.length > 0) return projectCollections[0].id;
    return globalAssignedCollectionId;
  }, [assignedCollectionId, projectCollections, globalAssignedCollectionId]);

  const filteredCollections = useMemo(() => {
    const lowerQuery = searchTerm.toLowerCase();
    return availableCollections.filter((c) => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.items?.some(i => i.name?.toLowerCase().includes(lowerQuery) || i.date.includes(lowerQuery))
    );
  }, [searchTerm, availableCollections]);

  const filteredExceptions = useMemo(() => {
    let data = memberExceptions;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(h => 
        h.name.toLowerCase().includes(lower) || 
        h.date.includes(lower) ||
        (userNames[h.targetId] || "").toLowerCase().includes(lower)
      );
    }
    return data;
  }, [memberExceptions, searchTerm, userNames]);

  const membersList = useMemo(() => {
    let data = members;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(m => (userNames[m.userId] || "").toLowerCase().includes(lower));
    }
    return data;
  }, [members, searchTerm, userNames]);

  const memberColumns: Column<any>[] = [
    {
      key: "user",
      header: "MIEMBRO",
      render: (r) => <p className="font-medium text-foreground">{userNames[r.userId] || "Cargando..."}</p>,
    },
    {
      key: "exceptions",
      header: "DÍAS PERSONALIZADOS",
      render: (r) => {
        const userHols = filteredExceptions.filter(h => h.targetId === r.userId);
        if (userHols.length === 0) return <span className="text-xs text-muted-foreground">Sin excepciones</span>;
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
            onClick={() => setExceptionsModalUser(r.userId)}
          >
            Ver {userHols.length} días
          </Button>
        );
      },
    },
    {
      key: "actions",
      header: "ACCIONES",
      render: (r) => (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openFormForUser(r.userId)}>
          <Plus className="w-3 h-3 mr-1" /> Configurar Calendario
        </Button>
      ),
    },
  ];

  const totalProjectDates = availableCollections.reduce((acc, c) => acc + (c.items?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4">

        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Feriados del Proyecto"
          description="Administra colecciones de feriados del proyecto y excepciones para miembros específicos."
          showPeriodSelector={false}
        />

        <Card className="mt-4">
          <CardContent className="p-4">

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap lg:flex-nowrap mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full sm:w-auto">
                <SubMetricCard label="COLECCIONES DISPONIBLES" value={availableCollections.length} color="amber" icon={<Layers className="w-5 h-5 text-indigo-500" />} />
                <SubMetricCard label="TOTAL FERIADOS" value={totalProjectDates} color="green" icon={<CalendarIcon className="w-5 h-5 text-emerald-500" />} />
              </div>

              <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px]">
                <label className="text-[10px] text-zinc-500 mb-1">Proyecto</label>
                <Select value={selectedProjectId} onValueChange={(val) => { setSelectedProjectId(val); setAssignedCollectionId(null); }}>
                  <SelectTrigger className="h-9 border-border">
                    <SelectValue placeholder="Seleccione Proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px]">
                <label className="text-[10px] text-zinc-500 mb-1">Buscar</label>
                <Input
                  placeholder="Feriado o usuario..."
                  className="h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button variant="ghost" onClick={fetchData} className="border border-border h-9 px-3 self-end sm:self-auto">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {selectedProjectId !== "all" && selectedProjectId ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="project">Colecciones del Proyecto</TabsTrigger>
                  <TabsTrigger value="members">Calendarios Personalizados</TabsTrigger>
                </TabsList>

                <TabsContent value="project">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Colecciones aplicadas a este proyecto</h3>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <HolidayImporter onImport={handleImportHolidays} year={year} />
                      <Button size="sm" variant="outline" onClick={() => setIsLinkModalOpen(true)} className="h-9 text-xs">
                        <LinkIcon className="w-4 h-4 mr-1" /> Enlazar Colección Global
                      </Button>
                      <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white shrink-0">
                        <Plus className="w-4 h-4 mr-1" /> Crear Colección
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {filteredCollections.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground bg-card border border-dashed rounded-lg">
                        {searchTerm ? "No se encontraron colecciones." : "El proyecto no tiene colecciones enlazadas."}
                      </div>
                    ) : (
                      filteredCollections.map(c => {
                        const isAssigned = c.id === activeAssignedCollectionId;
                        return (
                          <div key={c.id} className="border rounded-lg bg-card overflow-hidden shadow-sm">
                            <div 
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 cursor-pointer hover:bg-accent transition-colors gap-3"
                              onClick={() => toggleExpand(c.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-md ${c.scope === 'GLOBAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                                  <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{c.name}</h4>
                                  <p className="text-xs text-muted-foreground">{c.items?.length || 0} feriados ⬢ {c.scope === 'GLOBAL' ? 'Global' : 'Proyecto'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <Button 
                                  size="sm" 
                                  variant={isAssigned ? "outline" : "default"}
                                  disabled={isAssigned}
                                  onClick={(e) => { e.stopPropagation(); setPendingAssignment(c.id); }}
                                  className={`h-8 text-xs font-semibold ${
                                    isAssigned ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-50 opacity-100 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/40" : "bg-violet-600 hover:bg-violet-700 text-white"
                                  }`}
                                >
                                  {isAssigned ? <><CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Asignado</> : "Asignar"}
                                </Button>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${c.scope === 'GLOBAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                                  {c.scope}
                                </span>
                                {c.scope === 'GLOBAL' ? (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); handleUnlinkCollection(c.id); }} title="Desvincular Global">
                                    <Unlink className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteCollection(c.id); }} title="Eliminar Colección">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {expandedId === c.id ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                              </div>
                            </div>
                          
                          {expandedId === c.id && (
                            <div className="bg-background border-t p-4">
                              {!c.items || c.items.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Esta colección no tiene fechas asignadas.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {c.items.map(item => {
                                    const dateObj = new Date(item.date + "T00:00:00");
                                    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                                    return (
                                      <div key={item.id} className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm group">
                                        <div className="flex items-center gap-3">
                                          <div className="flex flex-col items-center justify-center bg-muted rounded p-2 min-w-[50px]">
                                            <span className="text-xs text-muted-foreground uppercase">{format(dateObj, "MMM", { locale: es })}</span>
                                            <span className="text-lg font-bold text-foreground leading-none">{format(dateObj, "dd")}</span>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{days[dateObj.getDay()]}, {dateObj.getFullYear()}</p>
                                          </div>
                                        </div>
                                        {c.scope !== 'GLOBAL' && (
                                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteCollectionItem(item.id)} title="Eliminar fecha">
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="members">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Configura calendarios distintos para miembros individuales</h3>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <DataTable
                      columns={memberColumns}
                      data={membersList}
                      loading={loading}
                      emptyText="No hay miembros en el proyecto."
                      pageSize={5}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-10 text-zinc-500 text-sm">
                Seleccione un proyecto para visualizar sus feriados.
              </div>
            )}

          </CardContent>
        </Card>

        {/* Modal: Crear Colección Proyecto */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Crear Colección para el Proyecto</DialogTitle>
              <DialogDescription>Crea una colección de fechas que solo aplicará a este proyecto.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCollection} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg border flex flex-col items-center">
                <Label className="text-foreground font-semibold mb-2">Selecciona las Fechas</Label>
                <div className="bg-card rounded-md shadow-sm border p-2">
                  <Calendar mode="multiple" selected={formDates} onSelect={(dates) => setFormDates(dates as Date[])} className="rounded-md" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">Has seleccionado {formDates.length} días.</p>
              </div>

              <div className="space-y-5 flex flex-col">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nombre de la Colección <span className="text-red-500">*</span></Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej. Feriados Perú 2026" required />
                </div>

                {formDates.length > 0 && (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 border rounded-md p-3 bg-muted/30 flex-1">
                    <Label className="text-sm font-semibold block mb-2 text-muted-foreground">Nombres específicos (Opcional)</Label>
                    {formDates.map((d, i) => {
                      const offset = d.getTimezoneOffset();
                      const adjusted = new Date(d.getTime() - (offset*60*1000));
                      const dateStr = adjusted.toISOString().split('T')[0];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground min-w-[90px] text-center">{dateStr}</span>
                          <Input 
                            size={1}
                            className="h-8 text-sm" 
                            placeholder={formName || "Nombre..."} 
                            value={dateNames[dateStr] || ""} 
                            onChange={(e) => setDateNames(prev => ({...prev, [dateStr]: e.target.value}))} 
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <DialogFooter className="pt-2 mt-auto">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Enlazar Colección Global */}
        <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Enlazar Colección Global</DialogTitle>
              <DialogDescription>Añade una colección global existente a tu proyecto.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLinkCollection} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Selecciona la Colección</Label>
                <Select value={selectedGlobalCollection} onValueChange={setSelectedGlobalCollection} required>
                  <SelectTrigger><SelectValue placeholder="Seleccione una colección" /></SelectTrigger>
                  <SelectContent>
                    {globalCollections.filter(g => !projectCollections.find(pc => pc.id === g.id)).length === 0 ? (
                      <SelectItem value="empty" disabled>No hay colecciones globales disponibles</SelectItem>
                    ) : (
                      globalCollections.filter(g => !projectCollections.find(pc => pc.id === g.id)).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.items?.length || 0} fechas)</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsLinkModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={!selectedGlobalCollection || selectedGlobalCollection === "empty"} className="bg-violet-600 hover:bg-violet-700 text-white">Enlazar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Confirmar Asignación de Proyecto */}
        <Dialog open={!!pendingAssignment} onOpenChange={(open) => { if (!open) setPendingAssignment(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Asignar Colección</DialogTitle>
              <DialogDescription>
                Se aplicará esta colección a este proyecto. Al hacer esto, reemplazará a cualquier colección asignada previamente en el proyecto. ¿Aceptas?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setPendingAssignment(null)}>Cancelar</Button>
              <Button onClick={confirmAssignment} className="bg-violet-600 hover:bg-violet-700 text-white">
                Aceptar y Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Excepción Usuario */}
        <Dialog open={isExceptionFormOpen} onOpenChange={setIsExceptionFormOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Calendario Personalizado (Usuario)</DialogTitle>
              <DialogDescription>
                Selecciona las fechas que este usuario en particular trabajará o descansará fuera del calendario normal.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateException} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg border border-zinc-100 flex flex-col items-center">
                <Label className="text-foreground font-semibold mb-2">Fechas de Excepción</Label>
                <div className="bg-card rounded-md shadow-sm border p-2">
                  <Calendar mode="multiple" selected={exceptionDates} onSelect={(dates) => setExceptionDates(dates as Date[])} className="rounded-md" />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">Has seleccionado {exceptionDates.length} días.</p>
              </div>
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Motivo de Excepción</Label>
                    <Input value={exceptionName} onChange={(e) => setExceptionName(e.target.value)} placeholder="Ej. Cumpleaños, Permiso..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tipo de Excepción</Label>
                    <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER_INCLUDE">Día Libre (No asiste)</SelectItem>
                        <SelectItem value="USER_EXCLUDE">Día Laborable (Ignora feriado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsExceptionFormOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Guardar Excepción</Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Listar Excepciones */}
        <Dialog open={!!exceptionsModalUser} onOpenChange={(open) => !open && setExceptionsModalUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Días Personalizados</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-xs font-semibold text-blue-800">Acciones Rápidas:</span>
                <HolidayImporter onImport={handleImportMemberHolidays} year={year} />
              </div>
              {exceptionsModalUser && filteredExceptions.filter(h => h.targetId === exceptionsModalUser).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {filteredExceptions.filter(h => h.targetId === exceptionsModalUser).map(h => (
                    <div key={h.id} className="flex justify-between items-center p-3 border border-zinc-100 rounded-lg bg-zinc-50/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${h.type === "USER_INCLUDE" ? "bg-violet-100 text-violet-700" : "bg-red-100 text-red-700"}`}>
                            {h.type === "USER_INCLUDE" ? "DÍA LIBRE" : "DÍA LABORABLE"}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">{h.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{h.name}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteException(h.id)}><X className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">No hay días personalizados.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
