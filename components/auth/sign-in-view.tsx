"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailValidationMessage, isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { magicLinkRedirectTo } from "@/lib/auth/magic-link";
import { LINK_ERROR_COPY, magicLinkSendError } from "@/lib/auth/messages";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SignInViewProps = {
  initialError: "expired" | "invalid" | null;
  nextPath: string;
};

type FormStatus = "idle" | "sending" | "sent";

export function SignInView({ initialError, nextPath }: SignInViewProps) {
  const emailId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<"expired" | "invalid" | null>(initialError);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sentFrom, setSentFrom] = useState<string | null>(null);

  const sending = status === "sending";
  const invalid = fieldError !== null;

  async function sendLink(address: string) {
    setStatus("sending");
    setFieldError(null);
    setSendError(null);
    setLinkError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = magicLinkRedirectTo(window.location.origin);
      window.sessionStorage.setItem("marginalia.authNext", nextPath);
      const { error } = await supabase.auth.signInWithOtp({
        email: address,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setSendError(magicLinkSendError(error));
        setStatus("idle");
        return;
      }

      setSentTo(address);
      setSentFrom(window.location.host);
      setStatus("sent");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Failed to fetch";
      setSendError(magicLinkSendError(message));
      setStatus("idle");
    }
  }

  function handleSend() {
    if (sending) {
      return;
    }

    const address = normalizeEmail(email);
    const validation = emailValidationMessage(address);
    if (validation !== null) {
      setFieldError(validation);
      return;
    }

    void sendLink(address);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSend();
  }

  function useDifferentEmail() {
    setStatus("idle");
    setSentTo(null);
    setSendError(null);
    setLinkError(null);
  }

  return (
    <div
      data-auth-frame
      className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[26rem] flex-col justify-center px-5 py-16 md:min-h-screen"
    >
      <p className="font-serif text-ink text-[22px] leading-none md:text-[24px]">
        Marginalia
      </p>

      {status === "sent" && sentTo !== null ? (
        <div className="mt-10">
          <h1 className="font-serif text-ink text-[34px] leading-[1.12] font-normal text-balance md:text-[46px]">
            Check your inbox.
          </h1>
          <p className="text-muted-ink mt-5 text-[16px] leading-[1.65]">
            A sign-in link is on its way to{" "}
            <span className="text-ink">{sentTo}</span>. Open it in this browser:
            the link signs in whichever device opens it.
            {sentFrom ? (
              <>
                {" "}It should start with{" "}
                <span className="text-ink">{sentFrom}</span>.
              </>
            ) : null}{" "}
            It expires in about an hour, and no password is needed.
          </p>
          <button
            type="button"
            onClick={useDifferentEmail}
            className="text-burgundy hover:text-burgundy-hover mt-8 min-h-11 text-[14px] font-medium"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <div className="mt-10">
          <h1 className="font-serif text-ink text-[34px] leading-[1.12] font-normal text-balance md:text-[46px]">
            Return to your studies.
          </h1>
          <p className="text-muted-ink mt-5 text-[16px] leading-[1.65]">
            Enter your email and Marginalia will send a sign-in link. The link
            opens this library on this device — no password required.
          </p>

          {linkError ? (
            <p
              className="border-state-shaky/40 bg-paper text-ink mt-6 border px-3 py-3 text-[14px] leading-[1.55]"
              role="alert"
            >
              {LINK_ERROR_COPY[linkError]}
            </p>
          ) : null}

          <form className="mt-10" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor={emailId} className="text-[14px] font-medium">
                Email
              </Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                disabled={sending}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldError !== null) {
                    setFieldError(null);
                  }
                }}
                className="border-rule bg-paper h-11 rounded-sm text-[16px] md:text-[15px]"
              />
              {fieldError ? (
                <p id={errorId} className="text-state-shaky text-[13px] leading-[1.55]" role="alert">
                  {fieldError}
                </p>
              ) : null}
            </div>

            {sendError ? (
              <p className="text-state-shaky mt-4 text-[13px] leading-[1.55]" role="alert">
                {sendError}
              </p>
            ) : null}

            <p className="text-muted-ink mt-4 text-[13px] leading-[1.55]">
              No password is needed. The email is only used to sign you in.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                type="submit"
                disabled={sending || (sendError !== null && !isValidEmail(email))}
                className="bg-burgundy text-paper hover:bg-burgundy-hover h-11 rounded-sm"
              >
                {sending ? "Sending…" : sendError ? "Retry" : "Send sign-in link"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

