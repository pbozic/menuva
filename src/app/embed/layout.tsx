export default function EmbedLayout({ children }: LayoutProps<"/embed">) {
  return <div className="bg-card">{children}</div>;
}
