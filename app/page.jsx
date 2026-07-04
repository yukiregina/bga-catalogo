// Página inicial — Landing Page.
// The interactive markup lives in components/LandingPage.jsx (client component);
// this file stays a server component so it can export page metadata.
import LandingPage from '@/components/LandingPage'

export default function Home() {
  return <LandingPage />
}
