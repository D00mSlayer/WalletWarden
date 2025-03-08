import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function RestoreButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleRestore = async () => {
    try {
      setIsLoading(true);

      // Check if Google auth is needed
      const authResponse = await fetch('/api/google/auth-url');
      if (!authResponse.ok) {
        throw new Error(`Failed to get auth URL: ${await authResponse.text()}`);
      }
      const { url } = await authResponse.json();

      // If we got a URL, we need to authenticate
      if (url) {
        console.log('[Restore] Opening Google auth window');

        // For mobile devices, open in current window
        if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.location.href = url;
          return; // Don't set loading false as we're redirecting
        }

        // For desktop, open in popup
        const width = 600;
        const height = 600;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;

        const authWindow = window.open(
          url,
          'google-auth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!authWindow) {
          throw new Error('Popup blocked. Please allow popups and try again.');
        }

        // Wait for auth to complete
        await new Promise<void>((resolve, reject) => {
          const handleMessage = async (event: MessageEvent) => {
            if (event.data === 'google-auth-success') {
              window.removeEventListener('message', handleMessage);
              resolve();
            }
          };
          window.addEventListener('message', handleMessage);
        });
      }

      // Proceed with restore
      const restoreResponse = await fetch('/api/restore', {
        method: 'POST',
        credentials: 'include',
      });

      if (!restoreResponse.ok) {
        throw new Error(`Restore failed: ${await restoreResponse.text()}`);
      }

      toast({
        title: "Restore successful",
        description: "Your data has been restored from the latest backup",
      });

      // Reload the page to show restored data
      window.location.reload();
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "An error occurred during restore",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={className}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Restoring...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Restore from Drive
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will restore your data from the latest backup in Google Drive.
            Any current data will be overwritten. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}