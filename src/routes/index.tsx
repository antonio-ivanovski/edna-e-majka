import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="font-serif text-3xl font-semibold">Една е Мајка</h1>
    </main>
  )
}
