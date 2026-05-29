import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

import { LogoMark } from "../components/LogoMark";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAppStore } from "../store/useAppStore";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export const Welcome = () => {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const [step, setStep] = React.useState<"start" | "email">("start");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    setUser({ ...values, provider: "email" });
    navigate("/workspace");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_center,rgba(120,95,40,0.12),transparent_65%)] px-6">
      <motion.div
        className="w-full max-w-lg rounded-2xl border border-line/60 bg-card p-10 text-center shadow-soft"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="h-12 w-12" />
          <div>
            <h1 className="text-2xl font-semibold">Welcome to Ouro</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingest. Retrieve. Research.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {step === "start" ? (
              <motion.div
                key="start"
                className="space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <GoogleSignInButton
                  onSuccess={(profile) => {
                    setUser({ ...profile, provider: "google" });
                    navigate("/workspace");
                  }}
                />
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => setStep("email")}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Email
                </Button>
              </motion.div>
            ) : null}

            {step === "email" ? (
              <motion.div
                key="email"
                className="space-y-4 text-left"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rounded-xl border border-line/60 bg-background/80 p-4">
                  <h2 className="text-sm font-medium">Create your local profile</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This stays on your device for this workspace.
                  </p>
                  <form className="mt-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                      <label className="text-xs text-muted-foreground">Name</label>
                      <Input aria-label="Name" {...register("name")} />
                      {errors.name ? (
                        <p className="mt-1 text-xs text-rose-500">
                          {errors.name.message}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Email</label>
                      <Input aria-label="Email" {...register("email")} />
                      {errors.email ? (
                        <p className="mt-1 text-xs text-rose-500">
                          {errors.email.message}
                        </p>
                      ) : null}
                    </div>
                    <Button type="submit" className="w-full">
                      Continue to Workspace
                    </Button>
                  </form>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setStep("start")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};
