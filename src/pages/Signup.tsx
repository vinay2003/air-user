import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserAuth } from '../contexts/AuthContext';
import api from '../lib/apiClient';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

// Note: Ensure LoadingButton is correctly imported. If not available in @/components/ui/button, use standard Button with disabled/loading state.
// Since I don't see LoadingButton in imports in original file (except commented out or unused), I will implement loading state manually on Button or use the one from shared if available.
// Actually, the original file didn't have LoadingButton in imports (it was removed in previous steps or I recall incorrectly). 
// Wait, step 45 view_file didn't show LoadingButton import. 
// Step 45 Line 9: import api from '../lib/apiClient';
// Step 45 Line 10: import PasswordStrengthMeter ...
// So I will stick to Button and handle loading state manually.

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const { loginWithToken } = useUserAuth();
    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [otp, setOtp] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    // Step 1: Send OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 12) {
            setError('Password must be at least 12 characters');
            return;
        }

        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumber = /\d/.test(formData.password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
            setError('Password must contain uppercase, lowercase, number, and special character');
            return;
        }

        setLoading(true);

        try {
            // Check if user exists (handled by backend 409) and send OTP
            // We verify both email and phone uniqueness in one go or backend handles it.
            // Based on auth.service.ts, sendSignupOTP checks for existing user by the identifier.
            // We should send 'phone' as identifier to verify phone uniqueness and sending OTP to phone.
            // But we also want to ensure email is unique. The backend service checks:
            // where: dto.phone ? { phoneNumber: dto.phone } : { email: dto.email }
            // It prioritizes phone.

            await api.post('/auth/signup/send-otp', {
                phone: formData.phone,
                email: formData.email
            });

            setSuccess('OTP sent successfully to your phone!');
            setStep('otp');
        } catch (err: any) {
            let errorMessage = 'Failed to send OTP. Please try again.';
            if (err.response) {
                if (err.response.status === 409) {
                    errorMessage = 'User with this phone or email already exists.';
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP and Create Account
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/signup/verify-otp', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                otp: otp,
                role: 'user'
            });

            console.log('✅ User signup successful');

            if (response.data.access_token) {
                loginWithToken(response.data.access_token);
                setSuccess('Account verified successfully!');
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Invalid OTP. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors duration-300">
            {/* Back to Home Button */}
            <Link
                to="/"
                className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Home</span>
            </Link>

            <Card className="w-full max-w-md shadow-2xl border-gray-200 dark:border-slate-800">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-red-500 text-white p-3 rounded-xl">
                            <span className="text-2xl font-bold font-cursive">Ai</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center dark:text-white">
                        {step === 'details' ? 'Create Account' : 'Verify Phone'}
                    </CardTitle>
                    <CardDescription className="text-center dark:text-slate-400">
                        {step === 'details'
                            ? 'Join Airion to discover amazing events'
                            : `Enter the 6-digit code sent to ${formData.phone}`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center gap-2 text-sm">
                            <CheckCircle size={16} />
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'details' ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="dark:text-slate-200">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        autoComplete="name"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        autoComplete="email"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="dark:text-slate-200">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="9876543210"
                                        className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        autoComplete="tel"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="dark:text-slate-200">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData({ ...formData, password: e.target.value });
                                            setError('');
                                        }}
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <PasswordStrengthMeter password={formData.password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="dark:text-slate-200">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Create Account'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="dark:text-slate-200">One-Time Password</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    className="text-center text-2xl tracking-widest dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    maxLength={6}
                                    disabled={loading}
                                    autoComplete="one-time-code"
                                />
                                <p className="text-xs text-center text-gray-500 dark:text-slate-400 mt-2">
                                    Please check your mobile messages
                                </p>
                            </div>

                            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Sign Up'}
                            </Button>

                            <div className="flex items-center justify-between mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('details')}
                                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 underline"
                                    disabled={loading}
                                >
                                    Change details
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                    disabled={loading}
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" type="button" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700">
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                        <Button variant="outline" type="button" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700">
                            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            GitHub
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Signup;
