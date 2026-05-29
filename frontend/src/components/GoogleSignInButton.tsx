import React from "react";
import { Chrome } from "lucide-react";

import { Button } from "./ui/Button";
import { pushToast } from "./Toast";

type GoogleProfile = {
  name: string;
  email: string;
  avatarUrl?: string;
};

type GoogleStatus = "loading" | "ready" | "missing" | "error";

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const loadGoogleScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById("google-identity")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "google-identity";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google identity script failed"));
    document.head.appendChild(script);
  });
};

export const GoogleSignInButton = ({
  onSuccess,
}: {
  onSuccess: (profile: GoogleProfile) => void;
}) => {
  const tokenClientRef = React.useRef<{
    requestAccessToken: (options?: { prompt?: string }) => void;
  } | null>(null);
  const [status, setStatus] = React.useState<GoogleStatus>("loading");
  const onSuccessRef = React.useRef(onSuccess);

  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  React.useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!CLIENT_ID) {
        setStatus("missing");
        return;
      }

      try {
        await loadGoogleScript();
        if (!window.google?.accounts?.oauth2 || !mounted) {
          return;
        }
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: "openid email profile",
          callback: async (response) => {
            if (!response.access_token) {
              pushToast({
                title: "Google sign-in failed",
                description: "No access token returned.",
                tone: "error",
              });
              return;
            }
            try {
              const profileResponse = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                  headers: {
                    Authorization: `Bearer ${response.access_token}`,
                  },
                }
              );
              const profile = await profileResponse.json();
              if (!profile.email || !profile.name) {
                throw new Error("Profile response incomplete");
              }
              onSuccessRef.current({
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.picture,
              });
            } catch (error) {
              pushToast({
                title: "Google profile error",
                description:
                  error instanceof Error ? error.message : "Unable to fetch profile",
                tone: "error",
              });
            }
          },
        });
        setStatus("ready");
      } catch (error) {
        if (mounted) {
          setStatus("error");
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [onSuccess]);

  const handleClick = () => {
    if (!CLIENT_ID) {
      pushToast({
        title: "Google sign-in unavailable",
        description: "Set VITE_GOOGLE_CLIENT_ID in frontend/.env and restart the dev server.",
        tone: "error",
      });
      return;
    }
    if (status === "error") {
      pushToast({
        title: "Google sign-in unavailable",
        description: "Google identity failed to load. Check your network or blockers.",
        tone: "error",
      });
      return;
    }
    if (!tokenClientRef.current) {
      pushToast({
        title: "Google sign-in unavailable",
        description: "Google identity has not finished loading.",
        tone: "error",
      });
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  };

  return (
    <Button
      className="w-full"
      variant="primary"
      onClick={handleClick}
      disabled={status === "loading"}
    >
      <Chrome className="mr-2 h-4 w-4" />
      {status === "ready"
        ? "Continue with Google"
        : status === "missing"
        ? "Configure Google Sign-In"
        : status === "error"
        ? "Google Unavailable"
        : "Loading Google..."}
    </Button>
  );
};
