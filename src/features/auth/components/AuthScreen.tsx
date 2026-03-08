import { useMemo, useState } from "react";
import type { User } from "../../../shared/types/lms";
import logo from "../../../assets/logo.png";
import cover from "../../../assets/cover.png";

export function AuthScreen({
  api,
  onAuth,
  message,
  setMessage,
  theme,
  onToggleTheme,
}: {
  api: any;
  onAuth: (user: User) => void;
  message: string;
  setMessage: (m: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const isDark = theme === "dark";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );
  const passwordStrong =
    passwordChecks.length &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.number &&
    passwordChecks.special;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    try {
      setIsSubmitting(true);
      if (mode === "register") {
        if (!passwordStrong) {
          setMessage("Password must meet all security requirements.");
          return;
        }
        if (password !== confirmPassword) {
          setMessage("Password confirmation does not match.");
          return;
        }
        await api("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            role,
            studentId: role === "STUDENT" ? studentId : undefined,
          }),
        });
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setMessage(
          role === "INSTRUCTOR"
            ? "Registration submitted. Your instructor account must be approved by admin before login."
            : "Registration successful. You can now log in.",
        );
        return;
      }

      const r = await api("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      onAuth(r.user);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const shellText = isDark ? "text-slate-100" : "text-slate-900";
  const subText = isDark ? "text-slate-300" : "text-slate-600";
  const inputClass = `w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-blue-500 ${
    isDark
      ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400"
      : "border-slate-300 bg-white text-slate-900"
  }`;

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--ink)] transition-colors">
      <header
        className={`border-b backdrop-blur transition-colors ${
          isDark ? "border-slate-800 bg-slate-950/90" : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NEMSU" className="h-10 w-10 rounded-full" />
            <div>
              <p className={`text-sm font-semibold leading-none ${shellText}`}>
                North Eastern Mindanao State University
              </p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                E-Learning Environment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className={`hidden items-center gap-3 text-sm md:flex ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              <a href="https://nemsu.edu.ph" target="_blank" rel="noreferrer" className="hover:text-blue-500">
                About
              </a>
              <a href="https://nemsu.edu.ph/contact-us/" target="_blank" rel="noreferrer" className="hover:text-blue-500">
                Contact
              </a>
              <a href="mailto:information@nemsu.edu.ph" className="hover:text-blue-500">
                information@nemsu.edu.ph
              </a>
              <a href="mailto:registrarmain@nemsu.edu.ph" className="hover:text-blue-500">
                registrarmain@nemsu.edu.ph
              </a>
              <a href="https://www.facebook.com/nemsuofficialph" target="_blank" rel="noreferrer" aria-label="NEMSU Facebook" className="hover:text-blue-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M13.5 8H16V5h-2.5C11 5 9.5 6.6 9.5 9.2V11H7v3h2.5v5H13v-5h2.6l.4-3H13V9.5c0-.9.3-1.5 1.5-1.5Z"/></svg>
              </a>
              <a href="https://www.youtube.com/@nemsuofficialph" target="_blank" rel="noreferrer" aria-label="NEMSU YouTube" className="hover:text-blue-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M23 12s0-3.3-.4-4.9a2.6 2.6 0 0 0-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.3a2.6 2.6 0 0 0-1.8 1.8C1 8.7 1 12 1 12s0 3.3.4 4.9a2.6 2.6 0 0 0 1.8 1.8C4.8 19 12 19 12 19s7.2 0 8.8-.3a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.9.4-4.9ZM10 15.5v-7l6 3.5-6 3.5Z"/></svg>
              </a>
            </nav>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              aria-label="Toggle theme"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                {isDark ? (
                  <path d="M12 4v2m0 12v2m6-8h2M4 12H2m14.4 4.4 1.2 1.2M6.4 6.4 5.2 5.2m11.2 0-1.2 1.2M6.4 17.6l-1.2 1.2M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
                ) : (
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <section
        className="w-full min-h-[calc(100vh-124px)]"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(rgba(2, 6, 23, 0.66), rgba(2, 6, 23, 0.72)), url(${cover})`
            : `linear-gradient(rgba(2, 6, 23, 0.48), rgba(2, 6, 23, 0.54)), url(${cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto grid min-h-[calc(100vh-124px)] w-full max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2">
          <div className="p-2">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-blue-200">NEMSU EE</p>
            <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-sm">E-Learning Environment</h1>
            <p className="mt-3 max-w-md text-base text-slate-100/95">
              Access your courses, assessments, and academic services through a secure university portal.
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-100">
              <p>✔ Role-based access control</p>
              <p>✔ Strong password policy</p>
              <p>✔ Secure login sessions</p>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            data-auth-form="true"
            className={`rounded-none border p-8 shadow-xl backdrop-blur-sm transition-colors ${
              isDark
                ? "border-blue-500/40 bg-slate-950/80 text-slate-100"
                : "border-slate-200 bg-white/92 text-slate-900"
            }`}
            style={{ borderTopLeftRadius: "2rem", borderBottomRightRadius: "3rem" }}
          >
            <div className={`mb-6 flex rounded-xl p-1 text-sm ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`w-1/2 rounded-md px-3 py-2 transition ${
                  mode === "login" ? "bg-blue-600 text-white" : isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`w-1/2 rounded-md px-3 py-2 transition ${
                  mode === "register" ? "bg-blue-600 text-white" : isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Register
              </button>
            </div>

            <h2 className={`mb-1 text-2xl font-bold ${shellText}`}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>
            <p className={`mb-6 text-sm ${subText}`}>
              {mode === "login"
                ? "Use your university credentials to access your portal."
                : "Register as Student or Instructor."}
            </p>

            {message && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p>{message}</p>
                <button
                  type="button"
                  onClick={() => setMessage("")}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {mode === "register" && (
              <div className="mb-4">
                <label className={`mb-2 block text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  name="fullName"
                  required
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </div>
            )}
            <div className="mb-4">
              <label className={`mb-2 block text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                Enter Your University Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                name="email"
                type="email"
                required
                placeholder="name@nemsu.edu.ph"
                className={inputClass}
              />
            </div>
            <div className="mb-4">
              <label className={`mb-2 block text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                Password
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password"
                  className={`${inputClass} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium ${
                    isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <>
                <div className="relative mb-2">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm password"
                    className={`${inputClass} pr-20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className={`absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium ${
                      isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <select
                  value={role}
                  onChange={(e) => {
                    const nextRole = e.target.value as "STUDENT" | "INSTRUCTOR";
                    setRole(nextRole);
                    if (nextRole !== "STUDENT") setStudentId("");
                  }}
                  name="role"
                  className={`${inputClass} mb-2`}
                >
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor (Requires admin approval)</option>
                </select>
                {role === "STUDENT" && (
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="Student ID"
                    className={`${inputClass} mb-2`}
                  />
                )}
                <div className={`mb-3 grid grid-cols-2 gap-1 text-xs ${isDark ? "text-slate-300" : ""}`}>
                  <p className={passwordChecks.length ? "text-emerald-400" : "text-slate-400"}>8+ chars</p>
                  <p className={passwordChecks.upper ? "text-emerald-400" : "text-slate-400"}>Uppercase</p>
                  <p className={passwordChecks.lower ? "text-emerald-400" : "text-slate-400"}>Lowercase</p>
                  <p className={passwordChecks.number ? "text-emerald-400" : "text-slate-400"}>Number</p>
                  <p className={passwordChecks.special ? "text-emerald-400" : "text-slate-400"}>Special char</p>
                  <p
                    className={
                      password === confirmPassword && password.length > 0 ? "text-emerald-400" : "text-slate-400"
                    }
                  >
                    Match
                  </p>
                </div>
              </>
            )}

            <button
              disabled={isSubmitting}
              data-keep-action-text="true"
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Please wait..." : mode === "login" ? "Sign In" : "Submit Registration"}
            </button>
            <div className="mt-5 space-y-2 text-sm">
              <button type="button" className="block text-blue-600 hover:underline">
                Forgot Your Password? (Students)
              </button>
              <button type="button" className="block text-blue-600 hover:underline">
                Privacy Policy
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer className={`border-t transition-colors ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <div
          className={`mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-3 text-xs md:flex-row ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <p>
            Copyright {new Date().getFullYear()} North Eastern Mindanao State University. All rights reserved.
          </p>
          <p>NEMSU EE</p>
        </div>
      </footer>
    </main>
  );
}
