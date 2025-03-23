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
    <ScrollArea className={cn("flex-1 p-6", className)} {...props}>
      {children}
    </ScrollArea>
  );
}
