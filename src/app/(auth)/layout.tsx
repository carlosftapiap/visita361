
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 flex items-center gap-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary flex-shrink-0">
            <path d="M4 4.00098H12.001L12.002 12.002L4 12.001L4 4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16.002H8.0005L8.001 20.0024H4V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.002 16.002H20.003L20.002 20.0024H12.002V16.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.002 4.00098H20.0024V8.00149H16.002V4.00098Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="font-headline text-4xl font-bold text-primary">
            PlanVisitas
        </h1>
      </div>
      {children}
    </main>
  )
}
