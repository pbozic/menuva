import { DashboardNav } from "./nav";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
      <DashboardNav />
      {children}
    </>
  );
}
