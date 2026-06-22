import { useNavigate } from "react-router-dom";

const C = {
  bg:        "#111114",
  surface:   "#1a1a1f",
  border:    "#2a2a35",
  purple:    "#a855f7",
  purpleHov: "#9333ea",
  blue:      "#00A8FF",
  text:      "#f0f0f5",
  mid:       "#8892a4",
  dark:      "#c8d0dc",
  inputBg:   "#252530",
  cardBg:    "#1e1e24",
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={s.pageWrapper}>
      <Navbar navigate={navigate} />
      <main style={s.main}>
        {/* HERO */}
        <section style={s.hero}>
          <div style={s.heroContainer}>
            <div style={s.heroContent}>
              <p style={s.heroTag}>INTELIGENCIA ARTIFICIAL + MÚSICA</p>
              <h1 style={s.heroTitle}>Crea música increíble con solo describirla</h1>
              <p style={s.heroDesc}>
                <strong>MusicGen</strong> transforma tus ideas en canciones reales usando inteligencia artificial avanzada.
                Solo describe el estilo que imaginas, elige el género musical, el ritmo y el mood, y nuestra IA compondrá,
                generará la letra y producirá tu track completo en cuestión de segundos, sin necesidad de conocimientos musicales.
              </p>
              <p style={s.heroDesc}>
                Pero MusicGen es mucho más que un generador. Separa la voz del instrumental de cualquier canción para crear
                pistas karaoke al instante. Mezcla tus tracks como un DJ profesional con nuestro editor integrado.
                Organiza tu música en playlists inteligentes generadas por IA según tu estado de ánimo.
                Y comparte todo con una comunidad global de creadores.
              </p>
              <div style={s.heroButtons}>
                <button style={s.btnCreate} onClick={() => navigate('/register')}>
                  ¡Empieza gratis ahora!
                </button>
              </div>
            </div>
            <div style={s.heroImage}>
              <img src="/fondo_home.png" alt="MusicGen" style={{ width: "100%", maxWidth: 820, borderRadius: 20, boxShadow: "0 15px 45px rgba(168,85,247,0.2)" }} />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <Features navigate={navigate} />
      </main>
    </div>
  );
}

function Navbar({ navigate }: { navigate: (path: string) => void }) {
  return (
    <nav style={s.navbar}>
      <div style={s.brand}>
        <img src="/logo.png" alt="MusicGen" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <span style={s.brandName}>MusicGen</span>
      </div>
      <div style={s.navActions}>
        <button style={s.btnLogin} onClick={() => navigate('/login')}>Iniciar sesión</button>
        <button style={s.btnRegister} onClick={() => navigate('/register')}>Cuenta gratuita</button>
      </div>
    </nav>
  );
}

const FEATURES = [
  {
    icon: "🎵",
    title: "Generación de Música IA",
    desc: "Describe con texto libre la canción que imaginas. Elige género, ritmo y estilo. La IA genera tu track completo con letra incluida en segundos.",
  },
  {
    icon: "🎤",
    title: "Karaoke & Separación",
    desc: "Sube cualquier canción y separa la voz del instrumental al instante. Obtén la pista karaoke o la voz aislada para tus proyectos.",
  },
  {
    icon: "🎛️",
    title: "Mix DJ",
    desc: "Mezcla tus canciones generadas como un DJ profesional. Crea transiciones, ajusta el tempo y arma sets únicos directamente en el navegador.",
  },
  {
    icon: "🌐",
    title: "Comunidad",
    desc: "Comparte tus creaciones, descubre música de otros usuarios, crea playlists colaborativas y conecta con creadores de todo el mundo.",
  },
  {
    icon: "🎶",
    title: "Colaborativo",
    desc: "Comparte tus pistas karaoke con la comunidad y canta junto a otros creadores en tiempo real. Crea sesiones grupales y disfruta la música juntos.",
  },
];

function Features({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section style={s.features}>
      <div style={s.featuresContainer}>
        <div style={s.featuresHeader}>
          <p style={s.featuresTag}>TODO LO QUE NECESITAS</p>
          <h2 style={s.featuresTitle}>Una plataforma completa para creadores</h2>
        </div>
        <div style={s.featuresGrid}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} style={s.featureCard}>
              <div style={s.featureIconWrap}>
                <span style={{ fontSize: "2.5rem" }}>{icon}</span>
              </div>
              <h3 style={s.featureCardTitle}>{title}</h3>
              <p style={s.featureCardDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageWrapper: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: C.bg,
    color: C.text,
    overflowX: "hidden",
    overflowY: "auto",
    minHeight: "100vh",
    height: "100vh",
  },
  navbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "fixed", top: 0, left: 0, width: "100%",
    padding: "0 80px", height: 70,
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    boxSizing: "border-box", zIndex: 1000,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandName: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: "1.4rem", fontWeight: 700, color: C.purple, letterSpacing: "-0.5px",
  },
  navActions: { display: "flex", alignItems: "center", gap: 16 },
  btnLogin: {
    background: "transparent", border: "none", fontSize: "0.95rem",
    fontWeight: 500, color: C.text, cursor: "pointer", padding: "8px 16px", borderRadius: 10,
  },
  btnRegister: {
    background: C.purple, color: "#fff", border: "none",
    padding: "0 20px", height: 40, lineHeight: "36px",
    borderRadius: 5, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
  },
  main: { paddingTop: 70 },
  hero: {
    minHeight: "calc(100vh - 70px)", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "80px 9%",
  },
  heroContainer: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 70, width: "100%", maxWidth: 1400, flexWrap: "wrap",
  },
  heroContent: { flex: 1, maxWidth: 600 },
  heroTag: {
    color: C.blue, fontSize: "0.9rem", fontWeight: 700,
    letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12,
  },
  heroTitle: { fontSize: "2.6rem", fontWeight: 700, lineHeight: 1.1, color: C.text, marginBottom: 24 },
  heroDesc: { fontSize: "1.1rem", color: C.mid, lineHeight: 1.8, marginBottom: 20 },
  heroButtons: { marginTop: 8 },
  btnCreate: {
    background: C.purple, color: "#fff", border: "none",
    padding: "0 32px", height: 50, lineHeight: "40px",
    borderRadius: 5, fontSize: "1rem", fontWeight: 700, cursor: "pointer",
  },
  heroImage: { flex: 1, display: "flex", justifyContent: "center" },
  heroImgPlaceholder: {
    width: "100%", maxWidth: 520, height: 360,
    background: C.cardBg, border: `2px dashed ${C.border}`, borderRadius: 20,
  },
  features: {
    background: C.surface, padding: "100px 0", display: "flex", justifyContent: "center",
  },
  featuresContainer: { width: "100%", maxWidth: 1400, padding: "0 10%" },
  featuresHeader: { textAlign: "center", marginBottom: 60 },
  featuresTag: {
    color: C.blue, fontSize: "0.85rem", fontWeight: 700,
    letterSpacing: 2, marginBottom: 12, textTransform: "uppercase",
  },
  featuresTitle: { fontSize: "2.5rem", color: C.text, fontWeight: 800 },
  featuresGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32,
  },
  featureCard: {
    background: C.cardBg, padding: "40px", borderRadius: 20,
    border: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
    alignItems: "center", textAlign: "center",
  },
  featureIconWrap: {
    width: 80, height: 80, background: "#1a0a2e", borderRadius: 15,
    border: `2px solid ${C.purple}`, display: "flex",
    alignItems: "center", justifyContent: "center", marginBottom: 25,
  },
  featureCardTitle: { fontSize: "1.4rem", color: C.text, marginBottom: 15, fontWeight: 700 },
  featureCardDesc: { color: C.mid, lineHeight: 1.6, margin: 0, fontSize: "0.95rem" },
};