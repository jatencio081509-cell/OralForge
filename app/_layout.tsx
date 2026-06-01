import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import { Text } from 'react-native';

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <Text>Clerk key is missing. Check your .env file or secrets.</Text>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <Slot />
    </ClerkProvider>
  );
}