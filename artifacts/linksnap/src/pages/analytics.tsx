import { useRoute, Link } from "wouter";
import { useGetLink, useGetLinkAnalytics } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, BarChart3, Copy, ExternalLink, Globe, Monitor, MousePointerClick, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const [, params] = useRoute("/links/:id/analytics");
  const linkId = params?.id ? parseInt(params.id, 10) : null;

  const { data: link, isLoading: isLinkLoading } = useGetLink(linkId as number, { 
    query: { enabled: !!linkId, queryKey: linkId ? ["useGetLink", linkId] : [] } 
  });
  
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetLinkAnalytics(linkId as number, {
    query: { enabled: !!linkId, queryKey: linkId ? ["useGetLinkAnalytics", linkId] : [] }
  });

  const handleCopy = (shortCode: string) => {
    const fullUrl = `${window.location.origin}${import.meta.env.BASE_URL}api/r/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to clipboard");
  };

  if (isLinkLoading || isAnalyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg md:col-span-2" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!link || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-semibold mb-2">Analytics Not Found</h2>
        <p className="text-muted-foreground mb-4">We couldn't load the data for this link.</p>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const shortUrl = `${window.location.host}${import.meta.env.BASE_URL}api/r/${link.shortCode}`;
  const displayAlias = link.customAlias || link.shortCode;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="shrink-0 mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{link.title}</h1>
              <Badge variant={link.isActive ? "default" : "secondary"}>
                {link.isActive ? "Active" : "Disabled"}
              </Badge>
            </div>
            <a 
              href={link.originalUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1.5 max-w-2xl truncate"
            >
              {link.originalUrl}
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Short Link</span>
            <span className="font-mono text-primary font-medium">{displayAlias}</span>
          </div>
          <Button variant="secondary" size="icon" onClick={() => handleCopy(link.shortCode)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[120px]">
            {analytics.dailyClicks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyClicks} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    labelFormatter={(label) => {
                      try {
                        return format(parseISO(label), 'MMM d, yyyy');
                      } catch {
                        return label;
                      }
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                Not enough data to display trend
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.referrers.length > 0 ? analytics.referrers.map((ref, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ref.name || 'Direct / Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/60 rounded-full" 
                        style={{ width: `${Math.max((ref.count / analytics.totalClicks) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{ref.count}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-sm text-muted-foreground py-6">No referrer data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.devices.length > 0 ? analytics.devices.map((device, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{device.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/60 rounded-full" 
                        style={{ width: `${Math.max((device.count / analytics.totalClicks) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{device.count}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-sm text-muted-foreground py-6">No device data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              Browsers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {analytics.browsers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.browsers} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {analytics.browsers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No browser data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {analytics.countries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.countries} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {analytics.countries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.6} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No location data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
