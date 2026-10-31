'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bot, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('candidate@intervibe.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await login(email);
      toast.success('Signed in successfully!');
      router.push('/dashboard/interview');
    } catch (err: any) {
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md border-border/70 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-1 shadow-md">
            IV
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to InterVibe</CardTitle>
          <CardDescription>Enter your email below to log into your mock interview dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground">Demo mode: any password</span>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to InterVibe'}
              <ArrowRight className="size-4" />
            </Button>
            <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Session stored securely in local browser storage</span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
