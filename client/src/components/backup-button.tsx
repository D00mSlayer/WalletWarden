import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Cloud } from 'lucide-react';

export function BackupButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Setup message listener for Google auth popup and mobile auth check
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data === 'google-auth-success') {
        console.log('[Backup] Received auth success message from popup');
        try {
          await performBackup();
        } catch (error) {
          console.error('[Backup] Error after auth:', error);
          toast({
            title: "Backup failed",
            description: error instanceof Error ? error.message : "An error occurred during backup",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Check if we're returning from a mobile auth flow
    const checkMobileAuth = async () => {
      const pendingBackup = sessionStorage.getItem('pendingBackup');
      if (pendingBackup) {
        sessionStorage.removeItem('pendingBackup');
        console.log('[Backup] Detected return from mobile auth');
        try {
          await performBackup();
        } catch (error) {
          console.error('[Backup] Error after mobile auth:', error);
          toast({
            title: "Backup failed",
            description: error instanceof Error ? error.message : "An error occurred during backup",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    checkMobileAuth();

    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  const performBackup = async () => {
    console.log('[Backup] Initiating backup to Google Drive');
    const backupResponse = await fetch('/api/backup', {
      method: 'POST',
      credentials: 'include',
    });

    if (!backupResponse.ok) {
      const errorText = await backupResponse.text();
      throw new Error(`Backup failed: ${errorText}`);
    }

    const file = await backupResponse.json();
    console.log('[Backup] Backup successful:', file);

    toast({
      title: "Backup successful",
      description: `Your data has been backed up to Google Drive: ${file.name}`,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from closing
    initiateBackup();
  };

  const initiateBackup = async () => {
    try {
      setIsLoading(true);

      // First check if we need Google auth
      const authResponse = await fetch('/api/google/auth-url');
      if (!authResponse.ok) {
        throw new Error(`Failed to get auth URL: ${await authResponse.text()}`);
      }
      const { url } = await authResponse.json();

      // If we got a URL, we need to authenticate
      if (url) {
        console.log('[Backup] Opening Google auth window');

        // For mobile devices, open in current window
        if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // Store a flag in sessionStorage to indicate we're in the middle of a backup
          sessionStorage.setItem('pendingBackup', 'true');
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
      } else {
        // No auth needed, proceed with backup
        await performBackup();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Backup] Error:', error);
      toast({
        title: "Backup failed",
        description: error instanceof Error ? error.message : "An error occurred during backup",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Backing up...
        </>
      ) : (
        <>
          <Cloud className="h-4 w-4 mr-2" />
          Backup to Drive
        </>
      )}
    </Button>
  );
}