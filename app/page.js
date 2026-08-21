import DashboardClient from "@/components/DashboardClient";

// ==========================================
// DUAL-ENGINE PIPELINE TOGGLE
// Set to true to utilize Python FastAPI backend on port 8000
// Set to false for default client-side cleaner.js utility
// ==========================================
const USE_PYTHON_BACKEND = true;

export default async function Page({ searchParams }) {
  // Resolves the searchParams Promise in Next.js 15+ / Next.js 16 App Router
  const resolvedParams = await searchParams;
  const sessionId = resolvedParams?.sessionId || null;

  return (
    <DashboardClient 
      sessionId={sessionId} 
      usePythonBackend={USE_PYTHON_BACKEND} 
    />
  );
}
