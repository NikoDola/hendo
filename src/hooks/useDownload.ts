import { useCallback } from 'react';

export function useDownload() {
  const download = useCallback(async (purchaseId: string, type: 'zip' | 'pdf', filename: string) => {
    try {
      // Get fresh download URL from API
      const response = await fetch(`/api/user/purchases/${purchaseId}/download?type=${type}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get download URL');
      }

      const { downloadUrl } = await response.json();

      // Download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  return { download };
}

