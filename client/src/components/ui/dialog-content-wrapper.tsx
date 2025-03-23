import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DialogContentWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogContentWrapper({
  children,
  className,
  ...props
}: DialogContentWrapperProps) {
  return (
    <ScrollArea className={cn("flex-1", className)} {...props}>
      <div className="px-6 py-4">
        {children}
      </div>
    </ScrollArea>
  );
}