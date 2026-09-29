# EBP Daily Brief - GitHub Pages版

## 目的
ChatGPT Sitesへの依存を外し、GitHub Pagesで継続公開できるDaily Briefの初期実装です。

## 採用仕様
- 最新記事
- Web記事から原典へ直接リンク
- キーワード・地域・情報種別・タグによる検索
- 月 → 日付 → 記事の二段階折りたたみ
- 日次PDFはGoogle Driveへ外部保存
- 印刷用CSS
- noindex / nofollow / noarchive
- UIと記事データを分離

## PDF保管先
https://drive.google.com/drive/folders/17L-6pARPBwcP827R2pij6D_AI55DQM3R

このフォルダは、指定時点で「リンクを知っている人が閲覧可能・検索公開なし」の設定を確認済みです。

## 日々の更新
1. `data/briefs/YYYY-MM-DD.json` を作る
2. `data/index.json` の `entries` に1行追加する
3. PDFをGoogle Driveへ保存し、そのPDFの共有URLを日次JSONの `pdf_url` に入れる
4. GitHubへcommit / pushする

## 重要
`pdf_url` はフォルダURLではなく、可能であれば「その日のPDFファイルそのもの」の共有URLを設定してください。
フォルダURLは `pdf_folder_url` として保持できます。

## 公開方法
GitHubリポジトリに一式を置き、Settings → Pages で main ブランチ / root を公開対象にします。

## 今後の拡張候補
- index.jsonの自動生成（GitHub Actions）
- 年別アーカイブ
- 記事URLの恒久化
- 研究HUBの関連ID連携
- RSS/Atom（noindex方針との整合を確認してから）

## アーカイブ初期表示
過去アーカイブは、月・日付ともにデフォルトで閉じた状態にします。
最新記事はページ上部の「最新のDaily Brief」で確認し、過去分は必要な月・日付だけ展開します。

## PDFリンク運用
- アーカイブ上部：「PDF保管フォルダ」→ Google Driveの月別保管フォルダ
- 各日：「この日のPDF版を開く」→ その日のPDFファイル直リンク
- 日次JSONの `pdf_url` には、フォルダURLではなく、その日のPDFファイル共有URLを設定してください。

## v1.3 表示修正
添付画像の既存ロゴ・上部デザインを基準にし、下部のみ「制作について」→「お問い合わせ」を追加。メールは mailto:ebp2.ichimizu@gmail.com。

## v1.4 実データ
2026-09-25、2026-09-28、2026-09-29 のDaily Briefを実データとして追加。
各日のPDFボタンはGoogle Drive上の該当PDFへ直接リンク。
各記事の「原典を見る」はPDF内のリンク注釈から取得した原典URLへ接続。

## v1.5 過去記事遡及掲載
Google DriveのPDFから2026-09-09〜2026-09-24分を遡及追加。
PDF本文の「事実・解釈・反証/限界・エビデンス評価」を記事データへ変換し、
PDF内のハイパーリンク注釈から原典URLを可能な限り復元しています。
各日のPDFボタンはGoogle Drive上の該当PDFへ直接リンクします。
