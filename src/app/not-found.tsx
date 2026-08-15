import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">🌵</div>
      <h3 className="text-lg font-bold font-mono mb-2">404 - Grid not found</h3>
      <p className="text-muted-foreground text-sm font-mono mb-6">
        Could not find requested resource.
      </p>
      <Link href="/" className="btn-gradient px-6 py-2 rounded-xl text-sm font-semibold">
        Return Home
      </Link>
    </div>
  );
}