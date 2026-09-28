"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/admin/salir", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
