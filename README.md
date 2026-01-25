# React + TypeScript + Vite

## 開発（devcontainer）

- `npm ci`
- `.env.example` を参考に `.env` を作成
- `npm run dev`
- VS Code Dev Containers利用時は、Portsタブに表示される `5173` の転送先URL（通常は `http://localhost:5173/`）を開いてください。

## 打刻データを SharePoint リストへ登録する

前提:

- Entra ID アプリ登録で Microsoft Graph の委任権限を追加し、管理者同意（またはユーザー同意）を済ませてください
- `.env.example` を参考に `.env` に以下を設定してください

必要な設定:

- `VITE_GRAPH_SCOPES`（例: `User.Read,Sites.ReadWrite.All`）
- `VITE_SP_SITE_ID`（Graph の siteId 文字列）
- `VITE_SP_PUNCH_LIST_ID`（打刻リストの listId GUID）
- `VITE_SP_ATTENDANCE_LIST_ID`（勤怠一覧リストの listId GUID）

祝日（Google カレンダー）を使う場合（オンデマンド）:

- `VITE_GCAL_API_KEY`
  - ブラウザから直接呼ぶため **必ず APIキーを HTTP referrer で制限**してください（GitHub Pages のURLに限定）
- `VITE_GCAL_HOLIDAY_CALENDAR_ID`
  - 祝日カレンダーの Calendar ID（Google Calendar の設定画面で確認）
  - 例: `ja.japanese#holiday@group.v.calendar.google.com`（環境により異なる場合があります）

SharePoint 側のリスト（例: `Punches`）に作る列（推奨）:

- `PunchType`（1行テキスト or Choice: start/end）
- `PunchDate`（1行テキスト: `YYYY-MM-DD` を推奨）
- `PunchTime`（1行テキスト: `HH:mm:ss`）
- `Note`（複数行テキスト）
- `UserObjectId`（1行テキスト）
- `UserPrincipalName`（1行テキスト）

勤怠一覧の取得に使うリスト（例: `Attendance`）に作る列（推奨）:

- `AttendanceDate`（1行テキスト: `YYYY-MM-DD` を推奨）
- `StartTime`（1行テキスト: `HH:mm`）
- `EndTime`（1行テキスト: `HH:mm`）
- `UserObjectId`（1行テキスト）

動作:

- 打刻画面（`/#/punch`）で打刻すると、
  - `Punches` にレコードを追記
  - `Attendance` の当日レコードを作成/更新
- 勤怠一覧は `/#/attendance` で `Attendance` リストから取得します。

集計:

- ダッシュボードの「平日」は **土日祝を除外**して集計します（祝日は Google Calendar から当月分をオンデマンド取得）。

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
