"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { useUIStore } from "@/store/ui-store";

export function MobileNav() {
  const open = useUIStore((s) => s.sidebarOpen);
  const setOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-[280px] border-r p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate between Dashboard, Projects and Tasks.
        </SheetDescription>
        <Sidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
