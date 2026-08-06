import { Route, Routes, Outlet } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { WriteupPage } from "./pages/WriteupPage";
import { EditorPage } from "./pages/EditorPage";
import { MyWriteupsPage } from "./pages/MyWriteupsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { NotFoundPage } from "./pages/NotFoundPage";

const Layout = () => (
  <div className="min-h-screen">
    <Sidebar />
    <div className="flex min-h-screen flex-col lg:pl-72">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-line-800 px-6 py-6 text-center font-mono text-xs text-ink-500">
        pwnfolio — writeups for hackers, by hackers [ act like you belong ]
      </footer>
    </div>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/writeups/:id" element={<WriteupPage />} />
        <Route
          path="/writeups/new"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/writeups/:id/edit"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/writeups"
          element={
            <ProtectedRoute>
              <MyWriteupsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/users/:username" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
