"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />
}

function SheetContent({
  className,
  children,
  title,
  ...props
}: DialogPrimitive.Popup.Props & {
  title?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          // Base: bottom sheet on all sizes
          "fixed bottom-0 left-0 right-0 z-50 flex flex-col outline-none",
          "bg-background rounded-t-2xl ring-1 ring-foreground/10",
          "max-h-[92dvh]",
          // Center on desktop with max width
          "sm:left-1/2 sm:right-auto sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2",
          // Animation
          "data-open:animate-in data-open:slide-in-from-bottom data-open:duration-300",
          "data-closed:animate-out data-closed:slide-out-to-bottom data-closed:duration-200",
          className
        )}
        {...props}
      >
        {/* Handle bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
          <div className="absolute left-1/2 -translate-x-1/2 top-3 h-1 w-10 rounded-full bg-muted-foreground/25 sm:hidden" />
          {title && (
            <DialogPrimitive.Title className="text-base font-semibold leading-none pt-1">
              {title}
            </DialogPrimitive.Title>
          )}
          {!title && <span />}
          <DialogPrimitive.Close
            render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground" />}
          >
            <XIcon />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

export { Sheet, SheetContent }
