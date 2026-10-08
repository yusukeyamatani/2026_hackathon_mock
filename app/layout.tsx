import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NAKAMA / 仲間を見つけるゲームラボ",
  description:
    "5つの仲間探しゲームを遊んで、あなたの好きなつながりを見つけよう。",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
