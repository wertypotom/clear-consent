"use client";

import ChatWidget from "./components/ChatWidget";
import { SessionProvider } from "./context/SessionContext";

export default function Providers({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <SessionProvider>
      {children}
      <ChatWidget />
    </SessionProvider>
  );
}