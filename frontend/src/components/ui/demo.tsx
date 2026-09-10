import React from "react";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The candidate evaluation loop is seamless and the automated rubrics save hours every single week.",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service transformed how our engineering team conducts technical screens. Clean design and objective scoring.",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "Intuitive, reliable, and genuinely elevating candidate experience while giving recruiters deep analytical reports.",
  },
];

export const SignInPageDemo = () => {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign In submitted:", data);
    alert(`Sign In Submitted! Check the browser console for form data.`);
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    alert("Continue with Google clicked");
  };

  const handleResetPassword = () => {
    alert("Reset Password clicked");
  };

  const handleCreateAccount = () => {
    alert("Create Account clicked");
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        heroImageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1400&auto=format&fit=crop"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
};

export default SignInPageDemo;
