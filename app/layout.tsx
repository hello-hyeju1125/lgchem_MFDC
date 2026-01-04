import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LG Chem MFDC 리더십 유형 진단",
  description: "리더가 무엇을 기준으로 판단하고 행동하는지를 4가지 축과 16가지 유형으로 구조화합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}

