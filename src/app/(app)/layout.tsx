
"use client";

import * as React from "react";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { CalendarCheck, LineChart, Target, Package, LogOut, Database, Users } from 'lucide-react';
import { getSupabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import DashboardSkeleton from "@/components/dashboard-skeleton";
import { UserProvider } from '@/context/UserContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const supabase = getSupabase();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  
  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    // The auth listener will handle the redirect to /login
  };
  
  if (loading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <DashboardSkeleton />
        </div>
    );
  }

  return (
    <UserProvider user={user}>
      <SidebarProvider>
          <Sidebar>
              <SidebarContent>
                  <SidebarHeader>
                       <div className="flex items-center gap-3 p-2">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary flex-shrink-0">
                              <path d="M4 4.00098H12.001L12.002 12.002L4 12.001L4 4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M4 16.002H8.0005L8.001 20.0024H4V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12.002 16.002H20.003L20.002 20.0024H12.002V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16.002 4.00098H20.0024V8.00149H16.002V4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="font-headline text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">
                              Visita360
                          </span>
                      </div>
                  </SidebarHeader>
                  <SidebarMenu>
                      <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname.startsWith('/cronograma-trade')} tooltip="Cronograma Trade">
                              <Link href="/cronograma-trade">
                                  <CalendarCheck />
                                  <span>Cronograma Trade</span>
                              </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname.startsWith('/analisis-roi')} tooltip="Análisis de ROI">
                              <Link href="/analisis-roi">
                                  <Target />
                                  <span>Análisis de ROI</span>
                              </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname.startsWith('/gestion-pedidos')} tooltip="Gestión de Materiales">
                              <Link href="/gestion-pedidos">
                                  <Package />
                                  <span>Gestión de Materiales</span>
                              </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname.startsWith('/gestion-datos')} tooltip="Gestión de Datos">
                              <Link href="/gestion-datos">
                                  <Database />
                                  <span>Gestión de Datos</span>
                              </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname.startsWith('/gestion-ejecutivas')} tooltip="Gestión de Ejecutivas">
                              <Link href="/gestion-ejecutivas">
                                  <Users />
                                  <span>Gestión de Ejecutivas</span>
                              </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                  </SidebarMenu>
              </SidebarContent>
               <SidebarFooter>
                  <SidebarMenu>
                      <SidebarMenuItem>
                           <SidebarMenuButton onClick={handleSignOut} tooltip="Cerrar Sesión">
                              <LogOut />
                              <span>Cerrar Sesión</span>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                  </SidebarMenu>
              </SidebarFooter>
          </Sidebar>
          <SidebarInset>
               <header className="flex h-14 items-center px-4 md:hidden border-b">
                  <SidebarTrigger/>
              </header>
              <div className="h-full overflow-auto">
               {children}
              </div>
          </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
