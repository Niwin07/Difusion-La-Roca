import { Route, Switch } from "wouter";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AudioPlayerProvider } from "./context/AudioPlayerContext";
import { AppShell } from "./components/layout/AppShell";
import HomePage from "./pages/HomePage";
import CongresoPage from "./pages/CongresoPage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminPage from "./pages/AdminPage";

// El shell (header, watermark, reproductor global, toasts) es exclusivo
// del sitio público — /admin es un contexto aparte con su propio layout
// de dashboard, sin nav pública ni reproductor.
function PublicLayout({ children }) {
  return (
    <AudioPlayerProvider>
      <AppShell>{children}</AppShell>
    </AudioPlayerProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Switch>
          <Route path="/admin" component={AdminPage} />
          <Route path="/">
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          </Route>
          <Route path="/congreso">
            <PublicLayout>
              <CongresoPage />
            </PublicLayout>
          </Route>
          <Route>
            <PublicLayout>
              <NotFoundPage />
            </PublicLayout>
          </Route>
        </Switch>
      </ToastProvider>
    </ThemeProvider>
  );
}
