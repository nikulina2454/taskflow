import { requireUser } from "@/lib/auth-helpers";
import { Topbar } from "@/components/Topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <>
      <Topbar
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
        }}
      />
      {children}
    </>
  );
}
