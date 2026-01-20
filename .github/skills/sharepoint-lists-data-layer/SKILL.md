---
name: sharepoint-lists-data-layer
description: SharePoint Lists（Microsoft Lists）を勤怠システムのデータストアとして設計・実装する。リスト設計、列・インデックス、権限、API（Microsoft Graph / SharePoint REST）を扱うタスクで使う。
license: MIT
---

# SharePoint Lists Data Layer Skill

## このスキルの目的
勤怠システムの永続化を SharePoint Lists で実現するために、**データモデル設計 → リスト作成 → APIでCRUD → 権限設計 → 運用**までを一貫して進める。

## 前提（このリポジトリ想定）
- 利用者は社内メンバーのみ（小規模）
- 認証は Entra ID（SSO）
- まずは MS365（Business Basic）範囲を優先し、必要に応じてクラウド併用も検討
- “厳密リアルタイム”は不要（例：5分間隔反映でもOK）

## 進め方（必ずこの順で）
1. **要件確認（最小）**
   - 打刻：出勤/退勤/休憩（開始/終了）を記録するか
   - 月次：締め日、集計単位（社員×月）
   - 承認：上長承認の有無、差戻しフロー
   - 修正：本人修正、管理者修正の権限分離

2. **エンティティ設計（推奨3リスト）**
   - `employees`（社員マスタ）
     - employeeId（キー）, displayName, mail, dept, role, isActive
   - `time_entries`（打刻/明細：1日またはイベント単位）
     - employeeId, date, clockIn, clockOut, breaks, note, source, updatedAt
   - `approvals`（月次申請/承認）
     - employeeId, yearMonth, status(draft/submitted/approved/rejected), approver, decidedAt, comment

3. **列設計の注意**
   - 後からの検索が多い列（employeeId, date, yearMonth, status）にインデックスを検討
   - “人”は可能なら mail / AAD ObjectId を正として持つ（表示名は変わる）
   - JSON を列に詰めるのは最後の手段（検索性が落ちる）。休憩は「別リスト」か「開始/終了を複数列」も検討

4. **権限設計（最小安全）**
   - 基本は「本人は自分のデータのみ」「管理者は全体」「承認者は部下」
   - SharePoint 側の権限＋API側のチェック（どちらか一方に依存しない）
   - “閲覧できるが更新できない”など要件別にロール定義を作る

5. **API方針**
   - 可能なら Microsoft Graph を優先し、無理なところだけ SharePoint REST
   - APIクライアントは責務分離（認証/リトライ/ページング/型定義/ログ）

## 成果物（このスキルで必ず出す）
- リスト定義（列一覧、型、必須/任意、インデックス、ユニーク制約の方針）
- CRUD API のI/F（関数/エンドポイント/レスポンス型）
- 権限マトリクス（ロール×操作×対象）
- サンプルデータ（最小3人×3日分）

## 例：このスキルを使う依頼
- 「打刻データをSharePoint Listsに保存する設計にしたい。列設計と検索性も考えて」
- 「approval と time_entries の関係をどう持つのが良い？」
- 「Graphで一覧取得する時のページングと差分取得の方針を決めたい」
