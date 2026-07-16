import AuthForm from "@/components/AuthForm";
import AuthLayout from "@/components/AuthLayout";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthLayout>
      <AuthForm mode="signup" next={next} />
    </AuthLayout>
  );
}
