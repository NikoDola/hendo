import HomeMusicClientFetcher from '@/components/client/HomeMusicClientFetcher';

// This component now delegates to a client component that fetches via API
// This ensures it works in production where Firebase Admin may not be configured
export default function HomeMusicSectionServer() {
  return <HomeMusicClientFetcher />;
}

