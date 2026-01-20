import { Link } from '@tanstack/react-router'

export function About() {
  return (
    <main className="app">
      <h1>about</h1>
      <p>
        ルーティングは TanStack Router、データ取得は TanStack Query、表は TanStack Table を使っています。
      </p>
      <p>
        <Link to="/attendance">勤怠一覧へ</Link>
      </p>
    </main>
  )
}
