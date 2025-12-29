import React from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart2,
  Camera,
  LayoutDashboard,
  MapPin,
  Menu,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Scan Waste", url: "/scan", icon: Camera },
  { title: "Reports", url: "/reports", icon: MapPin },
  { title: "Analytics", url: "/analytics", icon: BarChart2 },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="bg-primary text-primary-foreground p-1 rounded-md">
          <Activity className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg tracking-tight uppercase">
          ECOSCAN
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-muted/30">
        <header className="h-14 flex items-center px-4 md:px-6 bg-background border-b z-10 shrink-0 sticky top-0">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
