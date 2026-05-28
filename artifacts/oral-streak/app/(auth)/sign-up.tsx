import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSignUp } from "@clerk/expo/legacy";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Invalid code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (stage === "verify") {
    return (
      <View
        style={[
          styles.container,
          styles.verifyWrap,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { setStage("form"); setError(null); setCode(""); }}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.iconBadge}>
          <Ionicons name="mail-unread" size={32} color="#00b896" />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={[styles.subtitle, { textAlign: "center" }]}>
          We sent a 6-digit code to{"\n"}
          <Text style={{ color: "#00b896" }}>{email}</Text>
        </Text>

        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="000000"
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={code}
          onChangeText={(t) => { setCode(t); setError(null); }}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
          textAlign="center"
        />

        {error && <Text style={[styles.errorText, { textAlign: "center" }]}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryBtn, (!code || loading) && styles.disabled]}
          onPress={handleVerify}
          disabled={!code || loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryBtnText}>Verify & Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={async () => {
            try { await signUp?.prepareEmailAddressVerification({ strategy: "email_code" }); }
            catch {}
          }}
        >
          <Text style={styles.linkText}>Resend code</Text>
        </TouchableOpacity>

        <View nativeID="clerk-captcha" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={28} color="#00b896" />
          </View>
          <Text style={styles.appName}>OralStreak</Text>
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start your oral health journey today</Text>

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Choose a password"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null); }}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={18}
              color="rgba(255,255,255,0.4)"
            />
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { marginTop: 28 },
            (!email || !password || loading) && styles.disabled,
          ]}
          onPress={handleSignUp}
          disabled={!email || !password || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View nativeID="clerk-captcha" />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D18" },
  scrollContent: { paddingHorizontal: 28 },
  verifyWrap: {
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 32,
  },
  brand: { alignItems: "center", marginBottom: 40, marginTop: 8 },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0,184,150,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,184,150,0.25)",
  },
  appName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,184,150,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,184,150,0.25)",
  },
  title: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    marginBottom: 36,
    lineHeight: 20,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
    marginBottom: 16,
    width: "100%",
  },
  codeInput: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 10,
    width: "80%",
    marginBottom: 12,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    padding: 4,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: "#00b896",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    width: "100%",
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  disabled: { opacity: 0.45 },
  linkBtn: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  linkText: { color: "#00b896", fontSize: 14, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  footerLink: { color: "#00b896", fontSize: 14, fontWeight: "700" },
});
