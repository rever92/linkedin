import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Key } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          channel: 'email',
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
      setOtpSent(true);
      setMessage({
        type: 'success',
        text: 'Check your email for the verification code!',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.error_description || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.error_description || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            {otpSent ? (
              <Key className="h-6 w-6 text-blue-600" />
            ) : (
              <Mail className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {otpSent ? 'Enter verification code' : 'Sign in to your account'}
          </h2>
          {otpSent && (
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a code to {email}
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!otpSent ? (
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="otp" className="sr-only">
                  Verification code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  pattern="\d{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
            )}
          </div>

          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading
                ? otpSent
                  ? 'Verifying...'
                  : 'Sending code...'
                : otpSent
                ? 'Verify code'
                : 'Send verification code'}
            </button>

            {otpSent && (
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setMessage(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Use a different email
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}