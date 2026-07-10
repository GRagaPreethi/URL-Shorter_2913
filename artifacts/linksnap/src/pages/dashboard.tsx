import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetDashboardSummary, 
  useListLinks, 
  useCreateLink, 
  useUpdateLink, 
  useDeleteLink, 
  useUpdateLinkStatus,
  useSuggestAlias,
  getListLinksQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  BarChart3, 
  Copy, 
  ExternalLink, 
  MoreVertical, 
  MousePointerClick, 
  Pencil, 
  Plus, 
  Search, 
  Sparkles, 
  Trash2, 
  LinkIcon, 
  AlertCircle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// --- Schemas ---
const linkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  originalUrl: z.string().url("Must be a valid URL"),
  customAlias: z.string().optional().transform(val => val === "" ? undefined : val),
  expiresAt: z.string().optional().transform(val => val === "" ? undefined : val)
});

type LinkFormValues = z.infer<typeof linkSchema>;

// --- Components ---

function StatsCards() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalLinks.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalClicks.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Links</CardTitle>
          <Sparkles className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.activeLinks.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expired Links</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.expiredLinks.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const queryClient = useQueryClient();

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Data fetching
  const { data: listData, isLoading: isListLoading } = useListLinks(
    { page, limit: 10, search: debouncedSearch || undefined }
  );

  // Mutations
  const createLink = useCreateLink();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const updateStatus = useUpdateLinkStatus();

  // Handlers
  const handleCopy = (shortCode: string) => {
    const fullUrl = `${window.location.origin}${import.meta.env.BASE_URL}api/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to clipboard");
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    updateStatus.mutate(
      { id, data: { isActive: !currentStatus } },
      {
        onSuccess: () => {
          toast.success(`Link ${!currentStatus ? 'activated' : 'disabled'}`);
          queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => toast.error("Failed to update status")
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    deleteLink.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Link deleted");
          queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => toast.error("Failed to delete link")
      }
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Manage and track your shortened URLs.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Link
        </Button>
      </div>

      <StatsCards />

      <Card className="flex-1 flex flex-col shadow-sm border">
        <CardHeader className="py-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">All Links</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search links..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Title & URL</TableHead>
                <TableHead>Short Link</TableHead>
                <TableHead className="w-24 text-right">Clicks</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-32">Created</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isListLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full max-w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : listData?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <LinkIcon className="w-8 h-8 mb-4 opacity-50" />
                      <p>No links found.</p>
                      {search && <p className="text-sm mt-1">Try adjusting your search.</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                listData?.items.map((link) => {
                  const shortUrl = `${window.location.host}${import.meta.env.BASE_URL}api/r/${link.shortCode}`;
                  return (
                    <TableRow key={link.id} className="group">
                      <TableCell>
                        <div className="font-medium text-foreground">{link.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]" title={link.originalUrl}>
                          {link.originalUrl}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`${window.location.origin}${import.meta.env.BASE_URL}api/r/${link.shortCode}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="font-mono text-sm text-primary hover:underline flex items-center gap-1.5"
                          >
                            {link.customAlias || link.shortCode}
                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => handleCopy(link.shortCode)}
                            title="Copy link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {link.clickCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch 
                            checked={link.isActive} 
                            onCheckedChange={() => handleToggleStatus(link.id, link.isActive)}
                          />
                          <Badge variant={link.isActive ? "default" : "secondary"} className="w-16 justify-center">
                            {link.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <Link href={`/links/${link.id}/analytics`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Analytics
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingLink(link)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleDelete(link.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {listData && listData.total > listData.limit && (
          <div className="flex items-center justify-between border-t p-4 bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * listData.limit + 1} to {Math.min(page * listData.limit, listData.total)} of {listData.total} entries
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * listData.limit >= listData.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateEditLinkDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={() => {
          setIsCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        }}
      />

      {editingLink && (
        <CreateEditLinkDialog 
          open={!!editingLink} 
          onOpenChange={(open: boolean) => !open && setEditingLink(null)} 
          initialData={editingLink}
          onSuccess={() => {
            setEditingLink(null);
            queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
          }}
        />
      )}
    </div>
  );
}

function CreateEditLinkDialog({ open, onOpenChange, onSuccess, initialData }: any) {
  const isEdit = !!initialData;
  const createLink = useCreateLink();
  const updateLink = useUpdateLink();
  const suggestAlias = useSuggestAlias();
  
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: initialData?.title || "",
      originalUrl: initialData?.originalUrl || "",
      customAlias: initialData?.customAlias || "",
      expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : "",
    }
  });

  // Reset form when opened with new initialData
  useEffect(() => {
    if (open) {
      form.reset({
        title: initialData?.title || "",
        originalUrl: initialData?.originalUrl || "",
        customAlias: initialData?.customAlias || "",
        expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : "",
      });
    }
  }, [open, initialData, form]);

  const onSubmit = (data: LinkFormValues) => {
    const payload = {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
    };

    if (isEdit) {
      updateLink.mutate(
        { id: initialData.id, data: { title: payload.title, originalUrl: payload.originalUrl, expiresAt: payload.expiresAt } },
        {
          onSuccess: () => {
            toast.success("Link updated successfully");
            onSuccess();
          },
          onError: () => toast.error("Failed to update link")
        }
      );
    } else {
      createLink.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast.success("Link created successfully");
            onSuccess();
          },
          onError: () => toast.error("Failed to create link")
        }
      );
    }
  };

  const handleSuggest = async () => {
    const title = form.getValues("title");
    const originalUrl = form.getValues("originalUrl");
    if (!title || !originalUrl) {
      toast.error("Please enter a title and original URL first to get suggestions.");
      return;
    }
    
    suggestAlias.mutate(
      { data: { title, originalUrl } },
      {
        onError: () => toast.error("Failed to get suggestions. Try again.")
      }
    );
  };

  const isPending = createLink.isPending || updateLink.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Link" : "Create New Link"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update your shortened link details." : "Enter a long URL to generate a trackable short link."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Summer Campaign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/very/long/path" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customAlias"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center mb-1">
                    <FormLabel className="mb-0">Custom Alias (Optional)</FormLabel>
                    {!isEdit && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2 text-primary gap-1"
                        onClick={handleSuggest}
                        disabled={suggestAlias.isPending}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Suggest
                      </Button>
                    )}
                  </div>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground text-sm bg-muted px-3 py-2 rounded-md border hidden sm:block whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                        linksnap.io/
                      </div>
                      <Input 
                        placeholder="my-alias" 
                        {...field} 
                        disabled={isEdit} 
                        className="font-mono"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  
                  {/* AI Suggestions Chips */}
                  {suggestAlias.data?.suggestions && !isEdit && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
                      <div className="w-full text-xs font-medium text-primary mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Suggested Aliases
                      </div>
                      {suggestAlias.data.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="text-xs bg-background border shadow-sm px-2 py-1 rounded-md hover:border-primary hover:text-primary transition-colors font-mono"
                          onClick={() => {
                            form.setValue("customAlias", suggestion, { shouldValidate: true });
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
