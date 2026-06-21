import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Log in — NexusFlow" };

export default function LoginPage() {
    return <AuthForm mode="login" />;
}
