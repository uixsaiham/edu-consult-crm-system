export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-3xl font-bold text-foreground">404 – Page Not Found</h2>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <a href="/" className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Go to Dashboard
      </a>
    </div>
  );
}
