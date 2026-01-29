import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

function App() {
  const nowQuery = useQuery({
    queryKey: ['now'],
    queryFn: async () => new Date().toISOString(),
  })

  return (
    <main className="mx-auto w-full max-w-[960px] p-4">
      <h1>勤怠管理ダッシュボード</h1>
      <p>
        tanstack query: {nowQuery.isPending ? 'loading...' : nowQuery.data}
      </p>

      <p>
        <Link to="/attendance">勤怠一覧へ</Link>
      </p>
    </main>
  )
}

export default App
