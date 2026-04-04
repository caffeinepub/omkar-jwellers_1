import { useEffect } from "react";
import { useActor } from "../hooks/useActor";

/**
 * Re-establishes the backend session every time the actor becomes ready.
 * Each new deployment clears the backend's session map, so we must
 * call actor.login() on every page load to re-map our Principal -> phone.
 * NOTE: Stored credentials are already hashed (stored by LoginPage after hashing).
 */
export default function SessionRestorer() {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (isFetching || !actor) return;

    const raw = localStorage.getItem("omkar_creds");
    if (!raw) return;

    let creds: { phone: string; password: string };
    try {
      creds = JSON.parse(raw) as { phone: string; password: string };
    } catch {
      return;
    }

    if (!creds.phone || !creds.password) return;

    // Re-establish session. The stored password is already the SHA-256 hash
    // (LoginPage stores the hash, not the plain text). So we pass it directly.
    actor.login(creds.phone, creds.password).catch((err) => {
      console.warn("SessionRestorer: failed to re-establish session", err);
    });
  }, [actor, isFetching]);

  return null;
}
