"use client"
import { createClient } from "@/utils/supabase/client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { ConnectionProvider, useWallet, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import "@solana/wallet-adapter-react-ui/styles.css";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

function SignInButton() {
    const wallet = useWallet();
    const supabase = createClient();
    const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
    const [username, setUsername] = useState("")
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()


    const logIn = async ()=>{
    //@ts-ignore
        const {data} = await supabase.auth.signInWithWeb3({
             chain: "solana",
             statement: "By using Stakeup I agree to the terms and conditions of Stakeup.",
             wallet: wallet
        });

        if(data){
            setUser(data.user)
            const isUserNew = await supabase
            .from("users")
            .select()
            .eq("pubKey", data.user?.user_metadata.custom_claims.address)

        if(!isUserNew){
            onOpen()
        } else {
          addToast({
            title: "Login Successfull",
            description: "redirecting to home"
          })
          router.push('/home')
        }

    }
    
}

    const handelUsername = async ()=>{
        if(username.length == 0){
            addToast({
                title: "Please Enter Username",
                description: "Username length must be more then 4 characters"
            })
            return
        }
    
        try{
            console.log(username, user?.user_metadata.custom_claims.address);
            
            const {error} = await supabase
            .from("users")
            .insert({
                pubKey: user?.user_metadata.custom_claims.address,
                username: username
            })
            if(error){
                console.log(error);                
                addToast({
                    title: JSON.stringify(error.name),
                    description: JSON.stringify(error.message)
                })
                return
            }
            onClose()
            router.push('/home')
        } catch (err){
            console.log(err);            
        }
    }

  return (
    <>
      <Modal  
      hideCloseButton={true}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        backdrop="blur"
        onOpenChange={onOpenChange}>
        <ModalContent>
         
              <ModalHeader className="flex flex-col gap-1">Enter Username</ModalHeader>
              <ModalBody>
                <Input label="some goat username" onChange={(e)=>setUsername(e.target.value)}/>
              </ModalBody>
              <ModalFooter>
                <Button disabled={loading} isLoading={loading} color="primary" onPress={handelUsername}>
                  Create
                </Button>
              </ModalFooter>
         
       
        </ModalContent>
      </Modal>
      <div className="h-screen w-full flex items-center justify-center">
      {wallet.connected ? (
        <Button
        color="primary"
          onPress={() => logIn()}
        >
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