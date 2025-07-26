import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "../api";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation checks
    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }
    if (!confirmPassword.trim()) {
      setError("Please confirm your password");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (!acceptTerms) {
      setError("You must accept the Terms and Conditions");
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/register/", { username, email, password });
      setSuccess("Registration successful! You can now log in.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 24 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12, padding: 8 }}
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12, padding: 8 }}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12, padding: 8 }}
          />
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12, padding: 8 }}
          />
        </div>

        {/* Terms and Conditions Checkbox */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <span>
              I accept the{" "}
              <Link href="/terms-and-conditions" style={{ color: "#007bff", textDecoration: "underline" }}>
                Terms and Conditions
              </Link>
            </span>
          </label>
        </div>

        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: "green", marginBottom: 12 }}>{success}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {/* Navigation Links */}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <p>Already have an account? <Link href="/login" style={{ color: "#007bff" }}>Login here</Link></p>
        <p><Link href="/" style={{ color: "#007bff" }}>← Back to Home</Link></p>
      </div>
    </div>
  );
}
