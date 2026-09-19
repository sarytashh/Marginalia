export default function SignInLoading() {
  return (
    <div data-auth-frame className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[26rem]">
        <div className="bg-rule/70 h-5 w-28 animate-pulse rounded-sm" />
        <div className="bg-rule/70 mt-6 h-12 w-full animate-pulse rounded-sm" />
        <div className="bg-rule/50 mt-4 h-16 w-full animate-pulse rounded-sm" />
        <div className="bg-rule/50 mt-10 h-11 w-full animate-pulse rounded-sm" />
        <div className="bg-rule/40 mt-3 h-11 w-full animate-pulse rounded-sm" />
      </div>
    </div>
  );
}
