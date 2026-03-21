import Link from "next/link";
import list from "./out/list.json";
import ContactForm from "./ContactForm";

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
          <Link href="#features" style={{ color: "#444", textDecoration: "none", fontSize: 16 }}>特長</Link>
          <Link href="#howto" style={{ color: "#444", textDecoration: "none", fontSize: 16 }}>使い方</Link>
          <Link href="#examples" style={{ color: "#444", textDecoration: "none", fontSize: 16 }}>活用事例</Link>
          <Link href="#pricing" style={{ color: "#444", textDecoration: "none", fontSize: 16 }}>料金</Link>
          <Link href="#faq" style={{ color: "#444", textDecoration: "none", fontSize: 16 }}>FAQ</Link>
          <Link href="#contact" style={{
            backgroundColor: accent,
            color: navy,
            padding: "8px 20px",
            borderRadius: 4,
            textDecoration: "none",
            fontSize: 16,
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

          <img src={`${process.env.NEXT_PUBLIC_PREFIX}/logo.svg`} alt="KatachiForm" style={{ height: 70 }} />
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

      {/* ========== 簡単3ステップ ========== */}
      <section id="features" style={{ backgroundColor: gray, padding: "80px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: 0 }}>KatachiForm の簡単3ステップ</h2>
        </div>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 0,
          maxWidth: 1000,
          margin: "0 auto",
        }}>
          {[
            {
              step: "1",
              title: "3D CADデータをアップロード",
              desc: "お手持ちのSTEPファイルをKatachiFormにアップロード。自動的にWeb表示用の形式に変換されます。",
            },
            {
              step: "2",
              title: "データをもとにフォームを作成",
              desc: "可変にしたい寸法・価格計算式を設定。3Dプレビュー付きの見積もりフォームが自動生成されます。",
            },
            {
              step: "3",
              title: "共有URLを送信 or サイトに埋め込み",
              desc: "URLを顧客に送るだけ、またはscriptタグ1行で自社サイトに埋め込み。見積もり業務が自動化！",
            },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{ textAlign: "center", width: 280 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: accent,
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}>{s.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: navy, margin: "0 0 12px 0", padding: "0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 16, color: "#666", lineHeight: 1.7, margin: 0, padding: "0 8px" }}>{s.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  color: accent,
                  fontSize: 28,
                  fontWeight: 800,
                  marginTop: 14,
                  flexShrink: 0,
                }}>▶</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========== こんなお悩みありませんか？ ========== */}
      <section style={{
        backgroundColor: gray,
        padding: "80px 40px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: "0 0 40px 0", textAlign: "center" }}>こんなお悩みありませんか？</h2>

          <div style={{ display: "flex", gap: 0, marginBottom: 48 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#d94444", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>加工業者のお悩み</div>
              <ul style={{ color: "#555", fontSize: 16, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
                <li>メールの往復で寸法確認に時間をとられる</li>
                <li>製造不可能な仕様の発注を事前に弾けない</li>
                <li>見積もり作成が手作業で、対応が営業時間内に限られる</li>
              </ul>
            </div>
            <div style={{ width: 1, backgroundColor: "#ccc", margin: "0 32px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#2a7adf", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>発注者のお悩み</div>
              <ul style={{ color: "#555", fontSize: 16, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
                <li>問い合わせ前におおよその金額を知りたい</li>
                <li>この寸法で製造できるのか、可否だけでも知りたい</li>
                <li>完成品のイメージがわかないまま発注するのが不安</li>
              </ul>
            </div>
          </div>

          <div style={{ color: accent, fontSize: 20, fontWeight: 800, marginBottom: 16, textAlign: "center" }}>▼ KatachiForm で解決</div>
          <ul style={{ color: "#333", fontSize: 16, lineHeight: 2.2, margin: "0 auto", paddingLeft: 20, maxWidth: 400 }}>
            <li>3Dフォーム上で顧客が自分で寸法を入力・確認</li>
            <li>価格と可否を即時自動算出、24時間365日対応</li>
            <li>3Dプレビューで完成形を確認してから発注</li>
            <li>メール・電話でのやり取りが不要に</li>
          </ul>
        </div>
      </section>

      {/* ========== EXAMPLES ========== */}
      <section id="examples" style={{ backgroundColor: gray, padding: "80px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: navy, margin: 0 }}>こんな製品に対応しています</h2>
          <p style={{ color: "#666", fontSize: 16, marginTop: 12 }}>
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
                    fontSize: 16,
                    padding: 12,
                    textAlign: "center",
                  }}>
                    {displayName}の3Dプレビュー画像
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: navy }}>{displayName}</div>
                    <div style={{ fontSize: 16, color: "#888", marginTop: 4 }}>{desc}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/dev" style={{
            color: accent,
            fontSize: 16,
            fontWeight: 700,
            textDecoration: "none",
          }}>すべてのサンプルを見る →</Link>
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
            <div style={{ color: textLight, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>STARTER</div>
            <div style={{ color: "#fff", fontSize: 40, fontWeight: 800 }}>¥0</div>
            <div style={{ color: textLight, fontSize: 16, marginBottom: 24 }}>ロゴ透かし表示あり</div>
            <ul style={{ color: textLight, fontSize: 16, lineHeight: 2.2, textAlign: "left", margin: 0, paddingLeft: 20 }}>
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
              fontSize: 16,
              fontWeight: 700,
              padding: "4px 16px",
              borderRadius: 12,
            }}>おすすめ</div>
            <div style={{ color: accent, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>STANDARD</div>
            <div style={{ color: "#fff", fontSize: 40, fontWeight: 800 }}>¥10,000</div>
            <div style={{ color: textLight, fontSize: 16, marginBottom: 24 }}>/ 月（税抜）</div>
            <ul style={{ color: "#fff", fontSize: 16, lineHeight: 2.2, textAlign: "left", margin: 0, paddingLeft: 20 }}>
              <li>Starterの全機能</li>
              <li>メールサポート</li>
              <li>請求書払い対応</li>
              <li>導入支援</li>
              <li>優先対応</li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ color: textLight, fontSize: 16 }}>
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
                fontSize: 16,
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
                  fontSize: 16,
                  flexShrink: 0,
                }}>Q.</span>
                {item.q}
              </div>
              <div style={{
                fontSize: 16,
                color: "#666",
                lineHeight: 1.8,
                paddingLeft: 28,
              }}>
                <span style={{
                  color: navy,
                  fontWeight: 700,
                  fontSize: 16,
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
        <p style={{ color: "#666", fontSize: 16, margin: "0 0 32px 0", lineHeight: 1.8 }}>
          STEPファイルがあれば、今すぐ3D発注フォームを作成できます。<br />
          導入のご相談・デモのご依頼もお気軽にどうぞ。
        </p>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <ContactForm />
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{
        backgroundColor: "#fff",
        borderTop: "1px solid #e0e0e0",
        padding: "24px 40px",
        textAlign: "center",
      }}>
        <p style={{ color: "#888", fontSize: 16, margin: "0 0 8px 0" }}>
          © 2026 <Link href="https://surfic.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>サーフィック合同会社</Link> All rights reserved<Link href="/dev" style={{ color: "#888", textDecoration: "none" }}>.</Link>
        </p>
        <Link href="https://surfic.com/" target="_blank" rel="noopener noreferrer">
          <img src="https://surfic.com/SURFIC.svg" alt="サーフィック合同会社" style={{ height: 20 }} />
        </Link>
      </footer>
    </div>
  );
}
