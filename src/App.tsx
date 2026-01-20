import './App.css'
import { useQuery } from '@tanstack/react-query'

function App() {
  const nowQuery = useQuery({
    queryKey: ['now'],
    queryFn: async () => new Date().toISOString(),
  })

  return (
    <main className="app">
      <h1>hello world</h1>
      <p>
        tanstack query: {nowQuery.isPending ? 'loading...' : nowQuery.data}
      </p>
    </main>
  )
}

export default App
