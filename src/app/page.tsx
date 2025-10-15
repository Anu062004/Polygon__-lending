import { Header } from '@/components/Header'
import { Dashboard } from '@/components/Dashboard'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Dashboard />
      </div>
    </main>
  )
}




