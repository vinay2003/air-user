import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserAuth } from '../contexts/AuthContext';
import api from '../lib/apiClient';
import LoadingButton from '../../../shared/components/LoadingButton';
import StatusAlert from '../../../shared/components/StatusAlert';
import SocialLoginButtons from '../../../shared/components/SocialLoginButtons';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useUserAuth();
    const [searchParams] = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // Load saved email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('user_email');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    // Handle OAuth callback with token
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            login(token);
            setSuccess(true);
            setTimeout(() => navigate('/'), 1500);
        }
    }, [searchParams, login, navigate]);

    const getErrorMessage = (errorMsg: string): { title: string; suggestion: string } => {
        if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('credentials')) {
            return {
                title: 'Invalid email or password',
                suggestion: 'Please check your credentials and try again. If you forgot your password, click "Forgot password?" below.',
            };
        }
        if (errorMsg.toLowerCase().includes('locked')) {
            return {
                title: 'Account temporarily locked',
                suggestion: 'Too many failed attempts. Please try again in 15 minutes or reset your password.',
            };
        }
        if (errorMsg.toLowerCase().includes('verified')) {
            return {
                title: 'Email not verified',
                suggestion: 'Please check your inbox for the verification link we sent you.',
            };
        }
        return {
            title: 'Login failed',
            suggestion: 'Please try again or contact support if the problem persists.',
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password,
            });

            // Save email if remember me is checked
            if (rememberMe) {
                localStorage.setItem('user_email', formData.email);
            } else {
                localStorage.removeItem('user_email');
            }

            console.log('✅ User login successful');
            login(response.data.access_token);
            setSuccess(true);
            setTimeout(() => navigate('/'), 1500);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Invalid credentials. Please try again.';
            setError(errorMessage);
            console.error('Login Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const errorDetails = error ? getErrorMessage(error) : null;

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
                    <CardTitle className="text-2xl font-bold text-center dark:text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-center dark:text-slate-400">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Success Alert */}
                    {success && (
                        <StatusAlert
                            type="success"
                            title="Login successful!"
                            message="Redirecting you to your dashboard..."
                            className="mb-4"
                        />
                    )}

                    {/* Error Alert */}
                    {error && errorDetails && (
                        <StatusAlert
                            type="error"
                            title={errorDetails.title}
                            message={errorDetails.suggestion}
                            className="mb-4"
                        />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                    disabled={loading}
                                    aria-label="Email address"
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
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    disabled={loading}
                                    aria-label="Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                    disabled={loading}
                                />
                                <label
                                    htmlFor="remember"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-200"
                                >
                                    Remember me
                                </label>
                            </div>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <LoadingButton
                            loading={loading}
                            loadingText="Signing in..."
                            type="submit"
                            className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                        >
                            Sign In
                        </LoadingButton>
                    </form>

                    {/* Social Login */}
                    <div className="mt-6">
                        <SocialLoginButtons />
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-center w-full text-gray-600 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
