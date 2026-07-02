export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
      {children}
    </main>
  )
}
