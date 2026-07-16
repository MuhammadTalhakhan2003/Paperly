import AuthForm from "@/components/AuthForm";
import AuthLayout from "@/components/AuthLayout";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthLayout>
      <AuthForm mode="login" next={next} />
    </AuthLayout>
  );
}
