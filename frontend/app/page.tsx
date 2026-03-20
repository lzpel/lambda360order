import Link from "next/link";
import list from "./out/list.json";

const navy = "#1a2744";
const navyLight = "#243354";
const accent = "#f5a623";
const accentHover = "#e6981a";
const gray = "#f5f6f8";
const textLight = "#c8cdd6";

export default function Home() {
	return (
		<div style={{ fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Meiryo', sans-serif", color: "#333", margin: 0 }}>
			{/* ========== HEADER ========== */}
			<header style={{
				backgroundColor: "#fff",
				borderBottom: "1px solid #e0e0e0",
				padding: "12px 40px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				position: "sticky",
				top: 0,
				zIndex: 100,
			}}>
				<Link href="/" style={{ display: "flex", alignItems: "center" }}>
					<img src={`${process.env.NEXT_PUBLIC_PREFIX}/logo.svg`} alt="KatachiForm" style={{ height: 36 }} />
				</Link>
				<nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
					<Link href="#features" style={{ color: "#444", textDecoration: "none", fontSize: 14 }}>特長</Link>
					<Link href="#howto" style={{ color: "#444", textDecoration: "none", fontSize: 14 }}>使い方</Link>
					<Link href="#examples" style={{ color: "#444", textDecoration: "none", fontSize: 14 }}>活用事例</Link>
					<Link href="#pricing" style={{ color: "#444", textDecoration: "none", fontSize: 14 }}>料金</Link>
					<Link href="#faq" style={{ color: "#444", textDecoration: "none", fontSize: 14 }}>FAQ</Link>
					<Link href="#contact" style={{
						backgroundColor: accent,
						color: navy,
						padding: "8px 20px",
						borderRadius: 4,
						textDecoration: "none",
						fontSize: 14,
						fontWeight: 700,
					}}>お問い合わせ</Link>
				</nav>
			</header>

			{/* ========== HERO ========== */}
			<section style={{
				position: "relative",
				backgroundColor: "#fff",
				padding: "80px 40px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 60,
				flexWrap: "wrap",
			}}>
				<div style={{
					position: "absolute",
					inset: 0,
					backgroundImage: "url(/background.jpg)",
					backgroundSize: "cover",
					backgroundPosition: "center",
					opacity: 0.15,
					pointerEvents: "none",
				}} />
				<div style={{ maxWidth: 520, position: "relative" }}>
					<h1 style={{ color: navy, fontSize: 36, fontWeight: 800, lineHeight: 1.4, margin: "0 0 20px 0" }}>
						寸法が変わる<br />
						3D見積もりフォーム
					</h1>

					<img src="/logo.svg" alt="KatachiForm" style={{ height: 70 }} />
					<p style={{ color: "#666", fontSize: 16, lineHeight: 1.8, margin: "0 0 32px 0" }}>
						STEPファイルから、寸法変更・即時見積もり・3Dプレビュー付きの
						発注フォームを自動生成。御社のWebサイトに埋め込むだけで、
						24時間365日、セミオーダー品の受注を自動化します。
					</p>
					<div style={{ display: "flex", gap: 16 }}>
						<a href="#contact" style={{
							backgroundColor: accent,
							color: "#fff",
							padding: "14px 32px",
							borderRadius: 4,
							textDecoration: "none",
							fontSize: 16,
							fontWeight: 700,
						}}>無料で試してみる</a>
						<a href="#examples" style={{
							border: `2px solid ${navy}`,
							color: navy,
							padding: "12px 32px",
							borderRadius: 4,
							textDecoration: "none",
							fontSize: 16,
							fontWeight: 700,
						}}>デモを見る</a>
					</div>
				</div>
				<div style={{
					position: "relative",
					width: 780,
					borderRadius: 8,
					border: "1px solid #e0e0e0",
					overflow: "hidden",
					boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
				}}>
					<img src={`${process.env.NEXT_PUBLIC_PREFIX}/screenshot-box.png`} alt="板金制御盤ボックスの3D見積もりフォーム" style={{ width: "100%", display: "block" }} />
				</div>
			</section>

			{/* ========== FEATURES ========== */}
			<section id="features" style={{ backgroundColor: gray, padding: "80px 40px" }}>
				<div style={{ textAlign: "center", marginBottom: 60 }}>
					<h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: 0 }}>katachiform の特長</h2>
				</div>
				<div style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: 32,
					maxWidth: 1000,
					margin: "0 auto",
				}}>
					{[
						{
							icon: "📐",
							title: "STEPファイルから即生成",
							desc: "お手持ちの3D CADデータ（STEP形式）をアップロードするだけ。パラメトリックな発注フォームを自動生成します。",
						},
						{
							icon: "🔄",
							title: "リアルタイム3Dプレビュー",
							desc: "寸法を変更すると、3Dモデルがリアルタイムに変形。お客様が完成形を確認しながら発注できます。",
						},
						{
							icon: "💰",
							title: "自動見積もり",
							desc: "寸法に応じた価格を自動計算。見積もり業務の工数を大幅に削減し、即時対応を実現します。",
						},
						{
							icon: "📱",
							title: "スマートフォン対応",
							desc: "レスポンシブデザインで、現場からスマホで発注可能。PCがなくても、出先から即座に注文できます。",
						},
						{
							icon: "🔗",
							title: "自社サイトに埋め込み",
							desc: "scriptタグ1行を貼るだけで、御社の既存Webサイトに3D見積もりフォームを追加できます。",
						},
						{
							icon: "📧",
							title: "メール・Slack通知",
							desc: "お客様が発注ボタンを押すと、指定のメールアドレス・Slackに自動通知。受注を見逃しません。",
						},
					].map((f, i) => (
						<div key={i} style={{
							backgroundColor: "#fff",
							borderRadius: 8,
							padding: "32px 24px",
							textAlign: "center",
							boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
						}}>
							<div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
							<h3 style={{ fontSize: 16, fontWeight: 700, color: navy, margin: "0 0 12px 0" }}>{f.title}</h3>
							<p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* ========== HOW TO USE ========== */}
			<section id="howto" style={{ backgroundColor: "#fff", padding: "80px 40px" }}>
				<div style={{ textAlign: "center", marginBottom: 60 }}>
					<h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: 0 }}>かんたん3ステップ</h2>
				</div>
				<div style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: 40,
					maxWidth: 960,
					margin: "0 auto",
				}}>
					{[
						{
							step: "01",
							title: "3Dデータをアップロード",
							desc: "STEPファイルをドラッグ&ドロップ。自動的にWeb表示用の形式に変換されます。",
							placeholder: "STEPファイルをアップロードしている画面のスクリーンショット",
						},
						{
							step: "02",
							title: "パラメータを設定",
							desc: "可変にしたい寸法（幅・奥行き・高さなど）と価格計算式を設定します。",
							placeholder: "パラメータ設定画面のスクリーンショット（スライダーで寸法を変えている様子）",
						},
						{
							step: "03",
							title: "公開・共有",
							desc: "URLを共有するか、scriptタグで自社サイトに埋め込み。すぐに受注開始できます。",
							placeholder: "完成した3D発注フォームの画面スクリーンショット",
						},
					].map((s, i) => (
						<div key={i} style={{ textAlign: "center" }}>
							<div style={{
								width: 48,
								height: 48,
								borderRadius: "50%",
								backgroundColor: accent,
								color: navy,
								fontSize: 18,
								fontWeight: 800,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 20px",
							}}>{s.step}</div>
							<div style={{
								width: "100%",
								height: 180,
								backgroundColor: gray,
								borderRadius: 8,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								marginBottom: 20,
								padding: 16,
							}}>
								<div style={{ color: accent, fontSize: 13, textAlign: "center" }}>{s.placeholder}</div>
							</div>
							<h3 style={{ fontSize: 16, fontWeight: 700, color: navy, margin: "0 0 8px 0" }}>{s.title}</h3>
							<p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* ========== BEFORE/AFTER ========== */}
			<section style={{
				background: `linear-gradient(135deg, ${navy} 0%, ${navyLight} 100%)`,
				padding: "80px 40px",
			}}>
				<div style={{ textAlign: "center", marginBottom: 60 }}>
					<h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>見積もり業務がこう変わる</h2>
				</div>
				<div style={{
					display: "grid",
					gridTemplateColumns: "1fr auto 1fr",
					gap: 32,
					maxWidth: 900,
					margin: "0 auto",
					alignItems: "center",
				}}>
					<div style={{
						backgroundColor: "rgba(255,255,255,0.06)",
						border: "1px solid rgba(255,255,255,0.12)",
						borderRadius: 8,
						padding: 32,
					}}>
						<div style={{ color: "#ff6b6b", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>BEFORE</div>
						<ul style={{ color: textLight, fontSize: 14, lineHeight: 2.2, margin: 0, paddingLeft: 20 }}>
							<li>FAXで図面を送付</li>
							<li>メールで寸法をやり取り</li>
							<li>Excelで見積もり作成</li>
							<li>電話で仕様を確認</li>
							<li>対応は営業時間内のみ</li>
						</ul>
					</div>
					<div style={{ color: accent, fontSize: 40, fontWeight: 800 }}>→</div>
					<div style={{
						backgroundColor: "rgba(245,166,35,0.1)",
						border: `1px solid ${accent}`,
						borderRadius: 8,
						padding: 32,
					}}>
						<div style={{ color: accent, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>AFTER</div>
						<ul style={{ color: "#fff", fontSize: 14, lineHeight: 2.2, margin: 0, paddingLeft: 20 }}>
							<li>Webで3Dプレビュー確認</li>
							<li>お客様が自分で寸法を入力</li>
							<li>価格が自動算出</li>
							<li>ワンクリックで見積もり送信</li>
							<li>24時間365日対応</li>
						</ul>
					</div>
				</div>
			</section>

			{/* ========== EXAMPLES ========== */}
			<section id="examples" style={{ backgroundColor: gray, padding: "80px 40px" }}>
				<div style={{ textAlign: "center", marginBottom: 60 }}>
					<h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: 0 }}>こんな製品に対応しています</h2>
					<p style={{ color: "#666", fontSize: 14, marginTop: 12 }}>
						板金・切削・旋削・押出など、さまざまな加工品の3D発注フォームを作成できます
					</p>
				</div>
				<div style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 20,
					maxWidth: 1000,
					margin: "0 auto",
				}}>
					{list.slice(0, 8).map((item, i) => {
						const displayName = item.name.replace(/^\d+_/, "");
						const desc = item.description.split("—")[0].replace(/^\d+\.\s*/, "").trim();
						return (
							<Link href={`/out/${item.nameDirectory}`} key={i} style={{ textDecoration: "none" }}>
								<div style={{
									backgroundColor: "#fff",
									borderRadius: 8,
									overflow: "hidden",
									boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
									transition: "box-shadow 0.2s",
								}}>
									<div style={{
										height: 120,
										backgroundColor: navyLight,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: accent,
										fontSize: 12,
										padding: 12,
										textAlign: "center",
									}}>
										{displayName}の3Dプレビュー画像
									</div>
									<div style={{ padding: "12px 16px" }}>
										<div style={{ fontSize: 13, fontWeight: 700, color: navy }}>{displayName}</div>
										<div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{desc}</div>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
				<div style={{ textAlign: "center", marginTop: 32 }}>
					<Link href="/dev" style={{
						color: accent,
						fontSize: 14,
						fontWeight: 700,
						textDecoration: "none",
					}}>すべてのサンプルを見る →</Link>
				</div>
			</section>

			{/* ========== TARGET INDUSTRIES ========== */}
			<section style={{ backgroundColor: "#fff", padding: "80px 40px" }}>
				<div style={{ textAlign: "center", marginBottom: 60 }}>
					<h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: 0 }}>こんな企業様におすすめ</h2>
				</div>
				<div style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 24,
					maxWidth: 900,
					margin: "0 auto",
				}}>
					{[
						{ icon: "🏭", title: "板金加工業", desc: "ボックス・ブラケットなどのセミオーダー品を扱う企業" },
						{ icon: "⚙️", title: "機械部品加工業", desc: "シャフト・フランジなどの寸法違い品を受注する企業" },
						{ icon: "🖥️", title: "サーバー・IT機器", desc: "ラック・エンクロージャなどの筐体を製造する企業" },
						{ icon: "🔧", title: "治具・金型メーカー", desc: "特注治具やアタッチメントを受注生産する企業" },
					].map((t, i) => (
						<div key={i} style={{ textAlign: "center", padding: "24px 16px" }}>
							<div style={{ fontSize: 36, marginBottom: 12 }}>{t.icon}</div>
							<h3 style={{ fontSize: 15, fontWeight: 700, color: navy, margin: "0 0 8px 0" }}>{t.title}</h3>
							<p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>{t.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* ========== PRICING ========== */}
			<section id="pricing" style={{
				background: `linear-gradient(135deg, ${navy} 0%, ${navyLight} 100%)`,
				padding: "80px 40px",
			}}>
				<div style={{ textAlign: "center", marginBottom: 60 }}>
					<h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>料金プラン</h2>
				</div>
				<div style={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: 32,
					maxWidth: 700,
					margin: "0 auto",
				}}>
					<div style={{
						backgroundColor: "rgba(255,255,255,0.06)",
						border: "1px solid rgba(255,255,255,0.15)",
						borderRadius: 8,
						padding: "40px 32px",
						textAlign: "center",
					}}>
						<div style={{ color: textLight, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>STARTER</div>
						<div style={{ color: "#fff", fontSize: 40, fontWeight: 800 }}>¥0</div>
						<div style={{ color: textLight, fontSize: 13, marginBottom: 24 }}>ロゴ透かし表示あり</div>
						<ul style={{ color: textLight, fontSize: 13, lineHeight: 2.2, textAlign: "left", margin: 0, paddingLeft: 20 }}>
							<li>3Dプレビュー</li>
							<li>パラメトリック変形</li>
							<li>自動見積もり</li>
							<li>メール通知</li>
							<li>コミュニティサポート</li>
						</ul>
					</div>
					<div style={{
						backgroundColor: "rgba(245,166,35,0.1)",
						border: `2px solid ${accent}`,
						borderRadius: 8,
						padding: "40px 32px",
						textAlign: "center",
						position: "relative",
					}}>
						<div style={{
							position: "absolute",
							top: -14,
							left: "50%",
							transform: "translateX(-50%)",
							backgroundColor: accent,
							color: navy,
							fontSize: 12,
							fontWeight: 700,
							padding: "4px 16px",
							borderRadius: 12,
						}}>おすすめ</div>
						<div style={{ color: accent, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>STANDARD</div>
						<div style={{ color: "#fff", fontSize: 40, fontWeight: 800 }}>¥10,000</div>
						<div style={{ color: textLight, fontSize: 13, marginBottom: 24 }}>/ 月（税抜）</div>
						<ul style={{ color: "#fff", fontSize: 13, lineHeight: 2.2, textAlign: "left", margin: 0, paddingLeft: 20 }}>
							<li>Starterの全機能</li>
							<li>メールサポート</li>
							<li>請求書払い対応</li>
							<li>導入支援</li>
							<li>優先対応</li>
						</ul>
					</div>
				</div>
				<div style={{ textAlign: "center", marginTop: 24 }}>
					<p style={{ color: textLight, fontSize: 13 }}>
						※ 大規模導入・カスタム契約をご希望の場合は別途ご相談ください
					</p>
				</div>
			</section>

			{/* ========== FAQ ========== */}
			<section id="faq" style={{ backgroundColor: "#fff", padding: "80px 40px" }}>
				<div style={{ textAlign: "center", marginBottom: 60 }}>
					<h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: 0 }}>よくあるご質問</h2>
				</div>
				<div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 0 }}>
					{[
						{
							q: "導入に開発スキルは必要ですか？",
							a: "いいえ。STEPファイルをアップロードし、寸法や価格をGUIで設定するだけでフォームが完成します。HTMLやJavaScriptの知識は不要です。",
						},
						{
							q: "対応しているCADデータの形式は？",
							a: "現在はSTEP形式（.step / .stp）に対応しています。SolidWorks・Fusion 360・FreeCADなど主要なCADソフトからエクスポート可能です。",
						},
						{
							q: "自社のWebサイトへの埋め込みは簡単ですか？",
							a: "scriptタグ1行をHTMLに追加するだけです。WordPress・Shopify・静的HTMLなど、あらゆるサイトに対応しています。URLを共有するだけでも利用できます。",
						},
						{
							q: "見積もり金額はどのように計算されますか？",
							a: "寸法パラメータに対する価格計算式を自由に設定できます。基本価格＋寸法ごとの係数による線形計算や、体積比例の計算に対応しています。",
						},
						{
							q: "無料プランに利用制限はありますか？",
							a: "機能制限はありません。3Dプレビュー・パラメトリック変形・自動見積もり・メール通知のすべてが無料でご利用いただけます。フォーム右下に「Powered by katachiform」のロゴが表示されます。",
						},
						{
							q: "顧客の発注情報はどこに保存されますか？",
							a: "発注ボタンが押されると、指定のメールアドレスに通知が届きます。顧客データをこちらのサーバーに保存することはありません。",
						},
						{
							q: "解約はいつでもできますか？",
							a: "はい。月単位でいつでも解約可能です。解約後もStarterプラン（無料・ロゴ表示あり）としてそのままご利用いただけます。",
						},
					].map((item, i) => (
						<div key={i} style={{
							borderBottom: "1px solid #e8e8e8",
							padding: "24px 0",
						}}>
							<div style={{
								fontSize: 15,
								fontWeight: 700,
								color: navy,
								marginBottom: 10,
								display: "flex",
								alignItems: "flex-start",
								gap: 12,
							}}>
								<span style={{
									color: accent,
									fontWeight: 800,
									fontSize: 15,
									flexShrink: 0,
								}}>Q.</span>
								{item.q}
							</div>
							<div style={{
								fontSize: 14,
								color: "#666",
								lineHeight: 1.8,
								paddingLeft: 28,
							}}>
								<span style={{
									color: navy,
									fontWeight: 700,
									fontSize: 14,
								}}>A. </span>
								{item.a}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* ========== CTA ========== */}
			<section id="contact" style={{
				backgroundColor: "#fff",
				padding: "80px 40px",
				textAlign: "center",
			}}>
				<h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: "0 0 16px 0" }}>
					まずは無料でお試しください
				</h2>
				<p style={{ color: "#666", fontSize: 15, margin: "0 0 32px 0", lineHeight: 1.8 }}>
					STEPファイルがあれば、今すぐ3D発注フォームを作成できます。<br />
					導入のご相談・デモのご依頼もお気軽にどうぞ。
				</p>
				<div style={{
					maxWidth: 500,
					margin: "0 auto",
					backgroundColor: gray,
					borderRadius: 8,
					padding: 40,
				}}>
					<div style={{ marginBottom: 16 }}>
						<input
							type="text"
							placeholder="会社名"
							style={{
								width: "100%",
								padding: "12px 16px",
								border: "1px solid #ddd",
								borderRadius: 4,
								fontSize: 14,
								boxSizing: "border-box",
							}}
						/>
					</div>
					<div style={{ marginBottom: 16 }}>
						<input
							type="email"
							placeholder="メールアドレス"
							style={{
								width: "100%",
								padding: "12px 16px",
								border: "1px solid #ddd",
								borderRadius: 4,
								fontSize: 14,
								boxSizing: "border-box",
							}}
						/>
					</div>
					<div style={{ marginBottom: 24 }}>
						<textarea
							placeholder="お問い合わせ内容（任意）"
							rows={4}
							style={{
								width: "100%",
								padding: "12px 16px",
								border: "1px solid #ddd",
								borderRadius: 4,
								fontSize: 14,
								boxSizing: "border-box",
								resize: "vertical",
							}}
						/>
					</div>
					<button style={{
						backgroundColor: accent,
						color: navy,
						border: "none",
						padding: "14px 48px",
						borderRadius: 4,
						fontSize: 16,
						fontWeight: 700,
						cursor: "pointer",
						width: "100%",
					}}>送信する</button>
				</div>
			</section>

			{/* ========== FOOTER ========== */}
			<footer style={{
				backgroundColor: navy,
				padding: "40px 40px 24px",
			}}>
				<div style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					maxWidth: 1000,
					margin: "0 auto",
					flexWrap: "wrap",
					gap: 40,
				}}>
					<div>
						<img src="/logo.svg" alt="KatachiForm" style={{ height: 32, marginBottom: 12 }} />
						<p style={{ color: textLight, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
							セミオーダー品の3D見積もりフォームSaaS<br />
							製造業の見積もり・受注を自動化
						</p>
					</div>
					<div style={{ display: "flex", gap: 48 }}>
						<div>
							<div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>プロダクト</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								<a href="#features" style={{ color: textLight, fontSize: 13, textDecoration: "none" }}>特長</a>
								<a href="#howto" style={{ color: textLight, fontSize: 13, textDecoration: "none" }}>使い方</a>
								<a href="#pricing" style={{ color: textLight, fontSize: 13, textDecoration: "none" }}>料金</a>
							</div>
						</div>
						<div>
							<div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>リソース</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								<a href="#examples" style={{ color: textLight, fontSize: 13, textDecoration: "none" }}>活用事例</a>
								<Link href="/dev" style={{ color: textLight, fontSize: 13, textDecoration: "none" }}>開発者向け</Link>
							</div>
						</div>
					</div>
				</div>
				<div style={{
					borderTop: "1px solid rgba(255,255,255,0.1)",
					marginTop: 32,
					paddingTop: 16,
					textAlign: "center",
				}}>
					<p style={{ color: textLight, fontSize: 12, margin: 0 }}>© 2026 katachiform. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
}
