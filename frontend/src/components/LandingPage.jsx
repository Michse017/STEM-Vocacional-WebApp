import { useEffect } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { GraduationCap, Settings, ClipboardList, Brain } from "lucide-react";

export default function LandingPage() {
  // El landing es el punto de entrada. Si existe sesión de estudiante en esta ventana,
  // sincroniza un usuario mínimo solo para esta pestaña.
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("active_session") || "null");
      if (s && s.type === "student" && s.code) {
        const existing = JSON.parse(sessionStorage.getItem("usuario") || "null");
        if (!existing || !existing.id_usuario) {
          const minimal = { codigo_estudiante: s.code, id_usuario: -1 };
          try {
            sessionStorage.setItem("usuario", JSON.stringify(minimal));
          } catch {}
        }
      }
    } catch (_) {}
  }, []);

  return (
    <Container>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroText>
            <Title>STEM Vocational</Title>
            <Subtitle>
              Descubre tu futuro profesional en Ciencia, Tecnología, Ingeniería y Matemáticas con nuestra plataforma de
              orientación vocacional impulsada por inteligencia artificial.
            </Subtitle>
            <CTAButton to="/login">Comenzar</CTAButton>
          </HeroText>
          <HeroIllustration>
            <svg viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background glow circles */}
              <circle cx="300" cy="250" r="200" fill="url(#purpleGlow)" opacity="0.1" />
              <circle cx="450" cy="150" r="80" fill="url(#blueGlow)" opacity="0.1" />
              <circle cx="150" cy="350" r="60" fill="url(#greenGlow)" opacity="0.1" />

              {/* Rotating Atom (Purple - Science) */}
              <g className="atom-group">
                <circle cx="150" cy="150" r="12" fill="#8B5CF6" />
                <ellipse cx="150" cy="150" rx="60" ry="25" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.6" />
                <ellipse cx="150" cy="150" rx="25" ry="60" stroke="#8B5CF6" strokeWidth="3" fill="none" opacity="0.6" />
                <ellipse cx="150" cy="150" rx="50" ry="50" stroke="#8B5CF6" strokeWidth="2" fill="none" opacity="0.4" />
                <circle cx="210" cy="150" r="8" fill="#C084FC" />
                <circle cx="90" cy="150" r="8" fill="#C084FC" />
                <circle cx="150" cy="210" r="8" fill="#A78BFA" />
                <circle cx="150" cy="90" r="8" fill="#A78BFA" />
              </g>

              {/* Laptop with Code (Blue - Technology) */}
              <g transform="translate(370, 300)">
                <rect x="0" y="50" width="180" height="120" rx="6" fill="#1E293B" />
                <rect x="8" y="58" width="164" height="100" fill="#3B82F6" opacity="0.2" />
                <path d="M -20 170 L 200 170 L 185 180 L -5 180 Z" fill="#334155" />
                <rect x="85" y="175" width="20" height="3" rx="1.5" fill="#64748B" />

                {/* Code lines */}
                <rect x="20" y="70" width="40" height="4" rx="2" fill="#3B82F6" opacity="0.8" />
                <rect x="20" y="85" width="60" height="4" rx="2" fill="#60A5FA" opacity="0.6" />
                <rect x="30" y="100" width="50" height="4" rx="2" fill="#93C5FD" opacity="0.7" />
                <rect x="20" y="115" width="45" height="4" rx="2" fill="#3B82F6" opacity="0.8" />
                <rect x="30" y="130" width="55" height="4" rx="2" fill="#60A5FA" opacity="0.6" />

                {/* Code symbols */}
                <text x="100" y="95" fontSize="24" fill="#3B82F6" opacity="0.6" fontFamily="monospace">
                  {"<>"}
                </text>
                <text x="130" y="125" fontSize="20" fill="#60A5FA" opacity="0.5" fontFamily="monospace">
                  {"{ }"}
                </text>
              </g>

              {/* Floating Math Equations (Yellow - Mathematics) */}
              <g transform="translate(420, 100)">
                <text x="0" y="0" fontSize="32" fill="#F59E0B" fontWeight="bold" opacity="0.8">
                  ∑
                </text>
                <text x="40" y="10" fontSize="24" fill="#FBBF24" fontWeight="bold" opacity="0.7">
                  ∫
                </text>
                <text x="-20" y="40" fontSize="28" fill="#F59E0B" fontWeight="bold" opacity="0.6">
                  π
                </text>
                <path d="M 0 50 Q 20 30 40 50" stroke="#FBBF24" strokeWidth="2" fill="none" opacity="0.5" />
                <text x="10" y="75" fontSize="20" fill="#F59E0B" fontStyle="italic" opacity="0.7">
                  x²+y²
                </text>
              </g>

              {/* Interconnected Gears (Green - Engineering) */}
              <g transform="translate(100, 350)">
                <circle cx="0" cy="0" r="35" fill="none" stroke="#10B981" strokeWidth="6" />
                <circle cx="0" cy="0" r="20" fill="#10B981" opacity="0.3" />
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <rect key={i} x="-4" y="-40" width="8" height="15" fill="#10B981" transform={`rotate(${angle})`} />
                ))}

                <circle cx="55" cy="0" r="25" fill="none" stroke="#34D399" strokeWidth="5" />
                <circle cx="55" cy="0" r="14" fill="#34D399" opacity="0.3" />
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <rect
                    key={`small-${i}`}
                    x="51"
                    y="-28"
                    width="6"
                    height="10"
                    fill="#34D399"
                    transform={`rotate(${angle} 55 0)`}
                  />
                ))}
              </g>

              {/* DNA Helix (Purple - Biology) */}
              <g transform="translate(480, 350)">
                <path d="M 0 0 Q 15 25 0 50 Q -15 75 0 100" stroke="#8B5CF6" strokeWidth="4" fill="none" />
                <path d="M 30 0 Q 15 25 30 50 Q 45 75 30 100" stroke="#A78BFA" strokeWidth="4" fill="none" />
                {[10, 30, 50, 70, 90].map((y, i) => (
                  <>
                    <line
                      key={`line-${i}`}
                      x1="0"
                      y1={y}
                      x2="30"
                      y2={y}
                      stroke="#C084FC"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                    <circle key={`c1-${i}`} cx="0" cy={y} r="4" fill="#8B5CF6" />
                    <circle key={`c2-${i}`} cx="30" cy={y} r="4" fill="#A78BFA" />
                  </>
                ))}
              </g>

              {/* Floating particles */}
              <circle cx="250" cy="100" r="6" fill="#F59E0B" opacity="0.6" className="float-particle" />
              <circle cx="500" cy="250" r="8" fill="#3B82F6" opacity="0.5" className="float-particle" />
              <rect x="80" y="280" width="12" height="12" fill="#10B981" opacity="0.6" className="float-particle" />
              <polygon points="540,420 550,440 530,440" fill="#8B5CF6" opacity="0.6" className="float-particle" />

              <defs>
                <radialGradient id="purpleGlow">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="blueGlow">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="greenGlow">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </HeroIllustration>
        </HeroContent>
      </HeroSection>

      {/* Public Cards Section */}
      <PublicCardsSection>
        <CardsContainer>
          <PublicCard gradient="purpleBlue">
            <CardIcon color="#8B5CF6">
              <GraduationCap size={48} />
            </CardIcon>
            <CardBadge color="#8B5CF6">Estudiantes</CardBadge>
            <CardTitle>Estudiantes</CardTitle>
            <CardDescription>
              Acceso con código, diligenciamiento del cuestionario principal y visualización del resumen. Si hay
              modelo, el resumen puede incluir una recomendación.
            </CardDescription>
            <CardButton to="/login" color="#8B5CF6">
              Ingresar
            </CardButton>
          </PublicCard>

          <PublicCard gradient="greenYellow">
            <CardIcon color="#10B981">
              <Settings size={48} />
            </CardIcon>
            <CardBadge color="#10B981">Administración</CardBadge>
            <CardTitle>Administración</CardTitle>
            <CardDescription>
              Gestión de cuestionarios: crear, editar y publicar versiones, y definir un cuestionario primario.
            </CardDescription>
            <CardButton to="/admin/login" color="#10B981">
              Abrir portal
            </CardButton>
          </PublicCard>
        </CardsContainer>
      </PublicCardsSection>

      {/* How it Works Section */}
      <HowItWorksSection>
        <SectionTitle>Cómo funciona</SectionTitle>
        <HowItWorksGrid>
          <HowItWorksCard>
            <HowItWorksIcon color="#3B82F6">
              <ClipboardList size={40} />
            </HowItWorksIcon>
            <HowItWorksTitle>Cuestionario dinámico</HowItWorksTitle>
            <HowItWorksDescription>
              La aplicación renderiza cuestionarios a partir de definiciones gestionadas en el módulo de
              administración. Las secciones y preguntas pueden ajustarse sin redeploy del frontend.
            </HowItWorksDescription>
          </HowItWorksCard>

          <HowItWorksCard>
            <HowItWorksIcon color="#8B5CF6">
              <Brain size={40} />
            </HowItWorksIcon>
            <HowItWorksTitle>Recomendación del modelo</HowItWorksTitle>
            <HowItWorksDescription>
              Un modelo entrenado evalúa las respuestas y puede registrar una recomendación con su confianza.
            </HowItWorksDescription>
          </HowItWorksCard>
        </HowItWorksGrid>
      </HowItWorksSection>

      {/* Visual STEM Areas Section */}
      <STEMAreasSection>
        <SectionTitle>Áreas STEM</SectionTitle>
        <STEMAreasGrid>
          <STEMAreaCard color="#8B5CF6">
            <STEMAreaSVG>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="8" fill="#8B5CF6" />
                <ellipse cx="50" cy="50" rx="35" ry="15" stroke="#8B5CF6" strokeWidth="2.5" />
                <ellipse cx="50" cy="50" rx="15" ry="35" stroke="#8B5CF6" strokeWidth="2.5" />
                <circle cx="85" cy="50" r="5" fill="#C084FC" />
                <circle cx="15" cy="50" r="5" fill="#C084FC" />
                <circle cx="50" cy="85" r="5" fill="#A78BFA" />
                <circle cx="50" cy="15" r="5" fill="#A78BFA" />
              </svg>
            </STEMAreaSVG>
            <STEMAreaTitle>Ciencia</STEMAreaTitle>
            <STEMAreaDescription>Química, Física, Biología</STEMAreaDescription>
          </STEMAreaCard>

          <STEMAreaCard color="#3B82F6">
            <STEMAreaSVG>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="60" height="60" rx="4" stroke="#3B82F6" strokeWidth="2.5" />
                <circle cx="30" cy="30" r="3" fill="#3B82F6" />
                <circle cx="70" cy="30" r="3" fill="#3B82F6" />
                <circle cx="30" cy="70" r="3" fill="#3B82F6" />
                <circle cx="70" cy="70" r="3" fill="#3B82F6" />
                <line x1="30" y1="30" x2="70" y2="30" stroke="#60A5FA" strokeWidth="2" />
                <line x1="70" y1="30" x2="70" y2="70" stroke="#60A5FA" strokeWidth="2" />
                <line x1="70" y1="70" x2="30" y2="70" stroke="#60A5FA" strokeWidth="2" />
                <line x1="30" y1="70" x2="30" y2="30" stroke="#60A5FA" strokeWidth="2" />
                <line x1="30" y1="30" x2="70" y2="70" stroke="#93C5FD" strokeWidth="1.5" opacity="0.6" />
                <circle cx="50" cy="50" r="4" fill="#3B82F6" />
              </svg>
            </STEMAreaSVG>
            <STEMAreaTitle>Tecnología</STEMAreaTitle>
            <STEMAreaDescription>Programación, Sistemas, Redes</STEMAreaDescription>
          </STEMAreaCard>

          <STEMAreaCard color="#F59E0B">
            <STEMAreaSVG>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 20 80 Q 50 20 80 80" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
                <circle cx="50" cy="50" r="3" fill="#F59E0B" />
                <text x="30" y="35" fontSize="20" fill="#F59E0B" fontWeight="bold">
                  ∑
                </text>
                <text x="60" y="70" fontSize="18" fill="#FBBF24" fontWeight="bold">
                  π
                </text>
                <text x="25" y="70" fontSize="16" fill="#F59E0B" fontStyle="italic">
                  x
                </text>
                <text x="70" y="40" fontSize="14" fill="#FBBF24">
                  ²
                </text>
              </svg>
            </STEMAreaSVG>
            <STEMAreaTitle>Matemáticas</STEMAreaTitle>
            <STEMAreaDescription>Análisis, Álgebra, Estadística</STEMAreaDescription>
          </STEMAreaCard>

          <STEMAreaCard color="#10B981">
            <STEMAreaSVG>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="35" cy="50" r="20" fill="none" stroke="#10B981" strokeWidth="3" />
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <rect
                    key={i}
                    x="32"
                    y="27"
                    width="6"
                    height="10"
                    fill="#10B981"
                    transform={`rotate(${angle} 35 50)`}
                  />
                ))}
                <circle cx="60" cy="50" r="15" fill="none" stroke="#34D399" strokeWidth="2.5" />
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <rect
                    key={`s-${i}`}
                    x="58"
                    y="33"
                    width="4"
                    height="7"
                    fill="#34D399"
                    transform={`rotate(${angle} 60 50)`}
                  />
                ))}
              </svg>
            </STEMAreaSVG>
            <STEMAreaTitle>Ingeniería</STEMAreaTitle>
            <STEMAreaDescription>Mecánica, Civil, Industrial</STEMAreaDescription>
          </STEMAreaCard>
        </STEMAreasGrid>
      </STEMAreasSection>

      {/* CTA Final Section */}
      <CTASection>
        <FloatingElement color="#8B5CF6" style={{ top: "10%", left: "5%" }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="15" fill="currentColor" opacity="0.2" />
          </svg>
        </FloatingElement>
        <FloatingElement color="#3B82F6" style={{ top: "70%", right: "10%" }}>
          <svg width="50" height="50" viewBox="0 0 50 50">
            <rect x="10" y="10" width="30" height="30" fill="currentColor" opacity="0.2" />
          </svg>
        </FloatingElement>
        <FloatingElement color="#F59E0B" style={{ bottom: "15%", left: "15%" }}>
          <svg width="35" height="35" viewBox="0 0 35 35">
            <polygon points="17.5,5 5,30 30,30" fill="currentColor" opacity="0.2" />
          </svg>
        </FloatingElement>
        <FloatingElement color="#10B981" style={{ top: "20%", right: "8%" }}>
          <svg width="45" height="45" viewBox="0 0 45 45">
            <circle cx="22.5" cy="22.5" r="18" fill="currentColor" opacity="0.2" />
          </svg>
        </FloatingElement>

        <CTAContent>
          <CTATitle>Descubre tu camino en STEM</CTATitle>
          <CTASubtitle>Estudiantes completan el cuestionario principal. La administración gestiona versiones y publicación.</CTASubtitle>
          <CTAButtonGroup>
            <CTAButtonPrimary to="/login">
              Ingreso estudiantes
            </CTAButtonPrimary>
            <CTAButtonSecondary to="/admin/login">
              Portal de administración
            </CTAButtonSecondary>
          </CTAButtonGroup>
        </CTAContent>
      </CTASection>

      {/* Footer */}
      <Footer>
        <FooterContent>
          <FooterLinks>
            <FooterLink to="/login">Acceso Estudiantes</FooterLink>
            <FooterSeparator>•</FooterSeparator>
            <FooterLink to="/admin/login">Acceso Administradores</FooterLink>
          </FooterLinks>
          <Copyright>© 2025 OrientaSTEM. Todos los derechos reservados.</Copyright>
        </FooterContent>
      </Footer>
    </Container>
  );
}

// Animations
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const floatParticle = keyframes`
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(10px, -10px);
  }
  50% {
    transform: translate(-5px, -20px);
  }
  75% {
    transform: translate(-10px, -10px);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const glow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 10px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 20px currentColor);
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%);
`;

const HeroSection = styled.section`
  padding: 100px 20px 120px;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.05) 0%,
    rgba(59, 130, 246, 0.05) 33%,
    rgba(245, 158, 11, 0.05) 66%,
    rgba(16, 185, 129, 0.05) 100%
  );
  position: relative;
  overflow: hidden;
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 50px;
  }
`;

const HeroText = styled.div`
  animation: ${fadeInUp} 0.8s ease-out;
`;

const Title = styled.h1`
  font-size: 4rem;
  font-weight: 900;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 33%, #10b981 66%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 40px;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: 18px 48px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(139, 92, 246, 0.4);
  }
`;

const HeroIllustration = styled.div`
  svg {
    width: 100%;
    height: auto;
    animation: ${float} 6s ease-in-out infinite;

    .atom-group {
      animation: ${rotate} 20s linear infinite;
      transform-origin: 150px 150px;
    }

    .float-particle {
      animation: ${floatParticle} 8s ease-in-out infinite;
    }
  }
`;

const PublicCardsSection = styled.section`
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PublicCard = styled.div`
  background: ${(props) =>
    props.gradient === "purpleBlue"
      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)"};
  backdrop-filter: blur(10px);
  border: 2px solid
    ${(props) => (props.gradient === "purpleBlue" ? "rgba(139, 92, 246, 0.2)" : "rgba(16, 185, 129, 0.2)")};
  border-radius: 24px;
  padding: 40px;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(props) =>
      props.gradient === "purpleBlue"
        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)"
        : "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)"};
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px
      ${(props) => (props.gradient === "purpleBlue" ? "rgba(139, 92, 246, 0.3)" : "rgba(16, 185, 129, 0.3)")};

    &::before {
      opacity: 1;
    }
  }
`;

const CardIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: ${(props) => props.color}15;
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const CardBadge = styled.div`
  display: inline-block;
  padding: 6px 16px;
  background: ${(props) => props.color};
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 20px;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
`;

const CardDescription = styled.p`
  font-size: 1rem;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 28px;
`;

const CardButton = styled(Link)`
  display: inline-block;
  padding: 14px 32px;
  background: ${(props) => props.color};
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 20px ${(props) => props.color}40;
  }
`;

const HowItWorksSection = styled.section`
  padding: 100px 20px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
`;

const SectionTitle = styled.h2`
  font-size: 3rem;
  font-weight: 800;
  color: #1e293b;
  text-align: center;
  margin-bottom: 70px;

  @media (max-width: 768px) {
    font-size: 2.25rem;
  }
`;

const HowItWorksGrid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 50px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const HowItWorksCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
  }
`;

const HowItWorksIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${(props) => props.color}15;
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 25px ${(props) => props.color}25;
`;

const HowItWorksTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
`;

const HowItWorksDescription = styled.p`
  font-size: 1rem;
  color: #64748b;
  line-height: 1.7;
`;

const STEMAreasSection = styled.section`
  padding: 100px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const STEMAreasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;

  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const STEMAreaCard = styled.div`
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  text-align: center;
  transition: all 0.4s ease;
  border: 2px solid transparent;
  cursor: pointer;

  &:hover {
    transform: translateY(-10px);
    border-color: ${(props) => props.color};
    box-shadow: 0 20px 60px ${(props) => props.color}30;

    svg {
      animation: ${glow} 2s ease-in-out infinite;
      color: ${(props) => props.color};
    }
  }
`;

const STEMAreaSVG = styled.div`
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  transition: all 0.4s ease;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const STEMAreaTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
`;

const STEMAreaDescription = styled.p`
  font-size: 0.9rem;
  color: #64748b;
`;

const CTASection = styled.section`
  padding: 120px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 25%, #10b981 50%, #f59e0b 75%, #8b5cf6 100%);
  background-size: 200% 200%;
  animation: ${float} 15s ease-in-out infinite;
  position: relative;
  overflow: hidden;
`;

const FloatingElement = styled.div`
  position: absolute;
  color: ${(props) => props.color};
  animation: ${floatParticle} 10s ease-in-out infinite;
  opacity: 0.4;
`;

const CTAContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const CTATitle = styled.h2`
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
  margin-bottom: 24px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const CTASubtitle = styled.p`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 50px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const CTAButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButtonPrimary = styled(Link)`
  display: inline-block;
  padding: 20px 40px;
  background: white;
  color: #8b5cf6;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
`;

const CTAButtonSecondary = styled(Link)`
  display: inline-block;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Footer = styled.footer`
  padding: 50px 20px;
  background: #1a202c;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;

const FooterLink = styled(Link)`
  color: #94a3b8;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s ease;

  &:hover {
    color: #8b5cf6;
  }
`;

const FooterSeparator = styled.span`
  color: #475569;
`;

const Copyright = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
`;
