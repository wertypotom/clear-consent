"use client";

import ChatWidget from "./components/ChatWidget";

export default function Providers({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}