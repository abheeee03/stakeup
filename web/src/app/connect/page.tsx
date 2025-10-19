"use client";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

function SignInButton() {
  const wallet = useWallet();
  const supabase = createClient();
  const {
    isOpen,
    onOpen,
    onOpenChange,
    onClose,
  } = useDisclosure();
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Improved: Return user row if existing; if not, null
  const getUserByPubkey = async (pubkey: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", pubkey)
      .maybeSingle();
    if (error) {
      // log error but return null (safe for user creation path)
      console.error("User lookup failed", error);
      return null;
    }
    return data;
  };

  // Improved: Validate username more carefully
  function isValidUsername(name: string): boolean {
    // Add regex rules if required by your platform
    return name.length >= 4 && /^[\w\-]+$/.test(name);
  }

  // Improved Login flow
  const logIn = async () => {
    try {
      //@ts-ignore
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: "solana",
        statement:
          "By using Stakeup I agree to the terms and conditions of Stakeup.",
        wallet: wallet,
      });

      if (error) {
        console.error("Wallet signIn error", error);
        addToast({
          title: "Sign in failed",
          description: error.message || "Please check console for details.",
        });
        return;
      }

      if (data?.user) {
        setUser(data.user);
        // Get the wallet address field, fallback for backwards compatibility
        const pubkey =
          data.user?.user_metadata?.custom_claims?.address ||
          data.user?.user_metadata?.address;
        if (!pubkey) {
          addToast({
            title: "Wallet address not found",
            description: "Could not locate the wallet address after sign-in.",
          });
          return;
        }
        // Avoid duplicate accounts, check by wallet address
        const existing = await getUserByPubkey(pubkey);
        if (!existing) {
          // User does not exist, show modal to collect username
          onOpen();
        } else {
          addToast({
            title: "Login Successful",
            description: "Redirecting to home",
          });
          router.push("/home");
        }
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: "Something went wrong. See console for more.",
      });
    }
  };

  // Improved: check for username collisions and more reliable insert
  const handleUsername = async () => {
    const trimmedUsername = username.trim();
    if (!isValidUsername(trimmedUsername)) {
      addToast({
        title: "Invalid Username",
        description:
          "Please enter a username with at least 4 letters/numbers. Only letters, numbers, underscores and hyphens are allowed.",
      });
      return;
    }

    if (!user) {
      addToast({
        title: "User session missing",
        description: "Please reconnect your wallet and try again.",
      });
      return;
    }

    setLoading(true);
    try {
      const pubkey =
        user?.user_metadata?.custom_claims?.address ||
        user?.user_metadata?.address;

      if (!pubkey) {
        addToast({
          title: "Wallet address missing",
          description: "Please reconnect your wallet.",
        });
        setLoading(false);
        return;
      }

      // Check for username collision
      const { data: collision, error: collisionError } = await supabase
        .from("users")
        .select("id")
        .eq("username", trimmedUsername)
        .maybeSingle();

      if (collision) {
        addToast({
          title: "Username Taken",
          description: "Please pick another username.",
        });
        setLoading(false);
        return;
      }
      if (collisionError && collisionError.code !== "PGRST116") {
        // code PGRST116 = no rows found, not an actual DB error
        console.error("Username collision check failed", collisionError);
        addToast({
          title: "Unexpected error",
          description: "Failed to check username availability.",
        });
        setLoading(false);
        return;
      }

      // Upsert in case new user dropped session and restarted
      const { error: insertError } = await supabase.from("users").upsert(
        [
          {
            id: user.id,
            wallet_address: pubkey,
            username: trimmedUsername,
            // Optionally add: created_at: new Date(), for audit fields
          },
        ],
        { onConflict: "wallet_address" }
      );

      if (insertError) {
        addToast({
          title: "Account creation failed",
          description: insertError.message,
        });
        setLoading(false);
        return;
      }

      addToast({
        title: "Account Created",
        description: "Welcome! Redirecting to home.",
      });
      setLoading(false);
      onClose();
      router.push("/home");
    } catch (err) {
      console.error("User account create error", err);
      addToast({
        title: "Something went wrong while creating your account.",
        description: "Please try again or contact support.",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        hideCloseButton={true}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        backdrop="blur"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Enter Username
          </ModalHeader>
          <ModalBody>
            <Input
              label="Choose your username"
              value={username}
              maxLength={24}
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
              description="4+ letters/numbers"
              onKeyDown={e => {
                if (e.key === "Enter") handleUsername();
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              disabled={loading}
              isLoading={loading}
              color="primary"
              onPress={handleUsername}
            >
              Create Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <div className="h-screen w-full flex items-center justify-center">
        {wallet.connected ? (
          <Button color="primary" onPress={() => logIn()}>
            Sign in with Wallet
          </Button>
        ) : (
          <WalletMultiButton />
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL!}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <SignInButton />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;