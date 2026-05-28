---
name: Clerk Expo v3 Legacy API
description: In @clerk/expo v3+, useSignIn/useSignUp must be imported from @clerk/expo/legacy to get the { signIn, setActive, isLoaded } / { signUp, setActive, isLoaded } API shape. The default @clerk/expo export uses signals and lacks these properties.
---

# Clerk Expo v3 — Legacy Hook Import

**Rule:** Always import `useSignIn` and `useSignUp` from `@clerk/expo/legacy`, not `@clerk/expo`, when building custom auth flows.

**Why:** `@clerk/expo` v3 changed to a signals-based API. `useSignIn()` from the top-level export returns `SignInSignalValue` which has no `setActive`, `isLoaded`, or `signIn.create()`. The legacy sub-export restores the classic `{ signIn, setActive, isLoaded }` shape that Clerk's own internal code uses.

**How to apply:**
```tsx
import { useSignIn } from "@clerk/expo/legacy"; // ← correct
import { useSignUp } from "@clerk/expo/legacy"; // ← correct
// NOT from "@clerk/expo"
```

**Auth flow pattern (correct):**
```tsx
// Sign in
const result = await signIn.create({ identifier: email, password });
if (result.status === "complete") {
  await setActive({ session: result.createdSessionId });
  router.replace("/(tabs)");
}

// Sign up
await signUp.create({ emailAddress: email, password });
await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
const result = await signUp.attemptEmailAddressVerification({ code });
if (result.status === "complete") {
  await setActive({ session: result.createdSessionId });
}
```
