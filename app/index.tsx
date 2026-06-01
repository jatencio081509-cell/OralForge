import { View, Text, Button } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-expo';

export default function Home() {
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to OralForge</Text>

      <SignedOut>
        <SignInButton>
          <Button title="Sign In" />
        </SignInButton>
        <SignUpButton>
          <Button title="Sign Up" />
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <Button title="Sign Out" onPress={() => signOut()} />
        <Text>You are signed in!</Text>
      </SignedIn>
    </View>
  );
}