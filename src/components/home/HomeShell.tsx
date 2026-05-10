"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setGrowwSession } from "@/lib/growwSession";
import { HomeHeader } from "./HomeHeader";
import { HomeHero } from "./HomeHero";
import { LoginModal } from "./LoginModal";
import { MarketTicker } from "./MarketTicker";
import styles from "./HomeShell.module.css";

export function HomeShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("login") !== "1") return;
    setLoginOpen(true);
    router.replace("/", { scroll: false });
  }, [searchParams, router]);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const handleLoginSuccess = useCallback(
    (email: string) => {
      setGrowwSession({ email });
      setLoginOpen(false);
      router.push("/about-us");
    },
    [router],
  );

  return (
    <div className={styles.shell}>
      <HomeHeader onLoginClick={openLogin} />
      <MarketTicker />
      <HomeHero onGetStarted={openLogin} />
      <LoginModal
        open={loginOpen}
        onClose={closeLogin}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
