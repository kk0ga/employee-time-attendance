import { Link } from '@tanstack/react-router'
import { Section } from '@/components/ui/Section'

export function About() {
  return (
    <main className="mx-auto w-full max-w-[960px] p-4">
      <h1>このシステムについて</h1>
      
      <Section className="mt-4">
        <p className="leading-relaxed">
          この勤怠管理システムは、Microsoft 365 (SharePoint Online) をデータストアとして活用した、
          低コストかつセキュアな SPA (Single Page Application) です。
        </p>
        <ul className="mt-4 list-disc pl-5 opacity-80">
          <li>認証: Microsoft Entra ID (MSAL)</li>
          <li>データ: Microsoft Graph / SharePoint List</li>
          <li>ライブラリ: React, Tailwind CSS, TanStack Router/Query/Table</li>
        </ul>
      </Section>

      <p className="mt-6">
        <Link to="/settings/sharepoint" className="text-[#2563eb] hover:underline">
          SharePoint セットアップ支援画面
        </Link>
      </p>
        </main>
  )
}
