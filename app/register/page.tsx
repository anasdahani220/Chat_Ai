'use client' ;
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function RegistrePage() {

    const [fullName, setfullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const supabase = createClient();


    const handleRegister = async () => {
        setError('');
        setSuccess('');

        if (!email || !password || !fullName || !confirmPassword) {
            setError('Please fill in all fields');
            return
        }
        if (password !== confirmPassword) {
            setError('Password do not match');
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 character')
            return
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        })

        if (error) {
            setError(error.message);
            setLoading(false);
            return
        }

        // If email confirmation is required, signUp returns a user but no session.
        // In that case, tell the user to confirm instead of redirecting to a
        // protected page they can't access yet.
        if (!data.session) {
            setSuccess('Account created! Check your email to confirm your account before logging in.');
            setLoading(false);
            return
        }

        router.push('/');
        router.refresh();
    }

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ background: 'radial-gradient(125% 125% at 50% 101%, rgba(245,87,2,1) 10%, rgba(20,20,30,1) 60%)' }}>
            <div className="w-full max-w-md p-8 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">
                <h1 className="text-white text-2xl font-medium text-center mb-2">
                    Create Account 🚀
                </h1>
                <p className="text-white/50 text-sm text-center mb-8">
                    Join us today
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="text-white/70 text-sm mb-1 block">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) =>
                                setfullName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-white/70 text-sm mb-1 block">
                            Email
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-white/70 text-sm mb-1 block">
                            Password
                        </label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-white/70 text-sm mb-1 block">
                            Confirm Password
                        </label>
                        <input
                            type="text"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-400 transition-colors" />
                    </div>

                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="px-4 py-3 rounded-xl bg-green-500/20 border border-green-500/30">
                            <p className="text-green-400 text-sm text-center">{success}</p>
                        </div>
                    )}

                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-xs">Or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <p className="text-white/50 text-sm text-center">
                      Already Have An Account?{' '}
                      <a href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
                        Login
                      </a>
                    </p>
                </div>
            </div>
        </div>
    );
}